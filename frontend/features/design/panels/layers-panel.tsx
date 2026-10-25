'use client'

import { Eye, EyeOff, Layers, Lock, LockOpen, Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DesignLayer } from '../constants'
import { useStudio } from '../store'
import { IconButton, PanelShell } from './controls'

function LayerThumb({ layer }: { layer: DesignLayer }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/60">
      {layer.type === 'image' && layer.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL
        <img src={layer.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
      ) : (
        <Type className="size-4 text-muted-foreground" style={{ color: layer.color }} />
      )}
    </span>
  )
}

export function LayersPanel() {
  const layers = useStudio((state) => state.doc.layers)
  const selectedId = useStudio((state) => state.selectedId)
  const select = useStudio((state) => state.select)
  const updateLayer = useStudio((state) => state.updateLayer)
  const setTool = useStudio((state) => state.setTool)

  return (
    <PanelShell title="Layers" description="Top of the list prints on top.">
      {layers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <Layers className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No layers yet.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setTool('uploads')} className="cursor-pointer text-xs font-semibold text-foreground underline-offset-4 hover:underline">
              Upload artwork
            </button>
            <span className="text-xs text-muted-foreground">or</span>
            <button type="button" onClick={() => setTool('text')} className="cursor-pointer text-xs font-semibold text-foreground underline-offset-4 hover:underline">
              add text
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-1" aria-label="Layers">
          {[...layers].reverse().map((layer) => {
            const selected = layer.id === selectedId
            return (
              <li
                key={layer.id}
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg border p-1.5 pr-1 transition-[border-color,background-color] duration-150',
                  selected ? 'border-foreground/60 bg-muted' : 'border-transparent hover:bg-muted/60'
                )}
              >
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => select(selected ? null : layer.id)}
                  className={cn('flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left', !layer.visible && 'opacity-50')}
                >
                  <LayerThumb layer={layer} />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-foreground">{layer.name || 'Untitled'}</span>
                    <span className="block text-[11px] capitalize text-muted-foreground">
                      {layer.type} · {layer.side}
                    </span>
                  </span>
                </button>
                <IconButton
                  icon={layer.locked ? Lock : LockOpen}
                  label={layer.locked ? 'Unlock' : 'Lock'}
                  active={layer.locked}
                  onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                  className={cn('size-7', !layer.locked && '[@media(hover:hover)]:opacity-0 focus-visible:opacity-100 group-hover:opacity-100')}
                />
                <IconButton
                  icon={layer.visible ? Eye : EyeOff}
                  label={layer.visible ? 'Hide' : 'Show'}
                  onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                  className={cn('size-7', layer.visible && '[@media(hover:hover)]:opacity-0 focus-visible:opacity-100 group-hover:opacity-100')}
                />
              </li>
            )
          })}
        </ul>
      )}
    </PanelShell>
  )
}
