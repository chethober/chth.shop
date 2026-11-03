import { Coffee, CupSoda, HardHat, Image, Milk, Scissors, Shirt, ShoppingBag, Smartphone, Sticker, type LucideIcon } from 'lucide-react'
import type { DesignLayer, ProductType } from '@/types'

export type { DesignLayer } from '@/types'

type Vec3 = [number, number, number]

/** How a product is drawn: the baked t-shirt, any other GLB, or simple geometry built in code. */
export type GarmentRenderer = 'baked-gltf' | 'gltf' | 'cap' | 'beanie' | 'poster' | 'sticker'

/** Where new artwork lands on a product, in the model's normalized space. */
export interface PrintArea {
  position: Vec3
  scale: Vec3
}

/** How a GLB product is normalized and printed on (see scene/gltf-product.tsx). */
export interface GltfModelConfig {
  path: string
  /** Largest side after normalization, in scene units. */
  targetSize: number
  /** Turn the model so its printable front faces the camera (+z). */
  rotationY?: number
  /** Mesh names that take the product color; all when omitted. */
  tintParts?: string[]
  /** Drop baked colour textures on tinted parts so the color shows. */
  dropColorTextures?: boolean
  /** Mesh that receives prints; the largest when omitted. */
  printPart?: string
  /** Print centre as a fraction of the print part's height (0 = bottom). */
  printV?: number
  /** Print centre as a fraction of the print part's width (0 = left as seen from the front). Default 0.5. */
  printU?: number
  /** Default artwork width as a fraction of the print part's width. */
  printWidth?: number
}

export interface Garment {
  id: ProductType
  name: string
  icon: LucideIcon
  renderer: GarmentRenderer
  model?: GltfModelConfig
  /** Print area for renderers that don't compute one (baked shirt, procedural products). */
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

// Model sources and licenses: public/models/LICENSES.md
export const GARMENTS: Garment[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    icon: Shirt,
    renderer: 'baked-gltf',
    model: { path: '/models/shirt_baked.glb', targetSize: 0.6 },
    chestPosition: [0, 0.04, 0.15],
    chestScale: [0.15, 0.15, 0.15],
    decalDepth: 0.8,
    printAreaLabel: 'chest logo',
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    icon: Shirt,
    renderer: 'gltf',
    model: { path: '/models/hoodie.glb', targetSize: 0.75, dropColorTextures: true, printV: 0.62, printWidth: 0.2 },
    chestPosition: [0, 0.06, 0.1],
    chestScale: [0.15, 0.15, 0.15],
    decalDepth: 0.25,
    printAreaLabel: 'chest logo',
  },
  {
    id: 'pants',
    name: 'Joggers',
    icon: Scissors,
    renderer: 'gltf',
    model: { path: '/models/joggers.glb', targetSize: 0.62, dropColorTextures: true, printU: 0.27, printV: 0.72, printWidth: 0.34 },
    chestPosition: [0.06, 0.1, 0.06],
    chestScale: [0.08, 0.08, 0.08],
    decalDepth: 0.15,
    printAreaLabel: 'leg print',
  },
  {
    id: 'hat',
    name: 'Cap',
    icon: HardHat,
    renderer: 'cap',
    chestPosition: [0, 0.085, 0.17],
    chestScale: [0.13, 0.13, 0.13],
    decalDepth: 0.12,
    printAreaLabel: 'front patch',
  },
  {
    id: 'beanie',
    name: 'Beanie',
    icon: HardHat,
    renderer: 'beanie',
    chestPosition: [0, 0, 0.205],
    chestScale: [0.1, 0.1, 0.1],
    decalDepth: 0.1,
    printAreaLabel: 'cuff patch',
  },
  {
    id: 'mug',
    name: 'Mug',
    icon: Coffee,
    renderer: 'gltf',
    model: { path: '/models/mug.glb', targetSize: 0.5, tintParts: ['Body', 'Handle'], printPart: 'Body', printWidth: 0.6 },
    chestPosition: [0, 0, 0.16],
    chestScale: [0.2, 0.2, 0.2],
    decalDepth: 0.16,
    printAreaLabel: 'front print',
  },
  {
    id: 'cup',
    name: 'Takeaway Cup',
    icon: CupSoda,
    renderer: 'gltf',
    model: { path: '/models/coffee-cup.glb', targetSize: 0.5, tintParts: ['Cup'], printPart: 'Sleeve', printWidth: 0.55 },
    chestPosition: [0, 0, 0.2],
    chestScale: [0.15, 0.15, 0.15],
    decalDepth: 0.15,
    printAreaLabel: 'sleeve print',
  },
  {
    id: 'bottle',
    name: 'Water Bottle',
    icon: Milk,
    renderer: 'gltf',
    model: { path: '/models/water-bottle.glb', targetSize: 0.6, tintParts: ['Body'], printPart: 'Body', printV: 0.5, printWidth: 0.9 },
    chestPosition: [0, 0, 0.08],
    chestScale: [0.1, 0.1, 0.1],
    decalDepth: 0.08,
    printAreaLabel: 'wrap print',
  },
  {
    id: 'tote',
    name: 'Tote Bag',
    icon: ShoppingBag,
    renderer: 'gltf',
    model: { path: '/models/tote-bag.glb', targetSize: 0.6, printPart: 'Bag', printV: 0.45, printWidth: 0.55 },
    chestPosition: [0, -0.03, 0.03],
    chestScale: [0.24, 0.24, 0.24],
    decalDepth: 0.04,
    printAreaLabel: 'front print',
  },
  {
    id: 'phonecase',
    name: 'Phone Case',
    icon: Smartphone,
    renderer: 'gltf',
    model: { path: '/models/phone-case.glb', targetSize: 0.55, tintParts: ['Case'], printPart: 'Case', printV: 0.4, printWidth: 0.75 },
    chestPosition: [0, -0.03, 0.02],
    chestScale: [0.18, 0.18, 0.18],
    decalDepth: 0.03,
    printAreaLabel: 'back print',
  },
  {
    id: 'poster',
    name: 'Poster',
    icon: Image,
    renderer: 'poster',
    chestPosition: [0, 0, 0.001],
    chestScale: [0.3, 0.3, 0.3],
    decalDepth: 0.02,
    printAreaLabel: 'artwork',
  },
  {
    id: 'sticker',
    name: 'Sticker',
    icon: Sticker,
    renderer: 'sticker',
    chestPosition: [0, 0, 0.004],
    chestScale: [0.3, 0.3, 0.3],
    decalDepth: 0.02,
    printAreaLabel: 'artwork',
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
  { name: 'Kraft', value: '#C9A77C' },
  { name: 'Brushed Steel', value: '#D7DBE0' },
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
