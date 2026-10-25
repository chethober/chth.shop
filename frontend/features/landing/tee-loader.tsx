'use client'

import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'

/**
 * Preloader shown where the tee will appear: a large mono counter that counts up to
 * `progress` and a hairline that fills with it. Downloads report progress in jumps,
 * so both ease toward the latest value instead of snapping.
 */
export function TeeLoader({ progress }: { progress: number }) {
  const reduceMotion = useReducedMotion()
  const shown = useMotionValue(0)
  const counter = useTransform(shown, (v) => String(Math.round(v)).padStart(3, '0'))
  const fill = useTransform(shown, (v) => `scaleX(${v / 100})`)

  useEffect(() => {
    if (reduceMotion) {
      shown.set(progress)
      return
    }
    const controls = animate(shown, progress, { duration: 0.6, ease: [0.23, 1, 0.32, 1] })
    return () => controls.stop()
  }, [progress, reduceMotion, shown])

  return (
    <div role="status" className="flex w-40 flex-col gap-2 font-mono text-muted-foreground">
      <div className="flex items-baseline justify-between">
        <span className="text-xs lowercase">loading tee</span>
        <span className="text-3xl font-medium tabular-nums tracking-tight text-foreground">
          <motion.span>{counter}</motion.span>
          <span className="text-muted-foreground">%</span>
        </span>
      </div>
      <div className="h-px w-full bg-border">
        <motion.div className="h-full origin-left bg-foreground" style={{ transform: fill }} />
      </div>
    </div>
  )
}
