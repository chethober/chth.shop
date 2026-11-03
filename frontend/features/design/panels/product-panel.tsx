'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FABRICS, GARMENTS, getGarment } from '../constants'
import { useStudio } from '../store'
import { PanelShell, Section } from './controls'

export function ProductPanel() {
  const garmentId = useStudio((state) => state.doc.garmentId)
  const fabric = useStudio((state) => state.doc.fabric)
  const setGarment = useStudio((state) => state.setGarment)
  const setFabric = useStudio((state) => state.setFabric)
  const hasFabric = getGarment(garmentId).fabric

  return (
    <PanelShell title="Product" description="Pick the base product and, for apparel, what it's made of.">
      <Section title="Product">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Product">
          {GARMENTS.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={garmentId === id}
              onClick={() => setGarment(id)}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.97]',
                garmentId === id ? 'border-foreground bg-muted text-foreground' : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="text-center leading-tight">{name}</span>
            </button>
          ))}
        </div>
      </Section>

      {hasFabric && (
        <Section title="Fabric">
          <div className="space-y-1.5" role="radiogroup" aria-label="Fabric">
            {FABRICS.map(({ id, name, description }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={fabric === id}
                onClick={() => setFabric(id)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color] duration-150 ease-out',
                  fabric === id ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/30'
                )}
              >
                <span>
                  <span className="block text-xs font-semibold text-foreground">{name}</span>
                  <span className="block text-[11px] text-muted-foreground">{description}</span>
                </span>
                {fabric === id && <Check className="size-4 shrink-0 text-foreground" />}
              </button>
            ))}
          </div>
        </Section>
      )}
    </PanelShell>
  )
}
