import { Palette } from 'lucide-react'
import { FieldLabel, PanelShell, SwatchGrid } from './panel-shell'

export function ColorPanel({
  color,
  onColorChange,
  onClose,
}: {
  color: string
  onColorChange: (color: string) => void
  onClose: () => void
}) {
  return (
    <PanelShell title="Garment color" icon={Palette} onClose={onClose}>
      <div className="space-y-2">
        <FieldLabel aside={color}>Curated palette</FieldLabel>
        <SwatchGrid value={color} onChange={onColorChange} />
      </div>
    </PanelShell>
  )
}
