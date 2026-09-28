import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { OrderStatus } from '@/types'

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
