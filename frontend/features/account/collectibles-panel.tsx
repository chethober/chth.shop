'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Gem, Wallet } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { CollectibleCard, shortAddress } from '@/features/collectibles/collectible-card'
import api from '@/lib/api'
import type { Collectible } from '@/types'

const POLL_MS = 4000

/** NFT certificates from the buyer's NFT-backed purchases, claimable to a TON wallet. */
export function CollectiblesPanel() {
  const [collectibles, setCollectibles] = useState<Collectible[] | null>(null)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [manualAddress, setManualAddress] = useState('')
  const [tonConnectUI] = useTonConnectUI()
  const walletAddress = useTonAddress()

  const load = useCallback(() => api.collectibles.mine().then(setCollectibles), [])

  useEffect(() => {
    load().catch(() => setCollectibles([]))
  }, [load])

  // Keep refreshing while anything is minting.
  const minting = collectibles?.some((collectible) => collectible.status === 'MINTING')
  useEffect(() => {
    if (!minting) return
    const timer = setInterval(() => load().catch(() => {}), POLL_MS)
    return () => clearInterval(timer)
  }, [minting, load])

  const claim = async (collectible: Collectible) => {
    const address = walletAddress || manualAddress.trim()
    if (!address) {
      tonConnectUI.openModal()
      return
    }
    setClaimingId(collectible.id)
    try {
      const updated = await api.collectibles.claim(collectible.id, address)
      setCollectibles((current) => current?.map((c) => (c.id === updated.id ? updated : c)) ?? null)
      toast.success('Minting your NFT certificate…')
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not claim')
    } finally {
      setClaimingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Collectibles</CardTitle>
          <CardDescription>NFT certificates for your limited and NFT-backed merch</CardDescription>
        </div>
        {walletAddress ? (
          <Button variant="outline" size="sm" onClick={() => tonConnectUI.disconnect()}>
            <Wallet />
            {shortAddress(walletAddress)}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => tonConnectUI.openModal()}>
            <Wallet />
            Connect TON wallet
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!collectibles ? (
          <Spinner className="mx-auto" />
        ) : collectibles.length === 0 ? (
          <EmptyState
            icon={Gem}
            title="No collectibles yet"
            description="Items marked “NFT certificate” come with a numbered collectible you can claim to your TON wallet."
            action={
              <Button asChild size="sm">
                <Link href="/shop?collection=drops">Browse drops</Link>
              </Button>
            }
          />
        ) : (
          <>
            {!walletAddress && collectibles.some((c) => c.status === 'UNCLAIMED' || c.status === 'FAILED') && (
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3 sm:flex-row sm:items-center">
                <p className="text-xs text-muted-foreground sm:flex-1">Connect a wallet above, or paste a TON address to claim to:</p>
                <Input
                  value={manualAddress}
                  onChange={(event) => setManualAddress(event.target.value)}
                  placeholder="UQ… / EQ…"
                  spellCheck={false}
                  className="font-mono text-xs sm:w-72"
                />
              </div>
            )}
            {collectibles.map((collectible) => (
              <CollectibleCard key={collectible.id} collectible={collectible}>
                {(collectible.status === 'UNCLAIMED' || collectible.status === 'FAILED') && (
                  <Button size="sm" className="mt-2" onClick={() => claim(collectible)} disabled={claimingId !== null}>
                    {claimingId === collectible.id ? <Spinner /> : <Gem />}
                    {collectible.status === 'FAILED' ? 'Retry mint' : walletAddress || manualAddress ? 'Claim to wallet' : 'Connect wallet to claim'}
                  </Button>
                )}
              </CollectibleCard>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
