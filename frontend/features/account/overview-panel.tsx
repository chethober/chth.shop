'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  ExternalLink,
  Package,
  Palette,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { OrderStatusBadge, isActiveOrder } from '@/components/shared/order-status-badge'
import { ProductImage } from '@/components/shared/product-image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order, Product, Store as StoreRecord } from '@/types'
import type { AccountTab } from './account-tabs'
import { hasSocialLinks } from './store-form'

interface OverviewPanelProps {
  username: string
  store: StoreRecord | null
  products: Product[]
  orders: Order[]
  isLoadingOrders: boolean
  onNavigate: (tab: AccountTab) => void
}

function ProgressRing({ value, children }: { value: number; children: React.ReactNode }) {
  const size = 56
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-muted" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-brand"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

function StatTile({
  label,
  value,
  caption,
  icon: Icon,
  accent,
  index,
  onClick,
}: {
  label: string
  value: string
  caption: string
  icon: LucideIcon
  accent: string
  index: number
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="group cursor-pointer rounded-2xl border border-border bg-card p-4 text-left shadow-xs transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className={cn('flex size-9 items-center justify-center rounded-xl', accent)}>
          <Icon className="size-4" />
        </span>
        <ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{caption}</p>
    </motion.button>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
  primary,
  external,
}: {
  href: string
  icon: LucideIcon
  label: string
  primary?: boolean
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-3 transition-all hover:-translate-y-0.5',
        primary
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-border bg-background text-foreground hover:border-foreground/20'
      )}
    >
      <Icon className="size-4" />
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  )
}

export function OverviewPanel({ username, store, products, orders, isLoadingOrders, onNavigate }: OverviewPanelProps) {
  const activeOrders = orders.filter((order) => isActiveOrder(order.status))
  const totalSpent = orders
    .filter((order) => order.status !== 'CANCELLED')
    .reduce((sum, order) => sum + order.total, 0)
  const recentOrders = orders.slice(0, 3)

  const checklist: { id: string; label: string; hint: string; done: boolean; tab: AccountTab }[] = [
    { id: 'username', label: 'Claim your username', hint: 'Your public handle', done: Boolean(username), tab: 'profile' },
    { id: 'store', label: 'Activate your store', hint: 'Pick a store name to go live', done: Boolean(store), tab: 'store' },
    { id: 'payout', label: 'Add a payout address', hint: 'Where your crypto earnings go', done: Boolean(store?.payoutAddress?.trim()), tab: 'store' },
    { id: 'bio', label: 'Write a bio', hint: 'Tell fans who you are', done: Boolean(store?.bio?.trim()), tab: 'store' },
    { id: 'socials', label: 'Connect a social', hint: 'Help fans find you', done: hasSocialLinks(store), tab: 'store' },
    { id: 'product', label: 'Publish a product', hint: 'Design your first piece', done: products.length > 0, tab: 'store' },
  ]
  const completed = checklist.filter((item) => item.done).length
  const nextStep = checklist.find((item) => !item.done)

  const stats = [
    {
      label: 'Products',
      value: String(products.length),
      caption: store ? 'In your store' : 'Store not active',
      icon: Store,
      tab: 'store' as const,
      accent: 'bg-brand/10 text-brand',
    },
    {
      label: 'Active orders',
      value: isLoadingOrders ? '—' : String(activeOrders.length),
      caption: `${orders.length} total`,
      icon: Truck,
      tab: 'orders' as const,
      accent: 'bg-info/10 text-info',
    },
    {
      label: 'Total spent',
      value: isLoadingOrders ? '—' : formatPrice(totalSpent),
      caption: 'Excluding cancelled',
      icon: CircleDollarSign,
      tab: 'orders' as const,
      accent: 'bg-success/10 text-success',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(({ tab, ...stat }, index) => (
          <StatTile key={stat.label} {...stat} index={index} onClick={() => onNavigate(tab)} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 sm:p-6 lg:col-span-3">
          {nextStep ? (
            <>
              <div className="mb-5 flex items-center gap-4">
                <ProgressRing value={completed / checklist.length}>
                  <span className="text-xs font-bold tabular-nums text-foreground">
                    {completed}/{checklist.length}
                  </span>
                </ProgressRing>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Set up your creator profile</h2>
                  <p className="text-xs text-muted-foreground">
                    Next up: <span className="font-medium text-foreground">{nextStep.label.toLowerCase()}</span>
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5">
                {checklist.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={item.done}
                      onClick={() => onNavigate(item.tab)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        item.done ? 'cursor-default' : 'cursor-pointer hover:bg-muted/60',
                        item === nextStep && 'bg-muted/40 ring-1 ring-border'
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                          item.done
                            ? 'border-success bg-success text-white'
                            : 'border-dashed border-muted-foreground/50 group-hover:border-foreground'
                        )}
                      >
                        {item.done && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-sm font-medium',
                            item.done ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-foreground'
                          )}
                        >
                          {item.label}
                        </span>
                        {!item.done && <span className="block text-[11px] text-muted-foreground">{item.hint}</span>}
                      </span>
                      {!item.done && (
                        <ArrowRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <ProgressRing value={1}>
                <Sparkles className="size-5 text-brand" />
              </ProgressRing>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Your store is fully set up</h2>
                <p className="text-xs text-muted-foreground">Share it with your fans and keep designing.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={`/${username}`} target="_blank">
                    View store
                    <ExternalLink />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6 lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold text-foreground">Quick actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction href="/design" icon={Palette} label="New design" primary />
            {store ? (
              <QuickAction href={`/${username}`} icon={ExternalLink} label="Public store" external />
            ) : (
              <QuickAction href="/collab" icon={Sparkles} label="Become a seller" />
            )}
            <QuickAction href="/" icon={ShoppingBag} label="Browse shop" />
            <QuickAction href="/cart" icon={Package} label="My cart" />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-3">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Your latest purchases</CardDescription>
          </div>
          {orders.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => onNavigate('orders')}>
              View all
              <ArrowRight />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/60" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Items you buy from artists and merchants will show up here."
              action={
                <Button asChild size="sm">
                  <Link href="/shop">Explore the shop</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((order) => {
                const firstProduct = order.items[0]
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate('orders')}
                      className="-mx-2 flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-muted/30"
                    >
                      <ProductImage product={firstProduct} alt="" className="size-10 shrink-0 rounded-lg border border-border" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {firstProduct?.name || 'Order'}
                          {order.items.length > 1 && (
                            <span className="font-normal text-muted-foreground"> +{order.items.length - 1} more</span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                      <span className="w-20 text-right text-sm font-semibold tabular-nums text-foreground">
                        {formatPrice(order.total)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
