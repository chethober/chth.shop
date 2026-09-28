import { Sparkles } from 'lucide-react'

/** Full-screen progress overlay shown while warping into the design studio. */
export function StudioLaunchOverlay({ progress }: { progress: number }) {
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-md space-y-6 px-6 text-center">
        <span className="inline-flex animate-pulse items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs uppercase tracking-widest text-brand">
          <Sparkles className="size-3.5" />
          Launching 3D design studio
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Entering studio viewport</h2>
        <p className="text-sm text-muted-foreground">Calibrating WebGL shader pipelines and camera rigs…</p>
        <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-secondary/60">
          <div className="h-full bg-brand transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <span className="block text-xs text-muted-foreground">{progress}% loaded</span>
      </div>
    </div>
  )
}
