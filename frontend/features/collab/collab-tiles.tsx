'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, DoorOpen, Package, ShieldCheck, Upload, Wallet, type LucideIcon } from 'lucide-react'
import Wheel from '@/components/custom/wheel'
import { cn } from '@/lib/utils'
import { EASE_OUT } from './bento-tile'

const EARNINGS_PER_SALE = 20

/** Drag the wheel, see the monthly payout. */
export function EarningsTile() {
  const [monthlySales, setMonthlySales] = useState(25)
  const earnings = Math.round(monthlySales) * EARNINGS_PER_SALE

  return (
    <div className="flex h-full flex-col items-center justify-between gap-4">
      <p className="self-start text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Your monthly payout
      </p>
      <Wheel
        value={monthlySales}
        onChange={setMonthlySales}
        formatValue={(value) => Math.round(value)}
        label="Sales / mo"
        size={200}
      />
      <p className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tabular-nums tracking-tight text-brand sm:text-5xl">
          ${earnings.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">/mo</span>
      </p>
    </div>
  )
}

const WE_COVER = ['Blanks', 'Printing', 'QA', 'Packaging', 'Shipping', 'Support']

/** Tap either side of a sale to see who gets what. */
export function SplitTile() {
  const [side, setSide] = useState<'you' | 'us'>('you')

  return (
    <div className="flex h-full flex-col gap-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Every sale</p>

      <div role="tablist" aria-label="Sale split" className="flex h-12 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            { id: 'you', label: 'You · 25%', grow: 'flex-1' },
            { id: 'us', label: 'CHTH', grow: 'flex-[3]' },
          ] as const
        ).map(({ id, label, grow }) => (
          <button
            key={id}
            role="tab"
            aria-selected={side === id}
            onClick={() => setSide(id)}
            className={cn(
              'relative min-w-0 cursor-pointer whitespace-nowrap rounded-lg text-xs font-bold transition-[transform,color] duration-150 ease-out active:scale-[0.97]',
              grow,
              side !== id && 'text-muted-foreground hover:text-foreground'
            )}
          >
            {side === id && (
              <motion.span
                layoutId="split-active"
                transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
                className={cn('absolute inset-0 rounded-lg', id === 'you' ? 'bg-brand' : 'bg-foreground')}
              />
            )}
            <span className={cn('relative', side === id && (id === 'you' ? 'text-white' : 'text-background'))}>{label}</span>
          </button>
        ))}
      </div>

      <div className="relative min-h-16">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={side}
            initial={{ opacity: 0, filter: 'blur(2px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(2px)' }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            {side === 'you' ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wallet className="size-4 text-brand" />
                Paid monthly · Bank, Stripe or crypto
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {WE_COVER.map((item) => (
                  <li key={item} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

interface FactTileProps {
  icon: LucideIcon
  value: string
  label: string
  detail: string
}

/** A single number; tap to flip to the one-line detail behind it. */
export function FactTile({ icon: Icon, value, label, detail }: FactTileProps) {
  const [open, setOpen] = useState(false)

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      className="group flex h-full min-h-32 w-full cursor-pointer flex-col justify-between gap-3 text-left transition-transform duration-150 ease-out active:scale-[0.97]"
    >
      <span className="flex w-full items-center justify-between">
        <Icon className="size-4 text-brand" />
        <span
          aria-hidden
          className={cn(
            'text-base leading-none text-muted-foreground transition-transform duration-200 ease-out',
            open && 'rotate-45'
          )}
        >
          +
        </span>
      </span>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={open ? 'detail' : 'value'}
          initial={{ opacity: 0, filter: 'blur(2px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(2px)' }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="block"
        >
          {open ? (
            <span className="block text-xs font-medium leading-snug text-foreground">{detail}</span>
          ) : (
            <>
              <span className="block text-3xl font-extrabold tracking-tight text-foreground">{value}</span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export const FACTS: FactTileProps[] = [
  { icon: Banknote, value: '$0', label: 'Upfront', detail: 'No setup, stock or tooling fees. Ever.' },
  { icon: ShieldCheck, value: '100%', label: 'Your IP', detail: 'Non-exclusive license. You keep every right.' },
  { icon: DoorOpen, value: '14d', label: 'To leave', detail: 'Exit anytime with 14 days notice. Royalties still paid.' },
  { icon: Package, value: '0', label: 'Inventory', detail: 'Made on demand and shipped worldwide by us.' },
]

const STEPS: { icon: LucideIcon; label: string }[] = [
  { icon: Upload, label: 'Upload' },
  { icon: Package, label: 'We make & ship' },
  { icon: Wallet, label: 'You earn' },
]

export function StepsTile() {
  return (
    <ol className="flex h-full items-center justify-between gap-2">
      {STEPS.map(({ icon: Icon, label }, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Icon className="size-4 text-brand" />
            </span>
            <span className="text-[11px] font-semibold text-foreground">{label}</span>
          </span>
          {i < STEPS.length - 1 && <span aria-hidden className="mb-6 h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  )
}
