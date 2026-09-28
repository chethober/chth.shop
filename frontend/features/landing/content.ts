import { Layers, Sparkles, Zap, type LucideIcon } from 'lucide-react'

export interface Colorway {
  name: string
  hex: string
  decal: string
}

/** Default tee colour for each theme, so the tee always stands out from the page. */
export const DEFAULT_COLORWAY = { dark: 'Bone', light: 'Obsidian' } as const

export const COLORWAYS: Colorway[] = [
  { name: 'Obsidian', hex: '#121214', decal: '/logo-white.png' },
  { name: 'Bone', hex: '#F3EFE0', decal: '/logo-black.png' },
  { name: 'Cobalt', hex: '#253B59', decal: '/logo-white.png' },
  { name: 'Moss', hex: '#334537', decal: '/logo-white.png' },
  { name: 'Signal', hex: '#FF5B00', decal: '/logo-white.png' },
  { name: 'Violet', hex: '#5A3E7A', decal: '/logo-white.png' },
]

export type SectionId = 'hero' | 'collab' | 'design'

export const HERO_SPECS: { label: string; detail: string; icon: LucideIcon }[] = [
  { label: '320 GSM', detail: 'Heavyweight cotton', icon: Layers },
  { label: 'HD print', detail: 'Direct to garment', icon: Sparkles },
  { label: '48h', detail: 'Made to order', icon: Zap },
]

export const CREATOR_BENEFITS = [
  { title: 'Upload once, sell forever', description: 'Your design goes live in your own 3D storefront.' },
  { title: 'We make & ship every order', description: 'Printed, checked and dispatched within 48 hours.' },
  { title: 'You keep the rights', description: 'Non-exclusive license — your art stays yours.' },
]

export const CREATOR_STATS = [
  { value: '25%', label: 'Royalty per sale' },
  { value: '$0', label: 'Upfront cost' },
  { value: '48h', label: 'Dispatch' },
]

export const DESIGN_STEPS = [
  { title: 'Pick a garment & color', description: 'Tee, hoodie or pants in any colorway.' },
  { title: 'Add your artwork', description: 'Upload a logo, type text, place layers in 3D.' },
  { title: 'Order or publish', description: 'Buy it for yourself or sell it in your store.' },
]

/**
 * Callouts pinned to points on the 3D tee. `anchor` is in the model's own coordinates
 * (x ±0.28 sleeves, y −0.35 hem → 0.26 shoulders, z −0.13 back → 0.14 front).
 * Each tip is visible while scroll progress is within [from, to].
 */
export interface ModelTip {
  id: string
  title: string
  text: string
  anchor: [number, number, number]
  /** Which side of the anchor the label sits on (desktop; on phones labels point inward). */
  side: 'left' | 'right'
  /** Hidden on phones, where the lower part of the tee sits behind the section text. */
  desktopOnly?: boolean
  from: number
  to: number
}

export const MODEL_TIPS: ModelTip[] = [
  // Hero: the garment itself
  {
    id: 'collar',
    title: 'Ribbed collar',
    text: '1.25" twin-needle rib that keeps its shape wash after wash.',
    anchor: [0, 0.215, 0.075],
    side: 'left',
    from: 0,
    to: 0.3,
  },
  {
    id: 'fabric',
    title: '320 GSM cotton',
    text: 'Heavyweight combed cotton with a clean, structured drape.',
    anchor: [-0.21, 0.1, 0.06],
    side: 'left',
    from: 0.05,
    to: 0.3,
  },
  {
    id: 'fit',
    title: 'Boxy fit',
    text: 'Drop shoulders and a cropped, oversized silhouette.',
    anchor: [-0.13, -0.28, 0.12],
    side: 'left',
    desktopOnly: true,
    from: 0.1,
    to: 0.3,
  },

  // Collab: the artist's print area on the back
  {
    id: 'back-print',
    title: 'Your artwork here',
    text: 'Full back print area for artist collections.',
    anchor: [0, 0.03, -0.13],
    side: 'right',
    from: 0.38,
    to: 0.68,
  },
  {
    id: 'royalty',
    title: '25% on every sale',
    text: 'Paid out monthly — we handle printing and shipping.',
    anchor: [-0.12, -0.26, -0.1],
    side: 'right',
    desktopOnly: true,
    from: 0.44,
    to: 0.68,
  },

  // Design: what you can customize
  {
    id: 'chest',
    title: 'Your logo',
    text: 'Drop any image on the chest, or add movable layers.',
    anchor: [0, 0.04, 0.15],
    side: 'left',
    from: 0.8,
    to: 1.01,
  },
  {
    id: 'color',
    title: 'Any colorway',
    text: 'Try the swatches — the tee updates live.',
    anchor: [-0.22, 0.12, 0.05],
    side: 'left',
    from: 0.86,
    to: 1.01,
  },
]
