'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, ShoppingBag, Star, Sun, User } from 'lucide-react'
import { MobileNav, MobileNavHeader, NavBody, Navbar, NavbarLogo } from '@/components/custom/resizable-navbar'
import TextType from '@/components/custom/text-type'
import { ChthLogo } from '@/components/shared/chth-logo'
import { useHydrated } from '@/hooks/use-hydrated'
import { THEME_STORAGE_KEY, applyTheme, toggleTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/auth-store'
import useCartStore from '@/store/cart-store'
import { useT } from '@/lib/i18n'

const iconLinkStyles =
  'group relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 ease-out select-none hover:scale-110 hover:bg-muted hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const iconStyles = 'size-3.5 transition-transform duration-300 group-hover:scale-110'

function Logo({ size }: { size: 'sm' | 'md' }) {
  const t = useT()
  return (
    <NavbarLogo
      href="/"
      aria-label={t("CHTH home")}
      className={cn(
        'group justify-center rounded-full px-2 text-foreground transition-all duration-300 ease-out hover:scale-110 hover:bg-muted/60 active:scale-95',
        size === 'md' ? 'h-12' : 'h-11'
      )}
    >
      <ChthLogo
        className={cn(
          'h-auto transition-transform duration-300 ease-out group-hover:rotate-[-3deg] group-hover:scale-110',
          size === 'md' ? 'w-12 sm:w-14' : 'w-11'
        )}
      />
    </NavbarLogo>
  )
}

/** Left slot: the design studio for signed-in users, the artist program otherwise. */
function PrimaryLink({ isSignedIn, isActive }: { isSignedIn: boolean; isActive: (href: string) => boolean }) {
  const t = useT()
  if (isSignedIn) {
    return (
      <Link
        href="/design"
        aria-label={t("Design studio")}
        title={t("Design studio")}
        className={cn(iconLinkStyles, isActive('/design') && 'bg-muted/40 text-foreground')}
      >
        <Star className={cn(iconStyles, 'group-hover:rotate-12', isActive('/design') ? 'fill-current' : 'group-hover:fill-current')} />
      </Link>
    )
  }

  return (
    <Link
      href="/collab"
      aria-label={t("Artist collaboration")}
      className={cn(
        'inline-flex min-w-[88px] items-center rounded-full px-2.5 py-1 text-xs tracking-wider transition-all duration-200 ease-out select-none hover:scale-105 hover:bg-muted/70 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isActive('/collab') ? 'bg-muted/40 font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <TextType
        as="span"
        text={[t('Artists?'), t('Creators?'), t('Collab?')]}
        typingSpeed={75}
        pauseDuration={1500}
        deletingSpeed={40}
        cursorCharacter="|"
        cursorClassName="text-brand"
      />
    </Link>
  )
}

function Actions({ cartCount }: { cartCount: number }) {
  const t = useT()
  return (
    <>
      <button type="button" onClick={toggleTheme} aria-label={t("Toggle theme")} title={t("Toggle theme")} className={iconLinkStyles}>
        <Sun className={cn(iconStyles, 'hidden group-hover:rotate-45 dark:block')} />
        <Moon className={cn(iconStyles, 'block group-hover:-rotate-12 dark:hidden')} />
      </button>

      <Link href="/cart" aria-label={t("Cart")} title={t("Cart")} className={iconLinkStyles}>
        <ShoppingBag className={cn(iconStyles, 'group-hover:-translate-y-0.5')} />
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
            {cartCount}
          </span>
        )}
      </Link>

      <Link href="/account" aria-label={t("Account")} title={t("Account")} className={iconLinkStyles}>
        <User className={cn(iconStyles, 'group-hover:-translate-y-0.5')} />
      </Link>
    </>
  )
}

export function SiteHeader() {
  const t = useT()
  const pathname = usePathname()
  const hydrated = useHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const cartCount = useCartStore((state) => state.cart?.totalItems ?? 0)
  const fetchCart = useCartStore((state) => state.fetchCart)

  const isSignedIn = hydrated && isAuthenticated
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  // Keep the cart badge accurate across sessions and tabs.
  useEffect(() => {
    if (isSignedIn) fetchCart()
  }, [isSignedIn, fetchCart])

  // Follow theme changes made in other tabs.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) applyTheme(event.newValue === 'dark' ? 'dark' : 'light')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Drop focus after a click so the pill navbar doesn't keep a stale ring.
  const blurOnClick = (event: React.MouseEvent<HTMLElement>) => {
    ;(event.target as HTMLElement).closest<HTMLElement>('a, button')?.blur()
  }

  const count = hydrated ? cartCount : 0

  return (
    <Navbar className="mx-auto max-w-5xl" scrollThreshold={50}>
      <NavBody className="relative justify-between" onClickCapture={blurOnClick}>
        <div className="relative z-20 flex min-w-[130px] items-center">
          <PrimaryLink isSignedIn={isSignedIn} isActive={isActive} />
        </div>
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <Logo size="md" />
        </div>
        <div className="relative z-20 flex min-w-[130px] items-center justify-end gap-1.5">
          <Actions cartCount={count} />
        </div>
      </NavBody>

      <MobileNav onClickCapture={blurOnClick}>
        <MobileNavHeader>
          <div className="relative z-20 flex items-center">
            <PrimaryLink isSignedIn={isSignedIn} isActive={isActive} />
          </div>
          <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
            <Logo size="sm" />
          </div>
          <div className="relative z-20 flex items-center gap-1">
            <Actions cartCount={count} />
          </div>
        </MobileNavHeader>
      </MobileNav>
    </Navbar>
  )
}
