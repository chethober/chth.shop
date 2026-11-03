'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Store } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { AddToCartDialog } from '@/features/storefront/add-to-cart-dialog'
import { StorefrontProductCard } from '@/features/storefront/storefront-product-card'
import api from '@/lib/api'
import useWishlistStore from '@/store/wishlist-store'
import type { Product, StoreSummary } from '@/types'

/** Wishlist and followed stores. */
export function SavedPanel() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [stores, setStores] = useState<StoreSummary[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const savedIds = useWishlistStore((state) => state.ids)

  useEffect(() => {
    api.wishlist
      .list()
      .then(({ products: items }) => setProducts(items))
      .catch(() => setProducts([]))
    api.stores
      .following()
      .then(setStores)
      .catch(() => {})
  }, [])

  // Drop products un-hearted on this page.
  const visible = products?.filter((product) => savedIds.size === 0 || savedIds.has(product.id))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Wishlist</CardTitle>
            <CardDescription>Products you saved for later</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!visible ? (
            <Spinner className="mx-auto" />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              description="Tap the heart on any product to keep it here."
              action={
                <Button asChild size="sm">
                  <Link href="/shop">Explore the shop</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product, index) => (
                <StorefrontProductCard key={product.id} product={product} index={index} showStore onSelect={() => setSelected(product)} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Following</CardTitle>
            <CardDescription>New products from these stores show up in your Following feed.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/shop?following=1">Open feed</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">You don&apos;t follow any stores yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {stores.map((store) => (
                <li key={store.id}>
                  <Link
                    href={`/${store.username}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Store className="size-3.5" />
                    {store.storeName || `@${store.username}`}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AddToCartDialog product={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
