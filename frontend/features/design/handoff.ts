/**
 * The landing page's launch flies its tee into the exact spot the studio draws its own, then hands
 * over the tee's colour, any artwork the visitor uploaded, and a snapshot of that last frame. The studio shows the snapshot until its
 * canvas has drawn, then crossfades, so the two tees read as one.
 */

/** The studio's frame; the landing page draws a copy of it to fly the tee into. */
export const STUDIO_FRAME_CLASS =
  'relative h-[calc(100vh-140px)] min-h-[600px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm'

export const STUDIO_CAMERA = { position: [0, 0, 2] as [number, number, number], fov: 25 }

export const STUDIO_ROUGHNESS = 1

export interface StudioHandoff {
  color: string
  /** Image the visitor uploaded on the landing page, as a data URL; the studio starts with it as the chest logo. */
  logoUrl?: string
  /** The landing tee's last frame, cropped to the studio frame. */
  snapshot: HTMLCanvasElement
}

let pending: StudioHandoff | null = null

export function handOffToStudio(handoff: StudioHandoff) {
  pending = handoff
}

export function peekStudioHandoff() {
  return pending
}

export function clearStudioHandoff() {
  pending = null
}
