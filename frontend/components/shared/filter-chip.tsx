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
        'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      )}
    >
      {children}
      {count !== undefined && <span className="ml-1.5 tabular-nums opacity-70">{count}</span>}
    </button>
  )
}
