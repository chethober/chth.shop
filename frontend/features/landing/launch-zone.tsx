'use client'

import { forwardRef } from 'react'
import { ChevronsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Space after the last section: scrolling through it fills the bar,
 * and reaching the bottom of the page opens the design studio.
 */
export const LaunchZone = forwardRef<HTMLDivElement, { progress: number }>(function LaunchZone({ progress }, ref) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100)
  const almost = percent >= 90

  return (
    <div ref={ref} className="relative flex h-[70vh] items-end justify-center px-4 pb-16">
      <div className="w-full max-w-xs space-y-3 text-center">
        <ChevronsDown className={cn('mx-auto size-5 text-brand', !almost && 'animate-bounce')} />
        <p className="text-sm font-semibold text-foreground">
          {almost ? 'Opening the design studio…' : 'Keep scrolling to open the design studio'}
        </p>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Scroll to open the design studio"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand shadow-[0_0_10px_hsl(var(--brand)/0.7)] transition-[width] duration-100 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
})
