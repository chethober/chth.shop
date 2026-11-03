import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { Order, OrderStatus, PaymentStatus } from '@/types'

export const ORDER_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

export const ORDER_STATUS: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'info' },
  SHIPPED: { label: 'Shipped', variant: 'brand' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

export function isActiveOrder(status: OrderStatus) {
  return status === 'PENDING' || status === 'CONFIRMED' || status === 'SHIPPED'
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = ORDER_STATUS[status] ?? { label: status, variant: 'secondary' }
  return (
    <Badge variant={variant}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  )
}

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; variant: BadgeProps['variant'] }> = {
  UNPAID: { label: 'Unpaid', variant: 'warning' },
  WAITING: { label: 'Awaiting payment', variant: 'warning' },
  CONFIRMING: { label: 'Confirming on-chain', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  PARTIALLY_PAID: { label: 'Partially paid', variant: 'destructive' },
  EXPIRED: { label: 'Payment expired', variant: 'secondary' },
  FAILED: { label: 'Payment failed', variant: 'destructive' },
  REFUNDED: { label: 'Refunded', variant: 'secondary' },
}

/** Whether the buyer can (re)start the crypto payment for this order. */
export function canPayOrder(order: Pick<Order, 'status' | 'paymentStatus'>) {
  return order.status === 'PENDING' && ['UNPAID', 'WAITING', 'EXPIRED', 'FAILED'].includes(order.paymentStatus)
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, variant } = PAYMENT_STATUS[status] ?? { label: status, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}
