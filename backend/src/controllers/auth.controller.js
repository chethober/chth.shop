const passport = require('../config/passport');
const env = require('../config/env');
const prisma = require('../lib/prisma');
const { signToken } = require('../lib/tokens');
const { frontendOrigin } = require('../lib/origin');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { serializeUser } = require('../lib/serializers');
const {
  findOrCreateOAuthUser,
  createSession,
  frontendCallbackUrl,
  frontendErrorUrl,
} = require('../services/identity.service');
const { isValidTelegramPayload, telegramIdentity } = require('../services/telegram.service');
const xService = require('../services/x.service');

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const USERNAME_MIN_LENGTH = 5;

/* ---------- Google ---------- */

/** Google must be sent back to the same origin the user started on. */
function googleCallbackUrl(origin) {
  return `${origin}/api/auth/google/callback`;
}

function startGoogle(req, res, next) {
  const origin = frontendOrigin(req);
  if (!env.google.isConfigured) return res.redirect(frontendErrorUrl(origin, 'google_not_configured'));
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false,
    callbackURL: googleCallbackUrl(origin),
  })(req, res, next);
}

function googleCallback(req, res, next) {
  const origin = frontendOrigin(req);
  if (!env.google.isConfigured) return res.redirect(frontendErrorUrl(origin, 'google_not_configured'));

  passport.authenticate('google', { session: false, callbackURL: googleCallbackUrl(origin) }, (error, user) => {
    if (error || !user) {
      console.error('Google authentication error:', error);
      return res.redirect(frontendErrorUrl(origin, 'oauth_failed'));
    }
    res.redirect(frontendCallbackUrl(origin, user, 'google'));
  })(req, res, next);
}

/* ---------- X (Twitter) ---------- */

function startX(req, res) {
  const origin = frontendOrigin(req);
  if (!env.x.isConfigured) return res.redirect(frontendErrorUrl(origin, 'x_not_configured'));

  const { url, state, codeVerifier } = xService.createAuthorization(req);
  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;
  res.redirect(url);
}

async function xCallback(req, res) {
  const origin = frontendOrigin(req);
  try {
    const { code, state, error } = req.query;

    if (error) return res.redirect(frontendErrorUrl(origin, error));
    if (!code) return res.redirect(frontendErrorUrl(origin, 'x_missing_code'));
    if (!state || state !== req.session.oauthState) {
      return res.redirect(frontendErrorUrl(origin, 'x_invalid_state'));
    }

    const accessToken = await xService.exchangeCode(req, code, req.session.codeVerifier);
    if (!accessToken) return res.redirect(frontendErrorUrl(origin, 'x_token_failed'));

    const profile = await xService.fetchProfile(accessToken);
    if (!profile) return res.redirect(frontendErrorUrl(origin, 'x_profile_failed'));

    const user = await findOrCreateOAuthUser({
      provider: 'x',
      providerId: profile.id,
      preferredUsername: profile.username,
    });

    res.redirect(frontendCallbackUrl(origin, user, 'x'));
  } catch (error) {
    console.error('X OAuth callback error:', error);
    res.redirect(frontendErrorUrl(origin, 'x_oauth_failed'));
  }
}

/* ---------- Telegram ---------- */

function telegramConfig(req, res) {
  sendSuccess(res, {
    data: {
      botUsername: env.telegram.botUsername,
      isConfigured: env.telegram.isConfigured,
    },
  });
}

/** Redirect-based Telegram widget flow. */
async function telegramCallback(req, res) {
  const origin = frontendOrigin(req);
  try {
    if (!req.query.id || !req.query.hash) {
      return res.redirect(frontendErrorUrl(origin, 'telegram_invalid_data'));
    }
    if (!env.telegram.botToken) return res.redirect(frontendErrorUrl(origin, 'telegram_not_configured'));
    if (!isValidTelegramPayload(req.query)) {
      return res.redirect(frontendErrorUrl(origin, 'telegram_hash_invalid'));
    }

    const user = await findOrCreateOAuthUser(telegramIdentity(req.query));
    res.redirect(frontendCallbackUrl(origin, user, 'telegram'));
  } catch (error) {
    console.error('Telegram callback error:', error);
    res.redirect(frontendErrorUrl(origin, 'telegram_auth_failed'));
  }
}

/** JS callback-based Telegram widget flow. */
const telegramLogin = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data || !data.id || !data.hash) {
    throw new HttpError(400, 'Invalid Telegram authentication payload');
  }
  if (!env.telegram.botToken) {
    throw new HttpError(503, 'Telegram authentication is not configured on the server');
  }
  if (!isValidTelegramPayload(data)) {
    throw new HttpError(401, 'Telegram signature verification failed');
  }

  const user = await findOrCreateOAuthUser(telegramIdentity(data));
  sendSuccess(res, { data: createSession(user, 'telegram') });
});

/* ---------- Current user ---------- */

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { artist: true },
  });
  if (!user) throw new HttpError(404, 'User not found');

  sendSuccess(res, { data: { user: serializeUser(user) } });
});

const updateUsername = asyncHandler(async (req, res) => {
  const { newUsername } = req.body;

  if (!newUsername || typeof newUsername !== 'string') {
    throw new HttpError(400, 'New username is required');
  }
  if (newUsername.length < USERNAME_MIN_LENGTH) {
    throw new HttpError(400, `Username must be at least ${USERNAME_MIN_LENGTH} characters long`);
  }
  if (!USERNAME_PATTERN.test(newUsername)) {
    throw new HttpError(400, 'Username can only contain letters, numbers, and underscores');
  }

  const owner = await prisma.user.findUnique({ where: { username: newUsername } });
  if (owner && owner.id !== req.userId) {
    throw new HttpError(409, 'Username is already taken');
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { username: newUsername },
  });

  sendSuccess(res, {
    message: 'Username updated successfully',
    data: { user: serializeUser(user), token: signToken(user) },
  });
});

module.exports = {
  startGoogle,
  googleCallback,
  startX,
  xCallback,
  telegramConfig,
  telegramCallback,
  telegramLogin,
  getMe,
  updateUsername,
};
