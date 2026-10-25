'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CREATOR_BENEFITS, ROYALTY_PERCENT, SECTION_LABELS } from '../content'
import { DropSlots } from '../drop-slots'
import { LandingSection, Reveal, SectionIndex, SectionTitle } from '../section-parts'

/** One digit that rolls up from 0 through a column of 0–9 to its value, once it comes into view. */
function RollingDigit({ digit, delay }: { digit: number; delay: number }) {
  const reduceMotion = useReducedMotion()
  return (
    <span className="inline-block h-[1em] overflow-hidden leading-none">
      <motion.span
        className="flex flex-col"
        initial={{ transform: `translateY(${reduceMotion ? -digit * 10 : 0}%)` }}
        whileInView={{ transform: `translateY(${-digit * 10}%)` }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay, ease: [0.23, 1, 0.32, 1] }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="h-[1em]">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

/** The royalty as an odometer: each digit rolls into place, the later ones a beat behind. */
function RoyaltyOdometer() {
  return (
    <p className="flex items-baseline gap-3">
      <span aria-hidden className="flex text-6xl font-bold tracking-[-0.04em] tabular-nums text-foreground sm:text-7xl">
        {String(ROYALTY_PERCENT)
          .split('')
          .map((d, i) => (
            <RollingDigit key={i} digit={Number(d)} delay={0.3 + i * 0.12} />
          ))}
        <span className="leading-none">%</span>
      </span>
      <span className="sr-only">{ROYALTY_PERCENT}%</span>
      <span className="font-mono text-xs lowercase text-muted-foreground">of every sale goes to you</span>
    </p>
  )
}

export function CollabSection() {
  return (
    <LandingSection id="collab" align="right" edge={<DropSlots />}>
      <Reveal>
        <SectionIndex index={2}>{SECTION_LABELS.collab}</SectionIndex>
      </Reveal>
      <Reveal>
        <SectionTitle>Your art. Our production.</SectionTitle>
      </Reveal>
      <Reveal>
        <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Put your work on the back of a premium tee and sell it from your own store. No inventory, no upfront cost.
        </p>
      </Reveal>

      <Reveal>
        <RoyaltyOdometer />
      </Reveal>

      <Reveal>
        <ol className="max-w-md divide-y divide-border/60 border-y border-border/60">
          {CREATOR_BENEFITS.map((benefit, i) => (
            <li key={benefit.title} className="flex gap-4 py-2.5">
              <span className="font-mono text-xs leading-5 text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-sm font-semibold leading-5 text-foreground">{benefit.title}</h3>
                {/* Phones show the titles only, so the section fits one screen. */}
                <p className="text-xs text-muted-foreground max-sm:hidden">{benefit.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal>
        <Button asChild size="lg" className="group w-full sm:w-auto">
          <Link href="/collab">
            Join as an artist
            <ArrowRight className="transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
          </Link>
        </Button>
      </Reveal>
    </LandingSection>
  )
}
