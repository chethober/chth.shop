import { SOCIAL_PLATFORMS } from '@/lib/social'
import type { Store, StoreInput, StoreKind } from '@/types'

/** Editable storefront fields; every value is a string so inputs stay controlled. */
export interface StoreForm {
  kind: StoreKind
  storeName: string
  bio: string
  payoutAddress: string
  payoutNetwork: string
  instagram: string
  twitter: string
  tiktok: string
  youtube: string
  spotify: string
  telegram: string
  discord: string
  website: string
}

export const PAYOUT_NETWORKS = ['USDT-TRC20', 'USDT-ERC20', 'USDC-BASE', 'TON', 'BTC', 'ETH'] as const

export const STORE_FORM_FIELDS = [
  'kind',
  'storeName',
  'bio',
  'payoutAddress',
  'payoutNetwork',
  ...SOCIAL_PLATFORMS.map((platform) => platform.id),
] as (keyof StoreForm)[]

export function storeFormFromStore(store: Store | null): StoreForm {
  const form = Object.fromEntries(
    STORE_FORM_FIELDS.map((field) => [field, (store?.[field] as string | null | undefined) ?? ''])
  ) as unknown as StoreForm
  form.kind = store?.kind ?? 'ARTIST'
  form.payoutNetwork = store?.payoutNetwork ?? PAYOUT_NETWORKS[0]
  return form
}

export function isStoreFormDirty(saved: StoreForm, current: StoreForm) {
  return STORE_FORM_FIELDS.some((field) => saved[field] !== current[field])
}

/** Trims values and sends empty social handles as `null` so they are cleared. */
export function storeFormToPayload(form: StoreForm): StoreInput {
  const socials = Object.fromEntries(
    SOCIAL_PLATFORMS.map(({ id }) => [id, form[id].trim() || null])
  ) as Omit<StoreInput, 'storeName' | 'bio' | 'kind' | 'payoutAddress' | 'payoutNetwork'>

  return {
    kind: form.kind,
    storeName: form.storeName.trim(),
    bio: form.bio,
    payoutAddress: form.payoutAddress.trim(),
    payoutNetwork: form.payoutNetwork,
    ...socials,
  }
}

export function hasSocialLinks(store: Store | null) {
  return SOCIAL_PLATFORMS.some(({ id }) => Boolean(store?.[id]))
}
