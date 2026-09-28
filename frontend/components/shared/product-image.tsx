'use client'

import { getPlaceholderImage, getProductImageUrl } from '@/lib/products'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  product?: { imageUrl?: string | null; type?: string; name?: string } | null
  alt?: string
  className?: string
  style?: React.CSSProperties
}

/** Product photo that falls back to a stock garment image if it fails to load. */
export function ProductImage({ product, alt, className, style }: ProductImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- images come from arbitrary hosts and need an onError fallback
    <img
      src={getProductImageUrl(product?.imageUrl, product?.type, product?.name)}
      alt={alt ?? product?.name ?? ''}
      className={cn('bg-muted object-cover', className)}
      style={style}
      onError={(event) => {
        const fallback = getPlaceholderImage(product?.type, product?.name)
        if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback
      }}
    />
  )
}
