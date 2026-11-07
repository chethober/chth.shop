// The theme is the shared CHTH one (chth-kit/shell.js): the toggle, the saved choice under
// chth_theme, and the script that sets it before the first paint. This file only adds what the
// shop needs beyond it.
import { THEME_INIT_JS, THEME_KEY } from '@/chth-kit/shell.js'

export const THEME_STORAGE_KEY = THEME_KEY
export type Theme = 'light' | 'dark'

/** Runs before first paint (inlined in <head>): the saved theme, else the system's. */
export const themeInitScript = THEME_INIT_JS

/** Paints a theme without saving it, for Telegram's own color scheme inside the Mini App. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root.style.colorScheme = theme
}
