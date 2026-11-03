import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { ToastProvider } from '@/components/layout/toast-provider'
import { themeInitScript } from '@/lib/theme'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'CHTH', template: '%s | CHTH' },
  description: 'Design, customize, and order custom apparel with real-time 3D preview',
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
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        <ToastProvider />
      </body>
    </html>
  )
}
