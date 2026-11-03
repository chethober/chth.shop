const passport = require('../config/passport');
const env = require('../config/env');
const prisma = require('../lib/prisma');
const { signToken } = require('../lib/tokens');
const { frontendOrigin } = require('../lib/origin');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { serializeUser } = require('../lib/serializers');
const {
  createSession,
  findOrCreateOAuthUser,
  frontendCallbackUrl,
  frontendErrorUrl,
} = require('../services/identity.service');
const { saveOAuthState, takeOAuthState } = require('../lib/oauth');
const telegramService = require('../services/telegram.service');
const { telegramIdentity, parseWebAppInitData } = telegramService;
const telegramBotLogin = require('../services/telegram-bot-login.service');
const xService = require('../services/x.service');

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const USERNAME_MIN_LENGTH = 5;
/** Top-level frontend routes; a store at /<username> with these names would be unreachable. */
const RESERVED_USERNAMES = new Set(['account', 'admin', 'auth', 'cart', 'checkout', 'collab', 'design', 'login', 'register', 'shop', 'terms', 'verify']);

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

/* ---------- OAuth 2.0 redirect flows (X, Telegram) ---------- */

/**
 * Shared redirect handlers for providers using the authorization-code + PKCE flow.
 * `resolveIdentity(req, code, codeVerifier)` returns the identity for findOrCreateOAuthUser,
 * or an error code string to show the user.
 */
function oauthFlow(provider, service, resolveIdentity) {
  function start(req, res) {
    const origin = frontendOrigin(req);
    if (!env[provider].isConfigured) return res.redirect(frontendErrorUrl(origin, `${provider}_not_configured`));

    const { url, state, codeVerifier } = service.createAuthorization(req);
    saveOAuthState(req, provider, { state, codeVerifier });
    req.session.save((error) => {
      if (error) {
        console.error(`${provider} session save failed:`, error);
        return res.redirect(frontendErrorUrl(origin, `${provider}_oauth_failed`));
      }
      res.redirect(url);
    });
  }

  async function callback(req, res) {
    const origin = frontendOrigin(req);
    try {
      const { code, state, error } = req.query;

      if (error) return res.redirect(frontendErrorUrl(origin, error));
      if (!code) return res.redirect(frontendErrorUrl(origin, `${provider}_missing_code`));

      const saved = takeOAuthState(req, provider, state);
      if (!saved) return res.redirect(frontendErrorUrl(origin, `${provider}_invalid_state`));

      const identity = await resolveIdentity(req, code, saved.codeVerifier);
      if (typeof identity === 'string') return res.redirect(frontendErrorUrl(origin, identity));

      const user = await findOrCreateOAuthUser(identity);
      res.redirect(frontendCallbackUrl(origin, user, provider));
    } catch (error) {
      console.error(`${provider} OAuth callback error:`, error);
      res.redirect(frontendErrorUrl(origin, `${provider}_oauth_failed`));
    }
  }

  return { start, callback };
}

const xFlow = oauthFlow('x', xService, async (req, code, codeVerifier) => {
  const accessToken = await xService.exchangeCode(req, code, codeVerifier);
  if (!accessToken) return 'x_token_failed';

  const profile = await xService.fetchProfile(accessToken);
  if (!profile) return 'x_profile_failed';

  return { provider: 'x', providerId: profile.id, preferredUsername: profile.username };
});

const telegramFlow = oauthFlow('telegram', telegramService, async (req, code, codeVerifier) => {
  const idToken = await telegramService.exchangeCode(req, code, codeVerifier);
  if (!idToken) return 'telegram_token_failed';

  const claims = await telegramService.verifyIdToken(idToken);
  if (!claims) return 'telegram_id_token_invalid';

  return telegramService.telegramIdentity(claims);
});

/* ---------- Telegram bot sign-in ---------- */

/** Sends the browser to the bot, which replies with a one-tap sign-in button. */
async function startTelegramBot(req, res) {
  const origin = frontendOrigin(req);
  if (!env.telegram.isBotLoginConfigured) return res.redirect(frontendErrorUrl(origin, 'telegram_bot_not_configured'));
  try {
    res.redirect(await telegramBotLogin.botLoginLink());
  } catch (error) {
    console.error('Telegram bot sign-in start failed:', error);
    res.redirect(frontendErrorUrl(origin, 'telegram_bot_failed'));
  }
}

/** Target of the bot's `login_url` button; Telegram appends the signed user data. */
async function telegramBotCallback(req, res) {
  const origin = frontendOrigin(req);
  if (!env.telegram.isBotLoginConfigured) return res.redirect(frontendErrorUrl(origin, 'telegram_bot_not_configured'));
  try {
    const fields = telegramBotLogin.verifyLoginData(req.query);
    if (typeof fields === 'string') return res.redirect(frontendErrorUrl(origin, fields));

    const user = await findOrCreateOAuthUser(telegramBotLogin.botLoginIdentity(fields));
    res.redirect(frontendCallbackUrl(origin, user, 'telegram'));
  } catch (error) {
    console.error('Telegram bot sign-in failed:', error);
    res.redirect(frontendErrorUrl(origin, 'telegram_bot_failed'));
  }
}

/** Telegram Mini App: signs in with the `initData` Telegram hands the app. */
const telegramWebApp = asyncHandler(async (req, res) => {
  if (!env.telegram.botToken) throw new HttpError(503, 'Telegram authentication is not configured on the server');
  const parsed = parseWebAppInitData(req.body?.initData);
  if (!parsed) throw new HttpError(401, 'Telegram Mini App data could not be verified');

  const user = await findOrCreateOAuthUser(telegramIdentity(parsed.user));
  sendSuccess(res, { data: { ...createSession(user, 'telegram'), startParam: parsed.startParam } });
});

/* ---------- Current user ---------- */

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { store: true },
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
  if (RESERVED_USERNAMES.has(newUsername.toLowerCase())) {
    throw new HttpError(400, 'That username is reserved');
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
  startX: xFlow.start,
  xCallback: xFlow.callback,
  startTelegram: telegramFlow.start,
  telegramCallback: telegramFlow.callback,
  startTelegramBot,
  telegramBotCallback,
  telegramWebApp,
  getMe,
  updateUsername,
};
