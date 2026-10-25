'use client'

import {
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  Copy,
  Eye,
  EyeOff,
  FlipHorizontal2,
  Italic,
  Lock,
  LockOpen,
  MousePointerClick,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  POSITION_RANGE,
  SIZE_RANGE,
  getFabric,
  getGarment,
  type DesignLayer,
  type PrintSide,
} from '../constants'
import { surfacePoint } from '../scene-bridge'
import { useSelectedLayer, useStudio } from '../store'
import { ColorField, FieldLabel, IconButton, Section, Segmented, Slider, useModKey } from './controls'
import { FontPicker } from './text-panel'

const degrees = (radians: number) => `${Math.round((radians * 180) / Math.PI)}°`

function LayerInspector({ layer }: { layer: DesignLayer }) {
  const garmentId = useStudio((state) => state.doc.garmentId)
  const layerCount = useStudio((state) => state.doc.layers.length)
  const index = useStudio((state) => state.doc.layers.findIndex((l) => l.id === layer.id))
  const { updateLayer, placeLayer, removeLayer, duplicateLayer, reorderLayer } = useStudio.getState()
  const garment = getGarment(garmentId)

  const update = (changes: Partial<DesignLayer>, key?: string) => updateLayer(layer.id, changes, key && `${key}:${layer.id}`)

  // Horizontal reads left-to-right as seen from the side the print is on.
  const mirror = layer.side === 'back' ? -1 : 1
  const move = (x: number, y: number, key: string) =>
    update({ position: surfacePoint(x, y, layer.side, layer.position[2]) }, key)
  const setSide = (side: PrintSide) => {
    if (side === layer.side) return
    const [x, y] = layer.position
    update({ side, position: surfacePoint(-x, y, side, Math.abs(garment.chestPosition[2])) })
  }

  const locked = layer.locked

  return (
    <div className="space-y-5 p-4">
      <div className="space-y-1">
        <FieldLabel aside={<span className="capitalize text-muted-foreground">{layer.type}</span>}>Selected layer</FieldLabel>
        <input
          value={layer.name}
          onChange={(event) => update({ name: event.target.value }, 'name')}
          aria-label="Layer name"
          className="-mx-1.5 h-8 w-[calc(100%+0.75rem)] rounded-md border border-transparent bg-transparent px-1.5 text-sm font-semibold text-foreground outline-none hover:border-border focus-visible:border-input focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {layer.type === 'text' && (
        <Section title="Text">
          <div className="flex gap-2">
            <input
              value={layer.content}
              onChange={(event) => update({ content: event.target.value }, 'content')}
              aria-label="Text content"
              maxLength={60}
              className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <IconButton icon={Bold} label="Bold" active={layer.bold} onClick={() => update({ bold: !layer.bold })} className="size-9 border border-border" />
            <IconButton icon={Italic} label="Italic" active={layer.italic} onClick={() => update({ italic: !layer.italic })} className="size-9 border border-border" />
          </div>
          <FontPicker value={layer.font} onChange={(font) => update({ font })} />
          <ColorField value={layer.color ?? '#000000'} onChange={(color, live) => update({ color }, live ? 'text-color' : undefined)} />
          <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Outline</span>
            <span className="flex items-center gap-2">
              {layer.outline && (
                <span className="relative size-6 overflow-hidden rounded border border-border" style={{ backgroundColor: layer.outline }}>
                  <input
                    type="color"
                    value={layer.outline}
                    onChange={(event) => update({ outline: event.target.value }, 'outline')}
                    aria-label="Outline colour"
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </span>
              )}
              <input
                type="checkbox"
                checked={Boolean(layer.outline)}
                onChange={(event) => update({ outline: event.target.checked ? '#FFFFFF' : null })}
                className="size-4 cursor-pointer accent-foreground"
              />
            </span>
          </label>
        </Section>
      )}

      <Section title="Placement">
        <Segmented
          label="Print side"
          value={layer.side}
          onChange={setSide}
          options={[
            { id: 'front', label: 'Front' },
            { id: 'back', label: 'Back' },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {garment.placements
            .filter((placement) => placement.side === layer.side)
            .map((placement) => (
              <button
                key={placement.id}
                type="button"
                disabled={locked}
                onClick={() => placeLayer(layer.id, placement)}
                className="cursor-pointer rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {placement.label}
              </button>
            ))}
        </div>
      </Section>

      <Section title="Transform" aside={locked ? <span className="text-muted-foreground">Locked</span> : undefined}>
        <Slider
          label="Horizontal"
          value={layer.position[0] * mirror}
          min={POSITION_RANGE.min}
          max={POSITION_RANGE.max}
          step={0.005}
          disabled={locked}
          onChange={(x) => move(x * mirror, layer.position[1], 'x')}
        />
        <Slider
          label="Vertical"
          value={layer.position[1]}
          min={garment.id === 'pants' ? -0.6 : POSITION_RANGE.min}
          max={POSITION_RANGE.max}
          step={0.005}
          disabled={locked}
          onChange={(y) => move(layer.position[0], y, 'y')}
        />
        <Slider
          label="Size"
          value={layer.size}
          min={SIZE_RANGE.min}
          max={SIZE_RANGE.max}
          step={0.005}
          disabled={locked}
          format={(value) => `${Math.round(value * 100)}`}
          onChange={(size) => update({ size }, 'size')}
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Slider
              label="Rotation"
              value={layer.rotation}
              min={-Math.PI}
              max={Math.PI}
              step={Math.PI / 180}
              disabled={locked}
              format={degrees}
              onChange={(rotation) => update({ rotation: Math.abs(rotation) < 0.04 ? 0 : rotation }, 'rotation')}
            />
          </div>
          <IconButton icon={RotateCcw} label="Reset rotation" disabled={locked || layer.rotation === 0} onClick={() => update({ rotation: 0 })} />
        </div>
        <Slider
          label="Opacity"
          value={layer.opacity}
          min={0.1}
          max={1}
          step={0.01}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(opacity) => update({ opacity }, 'opacity')}
        />
      </Section>

      <Section title="Arrange">
        <div className="flex flex-wrap gap-1">
          <IconButton icon={ArrowUpToLine} label="Bring forward" disabled={index === layerCount - 1} onClick={() => reorderLayer(layer.id, 1)} />
          <IconButton icon={ArrowDownToLine} label="Send backward" disabled={index === 0} onClick={() => reorderLayer(layer.id, -1)} />
          <IconButton icon={FlipHorizontal2} label="Flip horizontally" active={layer.flipX} onClick={() => update({ flipX: !layer.flipX })} />
          <IconButton icon={layer.locked ? Lock : LockOpen} label={layer.locked ? 'Unlock' : 'Lock position'} active={layer.locked} onClick={() => update({ locked: !layer.locked })} />
          <IconButton icon={layer.visible ? Eye : EyeOff} label={layer.visible ? 'Hide' : 'Show'} active={!layer.visible} onClick={() => update({ visible: !layer.visible })} />
          <IconButton icon={Copy} label="Duplicate" onClick={() => duplicateLayer(layer.id)} />
          <IconButton icon={Trash2} label="Delete layer" onClick={() => removeLayer(layer.id)} className="ml-auto hover:bg-destructive/10 hover:text-destructive" />
        </div>
      </Section>
    </div>
  )
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex gap-1">
        {keys.map((key) => (
          <kbd key={key} className="min-w-5 rounded border border-border bg-muted px-1 py-0.5 text-center text-[11px] leading-none text-foreground">
            {key}
          </kbd>
        ))}
      </span>
    </li>
  )
}

function DesignSummary() {
  const doc = useStudio((state) => state.doc)
  const mod = useModKey()
  const garment = getGarment(doc.garmentId)
  const front = doc.layers.filter((layer) => layer.side === 'front').length
  const back = doc.layers.length - front

  const rows: [string, React.ReactNode][] = [
    ['Garment', garment.name],
    ['Fabric', getFabric(doc.fabric).name],
    [
      'Color',
      <span key="color" className="flex items-center gap-1.5">
        <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: doc.color }} />
        <span className="font-mono">{doc.color}</span>
      </span>,
    ],
    ['Prints', `${front} front · ${back} back`],
  ]

  return (
    <div className="space-y-6 p-4">
      <Section title="Design">
        <dl className="divide-y divide-border rounded-lg border border-border">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <div className="flex gap-3 rounded-lg bg-muted/60 p-3">
        <MousePointerClick className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {doc.layers.length > 0
            ? 'Click a print on the garment to edit it here, or drag it to move it across the fabric.'
            : 'Add artwork or text from the tools panel. It lands on the chest; drag it anywhere from there.'}
        </p>
      </div>

      {/* Touch screens have no keyboard to speak of. */}
      <div className="[@media(pointer:coarse)]:hidden">
        <Section title="Shortcuts">
          <ul className="space-y-2">
            <Shortcut keys={[mod, 'Z']} label="Undo" />
            <Shortcut keys={[mod, '⇧', 'Z']} label="Redo" />
            <Shortcut keys={[mod, 'D']} label="Duplicate" />
            <Shortcut keys={[mod, 'S']} label="Save draft" />
            <Shortcut keys={['⌫']} label="Delete layer" />
            <Shortcut keys={['←', '→', '↑', '↓']} label="Nudge (⇧ for more)" />
            <Shortcut keys={['[', ']']} label="Rotate" />
            <Shortcut keys={['F', 'B']} label="Front / back view" />
            <Shortcut keys={['Esc']} label="Deselect" />
          </ul>
        </Section>
      </div>
    </div>
  )
}

export function Inspector() {
  const layer = useSelectedLayer()
  return layer ? <LayerInspector key={layer.id} layer={layer} /> : <DesignSummary />
}
