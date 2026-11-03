'use client'

import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { TELEGRAM_MINI_APP_LINK } from '@/lib/config'

/**
 * TON Connect for wallet payments and NFT claims. The manifest is generated per origin
 * (app/tonconnect-manifest.json/route.ts) because wallets check that it matches the site.
 */
export function TonProvider({ children }: { children: React.ReactNode }) {
  const manifestUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/tonconnect-manifest.json`
  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // Inside the Telegram Mini App, wallets return the user here after approving.
      actionsConfiguration={TELEGRAM_MINI_APP_LINK ? { twaReturnUrl: TELEGRAM_MINI_APP_LINK as `${string}://${string}` } : undefined}
    >
      {children}
    </TonConnectUIProvider>
  )
}
