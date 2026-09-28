import { Scissors, Shirt, type LucideIcon } from 'lucide-react'
import type { ProductType } from '@/types'

type Vec3 = [number, number, number]

export interface Garment {
  id: ProductType
  name: string
  icon: LucideIcon
  modelPath: string
  /** Where the chest logo sits on the model's surface. */
  chestPosition: Vec3
  chestScale: Vec3
}

export const GARMENTS: Garment[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    icon: Shirt,
    modelPath: '/models/shirt_baked.glb',
    chestPosition: [0, 0.04, 0.15],
    chestScale: [0.15, 0.15, 0.15],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    icon: Shirt,
    modelPath: '/models/hoodie.glb',
    chestPosition: [0, 0.06, 0.18],
    chestScale: [0.18, 0.18, 0.18],
  },
  {
    id: 'pants',
    name: 'Pants',
    icon: Scissors,
    modelPath: '/models/pants.glb',
    chestPosition: [0.08, -0.15, 0.14],
    chestScale: [0.14, 0.14, 0.14],
  },
]

export function getGarment(id: ProductType): Garment {
  return GARMENTS.find((garment) => garment.id === id) ?? GARMENTS[0]
}

export const DEFAULT_GARMENT_COLOR = '#EFBD48'
export const DEFAULT_TEXT_COLOR = '#121212'

export const COLOR_PALETTE = [
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Pitch Black', value: '#121212' },
  { name: 'Royal Cobalt', value: '#1D4ED8' },
  { name: 'Sunset Amber', value: '#EFBD48' },
  { name: 'Forest Emerald', value: '#059669' },
  { name: 'Crimson Red', value: '#DC2626' },
  { name: 'Cyber Purple', value: '#8B5CF6' },
  { name: 'Rose Quartz', value: '#F472B6' },
]

export const FABRICS = [
  { id: 'cotton', name: 'Organic Cotton', description: '100% Breathable Soft Cotton' },
  { id: 'fleece', name: 'Heavyweight Fleece', description: '400GSM Cozy & Thick' },
  { id: 'linen', name: 'French Linen', description: 'Lightweight Natural Weave' },
  { id: 'satin', name: 'Silk Satin', description: 'Lustrous Smooth Finish' },
]

export const AI_PROMPT_PRESETS = [
  'Cyberpunk neon geometric streetwear typography',
  'Vintage Japanese woodblock ukiyo-e wave design',
  'Minimalist bauhaus abstract forms and shapes',
  'Retro 90s aesthetic graffiti illustration',
]

/** A movable image or text layer the user placed on the garment. */
export interface DesignLayer {
  id: string
  type: 'image' | 'text'
  content: string
  imageUrl?: string
  position: Vec3
  rotation: number
  scale: Vec3
  color?: string
  fontSize?: number
}
