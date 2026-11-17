'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CREATOR_BENEFITS, ROYALTY_PERCENT, SECTION_LABELS } from '../content'
import { DropSlots } from '../drop-slots'
import { LandingSection, Reveal, SectionIndex, SectionTitle } from '../section-parts'

/** The royalty, set large. */
function RoyaltyFigure() {
  return (
    <p className="flex items-baseline gap-3">
      <span className="text-[2.5rem] font-bold leading-none tracking-[-0.04em] tabular-nums text-foreground sm:text-5xl">
        {ROYALTY_PERCENT}%
      </span>
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
          Put your art or your brand on tees, hoodies, mugs and caps and sell them from your own store. No inventory, no upfront cost, crypto payouts.
        </p>
      </Reveal>

      <Reveal>
        <RoyaltyFigure />
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
            Open your store
            <ArrowRight className="transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
          </Link>
        </Button>
      </Reveal>
    </LandingSection>
  )
}
