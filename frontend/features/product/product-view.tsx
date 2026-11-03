'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Gem, Package, Send, ShieldCheck } from 'lucide-react'
import { TELEGRAM_MINI_APP_LINK } from '@/lib/config'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { ProductBadges, Stars, WishlistButton } from '@/components/shared/product-badges'
import { ProductImage } from '@/components/shared/product-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PurchaseOptions } from '@/features/storefront/add-to-cart-dialog'
import { useCatalog } from '@/hooks/use-catalog'
import api from '@/lib/api'
import { formatDateTime, formatPrice } from '@/lib/format'
import { getProductTypeLabel, STORE_KIND_LABELS } from '@/lib/products'
import useAuthStore from '@/store/auth-store'
import type { Product } from '@/types'
import { ReviewsSection } from './reviews-section'

/** Shares the product; with a Mini App configured, the link opens it inside Telegram. */
function telegramShareUrl(product: Product) {
  const url = TELEGRAM_MINI_APP_LINK
    ? `${TELEGRAM_MINI_APP_LINK}?startapp=p_${product.id}`
    : typeof window === 'undefined'
      ? `/p/${product.id}`
      : `${window.location.origin}/p/${product.id}`
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(product.name)}`
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; product: Product }

export function ProductView({ id }: { id: string }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { get: getCatalogItem } = useCatalog()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.products
      .get(id)
      .then((product) => !cancelled && setState({ status: 'ready', product }))
      .catch(() => !cancelled && setState({ status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [id])

  if (state.status === 'loading') return <LoadingState label="Loading product…" />
  if (state.status === 'error') {
    return (
      <EmptyState
        icon={Package}
        title="Product not found"
        description="It may have been unlisted or removed."
        action={
          <Button asChild>
            <Link href="/shop">Back to the shop</Link>
          </Button>
        }
      />
    )
  }

  const { product } = state
  const catalogItem = getCatalogItem(product.type)

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
          <ProductImage product={product} className="aspect-square w-full" />
          <WishlistButton productId={product.id} className="absolute right-3 top-3 size-10" />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <ProductBadges product={product} />
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{product.name}</h1>
            <p className="text-sm text-muted-foreground">
              {getProductTypeLabel(product.type)}
              {product.store && (
                <>
                  {' by '}
                  <Link href={`/${product.store.username}`} className="font-semibold text-foreground hover:underline">
                    {product.store.storeName || `@${product.store.username}`}
                  </Link>{' '}
                  <Badge variant="secondary">{STORE_KIND_LABELS[product.store.kind]}</Badge>
                </>
              )}
            </p>
            {product.ratingCount > 0 && <Stars value={product.ratingAvg} count={product.ratingCount} />}
            <p className="text-2xl font-bold tabular-nums text-foreground">{formatPrice(product.price)}</p>
          </div>

          {(product.description || catalogItem?.description) && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description || catalogItem?.description}
            </p>
          )}

          {product.dropStatus && product.dropStartsAt && (
            <p className="text-xs text-muted-foreground">
              Drop window: {formatDateTime(product.dropStartsAt)}
              {product.dropEndsAt && ` – ${formatDateTime(product.dropEndsAt)}`}
            </p>
          )}

          <Card className="p-4">
            {isAuthenticated ? (
              <PurchaseOptions product={product} />
            ) : (
              <Button asChild className="w-full">
                <Link href={`/auth?redirect=/p/${product.id}`}>Sign in to buy</Link>
              </Button>
            )}
          </Card>

          {product.nftBacked && (
            <div className="flex gap-3 rounded-xl border border-[#0098EA]/30 bg-[#0098EA]/5 p-4 text-xs">
              <Gem className="size-5 shrink-0 text-[#0098EA]" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Comes with an NFT certificate</p>
                <p className="text-muted-foreground">
                  Each unit gets a numbered collectible{product.editionSize ? ` (#1–${product.editionSize})` : ''} you can
                  claim to your TON wallet. The serial on the item&apos;s tag proves it&apos;s authentic at{' '}
                  <span className="font-mono">/verify</span>.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Printed on demand · pay with TON, USDT or any major coin
            </p>
            <Button asChild variant="ghost" size="sm">
              <a href={telegramShareUrl(product)} target="_blank" rel="noreferrer">
                <Send />
                Share on Telegram
              </a>
            </Button>
          </div>
        </div>
      </div>

      <ReviewsSection productId={product.id} />
    </div>
  )
}
