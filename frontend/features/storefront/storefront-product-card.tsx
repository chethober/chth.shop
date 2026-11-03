'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { ProductBadges, Stars, WishlistButton } from '@/components/shared/product-badges'
import { ProductImage } from '@/components/shared/product-image'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { getProductTypeLabel, STORE_KIND_LABELS } from '@/lib/products'
import type { Product } from '@/types'

interface StorefrontProductCardProps {
  product: Product
  index: number
  /** Show which store sells it (on the marketplace, not on a store's own page). */
  showStore?: boolean
  onSelect: () => void
}

export function StorefrontProductCard({ product, index, showStore = false, onSelect }: StorefrontProductCardProps) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.04 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/p/${product.id}`} aria-label={product.name} className="block size-full">
          <ProductImage product={product} className="size-full transition-transform duration-300 group-hover:scale-105" />
        </Link>
        <ProductBadges product={product} className="pointer-events-none absolute left-2 top-2 right-11" />
        <WishlistButton productId={product.id} className="absolute right-2 top-2" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-sm font-semibold text-foreground" title={product.name}>
          <Link href={`/p/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.ratingCount > 0 && <Stars value={product.ratingAvg} count={product.ratingCount} />}
        <p className="truncate text-xs text-muted-foreground">
          {getProductTypeLabel(product.type)}
          {showStore && product.store && (
            <>
              {' · '}
              <Link href={`/${product.store.username}`} className="font-medium text-foreground hover:underline">
                {product.store.storeName || `@${product.store.username}`}
              </Link>
              <span className="text-muted-foreground"> ({STORE_KIND_LABELS[product.store.kind]})</span>
            </>
          )}
        </p>
        <p className="mt-auto pt-2 text-base font-bold tabular-nums text-foreground">{formatPrice(product.price)}</p>
        <Button
          size="sm"
          className="mt-2 w-full"
          onClick={onSelect}
          disabled={product.dropStatus === 'upcoming' || product.dropStatus === 'ended' || product.editionsRemaining === 0}
        >
          <ShoppingBag />
          {product.dropStatus === 'upcoming' ? 'Coming soon' : product.editionsRemaining === 0 ? 'Sold out' : 'Add to cart'}
        </Button>
      </div>
    </motion.li>
  )
}
