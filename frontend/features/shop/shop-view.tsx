'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Package, Palette, Search } from 'lucide-react'
import { toast } from '@heroui/react'
import { EmptyState } from '@/components/shared/empty-state'
import { Eyebrow } from '@/components/shared/eyebrow'
import { FilterChip } from '@/components/shared/filter-chip'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { AddToCartDialog } from '@/features/storefront/add-to-cart-dialog'
import { StorefrontProductCard } from '@/features/storefront/storefront-product-card'
import api, { type ProductQuery } from '@/lib/api'
import { isProductType, PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from '@/lib/products'
import useAuthStore from '@/store/auth-store'
import type { Product, StoreKind } from '@/types'

type Sort = NonNullable<ProductQuery['sort']>

const SORT_LABELS: Record<Sort, string> = {
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  name: 'Name (A–Z)',
  top: 'Top rated',
}

const KIND_FILTERS: { id: StoreKind | 'all'; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'ARTIST', label: 'Artists' },
  { id: 'MERCHANT', label: 'Merchants' },
]

const PAGE_SIZE = 24

/** The marketplace: every listed product from every artist and merchant. */
export function ShopView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const typeParam = searchParams.get('type')
  const type = isProductType(typeParam) ? typeParam : undefined
  const kindParam = searchParams.get('kind')
  const kind = kindParam === 'ARTIST' || kindParam === 'MERCHANT' ? kindParam : undefined
  const sort = (searchParams.get('sort') as Sort) in SORT_LABELS ? (searchParams.get('sort') as Sort) : 'newest'
  const search = searchParams.get('q') ?? ''
  const following = searchParams.get('following') === '1' ? ('1' as const) : undefined
  const collection = searchParams.get('collection') === 'drops' ? ('drops' as const) : undefined

  const [searchInput, setSearchInput] = useState(search)
  /** Results, tagged with the filters they were loaded for. */
  const [results, setResults] = useState({ key: '', products: [] as Product[], page: 1, hasNext: false, total: 0 })
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const queryKey = JSON.stringify([type, kind, sort, search, following, collection])
  const { products, page, hasNext, total } = results
  const isLoading = results.key !== queryKey || isLoadingMore
  const [selected, setSelected] = useState<Product | null>(null)

  const setParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`/shop${params.size > 0 ? `?${params}` : ''}`, { scroll: false })
  }

  // Debounce typing into the URL.
  useEffect(() => {
    if (searchInput === search) return
    const timer = setTimeout(() => setParam('q', searchInput.trim() || undefined), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setParam reads the latest params on purpose
  }, [searchInput])

  // Reload from page 1 whenever a filter changes.
  useEffect(() => {
    let cancelled = false
    api.products
      .list({ type, kind, sort, search: search || undefined, following, collection, page: 1, limit: PAGE_SIZE })
      .then(({ products: items, pagination }) => {
        if (!cancelled) setResults({ key: queryKey, products: items, page: 1, hasNext: pagination.hasNext, total: pagination.total })
      })
      .catch((error) => {
        if (cancelled) return
        toast.danger(error instanceof Error ? error.message : 'Failed to load products')
        setResults({ key: queryKey, products: [], page: 1, hasNext: false, total: 0 })
      })
    return () => {
      cancelled = true
    }
  }, [type, kind, sort, search, following, collection, queryKey])

  const loadMore = async () => {
    setIsLoadingMore(true)
    try {
      const next = await api.products.list({ type, kind, sort, search: search || undefined, following, collection, page: page + 1, limit: PAGE_SIZE })
      setResults((current) =>
        current.key === queryKey
          ? { ...current, products: [...current.products, ...next.products], page: page + 1, hasNext: next.pagination.hasNext }
          : current
      )
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Failed to load products')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const select = (product: Product) => {
    if (!isAuthenticated) {
      toast.warning('Please sign in to add items to your cart')
      router.push('/auth?redirect=/shop')
      return
    }
    setSelected(product)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<Eyebrow>Marketplace</Eyebrow>}
        title="Shop"
        description="Merch from independent artists and merchants, printed on demand and paid in crypto."
        actions={
          <Button asChild variant="outline">
            <Link href="/design">
              <Palette />
              Design your own
            </Link>
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="inline-flex rounded-xl border border-border bg-muted/70 p-1" role="tablist" aria-label="Feed">
          {(
            [
              { id: 'all', label: 'All', active: !following && !collection, params: { following: undefined, collection: undefined } },
              { id: 'drops', label: 'Drops & limited', active: Boolean(collection), params: { following: undefined, collection: 'drops' } },
              { id: 'following', label: 'Following', active: Boolean(following), params: { following: '1', collection: undefined } },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.active}
              onClick={() => {
                if (tab.id === 'following' && !isAuthenticated) {
                  router.push('/auth?redirect=/shop?following=1')
                  return
                }
                const params = new URLSearchParams(searchParams.toString())
                for (const [key, value] of Object.entries(tab.params)) {
                  if (value) params.set(key, value)
                  else params.delete(key)
                }
                router.replace(`/shop${params.size > 0 ? `?${params}` : ''}`, { scroll: false })
              }}
              className={
                tab.active
                  ? 'cursor-pointer rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs'
                  : 'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products and stores…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select aria-label="Seller type" value={kind ?? 'all'} onChange={(event) => setParam('kind', event.target.value === 'all' ? undefined : event.target.value)}>
              {KIND_FILTERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select aria-label="Sort products" value={sort} onChange={(event) => setParam('sort', event.target.value === 'newest' ? undefined : event.target.value)}>
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={!type} onClick={() => setParam('type')}>
            All
          </FilterChip>
          {PRODUCT_TYPES.map((option) => (
            <FilterChip key={option} active={type === option} onClick={() => setParam('type', option)}>
              {PRODUCT_TYPE_LABELS[option]}
            </FilterChip>
          ))}
        </div>
      </div>

      {isLoading && products.length === 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </ul>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nothing found"
          description="Try another search or filter, or design something of your own."
          action={
            <Button asChild>
              <Link href="/design">Open the studio</Link>
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {total} {total === 1 ? 'product' : 'products'}
          </p>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <StorefrontProductCard key={product.id} product={product} index={index} showStore onSelect={() => select(product)} />
            ))}
          </ul>
          {hasNext && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                {isLoading && <Spinner />}
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      <AddToCartDialog product={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
