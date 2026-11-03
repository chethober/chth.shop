'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HERO_SPECS, SECTION_LABELS } from '../content'
import { LandingSection, Reveal, SectionIndex, SectionTitle } from '../section-parts'

export function HeroSection({ onDesign, onMeetArtists }: { onDesign: () => void; onMeetArtists: () => void }) {
  return (
    <LandingSection id="hero" align="left">
      <Reveal>
        <SectionIndex index={1}>{SECTION_LABELS.hero}</SectionIndex>
      </Reveal>

      <Reveal>
        <SectionTitle as="h1" className="sm:text-6xl xl:text-7xl">
          Merch without compromise.
        </SectionTitle>
      </Reveal>

      <Reveal>
        <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Tees, hoodies, mugs, caps and more, designed by you or by independent artists and merchants. Paid in crypto, made only when someone orders one.
        </p>
      </Reveal>

      <Reveal className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
        <Button size="lg" onClick={onDesign} className="group">
          Design yours
          <ArrowRight className="transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
        </Button>
        <Button size="lg" variant="outline" onClick={onMeetArtists} className="bg-background/60 backdrop-blur-md">
          Sell with us
        </Button>
      </Reveal>

      <Reveal>
        <p className="font-mono text-xs lowercase text-muted-foreground">{HERO_SPECS.join(' · ')}</p>
      </Reveal>
    </LandingSection>
  )
}
