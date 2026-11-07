'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Minus, Palette, Plus, ShoppingBag } from 'lucide-react'
import { toast } from '@/lib/toast'
import { ProductImage } from '@/components/shared/product-image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useCatalog } from '@/hooks/use-catalog'
import { formatPrice } from '@/lib/format'
import { colorName, getProductTypeLabel } from '@/lib/products'
import { cn } from '@/lib/utils'
import useCartStore from '@/store/cart-store'
import type { Product } from '@/types'

interface AddToCartDialogProps {
  product: Product | null
  onClose: () => void
}

/** Size / color / quantity picker shown before a listing goes into the cart. */
export function AddToCartDialog({ product, onClose }: AddToCartDialogProps) {
  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">{product && <AddToCartForm key={product.id} product={product} onClose={onClose} />}</DialogContent>
    </Dialog>
  )
}

function OptionButton({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  )
}

function AddToCartForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const { get: getCatalogItem } = useCatalog()
  const catalogItem = getCatalogItem(product.type)

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle>{product.name}</DialogTitle>
        <DialogDescription>
          {getProductTypeLabel(product.type)}
          {product.store && ` by ${product.store.storeName || `@${product.store.username}`}`}
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-4">
        <ProductImage product={product} className="size-24 shrink-0 rounded-xl border border-border" />
        <div className="min-w-0 space-y-1">
          <p className="text-lg font-bold tabular-nums text-foreground">{formatPrice(product.price)}</p>
          {(product.description || catalogItem?.description) && (
            <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">{product.description || catalogItem?.description}</p>
          )}
        </div>
      </div>

      <PurchaseOptions product={product} onAdded={onClose} />
    </div>
  )
}

/** Size, color and quantity pickers with Add to cart / Personalize; used in the dialog and on product pages. */
export function PurchaseOptions({ product, onAdded }: { product: Product; onAdded?: () => void }) {
  const addItem = useCartStore((state) => state.addItem)
  const { get: getCatalogItem } = useCatalog()
  const catalogItem = getCatalogItem(product.type)

  const sizes = product.sizes.length > 0 ? product.sizes : catalogItem?.sizes ?? []
  // A product with a saved design has its color baked in unless the seller offers several.
  const colors = product.colors.length > 0 ? product.colors : product.design?.color ? [] : catalogItem?.colors ?? []

  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '')
  const [color, setColor] = useState(colors[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const needsSize = sizes.length > 0 && !size
  const remaining = product.editionsRemaining
  const unavailable =
    product.dropStatus === 'upcoming'
      ? 'Coming soon'
      : product.dropStatus === 'ended'
        ? 'Drop ended'
        : remaining === 0
          ? 'Sold out'
          : ''

  const add = async () => {
    setIsAdding(true)
    try {
      await addItem({
        productId: product.id,
        quantity,
        options: { ...(size && { size }), ...(color && { color }) },
      })
      toast.success(`Added to cart: ${product.name}`)
      onAdded?.()
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-5">
      {sizes.length > 0 && (
        <div className="space-y-1.5">
          <Label>Size</Label>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Size">
            {sizes.map((option) => (
              <OptionButton key={option} selected={size === option} onClick={() => setSize(option)}>
                {option}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {colors.length > 1 && (
        <div className="space-y-1.5">
          <Label>
            Color <span className="font-normal text-muted-foreground">· {colorName(color)}</span>
          </Label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
            {colors.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={color === option}
                aria-label={colorName(option)}
                title={colorName(option)}
                onClick={() => setColor(option)}
                className={cn(
                  'size-7 cursor-pointer rounded-full border border-border transition-transform hover:scale-110',
                  color === option && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Quantity</Label>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
          <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => setQuantity((q) => q - 1)} disabled={quantity <= 1} aria-label="Decrease quantity">
            <Minus />
          </Button>
          <span className="w-6 text-center text-xs font-bold tabular-nums">{quantity}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={quantity >= Math.min(99, remaining ?? 99)}
            aria-label="Increase quantity"
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {product.customizable && (
          <Button asChild variant="outline">
            <Link href={`/design?product=${product.id}`}>
              <Palette />
              Personalize
            </Link>
          </Button>
        )}
        <Button onClick={add} disabled={isAdding || needsSize || Boolean(unavailable)}>
          {isAdding ? <Spinner /> : <ShoppingBag />}
          {unavailable || (needsSize ? 'Choose a size' : `Add to cart · ${formatPrice(product.price * quantity)}`)}
        </Button>
      </div>
    </div>
  )
}
