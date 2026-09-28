'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACCOUNT_TABS, type AccountTab } from './account-tabs'

interface AccountNavProps {
  activeTab: AccountTab
  onChange: (tab: AccountTab) => void
  counts: Partial<Record<AccountTab, number>>
  onSignOut: () => void
}

type Edge = 'left' | 'right'

/** Fade + chevron shown on a side of the tab bar that has more tabs hidden beyond it. */
function OverflowIndicator({ edge, visible, onClick }: { edge: Edge; visible: boolean; onClick: () => void }) {
  const Icon = edge === 'left' ? ChevronLeft : ChevronRight
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'pointer-events-none absolute inset-y-0 z-10 flex w-12 items-center transition-opacity duration-200',
        edge === 'left' ? 'left-0 justify-start bg-gradient-to-r' : 'right-0 justify-end bg-gradient-to-l',
        'from-background via-background/80 to-transparent',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        onClick={onClick}
        aria-label={edge === 'left' ? 'Scroll tabs left' : 'Scroll tabs right'}
        className={cn(
          'flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs transition-colors hover:text-foreground',
          visible && 'pointer-events-auto'
        )}
      >
        <Icon className="size-3.5" />
      </button>
    </div>
  )
}

function CountBadge({ count, inverted }: { count?: number; inverted?: boolean }) {
  if (!count) return null
  return (
    <span
      className={cn(
        'min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold',
        inverted ? 'bg-primary-foreground/20' : 'border border-border/60 bg-muted text-foreground'
      )}
    >
      {count}
    </span>
  )
}

export function AccountNav({ activeTab, onChange, counts, onSignOut }: AccountNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState({ left: false, right: false })

  /** Records whether tabs are hidden past either edge of the scroller. */
  const measureOverflow = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const left = el.scrollLeft > 1
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setOverflow((current) => (current.left === left && current.right === right ? current : { left, right }))
  }, [])

  // Re-measure when the bar or its content changes size (rotation, count badges, …).
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const observer = new ResizeObserver(measureOverflow)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [measureOverflow])

  const scrollTabs = (edge: Edge) => {
    const el = scrollerRef.current
    if (el) el.scrollBy({ left: (edge === 'left' ? -1 : 1) * el.clientWidth * 0.7, behavior: 'smooth' })
  }

  // Keep the active pill visible in the horizontally scrolling mobile bar.
  useEffect(() => {
    const scroller = scrollerRef.current
    const active = scroller?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!scroller || !active) return
    const left = active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2
    scroller.scrollTo({ left, behavior: 'smooth' })
  }, [activeTab])

  return (
    <>
      {/* Desktop sidebar */}
      <nav aria-label="Account sections" className="sticky top-24 hidden w-60 shrink-0 flex-col gap-1 self-start lg:flex">
        {ACCOUNT_TABS.map((tab, index) => {
          const active = tab.id === activeTab
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {active && (
                <motion.span
                  layoutId="account-nav-active"
                  className="absolute inset-0 rounded-xl border border-border bg-card shadow-xs"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span
                className={cn(
                  'relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight">{tab.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{tab.description}</span>
              </span>
              <span className="relative flex items-center gap-1.5">
                <CountBadge count={counts[tab.id]} />
                <kbd className="hidden rounded border border-border px-1 font-sans text-[10px] text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100 xl:inline-block">
                  {index + 1}
                </kbd>
              </span>
            </button>
          )
        })}

        <div className="my-2 h-px bg-border" />

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <LogOut className="size-4" />
          </span>
          Sign out
        </button>

        <p className="px-3 pt-2 text-[11px] text-muted-foreground/70">
          Tip: press <kbd className="rounded border border-border px-1">1</kbd>–
          <kbd className="rounded border border-border px-1">5</kbd> to switch sections
        </p>
      </nav>

      {/* Mobile / tablet pill bar */}
      <nav
        aria-label="Account sections"
        className="sticky top-16 z-30 -mx-4 min-w-0 self-stretch border-b border-border/60 bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden"
      >
        <div className="relative">
          <OverflowIndicator edge="left" visible={overflow.left} onClick={() => scrollTabs('left')} />
          <OverflowIndicator edge="right" visible={overflow.right} onClick={() => scrollTabs('right')} />
          <div
            ref={scrollerRef}
            onScroll={measureOverflow}
            className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max gap-1">
              {ACCOUNT_TABS.map((tab) => {
                const active = tab.id === activeTab
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors',
                      active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="account-nav-active-mobile"
                        className="absolute inset-0 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <Icon className="relative size-3.5" />
                    <span className="relative">{tab.label}</span>
                    <span className="relative">
                      <CountBadge count={counts[tab.id]} inverted={active} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
