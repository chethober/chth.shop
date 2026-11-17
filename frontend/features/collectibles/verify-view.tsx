'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { LoadingState } from '@/components/shared/loading-state'
import { StatusCard } from '@/components/shared/status-card'
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
      <StatusCard
        icon={ShieldAlert}
        tone="destructive"
        title="Unknown serial"
        description={`No CHTH item has the serial ${serial}. Check the code on the tag, or the item may not be genuine.`}
      />
    )
  }

  const { collectible } = state
  return (
    <StatusCard
      icon={ShieldCheck}
      tone="success"
      className="max-w-lg"
      title="Authentic CHTH item"
      description={
        <>
          Sold {formatDate(collectible.createdAt)} to @{collectible.ownerUsername}
          {collectible.status === 'MINTED' ? ', with its certificate minted on TON.' : '.'}
        </>
      }
    >
      <div className="text-left">
        <CollectibleCard collectible={collectible} />
      </div>
    </StatusCard>
  )
}
