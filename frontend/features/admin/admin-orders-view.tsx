'use client'

import { useEffect, useState } from 'react'
import { Package, RefreshCw, ShieldAlert } from 'lucide-react'
import { toast } from '@heroui/react'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterChip } from '@/components/shared/filter-chip'
import { LoadingState } from '@/components/shared/loading-state'
import { ORDER_STATUS, OrderStatusBadge, PaymentStatusBadge } from '@/components/shared/order-status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { ProductImage } from '@/components/shared/product-image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { useRequireAuth } from '@/hooks/use-require-auth'
import api from '@/lib/api'
import { formatDateTime, formatPrice } from '@/lib/format'
import { describeOptions, getProductImageUrl, getProductTypeLabel } from '@/lib/products'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/auth-store'
import type { Order, OrderStatus } from '@/types'

const STATUSES = Object.keys(ORDER_STATUS) as OrderStatus[]

/** Platform fulfillment queue: every order, with print details and status controls. */
export function AdminOrdersView() {
  const isSignedIn = useRequireAuth('/admin')
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN')
  const [filter, setFilter] = useState<OrderStatus | undefined>('CONFIRMED')
  const [reloadKey, setReloadKey] = useState(0)
  /** Orders, tagged with the filter + reload they were loaded for. */
  const [loaded, setLoaded] = useState<{ key: string; orders: Order[] }>({ key: '', orders: [] })
  const queryKey = `${filter ?? 'all'}:${reloadKey}`
  const orders = loaded.key === queryKey ? loaded.orders : null
  const setOrders = (update: (current: Order[]) => Order[]) =>
    setLoaded((current) => ({ ...current, orders: update(current.orders) }))

  useEffect(() => {
    if (!isSignedIn || !isAdmin) return
    let cancelled = false
    api.admin
      .orders(filter)
      .then((items) => !cancelled && setLoaded({ key: queryKey, orders: items }))
      .catch((error) => {
        if (cancelled) return
        toast.danger(error instanceof Error ? error.message : 'Failed to load orders')
        setLoaded({ key: queryKey, orders: [] })
      })
    return () => {
      cancelled = true
    }
  }, [isSignedIn, isAdmin, filter, queryKey])

  const setStatus = async (order: Order, status: OrderStatus) => {
    try {
      const updated = await api.admin.setOrderStatus(order.id, status)
      setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, ...updated, customer: o.customer } : o)))
      toast.success(`Order marked ${ORDER_STATUS[status].label.toLowerCase()}`)
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Failed to update the order')
    }
  }

  if (!isSignedIn) return null
  if (!isAdmin) return <EmptyState icon={ShieldAlert} title="Admins only" description="Ask an admin to run `npm run make-admin -- <username>`." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fulfillment"
        description="Paid orders are confirmed automatically. Print, then mark them shipped and delivered."
        actions={
          <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={!filter} onClick={() => setFilter(undefined)}>
          All
        </FilterChip>
        {STATUSES.map((status) => (
          <FilterChip key={status} active={filter === status} onClick={() => setFilter(status)}>
            {ORDER_STATUS[status].label}
          </FilterChip>
        ))}
      </div>

      {!orders ? (
        <LoadingState />
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders here" />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)} · @{order.customer?.username}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm font-semibold tabular-nums">{formatPrice(order.total)}</span>
                </span>
              </div>

              <ul className="divide-y divide-border rounded-xl border border-border">
                {order.items.map((item) => {
                  const design = item.options.design ?? item.options.sellerDesign
                  return (
                    <li key={item.id} className="flex items-center gap-3 p-2.5 text-xs">
                      <ProductImage product={item} className="size-12 shrink-0 rounded-lg border border-border" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {item.quantity} × {item.name}
                        </p>
                        <p className="truncate text-muted-foreground">
                          {[getProductTypeLabel(item.type), describeOptions(item.options), item.store && `@${item.store.username}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      {design && (
                        <div className="flex gap-1">
                          {[design.logoUrl, ...design.layers.map((layer) => layer.imageUrl)]
                            .filter((url): url is string => Boolean(url))
                            .map((url) => (
                              <a key={url} href={getProductImageUrl(url)} target="_blank" rel="noreferrer" className="text-brand underline">
                                art
                              </a>
                            ))}
                          {design.layers
                            .filter((layer) => layer.type === 'text')
                            .map((layer) => (
                              <span key={layer.id} className="rounded bg-muted px-1.5 py-0.5 font-mono">
                                “{layer.content}”
                              </span>
                            ))}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="whitespace-pre-line text-xs text-muted-foreground">{order.shippingAddress}</p>
                <Select
                  aria-label="Order status"
                  value={order.status}
                  onChange={(event) => setStatus(order, event.target.value as OrderStatus)}
                  className={cn('min-w-36')}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS[status].label}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
