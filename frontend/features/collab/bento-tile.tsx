'use client'

import { cn } from '@/lib/utils'

export const EASE_OUT = [0.23, 1, 0.32, 1] as const

interface BentoTileProps {
  children: React.ReactNode
  /** Position in the grid; drives the entrance stagger. */
  index: number
  className?: string
}

/** One cell of the collab bento. Rises in once on load (CSS, so it shows even without scripts). */
export function BentoTile({ children, index, className }: BentoTileProps) {
  return (
    <div
      style={{ animationDelay: `${index * 50}ms` }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500',
        className
      )}
    >
      {children}
    </div>
  )
}
