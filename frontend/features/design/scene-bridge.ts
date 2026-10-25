import type { PrintSide, Vec3, ViewId } from './constants'

/**
 * The studio's UI lives outside the R3F canvas, but a few actions need the scene itself: snapping a print onto the
 * fabric, flying the camera to a view, and rendering stills for export. The canvas registers handlers here on mount.
 */
interface SceneBridge {
  /** Finds the fabric under (x, y) on the given side, in the garment mesh's local space. */
  projectToSurface?: (x: number, y: number, side: PrintSide) => Vec3 | null
  setView?: (view: ViewId) => void
  resetView?: () => void
  /** Renders one still, optionally from a view preset, without on-canvas selection overlays. Returns a PNG data URL. */
  capture?: (view?: ViewId) => string | null
}

export const sceneBridge: SceneBridge = {}

/** Snaps a point onto the fabric; falls back to the point itself, mirrored in z for the back, if nothing is hit. */
export function surfacePoint(x: number, y: number, side: PrintSide, fallbackZ: number): Vec3 {
  return sceneBridge.projectToSurface?.(x, y, side) ?? [x, y, side === 'front' ? fallbackZ : -fallbackZ]
}
