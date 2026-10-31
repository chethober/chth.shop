'use client'

// The shop in five languages. Strings are keyed by their English text (lib/i18n/strings.ts), so
// a missing translation shows English. The language comes from ?lang=, the chth_lang cookie
// shared by every CHTH site, or the browser; the root layout reads the cookie so the first
// render already has the right <html lang dir>.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { dirOf, isLocale, localeCookie, localeFromCookie, pickLocale, type Locale } from '@/chth-kit/locales.js'
import { STRINGS } from './strings'

export type { Locale }
export const LOCALE_TAGS: Record<Locale, string> = { en: 'en-US', fa: 'fa-IR', ar: 'ar', ru: 'ru-RU', es: 'es-ES' }
const COL: Record<Exclude<Locale, 'en'>, number> = { fa: 0, ar: 1, ru: 2, es: 3 }

export function translate(key: string, locale: Locale, vars?: Record<string, string | number>) {
  const text = locale === 'en' ? key : STRINGS[key]?.[COL[locale]] ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : text
}

type Ctx = { locale: Locale; setLocale: (locale: Locale) => void }
const LocaleContext = createContext<Ctx>({ locale: 'en', setLocale: () => {} })

export function LocaleProvider({ initial, hasCookie, children }: { initial: Locale; hasCookie: boolean; children: ReactNode }) {
  const router = useRouter()
  const [locale, setState] = useState<Locale>(initial)
  const setLocale = useCallback((next: Locale) => {
    document.cookie = localeCookie(next)
    setState(next)
    document.documentElement.lang = next
    document.documentElement.dir = dirOf(next)
    router.refresh()
  }, [router])
  // ?lang= wins and is remembered; without a saved choice, the browser's languages decide.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('lang')
    if (isLocale(param) && param !== locale) return setLocale(param)
    if (isLocale(param)) { document.cookie = localeCookie(param); return }
    if (!hasCookie && !localeFromCookie(document.cookie)) {
      const guess = pickLocale([navigator.languages as unknown as string[]])
      if (guess !== locale) setLocale(guess)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export const useLocale = () => useContext(LocaleContext)

/** A translate function for the current language: t('Cart'), t('{count} items', { count }). */
export function useT() {
  const { locale } = useContext(LocaleContext)
  return useCallback((key: string, vars?: Record<string, string | number>) => translate(key, locale, vars), [locale])
}
