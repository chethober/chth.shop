'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Package, RefreshCw, Search } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterChip } from '@/components/shared/filter-chip'
import { isActiveOrder } from '@/components/shared/order-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'
import { OrderRow } from './order-row'

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled'

const FILTERS: { id: OrderFilter; label: string; matches: (order: Order) => boolean }[] = [
  { id: 'all', label: 'All', matches: () => true },
  { id: 'active', label: 'In progress', matches: (order) => isActiveOrder(order.status) },
  { id: 'delivered', label: 'Delivered', matches: (order) => order.status === 'DELIVERED' },
  { id: 'cancelled', label: 'Cancelled', matches: (order) => order.status === 'CANCELLED' },
]

interface OrdersPanelProps {
  orders: Order[]
  isLoading: boolean
  onRefresh: () => void
  onCancel: (orderId: string) => Promise<void>
}

export function OrdersPanel({ orders, isLoading, onRefresh, onCancel }: OrdersPanelProps) {
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const visibleOrders = useMemo(() => {
    const matches = FILTERS.find((f) => f.id === filter)!.matches
    const q = query.trim().toLowerCase()
    return orders.filter(
      (order) =>
        matches(order) &&
        (!q || order.id.toLowerCase().includes(q) || order.items.some((item) => item.product?.name.toLowerCase().includes(q)))
    )
  }, [orders, filter, query])

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Track and manage your purchases</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={cn(isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {orders.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <FilterChip key={f.id} active={filter === f.id} count={orders.filter(f.matches).length} onClick={() => setFilter(f.id)}>
                  {f.label}
                </FilterChip>
              ))}
            </div>
            <div className="relative md:ml-auto md:w-60">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Order # or product"
                className="pl-9 text-xs"
              />
            </div>
          </div>
        )}

        {isLoading && orders.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you buy from artists, your orders and their shipping status appear here."
            action={
              <Button asChild size="sm">
                <Link href="/">Explore products</Link>
              </Button>
            }
          />
        ) : visibleOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No orders match these filters.</p>
        ) : (
          <ul className="space-y-2">
            {visibleOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                open={expandedId === order.id}
                onToggle={() => setExpandedId((current) => (current === order.id ? null : order.id))}
                onCancel={onCancel}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
