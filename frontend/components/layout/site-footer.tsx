'use client'

import Link from 'next/link'
import { footerModel } from '@/chth-kit/footer.js'
import { LOGO_SVG } from '@/chth-kit/brand.js'
import { useLocale, useT } from '@/lib/i18n'

/** The shop's small footer bar, above it the shared "Part of CHTH" footer with the languages. */
export function SiteFooter() {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const m = footerModel(locale, 'shop', { sourceUrl: 'https://github.com/chethober/chth.shop' })
  return (
    <>
      <footer className="chth-footer mt-auto w-full" data-chth-footer>
        <div className="chth-footer__inner">
          <div className="chth-footer__brand">
            <span className="chth-footer__mark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
            <span><strong>{m.partOf}</strong><br /><small>{m.openSource}</small></span>
          </div>
          <nav className="chth-footer__col" aria-label={m.sitesTitle}>
            <h2>{m.sitesTitle}</h2>
            <ul>{m.sites.map((p) => <li key={p.id}><a href={p.href} title={p.tagline}><span aria-hidden="true">{p.ico}</span> {p.name}</a></li>)}</ul>
          </nav>
          <nav className="chth-footer__col" aria-label={m.botsTitle}>
            <h2>{m.botsTitle}</h2>
            <ul>{m.bots.map((p) => <li key={p.id}><a href={p.href} title={p.tagline}><span aria-hidden="true">{p.ico}</span> {p.name}</a></li>)}</ul>
          </nav>
          <div className="chth-footer__col">
            <h2>{m.languageLabel}</h2>
            <div className="chth-lang-switch">
              {m.locales.map((l) => (
                <button type="button" key={l.code} lang={l.code} aria-pressed={l.current} onClick={() => setLocale(l.code)}>{l.label}</button>
              ))}
            </div>
            {m.sourceUrl && <p><a href={m.sourceUrl}>{m.sourceLabel} ↗</a></p>}
          </div>
        </div>
      </footer>
      <div className="w-full border-t border-border/40 bg-card/40 py-2.5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-2.5 px-4 text-[11px] tracking-wide text-muted-foreground">
          <span>© {new Date().getFullYear()} CHTH</span>
          <span className="text-border">·</span>
          <Link href="/terms" className="transition-colors hover:text-foreground">{t('Terms of Service')}</Link>
        </div>
      </div>
    </>
  )
}
