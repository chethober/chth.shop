'use client'

import { useState } from 'react'
import { ProductImage } from '@/components/shared/product-image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCatalog } from '@/hooks/use-catalog'
import { formatPrice } from '@/lib/format'
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from '@/lib/products'
import { cn } from '@/lib/utils'
import type { Product, ProductInput, ProductType } from '@/types'
import { ReleaseSettings, releaseFromProduct, releaseToPayload } from '@/components/shared/release-settings'

export type ProductChanges = ProductInput

interface ProductEditDialogProps {
  product: Product | null
  saving: boolean
  onClose: () => void
  onSave: (changes: ProductChanges) => Promise<void>
}

export function ProductEditDialog({ product, saving, onClose, onSave }: ProductEditDialogProps) {
  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        {product && <ProductEditForm key={product.id} product={product} saving={saving} onClose={onClose} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function ProductEditForm({ product, saving, onClose, onSave }: ProductEditDialogProps & { product: Product }) {
  const [name, setName] = useState(product.name)
  const [type, setType] = useState(product.type as ProductType)
  const [price, setPrice] = useState(String(product.price))
  const [description, setDescription] = useState(product.description ?? '')
  const [customizable, setCustomizable] = useState(product.customizable)
  const [isActive, setIsActive] = useState(product.isActive)
  const [release, setRelease] = useState(() => releaseFromProduct(product))
  const releaseResult = releaseToPayload(release, product.editionsSold)
  const { get: getCatalogItem } = useCatalog()
  const baseCost = getCatalogItem(type)?.baseCost ?? 0

  const priceValue = Number(price)
  const nameError = name.trim() ? '' : 'Name is required'
  const priceError =
    price === '' || !Number.isFinite(priceValue) || priceValue < 0
      ? 'Enter a valid price'
      : priceValue < baseCost
        ? `Must be at least the production cost (${formatPrice(baseCost)})`
        : ''

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (nameError || priceError || releaseResult.error || saving) return
    await onSave({
      name: name.trim(),
      type,
      price: Math.round(priceValue * 100) / 100,
      description: description.trim() || null,
      customizable,
      isActive,
      ...releaseResult.payload,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>Edit product</DialogTitle>
        <DialogDescription>Changes are visible on your store immediately.</DialogDescription>
      </DialogHeader>

      <div className="flex gap-4">
        <ProductImage product={{ ...product, name, type }} alt="" className="size-20 shrink-0 rounded-xl border border-border" />
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="product-name">Name</Label>
          <Input id="product-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(nameError)} />
          {nameError && <p className="text-[11px] text-destructive">{nameError}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Product type">
          {PRODUCT_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={type === option}
              onClick={() => setType(option)}
              className={cn(
                'cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                type === option
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              {PRODUCT_TYPE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-price">Price</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <Input
            id="product-price"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={Boolean(priceError)}
            className="pl-7 tabular-nums"
          />
        </div>
        {priceError ? (
          <p className="text-[11px] text-destructive">{priceError}</p>
        ) : (
          baseCost > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Production cost {formatPrice(baseCost)} · you earn about{' '}
              <span className="font-semibold text-foreground">{formatPrice(Math.max(priceValue - baseCost, 0) * 0.75)}</span>{' '}
              per sale
            </p>
          )
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Materials, fit, the story behind the design…"
        />
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-2.5 text-xs">
          <input type="checkbox" checked={customizable} onChange={(e) => setCustomizable(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-semibold text-foreground">Let buyers personalize</span>
            <span className="block text-muted-foreground">Buyers can add their own text or image in the 3D studio.</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-xs">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-semibold text-foreground">Listed in the shop</span>
            <span className="block text-muted-foreground">Unlisted products stay in your dashboard only.</span>
          </span>
        </label>
      </div>

      <ReleaseSettings values={release} onChange={setRelease} />
      {releaseResult.error && <p className="text-[11px] text-destructive">{releaseResult.error}</p>}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={Boolean(nameError || priceError || releaseResult.error) || saving}>
          {saving && <Spinner />}
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogFooter>
    </form>
  )
}
