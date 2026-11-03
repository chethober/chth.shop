'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, MapPin, Package, XCircle } from 'lucide-react'
import { ConfirmButton } from '@/components/shared/confirm-button'
import { CopyButton } from '@/components/shared/copy-button'
import {
  canPayOrder,
  ORDER_STATUS,
  ORDER_STEPS,
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/shared/order-status-badge'
import { ProductImage } from '@/components/shared/product-image'
import { formatDateTime, formatPrice, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PayButton } from '@/features/checkout/pay-button'
import { describeOptions } from '@/lib/products'
import type { Order } from '@/types'

function OrderProgress({ status }: { status: Order['status'] }) {
  if (status === 'CANCELLED') {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs font-medium text-destructive">
        <XCircle className="size-4" />
        This order was cancelled.
      </p>
    )
  }

  const current = ORDER_STEPS.indexOf(status)

  return (
    <ol className="flex items-start">
      {ORDER_STEPS.map((step, index) => {
        const done = index <= current
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center">
            {index > 0 && (
              <span className="absolute right-1/2 top-3 h-0.5 w-full bg-border">
                <motion.span
                  className="block h-full origin-left bg-success"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.35, delay: index * 0.12 }}
                />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.12 }}
              className={cn(
                'relative z-10 flex size-6 items-center justify-center rounded-full border-2',
                done ? 'border-success bg-success text-white' : 'border-border bg-card text-muted-foreground',
                index === current && 'ring-4 ring-success/20'
              )}
            >
              {done ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-border" />}
            </motion.span>
            <span className={cn('mt-1.5 text-[11px] font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
              {ORDER_STATUS[step].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

interface OrderRowProps {
  order: Order
  open: boolean
  onToggle: () => void
  onCancel: (orderId: string) => Promise<void>
}

export function OrderRow({ order, open, onToggle, onCancel }: OrderRowProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <li className={cn('rounded-xl border transition-colors', open ? 'border-foreground/20 bg-muted/20' : 'border-border hover:border-foreground/15')}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-3 p-3 text-left">
        <div className="flex shrink-0 -space-x-3">
          {order.items.slice(0, 3).map((item, index) => (
            <ProductImage
              key={item.id}
              product={item}
              alt=""
              className="relative size-10 rounded-lg border-2 border-card"
              style={{ zIndex: 3 - index }}
            />
          ))}
          {order.items.length === 0 && (
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Package className="size-4 text-muted-foreground" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatRelativeTime(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <span className="hidden sm:inline-flex">
          <PaymentStatusBadge status={order.paymentStatus} />
        </span>
        <OrderStatusBadge status={order.status} />
        <span className="hidden w-20 text-right text-sm font-semibold tabular-nums text-foreground sm:block">
          {formatPrice(order.total)}
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 px-3 pb-4 pt-1">
              <OrderProgress status={order.status} />

              <div className="divide-y divide-border rounded-xl border border-border bg-card">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    <ProductImage product={item} className="size-12 shrink-0 rounded-lg border border-border" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      {(describeOptions(item.options) || item.store) && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {[describeOptions(item.options), item.store && `@${item.store.username}`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="text-[11px] tabular-nums text-muted-foreground">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                {order.discount > 0 && (
                  <div className="flex items-center justify-between p-3 text-xs text-success">
                    <span>Welcome discount</span>
                    <span className="tabular-nums">−{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 text-sm">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold tabular-nums text-foreground">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="mb-0.5 text-[11px] text-muted-foreground">Order ID</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="truncate font-mono text-foreground">{order.id}</code>
                    <CopyButton value={order.id} label="Copy order ID" className="-my-1 shrink-0" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
                  {order.paidAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Paid {formatDateTime(order.paidAt)}
                      {order.payCurrency && ` in ${order.payCurrency}`}
                    </p>
                  )}
                  {order.txHash && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      Tx <span className="font-mono">{order.txHash}</span>
                    </p>
                  )}
                </div>
                {order.shippingAddress && (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3" />
                      Shipping to
                    </p>
                    <p className="whitespace-pre-line text-foreground">{order.shippingAddress}</p>
                  </div>
                )}
              </div>

              {order.status === 'PENDING' && (
                <div className="flex flex-wrap justify-end gap-2">
                  <ConfirmButton
                    variant="destructive-outline"
                    question="Cancel this order?"
                    confirmLabel="Yes, cancel"
                    cancelLabel="Keep it"
                    onConfirm={() => onCancel(order.id)}
                  >
                    <XCircle />
                    Cancel order
                  </ConfirmButton>
                  {canPayOrder(order) && <PayButton orderId={order.id} size="sm" />}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
