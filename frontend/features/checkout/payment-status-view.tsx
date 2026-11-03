'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { canPayOrder, PaymentStatusBadge } from '@/components/shared/order-status-badge'
import { LoadingState } from '@/components/shared/loading-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRequireAuth } from '@/hooks/use-require-auth'
import api from '@/lib/api'
import { formatPrice } from '@/lib/format'
import type { Order } from '@/types'
import { PayButton } from './pay-button'

const POLL_INTERVAL_MS = 5000
/** Statuses that can still change on their own (confirmations arriving on-chain). */
const SETTLING = ['WAITING', 'CONFIRMING']

/** Where the crypto checkout sends buyers back to. Polls until the payment settles. */
export function PaymentStatusView() {
  const orderId = useSearchParams().get('order') ?? ''
  const isSignedIn = useRequireAuth(`/checkout/complete?order=${orderId}`)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSignedIn || !orderId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const load = async () => {
      try {
        const next = await api.orders.checkTon(orderId)
        if (cancelled) return
        setOrder(next)
        if (SETTLING.includes(next.paymentStatus)) timer = setTimeout(load, POLL_INTERVAL_MS)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load the order')
      }
    }
    load()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isSignedIn, orderId])

  if (!orderId || error) {
    return <p className="py-16 text-center text-sm text-muted-foreground">{error || 'No order given.'}</p>
  }
  if (!order) return <LoadingState label="Checking your payment…" />

  const paid = order.paymentStatus === 'PAID'
  const failed = ['EXPIRED', 'FAILED', 'PARTIALLY_PAID'].includes(order.paymentStatus)
  const Icon = paid ? CheckCircle2 : failed ? XCircle : Clock

  return (
    <Card className="mx-auto max-w-md space-y-5 p-6 text-center sm:p-8">
      <div
        className={
          paid
            ? 'mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success'
            : failed
              ? 'mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive'
              : 'mx-auto flex size-16 items-center justify-center rounded-full bg-warning/15 text-warning'
        }
      >
        <Icon className={paid || failed ? 'size-9' : 'size-9 animate-pulse'} />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-xl font-bold text-foreground">
          {paid ? 'Payment received' : failed ? 'Payment not completed' : 'Waiting for confirmations'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {paid
            ? "Thanks! We're printing your order now."
            : order.paymentStatus === 'PARTIALLY_PAID'
              ? 'We received less than the order total. Contact support with your order ID to settle the difference.'
              : failed
                ? 'The payment expired or failed. You can start a new one.'
                : 'This page updates automatically once the network confirms your transaction.'}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
        <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
        <PaymentStatusBadge status={order.paymentStatus} />
        <span className="font-semibold tabular-nums">{formatPrice(order.total)}</span>
      </div>

      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        {canPayOrder(order) && <PayButton orderId={order.id}>{failed ? 'Try again' : 'Open payment'}</PayButton>}
        <Button asChild variant="outline">
          <Link href="/account?tab=orders">View orders</Link>
        </Button>
      </div>
    </Card>
  )
}
