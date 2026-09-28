'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { CopyButton } from '@/components/shared/copy-button'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import { StoreProducts } from './store-products'
import type { StoreForm } from './store-form'
import { StorefrontSettings } from './storefront-settings'

type StoreView = 'products' | 'storefront'

interface StorePanelProps {
  username: string
  isStoreActive: boolean
  products: Product[]
  form: StoreForm
  onFormChange: (changes: Partial<StoreForm>) => void
  saving: boolean
  onActivate: () => Promise<void>
  onDeleteStore: () => Promise<void>
  onEditProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => Promise<void>
}

export function StorePanel(props: StorePanelProps) {
  const { username, isStoreActive, products } = props
  const [view, setView] = useState<StoreView>(isStoreActive ? 'products' : 'storefront')
  const storeUrl = typeof window === 'undefined' ? `/${username}` : `${window.location.origin}/${username}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex self-start rounded-xl border border-border bg-muted/70 p-1">
          {(['products', 'storefront'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={cn(
                'relative cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors',
                view === option ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {view === option && (
                <motion.span
                  layoutId="store-view-pill"
                  className="absolute inset-0 rounded-lg border border-border bg-card shadow-xs"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{option === 'products' ? `Products (${products.length})` : 'Storefront'}</span>
            </button>
          ))}
        </div>

        {isStoreActive && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Live at</span>
            <Link href={`/${username}`} target="_blank" className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline">
              chth.shop/{username}
              <ExternalLink className="size-3 opacity-60" />
            </Link>
            <CopyButton value={storeUrl} label="Copy store link" />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {view === 'products' ? (
            <StoreProducts
              isStoreActive={isStoreActive}
              products={products}
              onEdit={props.onEditProduct}
              onDelete={props.onDeleteProduct}
              onSetUpStore={() => setView('storefront')}
            />
          ) : (
            <StorefrontSettings
              username={username}
              isActive={isStoreActive}
              form={props.form}
              onFormChange={props.onFormChange}
              saving={props.saving}
              onActivate={props.onActivate}
              onDeleteStore={props.onDeleteStore}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
