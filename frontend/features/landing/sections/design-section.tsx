'use client'

import { ArrowRight, Palette } from 'lucide-react'
import { Eyebrow } from '@/components/shared/eyebrow'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { COLORWAYS, DESIGN_STEPS, type Colorway } from '../content'
import { LandingSection, SectionTitle } from '../section-parts'
import { useT } from '@/lib/i18n'

interface DesignSectionProps {
  colorway: Colorway
  onColorwayChange: (colorway: Colorway) => void
  onOpenStudio: () => void
}

export function DesignSection({ colorway, onColorwayChange, onOpenStudio }: DesignSectionProps) {
  const t = useT()
  return (
    <LandingSection id="design" align="left">
      <Eyebrow icon={Palette}>{t("Design studio")}</Eyebrow>
      <SectionTitle accent={t('yours.')}>{t("Make it")}</SectionTitle>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">{t("Try a colorway")}</span>
          <span className="font-bold text-foreground">{t(colorway.name)}</span>
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Tee colorway")}>
          {COLORWAYS.map((option) => {
            const selected = option.hex === colorway.hex
            return (
              <button
                key={option.hex}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={t(option.name)}
                title={t(option.name)}
                onClick={() => onColorwayChange(option)}
                className={cn(
                  'size-9 cursor-pointer rounded-full border border-black/20 shadow-xs transition-transform hover:scale-110',
                  selected && 'scale-110 ring-2 ring-brand ring-offset-2 ring-offset-background'
                )}
                style={{ backgroundColor: option.hex }}
              />
            )
          })}
        </div>
      </div>

      <ol className="space-y-3">
        {DESIGN_STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-[11px] font-bold text-brand">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">{t(step.title)}</h3>
              <p className="text-xs text-muted-foreground">{t(step.description)}</p>
            </div>
          </li>
        ))}
      </ol>

      <Button size="lg" onClick={onOpenStudio} className="group shadow-xl shadow-brand/20">
        {t("Open design studio")}
        <ArrowRight className="transition-transform group-hover:translate-x-1" />
      </Button>
    </LandingSection>
  )
}
