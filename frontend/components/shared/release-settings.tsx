'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Seller-editable release options; dates are `datetime-local` strings ('' = not set). */
export interface ReleaseValues {
  nftBacked: boolean
  editionSize: string
  dropStartsAt: string
  dropEndsAt: string
}

export const EMPTY_RELEASE: ReleaseValues = { nftBacked: false, editionSize: '', dropStartsAt: '', dropEndsAt: '' }

/** ISO → value for `<input type="datetime-local">` in the viewer's time zone. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function releaseFromProduct(product: {
  nftBacked: boolean
  editionSize: number | null
  dropStartsAt: string | null
  dropEndsAt: string | null
}): ReleaseValues {
  return {
    nftBacked: product.nftBacked,
    editionSize: product.editionSize ? String(product.editionSize) : '',
    dropStartsAt: toLocalInput(product.dropStartsAt),
    dropEndsAt: toLocalInput(product.dropEndsAt),
  }
}

/** API payload; also returns a validation message when the values don't make sense. */
export function releaseToPayload(values: ReleaseValues, editionsSold = 0) {
  const editionSize = values.editionSize.trim() === '' ? null : Number(values.editionSize)
  const dropStartsAt = values.dropStartsAt ? new Date(values.dropStartsAt).toISOString() : null
  const dropEndsAt = values.dropEndsAt ? new Date(values.dropEndsAt).toISOString() : null

  let error = ''
  if (editionSize !== null && (!Number.isInteger(editionSize) || editionSize < 1)) error = 'Edition size must be a whole number'
  else if (editionSize !== null && editionSize < editionsSold) error = `${editionsSold} are already sold`
  else if (dropStartsAt && dropEndsAt && dropEndsAt <= dropStartsAt) error = 'The drop must end after it starts'

  return { payload: { nftBacked: values.nftBacked, editionSize, dropStartsAt, dropEndsAt }, error }
}

export function ReleaseSettings({ values, onChange }: { values: ReleaseValues; onChange: (values: ReleaseValues) => void }) {
  const set = (changes: Partial<ReleaseValues>) => onChange({ ...values, ...changes })

  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-3">
      <legend className="px-1 text-xs font-semibold text-foreground">Release</legend>

      <label className="flex cursor-pointer items-start gap-2.5 text-xs">
        <input type="checkbox" checked={values.nftBacked} onChange={(e) => set({ nftBacked: e.target.checked })} className="mt-0.5" />
        <span>
          <span className="font-semibold text-foreground">NFT certificate</span>
          <span className="block text-muted-foreground">Each unit comes with a numbered collectible the buyer claims to their TON wallet.</span>
        </span>
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="release-edition">Limited edition</Label>
        <Input
          id="release-edition"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={values.editionSize}
          onChange={(e) => set({ editionSize: e.target.value })}
          placeholder="Unlimited"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="release-start">Drop starts</Label>
          <Input id="release-start" type="datetime-local" value={values.dropStartsAt} onChange={(e) => set({ dropStartsAt: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="release-end">Drop ends</Label>
          <Input id="release-end" type="datetime-local" value={values.dropEndsAt} onChange={(e) => set({ dropEndsAt: e.target.value })} />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">Leave dates empty to sell any time. Followers see drops in their feed.</p>
    </fieldset>
  )
}
