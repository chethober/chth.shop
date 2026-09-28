import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EyebrowProps {
  children: React.ReactNode
  /** Icon shown before the label; a brand-coloured dot is shown when omitted. */
  icon?: LucideIcon
  pulse?: boolean
  className?: string
}

/** Small uppercase label that introduces a section. */
export function Eyebrow({ children, icon: Icon, pulse, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-md',
        className
      )}
    >
      {Icon ? (
        <Icon className="size-3.5 text-brand" />
      ) : (
        <span className={cn('size-1.5 rounded-full bg-brand', pulse && 'animate-pulse')} />
      )}
      {children}
    </span>
  )
}
