import { SOCIAL_PLATFORMS } from '@/lib/social'
import type { Artist, ArtistProfileInput } from '@/types'

/** Editable storefront fields; every value is a string so inputs stay controlled. */
export interface StoreForm {
  storeName: string
  bio: string
  instagram: string
  twitter: string
  tiktok: string
  youtube: string
  spotify: string
  telegram: string
  discord: string
  website: string
}

export const STORE_FORM_FIELDS = [
  'storeName',
  'bio',
  ...SOCIAL_PLATFORMS.map((platform) => platform.id),
] as (keyof StoreForm)[]

export function storeFormFromArtist(artist: Artist | null): StoreForm {
  return Object.fromEntries(
    STORE_FORM_FIELDS.map((field) => [field, (artist?.[field] as string | null | undefined) ?? ''])
  ) as unknown as StoreForm
}

export function isStoreFormDirty(saved: StoreForm, current: StoreForm) {
  return STORE_FORM_FIELDS.some((field) => saved[field] !== current[field])
}

/** Trims values and sends empty social handles as `null` so they are cleared. */
export function storeFormToPayload(form: StoreForm): ArtistProfileInput {
  const socials = Object.fromEntries(
    SOCIAL_PLATFORMS.map(({ id }) => [id, form[id].trim() || null])
  ) as Omit<ArtistProfileInput, 'storeName' | 'bio'>

  return { storeName: form.storeName.trim(), bio: form.bio, ...socials }
}

export function hasSocialLinks(artist: Artist | null) {
  return SOCIAL_PLATFORMS.some(({ id }) => Boolean(artist?.[id]))
}
