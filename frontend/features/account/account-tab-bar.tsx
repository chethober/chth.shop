'use client'

import { cn } from '@/lib/utils'
import { ACCOUNT_TABS, type AccountTab } from './account-tabs'

interface AccountTabBarProps {
  activeTab: AccountTab
  onChange: (tab: AccountTab) => void
  /** Small counts on a tab's icon (open orders, products). */
  counts: Partial<Record<AccountTab, number>>
}

/**
 * The CHTH kit's tab bar (chth-kit/brand.css `.chth-tabs`, driven by the kit's shell script):
 * liquid glass docked at the bottom, a highlight that slides to the current section, labels that
 * fold away while the page scrolls down, and finger scrubbing across the tabs.
 */
export function AccountTabBar({ activeTab, onChange, counts }: AccountTabBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <nav
        aria-label="Account sections"
        data-chth-tabs
        className="chth-tabs pointer-events-auto relative w-full max-w-md text-foreground"
      >
        {ACCOUNT_TABS.map(({ id, label, icon: Icon }) => {
          const active = id === activeTab
          const count = counts[id]
          return (
            <button
              key={id}
              type="button"
              data-chth-tab
              aria-current={active ? 'page' : undefined}
              onClick={() => onChange(id)}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="relative">
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {count ? (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold tabular-nums text-background">
                    {count}
                  </span>
                ) : null}
              </span>
              <span className="chth-tabs__label text-[11px] font-semibold leading-none">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
