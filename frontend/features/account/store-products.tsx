'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit3, Plus, Search, Store, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterChip } from '@/components/shared/filter-chip'
import { ProductImage } from '@/components/shared/product-image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { formatPrice } from '@/lib/format'
import { PRODUCT_TYPES, getProductTypeLabel } from '@/lib/products'
import type { Product } from '@/types'

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'name'

const SORTERS: Record<SortKey, { label: string; compare: (a: Product, b: Product) => number }> = {
  newest: {
    label: 'Newest',
    compare: (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  },
  'price-asc': { label: 'Price: low → high', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high → low', compare: (a, b) => b.price - a.price },
  name: { label: 'Name A–Z', compare: (a, b) => a.name.localeCompare(b.name) },
}

interface StoreProductsProps {
  isStoreActive: boolean
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (productId: string) => Promise<void>
  onSetUpStore: () => void
}

function ProductTile({
  product,
  index,
  onEdit,
  onDelete,
}: {
  product: Product
  index: number
  onEdit: () => void
  onDelete: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18, delay: index * 0.02 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-background transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
    >
      <button type="button" onClick={onEdit} aria-label={`Edit ${product.name}`} className="block aspect-square w-full cursor-pointer overflow-hidden">
        <ProductImage product={product} className="size-full transition-transform duration-300 group-hover:scale-105" />
      </button>

      <span className="absolute left-2 top-2 rounded-full border border-border bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
        {getProductTypeLabel(product.type)}
      </span>
      {!product.isActive && (
        <span className="absolute bottom-[4.25rem] left-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
          Unlisted
        </span>
      )}

      <div className="absolute right-2 top-2 flex gap-1 transition-opacity sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
        <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit" className="bg-background/90 backdrop-blur-sm">
          <Edit3 />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setConfirming(true)}
          aria-label="Delete"
          className="bg-background/90 text-destructive backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-semibold text-foreground" title={product.name}>
          {product.name}
        </p>
        <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{formatPrice(product.price)}</p>
      </div>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 p-4 text-center backdrop-blur-sm"
          >
            <Trash2 className="size-5 text-destructive" />
            <p className="text-xs font-semibold text-foreground">Delete “{product.name}”?</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={deleting}>
                Keep
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleting}>
                {deleting && <Spinner />}
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

export function StoreProducts({ isStoreActive, products, onEdit, onDelete, onSetUpStore }: StoreProductsProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const countsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const product of products) counts[product.type] = (counts[product.type] ?? 0) + 1
    return counts
  }, [products])

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((product) => (typeFilter === 'all' || product.type === typeFilter) && (!q || product.name.toLowerCase().includes(q)))
      .sort(SORTERS[sort].compare)
  }, [products, query, typeFilter, sort])

  if (!isStoreActive && products.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="Your store isn’t active yet"
        description="Set up your storefront first — it only takes a store name — then start publishing designs."
        action={<Button onClick={onSetUpStore}>Set up storefront</Button>}
      />
    )
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="No products yet"
        description="Open the 3D studio to design your first piece of merch."
        action={
          <Button asChild>
            <Link href="/design">
              <Plus />
              Create product
            </Link>
          </Button>
        }
      />
    )
  }

  const typeOptions = Array.from(new Set([...PRODUCT_TYPES, ...Object.keys(countsByType)]))

  return (
    <Card>
      <CardContent className="space-y-5 pt-5 sm:pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {Object.entries(SORTERS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
            <Button asChild>
              <Link href="/design">
                <Plus />
                New
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={typeFilter === 'all'} count={products.length} onClick={() => setTypeFilter('all')}>
            All
          </FilterChip>
          {typeOptions.map((type) => (
            <FilterChip
              key={type}
              active={typeFilter === type}
              count={countsByType[type] ?? 0}
              disabled={!countsByType[type]}
              onClick={() => setTypeFilter(type)}
            >
              {getProductTypeLabel(type)}
            </FilterChip>
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No products match your filters.{' '}
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setTypeFilter('all')
              }}
              className="cursor-pointer font-semibold text-foreground hover:underline"
            >
              Clear filters
            </button>
          </p>
        ) : (
          <motion.ul layout className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            <AnimatePresence initial={false}>
              {visibleProducts.map((product, index) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  index={index}
                  onEdit={() => onEdit(product)}
                  onDelete={() => onDelete(product.id)}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </CardContent>
    </Card>
  )
}
