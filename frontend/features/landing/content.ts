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

/** Landing sections in page order. Each is a scroll-snap stop with its own tee pose and tip. */
export const SECTION_IDS = ['hero', 'collab', 'design'] as const
export type SectionId = (typeof SECTION_IDS)[number]

/** Each section's mono index label, shown as `01 / the tee`. */
export const SECTION_LABELS: Record<SectionId, string> = {
  hero: 'the tee',
  collab: 'for artists',
  design: 'studio',
}

export const HERO_SPECS = ['320 gsm cotton', 'dtg print', 'made in 48h']

export const CREATOR_BENEFITS = [
  { title: 'Upload once, sell forever', description: 'Your design goes live in your own 3D storefront.' },
  { title: 'We make & ship every order', description: 'Printed, checked and dispatched within 48 hours.' },
  { title: 'You keep the rights', description: 'Non-exclusive license — your art stays yours.' },
]

/** The artist's share of every sale, in percent. */
export const ROYALTY_PERCENT = 25

/**
 * Callouts pinned to points on the 3D tee, one per section. `anchor` is in the model's own coordinates
 * (x ±0.28 sleeves, y −0.35 hem → 0.26 shoulders, z −0.13 back → 0.14 front).
 * Each tip shows while its section is the one snapped into view.
 */
export interface ModelTip {
  id: string
  title: string
  text: string
  anchor: [number, number, number]
  /** Which side of the anchor the label sits on (desktop; on phones labels point inward). */
  side: 'left' | 'right'
  section: SectionId
}

export const MODEL_TIPS: ModelTip[] = [
  {
    id: 'fabric',
    title: '320 GSM cotton',
    text: 'Heavyweight combed cotton with a clean, structured drape.',
    anchor: [-0.21, 0.1, 0.06],
    side: 'left',
    section: 'hero',
  },
  {
    id: 'back-print',
    title: 'Your artwork here',
    text: 'Full back print area for artist collections.',
    anchor: [0, 0.03, -0.13],
    side: 'right',
    section: 'collab',
  },
  {
    id: 'chest',
    title: 'Your logo',
    text: 'Drop any image on the chest, or add movable layers.',
    anchor: [0, 0.04, 0.15],
    side: 'left',
    section: 'design',
  },
]
