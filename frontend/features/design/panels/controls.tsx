'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COLOR_PALETTE } from '../constants'

/** Header + scrollable body shared by every tool panel. */
export function PanelShell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">{children}</div>
    </div>
  )
}

export function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <FieldLabel aside={aside}>{title}</FieldLabel>
      {children}
    </section>
  )
}

export function FieldLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</span>
      {aside && <span className="font-mono text-[11px] tabular-nums text-foreground">{aside}</span>}
    </div>
  )
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
  disabled?: boolean
}

/** A labelled range input with its value read out. */
export function Slider({ label, value, min, max, step, onChange, format, disabled }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  return (
    <label className={cn('block space-y-1.5', disabled && 'opacity-50')}>
      <span className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">{format ? format(value) : value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        style={{ '--fill': `${Math.min(100, Math.max(0, percent))}%` } as React.CSSProperties}
        className="studio-range w-full"
      />
    </label>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: { id: T; label: string; icon?: LucideIcon }[]
  onChange: (value: T) => void
  className?: string
  label: string
}

export function Segmented<T extends string>({ value, options, onChange, className, label }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex rounded-lg bg-muted p-0.5', className)}>
      {options.map(({ id, label: optionLabel, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            'flex h-7 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-[color,background-color,box-shadow] duration-150 ease-out',
            value === id ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {Icon && <Icon className="size-3.5" />}
          {optionLabel}
        </button>
      ))}
    </div>
  )
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  active?: boolean
}

/** Square icon button; `label` doubles as its accessible name and tooltip. */
export function IconButton({ icon: Icon, label, active, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-muted hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-muted text-foreground',
        className
      )}
      {...props}
    >
      <Icon className="size-4" />
    </button>
  )
}

/** Palette swatches plus a free colour picker. */
export function ColorField({ value, onChange }: { value: string; onChange: (color: string, live?: boolean) => void }) {
  // What's being typed; shows `value` whenever nothing is.
  const [draft, setDraft] = useState<string | null>(null)
  const hex = draft ?? value

  const commitHex = () => {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`
    if (/^#[0-9a-f]{6}$/i.test(normalized)) onChange(normalized.toUpperCase())
    setDraft(null)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Palette">
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
                'aspect-square cursor-pointer rounded-md border border-black/10 transition-transform duration-150 ease-out active:scale-95 dark:border-white/15',
                selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-card'
              )}
              style={{ backgroundColor: swatch.value }}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <label
          className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
          style={{ backgroundColor: value }}
          title="Custom colour"
        >
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value.toUpperCase(), true)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Custom colour"
          />
        </label>
        <input
          value={hex}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitHex}
          onKeyDown={(event) => event.key === 'Enter' && commitHex()}
          spellCheck={false}
          aria-label="Hex colour"
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  )
}

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'start' | 'end'
}

/** A small dropdown that grows out of its trigger and closes on outside click or Escape. */
export function Menu({ trigger, children, align = 'end' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => !root.current?.contains(event.target as Node) && setOpen(false)
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      <div
        role="menu"
        data-open={open}
        inert={!open}
        className={cn(
          'studio-menu absolute top-full z-50 mt-1.5 w-60 rounded-xl border border-border bg-popover p-1 shadow-lg',
          align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
        )}
      >
        {children(() => setOpen(false))}
      </div>
    </div>
  )
}

export function MenuItem({
  icon: Icon,
  label,
  hint,
  onSelect,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-muted"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span>
        <span className="block text-xs font-medium text-foreground">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
    </button>
  )
}

/** The keyboard shortcut glyph for the current platform's command key. */
export function useModKey() {
  return useSyncExternalStore(
    noSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'),
    () => 'Ctrl'
  )
}

const noSubscribe = () => () => {}
