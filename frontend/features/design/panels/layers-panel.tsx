import { Sliders, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DesignLayer } from '../constants'
import { FieldLabel, PanelShell } from './panel-shell'

function RangeInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-3 text-[9px] text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-muted-foreground/30 accent-primary"
      />
    </label>
  )
}

export function LayersPanel({
  layer,
  onChange,
  onRemove,
  onClose,
}: {
  layer: DesignLayer
  onChange: (changes: Partial<DesignLayer>) => void
  onRemove: () => void
  onClose: () => void
}) {
  const setAxis = (axis: 0 | 1, value: number) => {
    const position = [...layer.position] as DesignLayer['position']
    position[axis] = value
    onChange({ position })
  }

  return (
    <PanelShell title="Layer transforms" icon={Sliders} onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <FieldLabel>Position</FieldLabel>
          <RangeInput label="X" value={layer.position[0]} min={-0.3} max={0.3} step={0.01} onChange={(v) => setAxis(0, v)} />
          <RangeInput label="Y" value={layer.position[1]} min={-0.3} max={0.3} step={0.01} onChange={(v) => setAxis(1, v)} />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Scale</FieldLabel>
          <RangeInput label="" value={layer.scale[0]} min={0.05} max={0.4} step={0.01} onChange={(v) => onChange({ scale: [v, v, v] })} />
        </div>

        <div className="space-y-1.5">
          <FieldLabel aside={`${Math.round((layer.rotation * 180) / Math.PI)}°`}>Rotation</FieldLabel>
          <RangeInput label="" value={layer.rotation} min={0} max={Math.PI * 2} step={0.05} onChange={(v) => onChange({ rotation: v })} />
        </div>

        <Button variant="destructive-outline" size="sm" className="w-full" onClick={onRemove}>
          <Trash2 />
          Remove layer
        </Button>
      </div>
    </PanelShell>
  )
}
