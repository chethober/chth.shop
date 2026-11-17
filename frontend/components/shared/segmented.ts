import { cn } from '@/lib/utils'

/**
 * The one segmented control (tabs, view switches, small radio groups): a pill track with pill
 * options, the same shape as the kit's buttons and chips. Each control keeps its own semantics
 * (role="tablist", "radiogroup"); only the look is shared.
 */
export const segmented = {
  root: 'inline-flex shrink-0 rounded-full bg-muted p-1',
  item: (active: boolean) =>
    cn(
      'relative inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-sm font-semibold transition-colors',
      active ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
    ),
}

/** A quantity stepper's track: the same pill as a segmented control. */
export const stepperTrack = 'flex items-center gap-1 rounded-full bg-muted p-1'
