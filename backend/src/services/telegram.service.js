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
 * which OIDC exposes as the `id` claim; fall back to `sub` if it's missing.
 */
function telegramIdentity(claims) {
  const providerId = String(claims.id ?? claims.sub);
  return {
    provider: 'telegram',
    providerId,
    preferredUsername: claims.preferred_username || claims.name || `tg_${providerId}`,
  };
}

module.exports = { createAuthorization, exchangeCode, verifyIdToken, telegramIdentity };
