import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Cart } from '@/types'

/** Subtotal / shipping / total breakdown for a cart. */
export function OrderSummary({ cart, className }: { cart: Cart; className?: string }) {
  return (
    <dl className={cn('space-y-2.5 text-sm', className)}>
      <div className="flex justify-between text-muted-foreground">
        <dt>Subtotal ({cart.totalItems})</dt>
        <dd className="font-semibold tabular-nums text-foreground">{formatPrice(cart.totalPrice)}</dd>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <dt>Shipping</dt>
        <dd className="font-semibold text-success">Free</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold text-foreground">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatPrice(cart.totalPrice)}</dd>
      </div>
    </dl>
  )
}
