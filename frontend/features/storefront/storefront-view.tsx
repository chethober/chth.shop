'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Package, User } from 'lucide-react'
import { toast } from '@heroui/react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import api from '@/lib/api'
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from '@/lib/products'
import useAuthStore from '@/store/auth-store'
import useCartStore from '@/store/cart-store'
import type { Artist, Product, ProductType } from '@/types'
import { ArtistProfileCard } from './artist-profile-card'
import { StorefrontProductCard } from './storefront-product-card'
import { useT } from '@/lib/i18n'

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'name'

const SORTERS: Record<SortKey, { label: string; compare: (a: Product, b: Product) => number }> = {
  newest: {
    label: 'Newest first',
    compare: (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  },
  'price-asc': { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  name: { label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; artist: Artist }

export function StorefrontView({ username }: { username: string }) {
  const t = useT()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const addToCart = useCartStore((state) => state.addItem)

  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.artists
      .get(username)
      .then((artist) => !cancelled && setState({ status: 'ready', artist }))
      .catch(() => !cancelled && setState({ status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [username])

  const products = useMemo(() => (state.status === 'ready' ? state.artist.products ?? [] : []), [state])
  const visibleProducts = useMemo(
    () =>
      products
        .filter((product) => typeFilter === 'all' || product.type === typeFilter)
        .sort(SORTERS[sort].compare),
    [products, typeFilter, sort]
  )

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      toast.warning(t("Please sign in to add items to your cart"))
      return
    }
    setAddingId(product.id)
    try {
      await addToCart(product.id)
      toast.success(`Added to cart: ${product.name}`)
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not add to cart')
    } finally {
      setAddingId(null)
    }
  }

  if (state.status === 'loading') return <LoadingState label={t("Loading store…")} />

  if (state.status === 'error') {
    return (
      <EmptyState
        icon={User}
        title={t("Artist not found")}
        description={t("This store doesn't exist or may have been removed.")}
        action={
          <Button asChild>
            <Link href="/">{t("Back to home")}</Link>
          </Button>
        }
        className="my-auto"
      />
    )
  }

  return (
    <div className="space-y-10">
      <ArtistProfileCard artist={state.artist} productCount={products.length} />

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            {t("Shop")} <span className="text-sm font-normal text-muted-foreground">({visibleProducts.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <Select
              aria-label={t("Filter by product type")}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as ProductType | 'all')}
            >
              <option value="all">{t("All items")}</option>
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PRODUCT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
            <Select aria-label={t("Sort products")} value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              {Object.entries(SORTERS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {t(label)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {visibleProducts.length === 0 ? (
          <EmptyState icon={Package} title={t("No designs published yet")} />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product, index) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                index={index}
                isAdding={addingId === product.id}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
