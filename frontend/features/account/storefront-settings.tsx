'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { InlineConfirm } from '@/components/custom/inline-confirm'
import { SlideToConfirm } from '@/components/custom/slide-to-confirm'
import { getSocialIcon } from '@/components/shared/social-icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SOCIAL_PLATFORMS } from '@/lib/social'
import { cn } from '@/lib/utils'
import { PAYOUT_NETWORKS, type StoreForm } from './store-form'
import { StorefrontPreview } from './storefront-preview'

/** Advisory only: longer bios are allowed but get truncated on small screens. */
const BIO_SOFT_LIMIT = 280

interface StorefrontSettingsProps {
  username: string
  isActive: boolean
  form: StoreForm
  onFormChange: (changes: Partial<StoreForm>) => void
  saving: boolean
  onActivate: () => Promise<void>
  onDeleteStore: () => Promise<void>
}

export function StorefrontSettings({
  username,
  isActive,
  form,
  onFormChange,
  saving,
  onActivate,
  onDeleteStore,
}: StorefrontSettingsProps) {
  const connectedCount = SOCIAL_PLATFORMS.filter(({ id }) => form[id].trim()).length
  const bioTooLong = form.bio.length > BIO_SOFT_LIMIT

  return (
    <div className="grid items-start gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{isActive ? 'Storefront' : 'Activate your store'}</CardTitle>
              <CardDescription>
                {isActive
                  ? 'How your store appears to visitors. Changes preview live.'
                  : 'Give your store a name to start selling your designs.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="store-name">
                Store name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-name"
                value={form.storeName}
                onChange={(event) => onFormChange({ storeName: event.target.value })}
                placeholder="e.g. Cosmic Creations"
                maxLength={60}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="store-bio">Bio</Label>
                <span className={cn('text-[11px] tabular-nums', bioTooLong ? 'font-semibold text-warning' : 'text-muted-foreground')}>
                  {form.bio.length}/{BIO_SOFT_LIMIT}
                </span>
              </div>
              <Textarea
                id="store-bio"
                rows={4}
                value={form.bio}
                onChange={(event) => onFormChange({ bio: event.target.value })}
                placeholder="Tell fans about yourself, your inspiration, and your style…"
                className="min-h-24 resize-y"
              />
              {bioTooLong && <p className="text-[11px] text-warning">Shorter bios read better on mobile.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Selling as</CardTitle>
              <CardDescription>Artists sell their art; merchants sell their brand&apos;s merch.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Store type">
              {(
                [
                  { id: 'ARTIST', label: 'Artist', hint: 'Original art & designs' },
                  { id: 'MERCHANT', label: 'Merchant', hint: 'A brand, shop, or business' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={form.kind === option.id}
                  onClick={() => onFormChange({ kind: option.id })}
                  className={cn(
                    'cursor-pointer rounded-xl border p-3 text-left transition-colors',
                    form.kind === option.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="block text-xs font-semibold">{option.label}</span>
                  <span className="block text-[11px] opacity-80">{option.hint}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payout-address">Crypto payout address</Label>
              <div className="flex gap-2">
                <Select
                  aria-label="Payout network"
                  value={form.payoutNetwork}
                  onChange={(event) => onFormChange({ payoutNetwork: event.target.value })}
                >
                  {PAYOUT_NETWORKS.map((network) => (
                    <option key={network} value={network}>
                      {network}
                    </option>
                  ))}
                </Select>
                <Input
                  id="payout-address"
                  value={form.payoutAddress}
                  onChange={(event) => onFormChange({ payoutAddress: event.target.value })}
                  placeholder="Wallet address"
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 font-mono text-xs"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Earnings are paid out monthly to this address. Double-check the network: transfers can&apos;t be reversed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Social links</CardTitle>
              <CardDescription>Let visitors follow you elsewhere.</CardDescription>
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
              {connectedCount}/{SOCIAL_PLATFORMS.length} connected
            </span>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const value = form[platform.id]
              return (
                <div key={platform.id} className="relative">
                  <label htmlFor={`social-${platform.id}`} className="sr-only">
                    {platform.label}
                  </label>
                  <span
                    className="absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md transition-opacity"
                    style={{ backgroundColor: platform.brandHoverBg, color: platform.brandColor, opacity: value ? 1 : 0.55 }}
                  >
                    {getSocialIcon(platform.id, { size: 13 })}
                  </span>
                  <Input
                    id={`social-${platform.id}`}
                    value={value}
                    onChange={(event) => onFormChange({ [platform.id]: event.target.value })}
                    placeholder={`${platform.label} · ${platform.placeholder}`}
                    className="pl-10 pr-8 text-xs"
                  />
                  {value && (
                    <button
                      type="button"
                      onClick={() => onFormChange({ [platform.id]: '' })}
                      aria-label={`Clear ${platform.label}`}
                      className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {isActive ? (
          <Card className="border-destructive/25 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground">Delete store</h3>
                <p className="text-xs text-muted-foreground">Removes your storefront and all its products. Your account stays.</p>
              </div>
              <InlineConfirm corner={12} label="Delete Store" onConfirm={onDeleteStore} />
            </div>
          </Card>
        ) : (
          <Card className="space-y-3 p-5 sm:p-6">
            <SlideToConfirm
              label="Slide to activate store"
              confirmedLabel="Store activated!"
              width={280}
              disabled={saving || !form.storeName.trim()}
              onConfirm={onActivate}
            />
            <p className="text-[11px] text-muted-foreground">
              {form.storeName.trim() ? (
                <>
                  By activating, you agree to the{' '}
                  <Link href="/collab" target="_blank" className="font-semibold text-foreground hover:underline">
                    artist collaboration agreement
                  </Link>
                  .
                </>
              ) : (
                'Enter a store name above to activate.'
              )}
            </p>
          </Card>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:col-span-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
        <StorefrontPreview username={username} form={form} />
      </div>
    </div>
  )
}
