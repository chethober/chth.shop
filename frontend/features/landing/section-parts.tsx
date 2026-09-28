import { cn } from '@/lib/utils'

/**
 * Full-height landing section. The floating tee takes the other half of the screen:
 * on desktop it sits beside the text (`align` says which side the text is on),
 * on mobile it floats above, so the text is pushed to the lower part of the screen.
 */
export function LandingSection({
  id,
  align,
  children,
}: {
  id: string
  align: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="relative flex min-h-screen items-end px-4 pb-16 pt-[46vh] sm:px-6 lg:items-center lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid w-full max-w-7xl lg:grid-cols-12">
        <div
          className={cn(
            'space-y-7 rounded-3xl bg-background/70 p-5 backdrop-blur-sm sm:p-6 lg:col-span-5 lg:bg-transparent lg:p-0 lg:backdrop-blur-none',
            align === 'right' && 'lg:col-start-8'
          )}
        >
          {children}
        </div>
      </div>
    </section>
  )
}

/** Section title with the second line set in italic serif. */
export function SectionTitle({
  children,
  accent,
  as: Tag = 'h2',
  className,
}: {
  children: React.ReactNode
  accent: string
  as?: 'h1' | 'h2'
  className?: string
}) {
  return (
    <Tag className={cn('text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl', className)}>
      {children} <br />
      <span className="font-serif font-light italic text-foreground/90">{accent}</span>
    </Tag>
  )
}

/** Translucent card that sits over the 3D scene. */
export const glassCard = 'rounded-xl border border-border/80 bg-card/60 shadow-xs backdrop-blur-md'
