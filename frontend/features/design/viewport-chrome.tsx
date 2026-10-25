'use client'

import { useProgress } from '@react-three/drei'
import { Focus, ImagePlus, Rotate3d } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { BACKDROPS, VIEWS, type BackdropId, type ViewId } from './constants'
import { IconButton } from './panels/controls'
import { sceneBridge } from './scene-bridge'
import { useStudio } from './store'

const FLOATING = 'pointer-events-auto rounded-xl border border-border/70 bg-card/85 shadow-xs backdrop-blur-md'

const BACKDROP_SWATCH: Record<BackdropId, string> = {
  light: 'bg-white',
  dark: 'bg-neutral-900',
  checker: 'bg-[conic-gradient(#d4d4d8_25%,#fff_0_50%,#d4d4d8_0_75%,#fff_0)] [background-size:8px_8px]',
}

/** Camera, backdrop and status controls floating over the 3D viewport. */
export function ViewportChrome({ dropping }: { dropping: boolean }) {
  const autoRotate = useStudio((state) => state.autoRotate)
  const backdrop = useStudio((state) => state.backdrop)
  const hasLayers = useStudio((state) => state.doc.layers.length > 0)
  const { setAutoRotate, setBackdrop, setTool } = useStudio.getState()
  const loading = useProgress((state) => state.active)

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
        <div className={cn(FLOATING, 'flex p-0.5')} role="group" aria-label="Camera view">
          {(Object.keys(VIEWS) as ViewId[]).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => sceneBridge.setView?.(view)}
              className="h-7 cursor-pointer rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-muted hover:text-foreground active:scale-[0.96]"
            >
              {VIEWS[view].label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
        <div className={cn(FLOATING, 'flex p-0.5')}>
          <IconButton icon={Rotate3d} label="Auto-rotate" active={autoRotate} onClick={() => setAutoRotate(!autoRotate)} className="size-7" />
          <IconButton icon={Focus} label="Reset view" onClick={() => sceneBridge.resetView?.()} className="size-7" />
        </div>
        <div className={cn(FLOATING, 'flex gap-1 p-1')} role="radiogroup" aria-label="Backdrop">
          {(Object.keys(BACKDROPS) as BackdropId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={backdrop === id}
              aria-label={`${BACKDROPS[id].label} backdrop`}
              title={`${BACKDROPS[id].label} backdrop`}
              onClick={() => setBackdrop(id)}
              className={cn(
                'size-5 cursor-pointer rounded-md border border-black/15 transition-transform duration-150 ease-out active:scale-90',
                BACKDROP_SWATCH[id],
                backdrop === id && 'ring-2 ring-foreground ring-offset-1 ring-offset-card'
              )}
            />
          ))}
        </div>
      </div>

      {loading && (
        <div className={cn(FLOATING, 'absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground')} role="status">
          <Spinner className="size-3.5" />
          Loading garment
        </div>
      )}

      {!hasLayers && !loading && (
        <button
          type="button"
          onClick={() => setTool('uploads')}
          className={cn(
            FLOATING,
            'absolute bottom-3 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-2 text-xs text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-[0.97]'
          )}
        >
          <ImagePlus className="size-3.5" />
          Drop an image here to print it
        </button>
      )}

      <div
        aria-hidden
        className={cn(
          'absolute inset-2 flex items-center justify-center rounded-xl border-2 border-dashed border-foreground/40 bg-background/60 text-sm font-medium text-foreground backdrop-blur-sm transition-opacity duration-150 ease-out',
          dropping ? 'opacity-100' : 'opacity-0'
        )}
      >
        Drop to print on the garment
      </div>
    </div>
  )
}
