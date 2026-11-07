'use client'

import { useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useT } from '@/lib/i18n'

const COOKIE_CONSENT_KEYS = ['chth_cookie_consent', 'chth_cookie_consent_v1']

function hasAcceptedCookies() {
  try {
    return COOKIE_CONSENT_KEYS.some((key) => localStorage.getItem(key))
  } catch {
    return true
  }
}

function acceptCookies() {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEYS[0], 'true')
  } catch {
    // Nothing to persist in private mode.
  }
}

/** Shows the one-time cookie notice. Toasts themselves are the shared CHTH ones (chth-kit/shell.js). */
export function ToastProvider() {
  const t = useT()
  useEffect(() => {
    if (hasAcceptedCookies()) return
    const timer = setTimeout(() => {
      toast(t('We use cookies to improve your experience.'), {
        type: 'accent',
        duration: 0,
        action: { label: t('OK'), onClick: acceptCookies },
        onClose: acceptCookies,
      })
    }, 600)
    return () => clearTimeout(timer)
    // Shown once, in the language of the first page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
