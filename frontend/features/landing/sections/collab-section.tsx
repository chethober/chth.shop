import Link from 'next/link'
import { ArrowRight, CheckCircle2, Users } from 'lucide-react'
import { Eyebrow } from '@/components/shared/eyebrow'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CREATOR_BENEFITS, CREATOR_STATS } from '../content'
import { LandingSection, SectionTitle, glassCard } from '../section-parts'

export function CollabSection() {
  return (
    <LandingSection id="collab" align="right">
      <Eyebrow icon={Users}>For artists & merchants</Eyebrow>
      <SectionTitle accent="Our production.">Your art.</SectionTitle>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
        Put your art or your brand on tees, hoodies, mugs and caps and sell them from your own store. No inventory, no upfront cost, crypto payouts.
      </p>

      <ul className="space-y-2.5">
        {CREATOR_BENEFITS.map((benefit) => (
          <li key={benefit.title} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-bold text-foreground">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-3 gap-2.5">
        {CREATOR_STATS.map((stat) => (
          <div key={stat.label} className={cn(glassCard, 'p-3')}>
            <dd className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</dd>
            <dt className="mt-0.5 text-[11px] text-muted-foreground">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <Button asChild size="lg" className="group">
        <Link href="/collab">
          Open your store
          <ArrowRight className="transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </LandingSection>
  )
}
