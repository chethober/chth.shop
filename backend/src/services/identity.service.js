const prisma = require('../lib/prisma');
const { signToken } = require('../lib/tokens');
const { serializeAuthUser } = require('../lib/serializers');
const { track } = require('./hub.service');

const PROVIDER_ID_FIELD = {
  google: 'googleId',
  x: 'twitterId',
  telegram: 'telegramId',
};

function sanitizeUsername(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

async function uniqueUsername(preferred, fallback) {
  const base = sanitizeUsername(preferred) || fallback;
  const taken = await prisma.user.findUnique({ where: { username: base } });
  return taken ? `${base}_${Math.random().toString(36).slice(2, 6)}` : base;
}

/**
 * Finds the user linked to an OAuth identity, or creates one.
 * Accounts are matched by provider ID only (plus a provider-verified email when given),
 * never by username, so a matching handle on another service cannot take over an account.
 */
async function findOrCreateOAuthUser({ provider, providerId, email, preferredUsername }) {
  const idField = PROVIDER_ID_FIELD[provider];
  const matchers = [{ [idField]: providerId }];
  if (email) matchers.push({ email });

  const existing = await prisma.user.findFirst({ where: { OR: matchers } });

  if (existing) {
    if (existing[idField]) return existing;
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        [idField]: providerId,
        authProvider: provider,
        ...(provider === 'google' && { isGoogleUser: true }),
      },
    });
  }

  const created = await prisma.user.create({
    data: {
      username: await uniqueUsername(preferredUsername, `${provider}_${providerId}`),
      email: email || `${providerId}@${provider}.local`,
      [idField]: providerId,
      authProvider: provider,
      password: '',
      ...(provider === 'google' && { isGoogleUser: true }),
    },
  });
  track('signup', { provider }, created.id);
  return created;
}

/** Issues a session for `user` and returns the auth payload the frontend stores. */
function createSession(user, provider) {
  return { user: serializeAuthUser(user, provider), token: signToken(user) };
}

/** URL on the frontend (at `origin`) that completes an OAuth redirect flow. */
function frontendCallbackUrl(origin, user, provider) {
  const { user: payload, token } = createSession(user, provider);
  const params = new URLSearchParams({ token, user: JSON.stringify(payload) });
  return `${origin}/auth/callback?${params}`;
}

/** URL on the frontend (at `origin`) that shows a sign-in error. */
function frontendErrorUrl(origin, code) {
  return `${origin}/auth?error=${encodeURIComponent(code)}`;
}

module.exports = {
  findOrCreateOAuthUser,
  createSession,
  frontendCallbackUrl,
  frontendErrorUrl,
};
