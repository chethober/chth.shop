'use client'

import { useEffect } from 'react'
import { Toast, toast } from '@heroui/react'
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

/** Renders the toast region and shows the one-time cookie notice. */
export function ToastProvider() {
  const t = useT()
  useEffect(() => {
    if (hasAcceptedCookies()) return

    let key: string | undefined
    const timer = setTimeout(() => {
      key = toast(t('We use cookies to improve your experience.'), {
        variant: 'accent',
        timeout: 0,
        actionProps: {
          children: t('OK'),
          'data-action': 'cookie-ok',
          onPress: () => {
            acceptCookies()
            if (key) toast.close(key)
          },
        } as never,
        onClose: acceptCookies,
      })
    }, 600)

    return () => clearTimeout(timer)
    // Shown once, in the language of the first page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Toast.Provider placement="bottom" maxVisibleToasts={5} gap={12} className="z-50" />
}
