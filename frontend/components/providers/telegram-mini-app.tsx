'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from '@heroui/react'
import api from '@/lib/api'
import { applyTheme } from '@/lib/theme'
import useAuthStore from '@/store/auth-store'

/** The parts of `window.Telegram.WebApp` we use (https://core.telegram.org/bots/webapps). */
interface TelegramWebApp {
  initData: string
  initDataUnsafe: { user?: { id: number }; start_param?: string }
  colorScheme: 'light' | 'dark'
  ready: () => void
  expand: () => void
  onEvent: (event: 'themeChanged', handler: () => void) => void
  BackButton: { show: () => void; hide: () => void; onClick: (handler: () => void) => void; offClick: (handler: () => void) => void }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

const REFERRAL_STORAGE_KEY = 'chth-referral'
/** Pages that are "home" inside the Mini App (no back button). */
const ROOT_PATHS = new Set(['/', '/shop'])

/** The Telegram WebApp object when the site runs inside Telegram, else null. */
export function telegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  const app = window.Telegram?.WebApp
  return app && app.initData ? app : null
}

const START_HANDLED_KEY = 'chth-tg-start-handled'

/**
 * Applies a Mini App start parameter: `ref_<CODE>` (referral) or `p_<product id>`. Telegram keeps
 * it in initData for the whole session, so it's applied only once (not on every reload).
 */
function handleStartParam(param: string | null | undefined, navigate: (path: string) => void) {
  if (!param) return
  try {
    if (sessionStorage.getItem(START_HANDLED_KEY) === param) return
    sessionStorage.setItem(START_HANDLED_KEY, param)
  } catch {
    // Without storage the link is still applied once per page load.
  }
  if (param.startsWith('ref_')) {
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, param.slice(4).toUpperCase())
    } catch {
      // Storage unavailable: skip the referral.
    }
  } else if (param.startsWith('p_')) {
    navigate(`/p/${param.slice(2)}`)
  }
}

/**
 * Inside Telegram: signs the user in with the Mini App `initData`, follows Telegram's theme,
 * expands to full height, wires the native back button and handles `startapp` deep links.
 * Outside Telegram it does nothing (the script just finds no init data).
 */
export function TelegramMiniApp() {
  const router = useRouter()
  const pathname = usePathname()
  const started = useRef(false)

  const start = () => {
    const app = telegramWebApp()
    if (!app || started.current) return
    started.current = true
    document.documentElement.dataset.telegram = 'mini-app'
    app.ready()
    app.expand()
    applyTheme(app.colorScheme)
    app.onEvent('themeChanged', () => applyTheme(app.colorScheme))

    const telegramId = String(app.initDataUnsafe.user?.id ?? '')
    const { user, signIn } = useAuthStore.getState()
    const signedInAsThisUser = Boolean(user?.telegramId && user.telegramId === telegramId)
    if (signedInAsThisUser) {
      handleStartParam(app.initDataUnsafe.start_param, (path) => router.replace(path))
      return
    }
    api.auth
      .telegramWebApp(app.initData)
      .then(({ user: signedIn, token, startParam }) => {
        signIn(signedIn, token)
        handleStartParam(startParam, (path) => router.replace(path))
      })
      .catch((error) => toast.danger(error instanceof Error ? error.message : 'Telegram sign-in failed'))
  }

  // Telegram's native back button replaces the browser's, which a Mini App doesn't have.
  useEffect(() => {
    const app = telegramWebApp()
    if (!app) return
    const goBack = () => router.back()
    if (ROOT_PATHS.has(pathname)) {
      app.BackButton.hide()
    } else {
      app.BackButton.show()
      app.BackButton.onClick(goBack)
    }
    return () => app.BackButton.offClick(goBack)
  }, [pathname, router])

  return <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onReady={start} />
}
