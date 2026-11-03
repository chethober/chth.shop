const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { frontendOrigin } = require('../lib/origin');
const { createPkce, exchangeAuthorizationCode } = require('../lib/oauth');

// Telegram OpenID Connect: https://core.telegram.org/bots/telegram-login
const ISSUER = 'https://oauth.telegram.org';
const AUTHORIZE_URL = `${ISSUER}/auth`;
const TOKEN_URL = `${ISSUER}/token`;
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;
const JWKS_TTL_MS = 60 * 60 * 1000;

/** Must be listed under the bot's Login Widget → Allowed URLs in @BotFather, for every origin you sign in from. */
function callbackUrl(req) {
  return `${frontendOrigin(req)}/api/auth/telegram/callback`;
}

/** Builds the Telegram OIDC (PKCE) authorize URL and the secrets to keep in the session. */
function createAuthorization(req) {
  const { state, codeVerifier, codeChallenge } = createPkce();

  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: env.telegram.clientId,
    redirect_uri: callbackUrl(req),
    scope: 'openid profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  }).toString();

  return { url: url.toString(), state, codeVerifier };
}

/** Exchanges the authorization code and returns the raw `id_token`. */
async function exchangeCode(req, code, codeVerifier) {
  const tokens = await exchangeAuthorizationCode(TOKEN_URL, {
    clientId: env.telegram.clientId,
    clientSecret: env.telegram.clientSecret,
    code,
    redirectUri: callbackUrl(req),
    codeVerifier,
  });
  return tokens?.id_token || null;
}

let jwksCache = { keys: [], fetchedAt: 0 };

/** Picks the JWKS key by `kid`, or by `alg` when the token header has no `kid`. */
async function signingKey({ kid, alg }) {
  const find = () => jwksCache.keys.find((key) => (kid ? key.kid === kid : key.alg === alg));
  const isFresh = Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS;

  if (!isFresh || !find()) {
    const response = await fetch(JWKS_URL);
    if (!response.ok) throw new Error(`Telegram JWKS fetch failed: ${response.status}`);
    const { keys = [] } = await response.json();
    jwksCache = { keys, fetchedAt: Date.now() };
  }

  const jwk = find();
  if (!jwk) throw new Error(`No Telegram signing key matches kid "${kid}" / alg "${alg}"`);
  return crypto.createPublicKey({ key: jwk, format: 'jwk' });
}

/** Verifies the `id_token` signature, issuer, audience and expiry; returns its claims or null. */
async function verifyIdToken(idToken) {
  try {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded) return null;

    const key = await signingKey(decoded.header);
    const claims = jwt.verify(idToken, key, {
      algorithms: ['RS256', 'ES256'],
      issuer: ISSUER,
    });

    // The client ID is numeric; compare as strings so a number/string `aud` both match.
    const audiences = [].concat(claims.aud).map(String);
    if (!audiences.includes(String(env.telegram.clientId))) return null;

    return claims;
  } catch (error) {
    console.error('Telegram id_token verification failed:', error.message);
    return null;
  }
}

/**
 * Accounts created by the old Login Widget stored Telegram's numeric user `id`,
 * which OIDC exposes as the `id` claim; fall back to `sub` if it's missing. Also accepts the
 * Mini App's `initData` user (id, username, first_name).
 */
function telegramIdentity(claims) {
  const providerId = String(claims.id ?? claims.sub);
  return {
    provider: 'telegram',
    providerId,
    preferredUsername:
      claims.preferred_username || claims.username || claims.name || claims.first_name || `tg_${providerId}`,
  };
}

/** Mini App initData older than this is rejected. */
const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

/**
 * Verifies Mini App `initData` (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 * the hash is HMAC-SHA256 of the sorted fields, keyed by HMAC-SHA256("WebAppData", bot token).
 * Returns the Telegram user and start parameter, or null when invalid or older than a day.
 */
function parseWebAppInitData(initData) {
  const { botToken } = env.telegram;
  if (!botToken || typeof initData !== 'string' || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
  if (expected.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) return null;

  const ageSeconds = Date.now() / 1000 - Number(params.get('auth_date'));
  if (!Number.isFinite(ageSeconds) || ageSeconds > MAX_AUTH_AGE_SECONDS) return null;

  let user;
  try {
    user = JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
  if (!user || !user.id) return null;
  return { user, startParam: params.get('start_param') || null };
}

module.exports = { createAuthorization, exchangeCode, verifyIdToken, telegramIdentity, parseWebAppInitData };
