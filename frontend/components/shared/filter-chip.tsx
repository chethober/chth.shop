import { cn } from '@/lib/utils'

/** Pill toggle with a count, used for list filters. */
export function FilterChip({
  active,
  count,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  count?: number
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // The small button's height and shapes: filled when on, outlined when off.
        'inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
      {count !== undefined && <span className="ml-1.5 tabular-nums opacity-70">{count}</span>}
    </button>
  )
}
