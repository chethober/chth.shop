import { cn } from '@/lib/utils'

const PANE = 'rounded-2xl border border-border bg-card shadow-xs'

interface StudioShellProps {
  toolbar?: React.ReactNode
  tools?: React.ReactNode
  viewport?: React.ReactNode
  inspector?: React.ReactNode
  viewportRef?: React.Ref<HTMLDivElement>
  viewportClassName?: string
}

/**
 * The studio's dashboard layout: toolbar across the top, tools on the left, the 3D viewport in the middle and the
 * inspector on the right. On small screens the viewport comes first and the rest stacks below it.
 *
 * The landing page renders an empty copy to find where the viewport sits, so the geometry here must not depend on
 * the content passed in.
 */
export function StudioShell({ toolbar, tools, viewport, inspector, viewportRef, viewportClassName }: StudioShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-2 px-2 pb-2 pt-20 sm:px-3 sm:pt-24 lg:h-dvh">
      <header className={cn(PANE, 'relative z-20 flex h-12 shrink-0 items-center gap-2 px-2')}>{toolbar}</header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
        <section
          ref={viewportRef}
          aria-label="3D preview"
          className={cn(PANE, 'relative order-1 h-[58svh] min-h-[360px] overflow-hidden lg:order-2 lg:h-auto lg:min-w-0 lg:flex-1', viewportClassName)}
        >
          {viewport}
        </section>
        <aside className={cn(PANE, 'order-2 flex min-h-[420px] overflow-hidden max-lg:flex-col lg:order-1 lg:min-h-0 lg:w-[344px] lg:shrink-0')}>
          {tools}
        </aside>
        <aside className={cn(PANE, 'order-3 min-h-0 overflow-y-auto lg:w-[300px] lg:shrink-0')}>{inspector}</aside>
      </div>
    </div>
  )
}
