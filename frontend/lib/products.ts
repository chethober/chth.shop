import type { ProductType } from '@/types'
import { API_ORIGIN } from './config'

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  tshirt: 'T-Shirt',
  hoodie: 'Hoodie',
  pants: 'Pants',
}

export const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]

export function getProductTypeLabel(type: string): string {
  return PRODUCT_TYPE_LABELS[type as ProductType] ?? type.charAt(0).toUpperCase() + type.slice(1)
}

const PLACEHOLDER_IMAGES: Record<ProductType, string> = {
  tshirt: '/tshirt.jpg',
  hoodie: '/hoodie.jpg',
  pants: '/pants.png',
}

/** Stock garment photo used when a product has no image of its own. */
export function getPlaceholderImage(type?: string, name?: string): string {
  if (type && type in PLACEHOLDER_IMAGES) return PLACEHOLDER_IMAGES[type as ProductType]

  const lowerName = name?.toLowerCase() ?? ''
  if (lowerName.includes('hoodie')) return PLACEHOLDER_IMAGES.hoodie
  if (lowerName.includes('pant') || lowerName.includes('trouser')) return PLACEHOLDER_IMAGES.pants
  return PLACEHOLDER_IMAGES.tshirt
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
