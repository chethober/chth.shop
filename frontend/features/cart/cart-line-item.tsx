'use client'

import { motion } from 'framer-motion'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { ProductImage } from '@/components/shared/product-image'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { getProductTypeLabel } from '@/lib/products'
import type { CartItem } from '@/types'

interface CartLineItemProps {
  item: CartItem
  index: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function CartLineItem({ item, index, onQuantityChange, onRemove }: CartLineItemProps) {
  const price = item.product?.price ?? 0

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
    >
      <ProductImage product={item.product} className="size-18 shrink-0 rounded-xl border border-border" />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-foreground">{item.product?.name}</h3>
        <p className="text-xs text-muted-foreground">
          {item.product ? getProductTypeLabel(item.product.type) : ''}
          {item.product?.artist?.username && ` · @${item.product.artist.username}`}
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatPrice(price)}</p>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={() => onQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus />
        </Button>
        <span className="w-6 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={() => onQuantityChange(item.quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus />
        </Button>
      </div>

      <p className="hidden w-20 text-right text-sm font-semibold tabular-nums text-foreground sm:block">
        {formatPrice(price * item.quantity)}
      </p>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Remove item"
        className="hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </motion.li>
  )
}
