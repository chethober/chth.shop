'use client'

import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Cart } from '@/types'
import { useT } from '@/lib/i18n'

/** Subtotal / shipping / total breakdown for a cart. */
export function OrderSummary({ cart, className }: { cart: Cart; className?: string }) {
  const t = useT()
  return (
    <dl className={cn('space-y-2.5 text-sm', className)}>
      <div className="flex justify-between text-muted-foreground">
        <dt>Subtotal ({cart.totalItems})</dt>
        <dd className="font-semibold tabular-nums text-foreground">{formatPrice(cart.totalPrice)}</dd>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <dt>{t("Shipping")}</dt>
        <dd className="font-semibold text-success">{t("Free")}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold text-foreground">
        <dt>{t("Total")}</dt>
        <dd className="tabular-nums">{formatPrice(cart.totalPrice)}</dd>
      </div>
    </dl>
  )
}
