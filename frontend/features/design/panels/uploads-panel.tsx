'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Plus, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { getGarment } from '../constants'
import { MAX_UPLOAD_MB, readImageFile } from '../files'
import { useStudio, type Asset } from '../store'
import { PanelShell, Section } from './controls'

/** Reads dropped or picked images into the asset library and prints the first one on the garment. */
export function useImageUpload() {
  const addAsset = useStudio((state) => state.addAsset)
  const addLayer = useStudio((state) => state.addLayer)

  return async (files: FileList | File[]) => {
    const list = Array.from(files)
    const results = await Promise.allSettled(list.map(readImageFile))
    let placed = false
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        toast.danger((result.reason as Error).message)
        return
      }
      const asset = addAsset({ name: list[index].name.replace(/\.[^.]+$/, ''), url: result.value })
      if (!placed) {
        addLayer({ type: 'image', name: asset.name, content: '', imageUrl: asset.url })
        placed = true
      }
    })
  }
}

export function UploadsPanel() {
  const assets = useStudio((state) => state.assets)
  const removeAsset = useStudio((state) => state.removeAsset)
  const addLayer = useStudio((state) => state.addLayer)
  const garmentId = useStudio((state) => state.doc.garmentId)
  const upload = useImageUpload()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [placementId, setPlacementId] = useState<string | null>(null)

  const placements = getGarment(garmentId).placements
  const placement = placements.find((p) => p.id === placementId) ?? placements[0]

  const place = (asset: Asset) => addLayer({ type: 'image', name: asset.name, content: '', imageUrl: asset.url }, placement)

  return (
    <PanelShell title="Uploads" description="Your artwork. Click any piece to print it again.">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setOver(false)
          void upload(event.dataTransfer.files)
        }}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.99]',
          over ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/40 hover:bg-muted/50'
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <ImagePlus className="size-5 text-foreground" />
        </span>
        <span className="text-xs font-semibold text-foreground">Drop images or click to browse</span>
        <span className="text-[11px] text-muted-foreground">PNG, JPG, SVG or WebP · up to {MAX_UPLOAD_MB} MB</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) void upload(event.target.files)
          event.target.value = ''
        }}
      />

      <Section title="Print new artwork on">
        <div className="flex flex-wrap gap-1.5">
          {placements.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={placement.id === p.id}
              onClick={() => setPlacementId(p.id)}
              className={cn(
                'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150',
                placement.id === p.id ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Library" aside={assets.length || undefined}>
        {assets.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing uploaded yet. Images you add this session collect here.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative">
                <button
                  type="button"
                  onClick={() => place(asset)}
                  title={`Print ${asset.name}`}
                  className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/50 p-1.5 transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                  <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <Plus className="size-5 text-white" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${asset.name} from library`}
                  onClick={() => removeAsset(asset.id)}
                  className="absolute -right-1.5 -top-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground [@media(hover:hover)]:opacity-0 shadow-xs transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </PanelShell>
  )
}
