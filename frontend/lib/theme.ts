export const THEME_STORAGE_KEY = 'chth_theme'

export type Theme = 'light' | 'dark'

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the wrong theme.
 * Uses the saved choice, falling back to the OS preference, defaulting to dark.
 */
export const themeInitScript = `(function () {
  try {
    var saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    var dark = saved ? saved === 'dark' : !prefersLight;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function toggleTheme() {
  const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  applyTheme(next)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Private mode: the choice just won't persist.
  }
}
