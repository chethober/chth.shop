'use client'

import { useState } from 'react'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice } from '@/lib/format'
import type { CatalogItem } from '@/types'
import { EMPTY_RELEASE, ReleaseSettings, releaseToPayload } from '@/components/shared/release-settings'

export interface PublishDetails {
  name: string
  price: number
  description: string
  customizable: boolean
  nftBacked: boolean
  editionSize: number | null
  dropStartsAt: string | null
  dropEndsAt: string | null
}

interface PublishDialogProps {
  open: boolean
  catalogItem: CatalogItem
  publishing: boolean
  onClose: () => void
  onPublish: (details: PublishDetails) => Promise<void>
}

/** Name and price a studio design before listing it in the seller's store. */
export function PublishDialog({ open, catalogItem, publishing, onClose, onPublish }: PublishDialogProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState(String(catalogItem.retailPrice))
  const [description, setDescription] = useState('')
  const [customizable, setCustomizable] = useState(false)
  const [release, setRelease] = useState(EMPTY_RELEASE)
  const releaseResult = releaseToPayload(release)

  const priceValue = Number(price)
  const priceError = !Number.isFinite(priceValue) || priceValue < catalogItem.baseCost ? `At least ${formatPrice(catalogItem.baseCost)} (production cost)` : ''
  const earning = Math.max(priceValue - catalogItem.baseCost, 0) * 0.75

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim() || priceError || releaseResult.error || publishing) return
    await onPublish({
      name: name.trim(),
      price: Math.round(priceValue * 100) / 100,
      description: description.trim(),
      customizable,
      ...releaseResult.payload,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !publishing && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Publish to your store</DialogTitle>
            <DialogDescription>
              Your {catalogItem.name.toLowerCase()} design goes live in the shop. We print each one on demand.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="publish-name">Product name</Label>
            <Input id="publish-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g. Midnight ${catalogItem.name}`} maxLength={120} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publish-price">Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="publish-price"
                type="number"
                inputMode="decimal"
                min={catalogItem.baseCost}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-invalid={Boolean(priceError)}
                className="pl-7 tabular-nums"
              />
            </div>
            <p className={priceError ? 'text-[11px] text-destructive' : 'text-[11px] text-muted-foreground'}>
              {priceError || (
                <>
                  Production {formatPrice(catalogItem.baseCost)} · you earn about{' '}
                  <span className="font-semibold text-foreground">{formatPrice(earning)}</span> per sale
                </>
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publish-description">Description</Label>
            <Textarea id="publish-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="The story behind the design…" />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 text-xs">
            <input type="checkbox" checked={customizable} onChange={(e) => setCustomizable(e.target.checked)} className="mt-0.5" />
            <span>
              <span className="font-semibold text-foreground">Let buyers personalize</span>
              <span className="block text-muted-foreground">Buyers can add a name, text, or their own image on top of your design.</span>
            </span>
          </label>

          <ReleaseSettings values={release} onChange={setRelease} />
          {releaseResult.error && <p className="text-[11px] text-destructive">{releaseResult.error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={publishing}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || Boolean(priceError || releaseResult.error) || publishing}>
              {publishing ? <Spinner /> : <Rocket />}
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
