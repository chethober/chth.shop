'use client'

import { cn } from '@/lib/utils'

/**
 * Full-height landing section. The floating tee takes the other half of the screen:
 * on desktop it sits beside the text (`align` says which side the text is on),
 * on mobile it floats above, so the text is pushed to the lower part of the screen
 * and sits on a fade that lets the tee's hem dissolve behind it.
 *
 * Only the hero moves: its blocks enter once on load (a CSS animation, so the text is there even if
 * a script fails, and it rests under reduced motion). The other sections are simply on the page;
 * nothing fades in as it is scrolled to. `edge` renders along the bottom of the section.
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
  const enters = id === 'hero'
  return (
    <section
      id={id}
      className="relative flex min-h-svh snap-start snap-always items-end px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[38svh] sm:px-6 lg:items-center lg:py-28"
    >
      <div className="mx-auto grid w-full max-w-5xl lg:grid-cols-12">
        <div
          className={cn(
            'relative space-y-5 sm:space-y-7 lg:col-span-5',
            // Mobile: a soft fade behind the text instead of a hard card edge across the tee.
            'before:pointer-events-none before:absolute before:-inset-x-4 before:-bottom-6 before:-top-16 before:-z-10 before:bg-[linear-gradient(to_bottom,transparent,hsl(var(--background)/0.92)_2.5rem,hsl(var(--background))_5rem)] sm:before:-inset-x-6 lg:before:hidden',
            align === 'right' && 'lg:col-start-8',
            enters && ENTER
          )}
        >
          {children}
        </div>
      </div>
      {edge}
    </section>
  )
}

/** The hero's entrance: each block rises in once on load, one after another. */
const ENTER = cn(
  '[&>*]:motion-safe:animate-in [&>*]:motion-safe:fade-in [&>*]:motion-safe:slide-in-from-bottom-3 [&>*]:motion-safe:fill-mode-both [&>*]:motion-safe:duration-700',
  '[&>*:nth-child(2)]:delay-75 [&>*:nth-child(3)]:delay-150 [&>*:nth-child(4)]:delay-200 [&>*:nth-child(5)]:delay-300 [&>*:nth-child(6)]:delay-500'
)

/** One block of a section's text. */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
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
