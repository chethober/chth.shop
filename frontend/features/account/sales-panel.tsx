'use client'

import { useEffect, useState } from 'react'
import { CircleDollarSign, Package, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { describeOptions } from '@/lib/products'
import type { SalesReport } from '@/types'
import { PayoutsCard } from './payouts-card'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; report: SalesReport }

/** Paid sales of the seller's products and what they earned from them. */
export function SalesPanel({ onEditPayoutSettings }: { onEditPayoutSettings?: () => void }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.stores
      .sales()
      .then((report) => !cancelled && setState({ status: 'ready', report }))
      .catch((error) => !cancelled && setState({ status: 'error', message: error instanceof Error ? error.message : 'Failed to load sales' }))
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
  }
  if (state.status === 'error') {
    return <p className="py-10 text-center text-sm text-muted-foreground">{state.message}</p>
  }

  const { summary, sales } = state.report
  const stats = [
    { label: 'Units sold', value: String(summary.unitsSold), icon: Package },
    { label: 'Revenue', value: formatPrice(summary.revenue), icon: TrendingUp },
    { label: 'Your earnings', value: formatPrice(summary.earnings), icon: CircleDollarSign },
  ]

  return (
    <div className="space-y-4">
      <PayoutsCard onEditSettings={onEditPayoutSettings} />
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
              <Icon className="size-3.5 text-brand" />
            </div>
            <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-foreground">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sales</CardTitle>
            <CardDescription>Paid orders containing your products.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <EmptyState icon={CircleDollarSign} title="No sales yet" description="Share your store link to get your first order." />
          ) : (
            <ul className="divide-y divide-border">
              {sales.map((sale) => (
                <li key={sale.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {sale.quantity} × {sale.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {[describeOptions(sale.options), sale.paidAt && formatRelativeTime(sale.paidAt), `#${sale.orderId.slice(0, 8).toUpperCase()}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <OrderStatusBadge status={sale.orderStatus} />
                  <span className="w-20 text-right text-sm font-semibold tabular-nums text-success">+{formatPrice(sale.earning)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
