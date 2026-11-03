'use client'

import { TonConnectUIProvider } from '@tonconnect/ui-react'

/**
 * TON Connect for wallet payments and NFT claims. The manifest is generated per origin
 * (app/tonconnect-manifest.json/route.ts) because wallets check that it matches the site.
 */
export function TonProvider({ children }: { children: React.ReactNode }) {
  const manifestUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/tonconnect-manifest.json`
  return <TonConnectUIProvider manifestUrl={manifestUrl}>{children}</TonConnectUIProvider>
}
