/** Human-readable messages for the `?error=` codes the backend redirects with. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: 'Google sign-in is not configured on the server yet.',
  x_not_configured: 'X (Twitter) sign-in is not configured on the server yet.',
  telegram_not_configured: 'Telegram sign-in is not configured on the server yet.',
  x_missing_code: 'X authentication was cancelled or returned no code.',
  x_invalid_state: 'Security verification failed for X authentication.',
  x_token_failed: 'Unable to exchange the authorization token with X.',
  x_profile_failed: 'Unable to retrieve your X profile.',
  x_oauth_failed: 'X authentication failed. Please try again.',
  access_denied: 'You declined the authorization request.',
  telegram_hash_invalid: 'Telegram verification failed or the login link expired.',
  telegram_invalid_data: 'Incomplete data returned from Telegram.',
  telegram_auth_failed: 'Telegram authentication failed. Please try again.',
  oauth_failed: 'Authentication failed. Please try again.',
}

export function describeAuthError(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? `Authentication failed: ${code}`
}
