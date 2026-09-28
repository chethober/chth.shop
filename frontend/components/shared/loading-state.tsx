import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

/** Centered spinner with a caption, for whole-page or whole-section loading. */
export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn('flex flex-1 flex-col items-center justify-center gap-3 py-16 text-muted-foreground', className)}
    >
      <Spinner className="size-6" />
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}
