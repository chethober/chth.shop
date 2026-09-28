'use client'

import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { ProductImage } from '@/components/shared/product-image'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatPrice } from '@/lib/format'
import { getProductTypeLabel } from '@/lib/products'
import type { Product } from '@/types'

interface StorefrontProductCardProps {
  product: Product
  index: number
  isAdding: boolean
  onAddToCart: () => void
}

export function StorefrontProductCard({ product, index, isAdding, onAddToCart }: StorefrontProductCardProps) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <ProductImage product={product} className="size-full transition-transform duration-300 group-hover:scale-105" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-sm font-semibold text-foreground" title={product.name}>
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground">{getProductTypeLabel(product.type)}</p>
        <p className="mt-auto pt-2 text-base font-bold tabular-nums text-foreground">{formatPrice(product.price)}</p>
        <Button size="sm" className="mt-2 w-full" onClick={onAddToCart} disabled={isAdding}>
          {isAdding ? <Spinner /> : <ShoppingBag />}
          Add to cart
        </Button>
      </div>
    </motion.li>
  )
}
