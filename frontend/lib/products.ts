import type { LineOptions, ProductType } from '@/types'
import { API_ORIGIN } from './config'

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  tshirt: 'T-Shirt',
  hoodie: 'Hoodie',
  pants: 'Pants',
  mug: 'Mug',
  hat: 'Cap',
  tote: 'Tote Bag',
}

export const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]

export function getProductTypeLabel(type: string): string {
  return PRODUCT_TYPE_LABELS[type as ProductType] ?? type.charAt(0).toUpperCase() + type.slice(1)
}

const PLACEHOLDER_IMAGES: Record<ProductType, string> = {
  tshirt: '/tshirt.jpg',
  hoodie: '/hoodie.jpg',
  pants: '/pants.png',
  mug: '/mug.svg',
  hat: '/hat.svg',
  tote: '/tote.svg',
}

/** Stock garment photo used when a product has no image of its own. */
export function getPlaceholderImage(type?: string, name?: string): string {
  if (type && type in PLACEHOLDER_IMAGES) return PLACEHOLDER_IMAGES[type as ProductType]

  const lowerName = name?.toLowerCase() ?? ''
  if (lowerName.includes('hoodie')) return PLACEHOLDER_IMAGES.hoodie
  if (lowerName.includes('pant') || lowerName.includes('trouser')) return PLACEHOLDER_IMAGES.pants
  if (lowerName.includes('mug') || lowerName.includes('cup')) return PLACEHOLDER_IMAGES.mug
  if (lowerName.includes('cap') || lowerName.includes('hat')) return PLACEHOLDER_IMAGES.hat
  if (lowerName.includes('tote') || lowerName.includes('bag')) return PLACEHOLDER_IMAGES.tote
  return PLACEHOLDER_IMAGES.tshirt
}

/** Uploaded files live on the API; everything else (data URLs, https, bundled images) is used as is. */
export function resolveUploadUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${API_ORIGIN}${url}` : url
}

/** Resolves a product's image URL, including backend-relative `/uploads/...` paths. */
export function getProductImageUrl(imageUrl?: string | null, type?: string, name?: string): string {
  if (!imageUrl?.trim() || imageUrl.includes('via.placeholder.com')) {
    return getPlaceholderImage(type, name)
  }
  if (imageUrl.startsWith('/uploads/')) {
    return `${API_ORIGIN}${imageUrl}`
  }
  return imageUrl
}

export function isProductType(value: string | null | undefined): value is ProductType {
  return Boolean(value) && value! in PRODUCT_TYPE_LABELS
}

export const STORE_KIND_LABELS = { ARTIST: 'Artist', MERCHANT: 'Merchant' } as const

/** Common color names for the swatches we offer; anything else is shown as its hex value. */
const COLOR_NAMES: Record<string, string> = {
  '#FFFFFF': 'White',
  '#121212': 'Black',
  '#1D4ED8': 'Cobalt',
  '#EFBD48': 'Amber',
  '#059669': 'Emerald',
  '#DC2626': 'Red',
  '#8B5CF6': 'Purple',
  '#F472B6': 'Pink',
  '#F5F0E6': 'Natural',
}

export function colorName(hex: string): string {
  return COLOR_NAMES[hex.toUpperCase()] ?? hex.toUpperCase()
}

/** "M · Black · Personalized" */
export function describeOptions(options?: LineOptions | null): string {
  if (!options) return ''
  return [
    options.size,
    options.color && colorName(options.color),
    options.design && 'Personalized',
  ]
    .filter(Boolean)
    .join(' · ')
}
