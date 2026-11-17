import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  /** `card`: a tile of its own. `inset`: a muted block inside a card. */
  variant?: 'card' | 'inset'
  /** Makes the tile a button (e.g. jump to the tab behind the number). */
  onClick?: () => void
  className?: string
}

/** A labelled number: a label, the figure, an optional hint. Used by every account panel. */
export function Stat({ label, value, hint, icon: Icon, variant = 'card', onClick, className }: StatProps) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'min-w-0 text-left',
        variant === 'card' ? 'rounded-2xl border border-border bg-card p-3.5 shadow-xs sm:p-4' : 'rounded-xl bg-muted/50 p-3',
        onClick && 'cursor-pointer transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm',
        className
      )}
    >
      {/* Labels and hints wrap rather than truncate: three tiles share a phone's width. */}
      <span className="flex items-start justify-between gap-2 text-muted-foreground">
        <span className="text-label">{label}</span>
        {Icon && <Icon className="hidden size-3.5 shrink-0 sm:block" />}
      </span>
      <span className="mt-1 block truncate text-lg font-extrabold tabular-nums tracking-tight text-foreground sm:text-2xl">{value}</span>
      {hint && <span className="block text-[11px] leading-snug text-muted-foreground">{hint}</span>}
    </Comp>
  )
}
