const crypto = require('crypto');
const env = require('../config/env');
const { frontendOrigin } = require('../lib/origin');

const AUTHORIZE_URL = 'https://twitter.com/i/oauth2/authorize';
const TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const PROFILE_URL = 'https://api.twitter.com/2/users/me';

/** Must be registered in the X developer portal for every origin you sign in from. */
function callbackUrl(req) {
  return `${frontendOrigin(req)}/api/auth/x/callback`;
}

/** Builds the X OAuth 2.0 (PKCE) authorize URL and the secrets to keep in the session. */
function createAuthorization(req) {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: env.x.clientId,
    redirect_uri: callbackUrl(req),
    scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  }).toString();

  return { url: url.toString(), state, codeVerifier };
}

async function exchangeCode(req, code, codeVerifier) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (env.x.clientSecret) {
    const credentials = Buffer.from(`${env.x.clientId}:${env.x.clientSecret}`).toString('base64');
    headers.Authorization = `Basic ${credentials}`;
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      code: String(code),
      grant_type: 'authorization_code',
      client_id: env.x.clientId,
      redirect_uri: callbackUrl(req),
      code_verifier: codeVerifier,
    }).toString(),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    console.error('X token exchange failed:', data);
    return null;
  }
  return data.access_token;
}

async function fetchProfile(accessToken) {
  const response = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();
  if (!response.ok || !data.data || !data.data.id) {
    console.error('X profile fetch failed:', data);
    return null;
  }
  return data.data;
}

module.exports = { createAuthorization, exchangeCode, fetchProfile };
