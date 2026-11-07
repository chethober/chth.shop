'use client'

import { useRef } from 'react'
import { languageMenuModel } from '@/chth-kit/language-menu.js'
import { useLocale } from '@/lib/i18n'

/** The CHTH language menu (the kit's globe and list), switching languages without a reload. */
export function LanguageMenu({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  const details = useRef<HTMLDetailsElement>(null)
  const m = languageMenuModel(locale)
  const current = m.locales.find((l) => l.current)
  return (
    <details ref={details} className={`chth-lang-menu${className ? ` ${className}` : ''}`}>
      <summary aria-label={`${m.label}: ${current?.label ?? ''}`} title={m.label} dangerouslySetInnerHTML={{ __html: m.globeSvg }} />
      <nav className="chth-lang-menu__list" aria-label={m.label}>
        {m.locales.map((l) => (
          <button
            type="button"
            key={l.code}
            lang={l.code}
            aria-current={l.current ? 'true' : undefined}
            onClick={() => {
              details.current?.removeAttribute('open')
              setLocale(l.code)
            }}
          >
            {l.label}
          </button>
        ))}
      </nav>
    </details>
  )
}
