'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, Wallet } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { shortAddress } from '@/features/collectibles/collectible-card'
import api from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/format'
import type { PayoutStatus, PayoutSummary } from '@/types'

export const PAYOUT_STATUS: Record<PayoutStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: 'Scheduled', variant: 'warning' },
  SENDING: { label: 'Sending…', variant: 'info' },
  SENT: { label: 'Sent', variant: 'success' },
  FAILED: { label: 'Failed, retrying', variant: 'destructive' },
}

/** Earnings balance, where it gets paid, and past payouts. */
export function PayoutsCard({ onEditSettings }: { onEditSettings?: () => void }) {
  const [summary, setSummary] = useState<PayoutSummary | null>(null)

  useEffect(() => {
    api.payouts
      .me()
      .then(setSummary)
      .catch(() => {})
  }, [])

  if (!summary) return null

  const stats = [
    { label: 'Ready to pay out', value: summary.available, hint: `Paid out when it reaches ${formatPrice(summary.minAmount)}` },
    { label: 'On hold', value: summary.onHold, hint: `Until shipped + ${summary.holdDays} days` },
    { label: 'Paid out', value: summary.paidOut, hint: 'All time' },
  ]

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-brand" />
            Payouts
          </CardTitle>
          <CardDescription>
            {summary.destination ? (
              <>
                Paid in USDT to <span className="font-mono">{shortAddress(summary.destination.address)}</span> ({summary.destination.network})
                {summary.destination.network === 'USDT-TON' && summary.automatic ? ', automatically every month.' : ', monthly.'}
              </>
            ) : (
              'Add a payout address to get paid.'
            )}
          </CardDescription>
        </div>
        {onEditSettings && (
          <button type="button" onClick={onEditSettings} className="cursor-pointer text-xs font-semibold text-foreground hover:underline">
            {summary.destination ? 'Change' : 'Add address'}
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-muted/50 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-xl font-extrabold tabular-nums text-foreground">{formatPrice(stat.value)}</dd>
              <dd className="text-[11px] text-muted-foreground">{stat.hint}</dd>
            </div>
          ))}
        </dl>

        {summary.payouts.length > 0 && (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {summary.payouts.map((payout) => (
              <li key={payout.id} className="flex items-center gap-3 p-3 text-xs">
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tabular-nums text-foreground">{formatPrice(payout.amount)} USDT</p>
                  <p className="truncate text-muted-foreground">
                    {formatDate(payout.sentAt ?? payout.createdAt)} · {payout.network}
                    {payout.txHash && <> · <span className="font-mono">{payout.txHash.slice(0, 16)}</span></>}
                  </p>
                </div>
                <Badge variant={PAYOUT_STATUS[payout.status].variant}>{PAYOUT_STATUS[payout.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
