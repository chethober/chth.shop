'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Users } from 'lucide-react'
import { Eyebrow } from '@/components/shared/eyebrow'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CREATOR_BENEFITS, CREATOR_STATS } from '../content'
import { LandingSection, SectionTitle, glassCard } from '../section-parts'
import { useT } from '@/lib/i18n'

export function CollabSection() {
  const t = useT()
  return (
    <LandingSection id="collab" align="right">
      <Eyebrow icon={Users}>{t("For artists")}</Eyebrow>
      <SectionTitle accent={t('Our production.')}>{t("Your art.")}</SectionTitle>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
        {t("Put your work on the back of a premium tee and sell it from your own store. No inventory, no upfront cost.")}
      </p>

      <ul className="space-y-2.5">
        {CREATOR_BENEFITS.map((benefit) => (
          <li key={benefit.title} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-bold text-foreground">{t(benefit.title)}</h3>
              <p className="text-xs text-muted-foreground">{t(benefit.description)}</p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-3 gap-2.5">
        {CREATOR_STATS.map((stat) => (
          <div key={stat.label} className={cn(glassCard, 'p-3')}>
            <dd className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</dd>
            <dt className="mt-0.5 text-[11px] text-muted-foreground">{t(stat.label)}</dt>
          </div>
        ))}
      </dl>

      <Button asChild size="lg" className="group">
        <Link href="/collab">
          {t("Join as an artist")}
          <ArrowRight className="transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </LandingSection>
  )
}
