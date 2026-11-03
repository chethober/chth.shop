'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/shared/eyebrow'
import { Button } from '@/components/ui/button'
import { HERO_SPECS } from '../content'
import { LandingSection, SectionTitle } from '../section-parts'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
})

export function HeroSection({ onDesign, onMeetArtists }: { onDesign: () => void; onMeetArtists: () => void }) {
  return (
    <LandingSection id="hero" align="left">
      <motion.div {...fadeUp(0)}>
        <Eyebrow pulse>Custom apparel in real-time 3D</Eyebrow>
      </motion.div>

      <motion.div {...fadeUp(0.1)}>
        <SectionTitle as="h1" accent="compromise." className="sm:text-6xl xl:text-7xl">
          Merch without
        </SectionTitle>
      </motion.div>

      <motion.p {...fadeUp(0.2)} className="max-w-md text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
        Tees, hoodies, mugs, caps and more, designed by you or by independent artists and merchants. Paid in crypto, made only when someone orders one.
      </motion.p>

      <motion.div {...fadeUp(0.3)} className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onDesign} className="group shadow-lg shadow-brand/10">
          Design yours
          <ArrowRight className="transition-transform group-hover:translate-x-1" />
        </Button>
        <Button size="lg" variant="outline" onClick={onMeetArtists} className="bg-card/60 backdrop-blur-md">
          Sell with us
        </Button>
      </motion.div>

      <motion.dl
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.45 }}
        className="grid max-w-md grid-cols-3 divide-x divide-border/50"
      >
        {HERO_SPECS.map(({ label, detail, icon: Icon }) => (
          <div key={label} className="px-3 first:pl-0">
            <dt className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Icon className="size-3.5 shrink-0 text-brand" />
              {label}
            </dt>
            <dd className="mt-0.5 text-[11px] text-muted-foreground">{detail}</dd>
          </div>
        ))}
      </motion.dl>
    </LandingSection>
  )
}
