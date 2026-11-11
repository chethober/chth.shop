import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { CookieNotice, SiteBanner } from '@/components/layout/site-notices'
import { ReferralCapture } from '@/components/providers/referral-capture'
import { TelegramMiniApp } from '@/components/providers/telegram-mini-app'
import { TonProvider } from '@/components/providers/ton-provider'
import { Suspense } from 'react'
import { themeInitScript } from '@/lib/theme'
import './globals.css'
import { dirOf } from '@/chth-kit/locales.js'
import { LocaleProvider } from '@/lib/i18n'
import { requestLocale } from '@/lib/i18n/server'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'CHTH', template: '%s | CHTH' },
  description: 'A crypto merch marketplace: design in 3D, buy from artists and merchants, pay with TON or any coin',
  keywords: 'merchandise, apparel, 3d design, tshirt, hoodie, pants, mug, cap, tote, artists, merchants, crypto, CHTH',
  authors: [{ name: 'CHTH' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, hasCookie } = await requestLocale()
  return (
    <html lang={locale} dir={dirOf(locale)} data-chth-product="shop" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Persian and Arabic text uses Vazirmatn (see .chth-* rules in globals.css). */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300..800&display=swap" />
      </head>
      <body suppressHydrationWarning className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <LocaleProvider initial={locale} hasCookie={hasCookie}>
          <TonProvider>
            <SiteBanner />
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
            <CookieNotice />
            <Suspense>
              <ReferralCapture />
            </Suspense>
            <TelegramMiniApp />
          </TonProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
