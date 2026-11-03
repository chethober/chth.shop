'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, DollarSign, Percent, ShieldCheck, TrendingUp, type LucideIcon } from 'lucide-react'
import Wheel from '@/components/custom/wheel'
import { Eyebrow } from '@/components/shared/eyebrow'
import { Card } from '@/components/ui/card'

/** A $29 tee on a $12 blank leaves a $17 margin; the seller keeps 75%. */
const EARNINGS_PER_SALE = 12.75

const STATS: { label: string; value: string; caption: string; icon: LucideIcon }[] = [
  { label: 'Your margin', value: '75%', caption: 'Of every sale above production cost', icon: Percent },
  { label: 'Upfront', value: '$0', caption: 'Zero setup, stocking, or tooling fees', icon: DollarSign },
  { label: 'Ownership', value: '100%', caption: 'You retain all copyrights and IP', icon: ShieldCheck },
  { label: 'Fulfillment', value: '24/7', caption: 'Worldwide on-demand dispatch', icon: Clock },
]

export function EconomicsCard() {
  const [monthlySales, setMonthlySales] = useState(25)
  const estimatedEarnings = Math.round(Math.round(monthlySales) * EARNINGS_PER_SALE)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-6"
    >
      <Card className="flex h-full flex-col justify-between gap-5 p-5 sm:p-6 lg:p-7">
        <div className="space-y-3">
          <Eyebrow pulse>Collab economics</Eyebrow>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Transparent <span className="font-serif font-light italic text-foreground/90">economics</span>
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Artists and merchants alike: zero inventory risk. We print, fulfill, and ship worldwide, buyers pay in
            crypto, and you receive monthly crypto payouts.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ label, value, caption, icon: Icon }) => (
            <div key={label} className="group rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted">
              <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
                <Icon className="size-3.5 text-brand transition-transform group-hover:scale-110" />
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>
            </div>
          ))}
        </div>

        {/* Royalty simulator */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-muted/40 p-4 sm:gap-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold leading-tight text-foreground sm:text-sm">
            <TrendingUp className="size-3.5 shrink-0 text-brand" />
            Estimated monthly earnings
          </p>
          <Wheel
            value={monthlySales}
            onChange={setMonthlySales}
            unit=""
            formatValue={(value) => Math.round(value)}
            label="Monthly sales"
            size={140}
          />
          <p className="flex items-baseline justify-end gap-1 text-right">
            <span className="text-base font-extrabold tabular-nums tracking-tight text-brand sm:text-lg lg:text-xl">
              ${estimatedEarnings.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">/mo</span>
          </p>
        </div>
      </Card>
    </motion.div>
  )
}
