import { Palette } from 'lucide-react'
import { FieldLabel, PanelShell, SwatchGrid } from './panel-shell'

export function ColorPanel({
  color,
  onColorChange,
  onClose,
  colors,
  title = 'Product color',
}: {
  colors?: string[]
  title?: string
  color: string
  onColorChange: (color: string) => void
  onClose: () => void
}) {
  return (
    <PanelShell title={title} icon={Palette} onClose={onClose}>
      <div className="space-y-2">
        <FieldLabel aside={color}>Available colors</FieldLabel>
        {colors && colors.length === 0 ? (
          <p className="text-xs text-muted-foreground">The seller fixed the color of this product.</p>
        ) : (
          <SwatchGrid value={color} onChange={onColorChange} colors={colors} />
        )}
      </div>
    </PanelShell>
  )
}
