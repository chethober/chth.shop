'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

/**
 * Full-height landing section. The floating tee takes the other half of the screen:
 * on desktop it sits beside the text (`align` says which side the text is on),
 * on mobile it floats above, so the text is pushed to the lower part of the screen
 * and sits on a fade that lets the tee's hem dissolve behind it.
 *
 * The text reveals block by block (see `Reveal`) the first time the section comes into view.
 * `edge` renders along the bottom of the section, full width, outside the text column.
 */
export function LandingSection({
  id,
  align,
  children,
  edge,
}: {
  id: string
  align: 'left' | 'right'
  children: React.ReactNode
  edge?: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    <section
      id={id}
      className="relative flex min-h-svh snap-start snap-always items-end px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[38svh] sm:px-6 lg:items-center lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid w-full max-w-7xl lg:grid-cols-12">
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ staggerChildren: reduceMotion ? 0 : 0.06 }}
          className={cn(
            'relative space-y-5 sm:space-y-7 lg:col-span-5',
            // Mobile: a soft fade behind the text instead of a hard card edge across the tee.
            'before:pointer-events-none before:absolute before:-inset-x-4 before:-bottom-6 before:-top-16 before:-z-10 before:bg-[linear-gradient(to_bottom,transparent,hsl(var(--background)/0.92)_2.5rem,hsl(var(--background))_5rem)] sm:before:-inset-x-6 lg:before:hidden',
            align === 'right' && 'lg:col-start-8'
          )}
        >
          {children}
        </motion.div>
      </div>
      {edge}
    </section>
  )
}

/** One block of a section's text; blocks rise in one after another. */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  const variants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(14px)' },
    shown: {
      opacity: 1,
      transform: 'translateY(0px)',
      transition: { duration: reduceMotion ? 0.2 : 0.6, ease: EASE_OUT_STRONG },
    },
  }
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  )
}

/** Mono section marker, `01 / the tee`: where this section sits in the page. */
export function SectionIndex({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs lowercase text-muted-foreground">
      <span className="text-foreground">{String(index).padStart(2, '0')}</span> / {children}
    </p>
  )
}

/** Section headline: one heavy, tightly tracked line that wraps as it needs to. */
export function SectionTitle({
  children,
  as: Tag = 'h2',
  className,
}: {
  children: React.ReactNode
  as?: 'h1' | 'h2'
  className?: string
}) {
  return (
    <Tag className={cn('text-balance text-[2.5rem] font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-5xl', className)}>
      {children}
    </Tag>
  )
}
