import { Coffee, CupSoda, HardHat, Image, Milk, Scissors, Shirt, ShoppingBag, Smartphone, Sticker, type LucideIcon } from 'lucide-react'
import type { ProductType } from '@/types'

export type Vec3 = [number, number, number]

/** Which face of the garment a print sits on. */
export type PrintSide = 'front' | 'back'

/** A named print spot, in the garment mesh's local space. `z` is found by projecting onto the surface. */
export interface Placement {
  id: string
  label: string
  side: PrintSide
  x: number
  y: number
  size: number
}

/** How a product is drawn: the baked t-shirt, a normalized GLB, or geometry built in code. */
export type GarmentRender = 'baked' | 'gltf' | 'cap' | 'beanie' | 'poster' | 'sticker'

/** How a GLB product is loaded (see scene/garment-model.tsx). */
export interface GltfModel {
  path: string
  /**
   * Largest side after normalization, in scene units. Normalized models are centred at the origin with their
   * print side facing +z, so placements below are in that shared space.
   */
  targetSize?: number
  /** Mesh names that take the product color; all when omitted. */
  tintParts?: string[]
  /** Drop baked colour textures on tinted parts so the color shows. */
  dropColorTextures?: boolean
  /** Mesh that receives prints; the largest when omitted. */
  printPart?: string
}

export interface Garment {
  id: ProductType
  name: string
  icon: LucideIcon
  render: GarmentRender
  model?: GltfModel
  /** Apparel takes the fabric options; rigid products (mugs, cases…) keep their own finish. */
  fabric: boolean
  /**
   * How deep prints project along the surface normal. Deep enough to wrap curved fabric, shallow enough that rigid
   * products don't print through to their other side.
   */
  decalDepth: number
  /**
   * Project prints straight along the front/back axis instead of along the surface normal. For models whose
   * normals are too coarse to orient a print (the low-poly joggers).
   */
  axisPrints?: boolean
  /** Where the first print lands (z is the fallback when projection misses). */
  chestPosition: Vec3
  chestScale: Vec3
  placements: Placement[]
}

const front = (id: string, label: string, x: number, y: number, size: number): Placement => ({ id, label, side: 'front', x, y, size })
const back = (id: string, label: string, x: number, y: number, size: number): Placement => ({ id, label, side: 'back', x, y, size })

// Model sources and licenses: public/models/LICENSES.md
export const GARMENTS: Garment[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    icon: Shirt,
    render: 'baked',
    model: { path: '/models/shirt_baked.glb' },
    fabric: true,
    decalDepth: 0.28,
    chestPosition: [0, 0.04, 0.15],
    chestScale: [0.15, 0.15, 0.15],
    placements: [
      front('center-chest', 'Center chest', 0, 0.04, 0.15),
      front('left-chest', 'Left chest', 0.07, 0.1, 0.07),
      front('full-front', 'Full front', 0, -0.02, 0.27),
      back('upper-back', 'Upper back', 0, 0.13, 0.12),
      back('full-back', 'Full back', 0, -0.01, 0.27),
    ],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    icon: Shirt,
    render: 'gltf',
    model: { path: '/models/hoodie.glb', targetSize: 0.75, dropColorTextures: true },
    fabric: true,
    decalDepth: 0.25,
    chestPosition: [0, 0.07, 0.15],
    chestScale: [0.15, 0.15, 0.15],
    placements: [
      front('center-chest', 'Center chest', 0, 0.07, 0.14),
      front('left-chest', 'Left chest', 0.06, 0.1, 0.07),
      front('full-front', 'Full front', 0, 0.02, 0.22),
      back('upper-back', 'Upper back', 0, 0.1, 0.12),
      back('full-back', 'Full back', 0, 0.03, 0.24),
    ],
  },
  {
    id: 'pants',
    name: 'Joggers',
    icon: Scissors,
    render: 'gltf',
    model: { path: '/models/joggers.glb', targetSize: 0.62, dropColorTextures: true },
    fabric: true,
    decalDepth: 0.15,
    axisPrints: true,
    chestPosition: [0.06, 0.13, 0.08],
    chestScale: [0.08, 0.08, 0.08],
    placements: [
      front('left-thigh', 'Left thigh', 0.06, 0.13, 0.08),
      front('right-thigh', 'Right thigh', -0.06, 0.13, 0.08),
      front('left-shin', 'Left shin', 0.06, -0.15, 0.06),
      back('back-thigh', 'Back thigh', 0.06, 0.1, 0.08),
      back('back-pocket', 'Back pocket', 0.06, 0.24, 0.05),
    ],
  },
  {
    id: 'hat',
    name: 'Cap',
    icon: HardHat,
    render: 'cap',
    fabric: true,
    decalDepth: 0.12,
    chestPosition: [0, 0.085, 0.17],
    chestScale: [0.13, 0.13, 0.13],
    placements: [front('front-panel', 'Front panel', 0, 0.085, 0.13), back('back-panel', 'Back', 0, 0.06, 0.08)],
  },
  {
    id: 'beanie',
    name: 'Beanie',
    icon: HardHat,
    render: 'beanie',
    fabric: true,
    decalDepth: 0.1,
    chestPosition: [0, 0, 0.205],
    chestScale: [0.1, 0.1, 0.1],
    placements: [front('cuff', 'Cuff patch', 0, 0, 0.1), back('back-cuff', 'Back cuff', 0, 0, 0.08)],
  },
  {
    id: 'mug',
    name: 'Mug',
    icon: Coffee,
    render: 'gltf',
    model: { path: '/models/mug.glb', targetSize: 0.5, tintParts: ['Body', 'Handle'], printPart: 'Body' },
    fabric: false,
    decalDepth: 0.16,
    chestPosition: [-0.08, 0, 0.17],
    chestScale: [0.2, 0.2, 0.2],
    placements: [front('front', 'Front', -0.08, 0, 0.2), back('back', 'Back', -0.08, 0, 0.2)],
  },
  {
    id: 'cup',
    name: 'Takeaway Cup',
    icon: CupSoda,
    render: 'gltf',
    model: { path: '/models/coffee-cup.glb', targetSize: 0.5, tintParts: ['Cup'], printPart: 'Sleeve' },
    fabric: false,
    decalDepth: 0.15,
    chestPosition: [0, -0.036, 0.18],
    chestScale: [0.15, 0.15, 0.15],
    placements: [front('sleeve-front', 'Sleeve front', 0, -0.036, 0.14), back('sleeve-back', 'Sleeve back', 0, -0.036, 0.14)],
  },
  {
    id: 'bottle',
    name: 'Water Bottle',
    icon: Milk,
    render: 'gltf',
    model: { path: '/models/water-bottle.glb', targetSize: 0.6, tintParts: ['Body'], printPart: 'Body' },
    fabric: false,
    decalDepth: 0.08,
    chestPosition: [0, -0.035, 0.085],
    chestScale: [0.12, 0.12, 0.12],
    placements: [front('front', 'Front', 0, -0.035, 0.12), back('back', 'Back', 0, -0.035, 0.12)],
  },
  {
    id: 'tote',
    name: 'Tote Bag',
    icon: ShoppingBag,
    render: 'gltf',
    model: { path: '/models/tote-bag.glb', targetSize: 0.6, printPart: 'Bag' },
    fabric: false,
    decalDepth: 0.04,
    chestPosition: [0, -0.08, 0.008],
    chestScale: [0.24, 0.24, 0.24],
    placements: [
      front('front', 'Front', 0, -0.08, 0.24),
      front('front-small', 'Front pocket', 0, -0.16, 0.1),
      back('back', 'Back', 0, -0.08, 0.24),
    ],
  },
  {
    id: 'phonecase',
    name: 'Phone Case',
    icon: Smartphone,
    render: 'gltf',
    model: { path: '/models/phone-case.glb', targetSize: 0.55, tintParts: ['Case'], printPart: 'Case' },
    fabric: false,
    decalDepth: 0.03,
    chestPosition: [0, -0.055, 0.012],
    chestScale: [0.2, 0.2, 0.2],
    placements: [front('case', 'Case', 0, -0.055, 0.2), front('case-full', 'Full case', 0, 0, 0.26)],
  },
  {
    id: 'poster',
    name: 'Poster',
    icon: Image,
    render: 'poster',
    fabric: false,
    decalDepth: 0.02,
    chestPosition: [0, 0, 0.001],
    chestScale: [0.3, 0.3, 0.3],
    placements: [front('full', 'Full print', 0, 0, 0.36), front('center', 'Centered', 0, 0.03, 0.22)],
  },
  {
    id: 'sticker',
    name: 'Sticker',
    icon: Sticker,
    render: 'sticker',
    fabric: false,
    decalDepth: 0.02,
    chestPosition: [0, 0, 0.004],
    chestScale: [0.3, 0.3, 0.3],
    placements: [front('full', 'Full sticker', 0, 0, 0.4), front('center', 'Centered', 0, 0, 0.26)],
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
  { name: 'Heather Grey', value: '#9CA3AF' },
  { name: 'Navy', value: '#1E293B' },
  { name: 'Sand', value: '#D6C7A1' },
  { name: 'Olive', value: '#5B6236' },
  { name: 'Natural Canvas', value: '#F5F0E6' },
  { name: 'Kraft', value: '#C9A77C' },
  { name: 'Brushed Steel', value: '#D7DBE0' },
]

/** `roughness` and `sheen` drive the garment material so fabrics read differently under the studio lights. */
export const FABRICS = [
  { id: 'cotton', name: 'Organic Cotton', description: '100% breathable soft cotton', roughness: 1 },
  { id: 'fleece', name: 'Heavyweight Fleece', description: '400GSM cozy & thick', roughness: 1 },
  { id: 'linen', name: 'French Linen', description: 'Lightweight natural weave', roughness: 0.9 },
  { id: 'satin', name: 'Silk Satin', description: 'Lustrous smooth finish', roughness: 0.38 },
]

export function getFabric(id: string) {
  return FABRICS.find((fabric) => fabric.id === id) ?? FABRICS[0]
}

export const FONTS = [
  { id: 'geist', label: 'Geist', family: "Geist, Inter, -apple-system, 'Segoe UI', sans-serif" },
  { id: 'serif', label: 'Serif', family: "Georgia, 'Times New Roman', serif" },
  { id: 'mono', label: 'Mono', family: "'Geist Mono', ui-monospace, Menlo, monospace" },
  { id: 'impact', label: 'Impact', family: "Impact, 'Arial Narrow Bold', sans-serif" },
  { id: 'script', label: 'Script', family: "'Brush Script MT', 'Segoe Script', cursive" },
]

export function getFont(id?: string) {
  return FONTS.find((font) => font.id === id) ?? FONTS[0]
}

export const AI_PROMPT_PRESETS = [
  'Cyberpunk neon geometric streetwear typography',
  'Vintage Japanese woodblock ukiyo-e wave design',
  'Minimalist bauhaus abstract forms and shapes',
  'Retro 90s aesthetic graffiti illustration',
]

/** Camera positions for the viewport's view presets; all sit on the studio camera's orbit radius. */
export const VIEWS = {
  front: { label: 'Front', position: [0, 0, 2] as Vec3 },
  back: { label: 'Back', position: [0, 0, -2] as Vec3 },
  left: { label: 'Left', position: [-2, 0, 0] as Vec3 },
  right: { label: 'Right', position: [2, 0, 0] as Vec3 },
  angle: { label: '3/4', position: [1.35, 0.35, 1.4] as Vec3 },
}

export type ViewId = keyof typeof VIEWS

export const BACKDROPS = {
  light: { label: 'Light', className: 'bg-card' },
  dark: { label: 'Dark', className: 'bg-neutral-900' },
  checker: {
    label: 'Transparent',
    className:
      'bg-card [background-image:conic-gradient(hsl(var(--muted))_25%,transparent_0_50%,hsl(var(--muted))_0_75%,transparent_0)] [background-size:20px_20px]',
  },
}

export type BackdropId = keyof typeof BACKDROPS

/** A movable image or text layer the user placed on the garment. */
export interface DesignLayer {
  id: string
  type: 'image' | 'text'
  name: string
  /** Text content for text layers. */
  content: string
  imageUrl?: string
  /** Position in the garment mesh's local space. */
  position: Vec3
  side: PrintSide
  /** Roll around the surface normal, in radians. */
  rotation: number
  /** Width of the print in model units; height follows the artwork's aspect ratio. */
  size: number
  opacity: number
  flipX: boolean
  visible: boolean
  locked: boolean
  color?: string
  font?: string
  bold?: boolean
  italic?: boolean
  outline?: string | null
}

/** Everything that defines a design, and so everything undo/redo and drafts track. */
export interface DesignDoc {
  name: string
  garmentId: ProductType
  color: string
  fabric: string
  layers: DesignLayer[]
}

export const EMPTY_DOC: DesignDoc = {
  name: 'Untitled design',
  garmentId: 'tshirt',
  color: DEFAULT_GARMENT_COLOR,
  fabric: FABRICS[0].id,
  layers: [],
}

export const SIZE_RANGE = { min: 0.03, max: 0.4 }
export const POSITION_RANGE = { min: -0.35, max: 0.35 }
