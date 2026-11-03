import { Coffee, HardHat, Scissors, Shirt, ShoppingBag, type LucideIcon } from 'lucide-react'
import type { DesignLayer, ProductType } from '@/types'

export type { DesignLayer } from '@/types'

type Vec3 = [number, number, number]

/** How a product is drawn: a GLTF model, or simple geometry built in code. */
export type GarmentRenderer = 'baked-gltf' | 'multi-gltf' | 'mug' | 'hat' | 'tote'

export interface Garment {
  id: ProductType
  name: string
  icon: LucideIcon
  renderer: GarmentRenderer
  /** GLTF file for the model-based renderers. */
  modelPath?: string
  /** Where the front print / logo sits on the model's surface. */
  chestPosition: Vec3
  chestScale: Vec3
  /**
   * How deep decals project into the model. Deep boxes wrap prints around curved fabric;
   * shallow ones stop rigid products (mugs, caps, bags) from printing through to the back.
   */
  decalDepth: number
  /** Label for the fixed print area in the studio ("chest logo", "front print"…). */
  printAreaLabel: string
}

export const GARMENTS: Garment[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    icon: Shirt,
    renderer: 'baked-gltf',
    modelPath: '/models/shirt_baked.glb',
    chestPosition: [0, 0.04, 0.15],
    chestScale: [0.15, 0.15, 0.15],
    decalDepth: 0.8,
    printAreaLabel: 'chest logo',
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    icon: Shirt,
    renderer: 'multi-gltf',
    modelPath: '/models/hoodie.glb',
    chestPosition: [0, 0.06, 0.18],
    chestScale: [0.18, 0.18, 0.18],
    decalDepth: 0.8,
    printAreaLabel: 'chest logo',
  },
  {
    id: 'pants',
    name: 'Pants',
    icon: Scissors,
    renderer: 'multi-gltf',
    modelPath: '/models/pants.glb',
    chestPosition: [0.08, -0.15, 0.14],
    chestScale: [0.14, 0.14, 0.14],
    decalDepth: 0.8,
    printAreaLabel: 'leg print',
  },
  {
    id: 'mug',
    name: 'Mug',
    icon: Coffee,
    renderer: 'mug',
    chestPosition: [0, 0, 0.16],
    chestScale: [0.2, 0.2, 0.2],
    decalDepth: 0.16,
    printAreaLabel: 'front print',
  },
  {
    id: 'hat',
    name: 'Cap',
    icon: HardHat,
    renderer: 'hat',
    chestPosition: [0, 0.08, 0.16],
    chestScale: [0.12, 0.12, 0.12],
    decalDepth: 0.14,
    printAreaLabel: 'front patch',
  },
  {
    id: 'tote',
    name: 'Tote Bag',
    icon: ShoppingBag,
    renderer: 'tote',
    chestPosition: [0, -0.03, 0.03],
    chestScale: [0.24, 0.24, 0.24],
    decalDepth: 0.04,
    printAreaLabel: 'front print',
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
  { name: 'Natural Canvas', value: '#F5F0E6' },
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

export type LayerDraft = Omit<DesignLayer, 'id' | 'position' | 'rotation' | 'scale'>
