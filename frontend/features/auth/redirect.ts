const REDIRECT_KEY = 'chth_auth_redirect'

/** Only same-site paths are allowed, so `?redirect=` can't send users to another site. */
export function safeRedirectPath(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

/** Remembers where to return after an OAuth round-trip through another site. */
export function rememberRedirect(path: string) {
  try {
    sessionStorage.setItem(REDIRECT_KEY, safeRedirectPath(path))
  } catch {
    // Falls back to the home page.
  }
}

export function consumeRedirect(): string {
  try {
    const path = sessionStorage.getItem(REDIRECT_KEY)
    sessionStorage.removeItem(REDIRECT_KEY)
    return safeRedirectPath(path)
  } catch {
    return '/'
  }
}
