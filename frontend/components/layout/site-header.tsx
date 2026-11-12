'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Store } from 'lucide-react'
import { languageMenuModel } from '@/chth-kit/language-menu.js'
import { navbarModel, themeToggleModel } from '@/chth-kit/shell.js'
import { useHydrated } from '@/hooks/use-hydrated'
import useAuthStore from '@/store/auth-store'
import useCartStore from '@/store/cart-store'
import { useLocale, useT } from '@/lib/i18n'

/**
 * The shared CHTH navbar (chth-kit's navbarHtml, as React): language, theme and the shop's words on
 * the left, the CHTH mark in the middle, the shop (not on phones), cart and profile on the right. It floats over the page
 * and narrows as the page scrolls; the kit's script types the words and handles theme and menus.
 */
export function SiteHeader() {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const pathname = usePathname()
  const hydrated = useHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const cartCount = useCartStore((state) => state.cart?.totalItems ?? 0)
  const fetchCart = useCartStore((state) => state.fetchCart)
  const isSignedIn = hydrated && isAuthenticated

  // Keep the cart badge accurate across sessions and tabs.
  useEffect(() => {
    if (isSignedIn) fetchCart()
  }, [isSignedIn, fetchCart])

  const nav = navbarModel(locale, 'shop', { leadHref: isSignedIn ? '/design' : '/collab', account: { href: '/account' } })
  const theme = themeToggleModel(locale)
  // The switcher's flags are synced from the kit into public/chth-flags
  const lang = languageMenuModel(locale, { flagBase: '/chth-flags' })
  const current = (href: string) => (pathname.startsWith(href) ? 'page' : undefined)
  const count = hydrated ? cartCount : 0

  return (
    <header className="chth-nav chth-nav--overlay" data-chth-nav>
      <div className="chth-nav__pill">
        <div className="chth-nav__start">
          <details className="chth-lang-menu chth-nav__lang">
            {/* The kit's switcher (chth-kit/language-menu.js): the globe with the current code on a badge */}
            <summary aria-label={`${lang.label}: ${lang.current?.label ?? ''}`} title={lang.label}>
              <span className="contents" dangerouslySetInnerHTML={{ __html: lang.globeSvg }} />
              {lang.badge ? <span className="chth-lang-menu__badge" aria-hidden="true">{lang.badge}</span> : null}
            </summary>
            <nav className="chth-lang-menu__list" aria-label={lang.label}>
              {lang.locales.map((l) => (
                <button
                  type="button"
                  key={l.code}
                  lang={l.code}
                  aria-current={l.current ? 'true' : undefined}
                  onClick={(e) => {
                    e.currentTarget.closest('details')?.removeAttribute('open')
                    setLocale(l.code)
                  }}
                >
                  {/* Check (current only), flag, the language's own name, its code */}
                  <span className="chth-lang-menu__check" dangerouslySetInnerHTML={{ __html: l.current ? lang.checkSvg : '' }} />
                  {l.flagSrc
                    // A 20px SVG fetched only when the menu opens: next/image would add nothing
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img className="chth-flag" src={l.flagSrc} alt="" width={20} height={15} loading="lazy" decoding="async" />
                    : <span className="chth-flag chth-flag--none" aria-hidden="true" />}
                  <span className="chth-lang-menu__name">{l.label}</span>
                  <span className="chth-lang-menu__code" aria-hidden="true">{l.short}</span>
                </button>
              ))}
            </nav>
          </details>
          <button type="button" className="chth-theme chth-nav__icon" data-chth-theme-toggle aria-label={theme.label} title={theme.label}
            suppressHydrationWarning dangerouslySetInnerHTML={{ __html: theme.iconsSvg }} />
          <Link className="chth-nav__lead" href={nav.leadHref} data-chth-type={JSON.stringify(nav.words)}>
            <span className="chth-nav__type">{nav.words[0]}</span>
            <span className="chth-nav__caret" aria-hidden="true" />
          </Link>
        </div>
        <Link className="chth-nav__logo" href={nav.home} aria-label={nav.homeLabel} dangerouslySetInnerHTML={{ __html: nav.logoSvg }} />
        <div className="chth-nav__end">
          <Link className="chth-nav__icon chth-nav__icon--wide" href="/shop" aria-label={t('Shop')} title={t('Shop')} aria-current={current('/shop')}>
            <Store aria-hidden="true" />
          </Link>
          <Link className="chth-nav__icon" href="/cart" aria-label={t('Cart')} title={t('Cart')} aria-current={current('/cart')}>
            <ShoppingBag aria-hidden="true" />
            {count > 0 && <span className="chth-nav__badge">{count}</span>}
          </Link>
          <Link className="chth-nav__icon" href={nav.account!.href} aria-label={nav.account!.label} title={nav.account!.label} aria-current={current('/account')}
            dangerouslySetInnerHTML={{ __html: nav.userSvg }} />
        </div>
      </div>
    </header>
  )
}
