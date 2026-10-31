'use client'

import { Palette } from 'lucide-react'
import { FieldLabel, PanelShell, SwatchGrid } from './panel-shell'
import { useT } from '@/lib/i18n'

export function ColorPanel({
  color,
  onColorChange,
  onClose,
}: {
  color: string
  onColorChange: (color: string) => void
  onClose: () => void
}) {
  const t = useT()
  return (
    <PanelShell title={t("Garment color")} icon={Palette} onClose={onClose}>
      <div className="space-y-2">
        <FieldLabel aside={color}>{t("Curated palette")}</FieldLabel>
        <SwatchGrid value={color} onChange={onColorChange} />
      </div>
    </PanelShell>
  )
}
