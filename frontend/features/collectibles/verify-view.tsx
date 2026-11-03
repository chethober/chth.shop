'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Card } from '@/components/ui/card'
import api from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { Collectible } from '@/types'
import { CollectibleCard } from './collectible-card'

/** Public authenticity check for the serial on an item's tag (the tag's QR code points here). */
export function VerifyView({ serial }: { serial: string }) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'missing' } | { status: 'ok'; collectible: Collectible }>({
    status: 'loading',
  })

  useEffect(() => {
    let cancelled = false
    api.collectibles
      .verify(serial)
      .then((collectible) => !cancelled && setState({ status: 'ok', collectible }))
      .catch(() => !cancelled && setState({ status: 'missing' }))
    return () => {
      cancelled = true
    }
  }, [serial])

  if (state.status === 'loading') return <LoadingState label="Checking serial…" />
  if (state.status === 'missing') {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Unknown serial"
        description={`No CHTH item has the serial ${serial}. Check the code on the tag, or the item may not be genuine.`}
      />
    )
  }

  const { collectible } = state
  return (
    <Card className="mx-auto max-w-lg space-y-5 p-6">
      <div className="space-y-1 text-center">
        <ShieldCheck className="mx-auto size-10 text-success" />
        <h1 className="text-xl font-bold text-foreground">Authentic CHTH item</h1>
        <p className="text-sm text-muted-foreground">
          Sold {formatDate(collectible.createdAt)} to @{collectible.ownerUsername}
          {collectible.status === 'MINTED' ? ', with its certificate minted on TON.' : '.'}
        </p>
      </div>
      <CollectibleCard collectible={collectible} />
    </Card>
  )
}
