import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { ToastProvider } from '@/components/layout/toast-provider'
import { ReferralCapture } from '@/components/providers/referral-capture'
import { TonProvider } from '@/components/providers/ton-provider'
import { Suspense } from 'react'
import { themeInitScript } from '@/lib/theme'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'CHTH', template: '%s | CHTH' },
  description: 'A crypto merch marketplace: design in 3D, buy from artists and merchants, pay with TON or any coin',
  keywords: 'merchandise, apparel, 3d design, tshirt, hoodie, pants, mug, cap, tote, artists, merchants, crypto, CHTH',
  authors: [{ name: 'CHTH' }],
  icons: { icon: '/logo-white.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <TonProvider>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
          <ToastProvider />
          <Suspense>
            <ReferralCapture />
          </Suspense>
        </TonProvider>
      </body>
    </html>
  )
}
