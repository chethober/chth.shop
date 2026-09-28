import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

/** Standard page width, spacing below the fixed site header, and dotted backdrop. */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="relative flex w-full flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px] opacity-25"
      />
      <div
        className={cn(
          'mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
