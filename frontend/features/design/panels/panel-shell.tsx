import { X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { COLOR_PALETTE } from '../constants'

/** Header + body frame shared by every studio tool panel. */
export function PanelShell({
  title,
  icon: Icon,
  onClose,
  children,
}: {
  title: string
  icon: LucideIcon
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
          <Icon className="size-3.5 text-brand" />
          {title}
        </h2>
        <Button variant="ghost" size="icon-sm" className="size-6" onClick={onClose} aria-label="Close panel">
          <X />
        </Button>
      </div>
      {children}
    </div>
  )
}

export function FieldLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{children}</span>
      {aside && <span className="text-[10px] font-semibold uppercase text-foreground">{aside}</span>}
    </div>
  )
}

/** Grid of colour swatches from the studio palette. */
export function SwatchGrid({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup">
      {COLOR_PALETTE.map((swatch) => {
        const selected = value.toUpperCase() === swatch.value.toUpperCase()
        return (
          <button
            key={swatch.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={swatch.name}
            title={swatch.name}
            onClick={() => onChange(swatch.value)}
            className={cn(
              'h-9 cursor-pointer rounded-lg border border-border shadow-xs transition-transform duration-150 hover:scale-105',
              selected && 'scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
            style={{ backgroundColor: swatch.value }}
          />
        )
      })}
    </div>
  )
}
