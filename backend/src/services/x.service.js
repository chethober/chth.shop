const env = require('../config/env');
const { frontendOrigin } = require('../lib/origin');
const { createPkce, exchangeAuthorizationCode } = require('../lib/oauth');

const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const PROFILE_URL = 'https://api.x.com/2/users/me';

/** Must be registered as a Callback URI in the X developer portal for every origin you sign in from. */
function callbackUrl(req) {
  return `${frontendOrigin(req)}/api/auth/x/callback`;
}

/** Builds the X OAuth 2.0 (PKCE) authorize URL and the secrets to keep in the session. */
function createAuthorization(req) {
  const { state, codeVerifier, codeChallenge } = createPkce();

  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: env.x.clientId,
    redirect_uri: callbackUrl(req),
    scope: 'tweet.read users.read',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  }).toString();

  return { url: url.toString(), state, codeVerifier };
}

async function exchangeCode(req, code, codeVerifier) {
  const tokens = await exchangeAuthorizationCode(TOKEN_URL, {
    clientId: env.x.clientId,
    clientSecret: env.x.clientSecret,
    code,
    redirectUri: callbackUrl(req),
    codeVerifier,
  });
  return tokens?.access_token || null;
}

async function fetchProfile(accessToken) {
  const response = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.data || !data.data.id) {
    console.error('X profile fetch failed:', response.status, data);
    return null;
  }
  return data.data;
}

module.exports = { createAuthorization, exchangeCode, fetchProfile };
