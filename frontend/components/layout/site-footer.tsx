'use client'

import { footerModel } from '@/chth-kit/footer.js'
import { useLocale } from '@/lib/i18n'

/**
 * The shared CHTH footer (chth-kit's footerHtml, as React): the call to CHTH, then the shop's
 * source code, docs, API docs, the CHTH privacy policy and the shop's own terms.
 */
export function SiteFooter() {
  const { locale } = useLocale()
  const m = footerModel(locale, 'shop')
  return (
    <footer className="chth-footer relative z-10 mt-auto w-full bg-background" data-chth-footer>
      <div className="chth-footer__cta">
        <span className="chth-footer__mark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: m.logoSvg }} />
        <p className="chth-footer__pitch"><strong>{m.partOf}</strong><span>{m.pitch}</span></p>
        <a className="chth-footer__btn" href={m.infoUrl}>{m.explore} <span aria-hidden="true">→</span></a>
      </div>
      <nav className="chth-footer__links" aria-label={m.partOf}>
        {m.links.map((l) => <a key={l.id} href={l.href}>{l.label}</a>)}
        <span className="chth-footer__year">© {m.year} CHTH</span>
      </nav>
    </footer>
  )
}
