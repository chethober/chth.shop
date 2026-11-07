'use client'

import Link from 'next/link'
import { footerModel } from '@/chth-kit/footer.js'
import { useLocale, useT } from '@/lib/i18n'

/** The shared "Part of CHTH" footer, and below it the shop's own links. */
export function SiteFooter() {
  const t = useT()
  const { locale } = useLocale()
  const m = footerModel(locale, 'shop')
  return (
    <>
      <footer className="chth-footer mt-auto w-full" data-chth-footer>
        <a className="chth-footer__brand" href={m.infoUrl}>
          <span className="chth-footer__mark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: m.logoSvg }} />
          <span>{m.partOf}</span>
        </a>
      </footer>
      <div className="w-full border-t border-border/40 bg-card/40 py-2.5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-2.5 px-4 text-[11px] tracking-wide text-muted-foreground">
          <span>© {new Date().getFullYear()} CHTH</span>
          <span className="text-border">·</span>
          <Link href="/terms" className="transition-colors hover:text-foreground">{t('Terms of Service')}</Link>
          <span className="text-border">·</span>
          <Link href="/api-docs" className="transition-colors hover:text-foreground">API</Link>
          <span className="text-border">·</span>
          <a href="https://github.com/chethober/chth.shop" className="transition-colors hover:text-foreground">{t('Source code')}</a>
        </div>
      </div>
    </>
  )
}
