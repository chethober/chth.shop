import { Scissors, Shirt, type LucideIcon } from 'lucide-react'
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

export interface Garment {
  id: ProductType
  name: string
  icon: LucideIcon
  modelPath: string
  /** Where the chest logo sits on the model's surface. */
  chestPosition: Vec3
  chestScale: Vec3
  placements: Placement[]
}

export const GARMENTS: Garment[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    icon: Shirt,
    modelPath: '/models/shirt_baked.glb',
    chestPosition: [0, 0.04, 0.15],
    chestScale: [0.15, 0.15, 0.15],
    placements: [
      { id: 'center-chest', label: 'Center chest', side: 'front', x: 0, y: 0.04, size: 0.15 },
      { id: 'left-chest', label: 'Left chest', side: 'front', x: 0.07, y: 0.1, size: 0.07 },
      { id: 'full-front', label: 'Full front', side: 'front', x: 0, y: -0.02, size: 0.27 },
      { id: 'upper-back', label: 'Upper back', side: 'back', x: 0, y: 0.13, size: 0.12 },
      { id: 'full-back', label: 'Full back', side: 'back', x: 0, y: -0.01, size: 0.27 },
    ],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    icon: Shirt,
    modelPath: '/models/hoodie.glb',
    chestPosition: [0, 0.06, 0.18],
    chestScale: [0.18, 0.18, 0.18],
    placements: [
      { id: 'center-chest', label: 'Center chest', side: 'front', x: 0, y: 0.06, size: 0.18 },
      { id: 'left-chest', label: 'Left chest', side: 'front', x: 0.08, y: 0.12, size: 0.08 },
      { id: 'full-front', label: 'Full front', side: 'front', x: 0, y: 0.02, size: 0.28 },
      { id: 'upper-back', label: 'Upper back', side: 'back', x: 0, y: 0.12, size: 0.14 },
      { id: 'full-back', label: 'Full back', side: 'back', x: 0, y: 0.02, size: 0.3 },
    ],
  },
  {
    id: 'pants',
    name: 'Pants',
    icon: Scissors,
    modelPath: '/models/pants.glb',
    chestPosition: [0.08, -0.15, 0.14],
    chestScale: [0.14, 0.14, 0.14],
    placements: [
      { id: 'left-thigh', label: 'Left thigh', side: 'front', x: 0.08, y: -0.15, size: 0.14 },
      { id: 'right-thigh', label: 'Right thigh', side: 'front', x: -0.08, y: -0.15, size: 0.14 },
      { id: 'back-thigh', label: 'Back thigh', side: 'back', x: 0.08, y: -0.15, size: 0.14 },
      { id: 'back-pocket', label: 'Back pocket', side: 'back', x: 0.08, y: 0.05, size: 0.08 },
    ],
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
