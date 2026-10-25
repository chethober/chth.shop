'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const EASE_OUT = [0.23, 1, 0.32, 1] as const

interface BentoTileProps {
  children: React.ReactNode
  /** Position in the grid; drives the entrance stagger. */
  index: number
  className?: string
}

/** One cell of the collab bento. Enters with a short stagger, never blocks interaction. */
export function BentoTile({ children, index, className }: BentoTileProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, transform: reduceMotion ? 'none' : 'translateY(8px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay: index * 0.05 }}
      className={cn('relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs', className)}
    >
      {children}
    </motion.div>
  )
}
