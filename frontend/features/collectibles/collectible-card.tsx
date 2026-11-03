'use client'

import Link from 'next/link'
import { ExternalLink, Gem } from 'lucide-react'
import { ProductImage } from '@/components/shared/product-image'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { usePaymentMethods } from '@/features/checkout/use-crypto-payment'
import { cn } from '@/lib/utils'
import type { Collectible, CollectibleStatus } from '@/types'

export const COLLECTIBLE_STATUS: Record<CollectibleStatus, { label: string; variant: BadgeProps['variant'] }> = {
  UNCLAIMED: { label: 'Ready to claim', variant: 'warning' },
  MINTING: { label: 'Minting…', variant: 'info' },
  MINTED: { label: 'On-chain', variant: 'success' },
  FAILED: { label: 'Mint failed', variant: 'destructive' },
}

/** Explorer link for a minted item; the dev mock has no real address. */
export function explorerUrl(address: string | null, network: 'mainnet' | 'testnet' = 'mainnet') {
  if (!address || address.startsWith('mock:')) return null
  return `https://${network === 'testnet' ? 'testnet.' : ''}tonviewer.com/${address}`
}

export function shortAddress(address: string) {
  return address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address
}

export function CollectibleCard({
  collectible,
  children,
  className,
}: {
  collectible: Collectible
  children?: React.ReactNode
  className?: string
}) {
  const isMockMint = collectible.nftAddress?.startsWith('mock:')
  const status = isMockMint ? { label: 'Test mint (not on-chain)', variant: 'secondary' as const } : COLLECTIBLE_STATUS[collectible.status]
  const network = usePaymentMethods()?.tonNetwork ?? 'mainnet'
  const link = explorerUrl(collectible.nftAddress, network)

  return (
    <div className={cn('flex gap-4 rounded-xl border border-border bg-card p-3', className)}>
      <div className="relative shrink-0">
        <ProductImage
          product={{ imageUrl: collectible.imageUrl, type: collectible.productType ?? undefined, name: collectible.name }}
          className="size-20 rounded-lg border border-border"
        />
        <span className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-[#0098EA] text-white">
          <Gem className="size-3" />
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{collectible.name}</p>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {collectible.edition ? `Edition #${collectible.edition} of ${collectible.editionSize} · ` : ''}
          Serial{' '}
          <Link href={`/verify/${collectible.serial}`} className="font-mono font-semibold text-foreground hover:underline">
            {collectible.serial}
          </Link>
        </p>
        {collectible.store && (
          <p className="text-xs text-muted-foreground">
            by{' '}
            <Link href={`/${collectible.store.username}`} className="hover:underline">
              {collectible.store.storeName || `@${collectible.store.username}`}
            </Link>
          </p>
        )}
        {collectible.ownerAddress && (
          <p className="text-[11px] text-muted-foreground">
            Owner wallet <span className="font-mono">{shortAddress(collectible.ownerAddress)}</span>
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-0.5 text-[#0098EA] hover:underline">
                View NFT <ExternalLink className="size-3" />
              </a>
            )}
          </p>
        )}
        {collectible.mintError && <p className="text-[11px] text-destructive">{collectible.mintError}</p>}
        {children}
      </div>
    </div>
  )
}
