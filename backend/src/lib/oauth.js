const crypto = require('crypto');

/** Fresh `state` plus a PKCE (S256) verifier/challenge pair for an authorization-code flow. */
function createPkce() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');
  return { state, codeVerifier, codeChallenge };
}

/** Exchanges an authorization code at `tokenUrl`, authenticating with HTTP Basic (client_secret_basic). */
async function exchangeAuthorizationCode(tokenUrl, { clientId, clientSecret, code, redirectUri, codeVerifier }) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }).toString(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`Token exchange with ${tokenUrl} failed:`, response.status, data);
    return null;
  }
  return data;
}

/** Saves per-provider OAuth state in the session (kept separate so parallel flows don't clobber each other). */
function saveOAuthState(req, provider, { state, codeVerifier }) {
  req.session.oauth = { ...req.session.oauth, [provider]: { state, codeVerifier } };
}

/** Returns and clears the OAuth state saved for `provider`, or null if `state` doesn't match. */
function takeOAuthState(req, provider, state) {
  const saved = req.session.oauth?.[provider];
  if (req.session.oauth) delete req.session.oauth[provider];
  if (!saved || !state || saved.state !== state) return null;
  return saved;
}

module.exports = { createPkce, exchangeAuthorizationCode, saveOAuthState, takeOAuthState };
