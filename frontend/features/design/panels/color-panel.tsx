'use client'

import { useStudio } from '../store'
import { ColorField, PanelShell, Section } from './controls'

export function ColorPanel() {
  const color = useStudio((state) => state.doc.color)
  const setColor = useStudio((state) => state.setColor)

  return (
    <PanelShell title="Color" description="The garment's base dye.">
      <Section title="Garment color" aside={color}>
        {/* The picker fires continuously while dragging; those changes undo as one step. */}
        <ColorField value={color} onChange={(value, live) => setColor(value, live ? 'color-picker' : undefined)} />
      </Section>
    </PanelShell>
  )
}
