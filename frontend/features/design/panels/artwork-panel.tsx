'use client'

import { useState } from 'react'
import { ImageIcon, Plus, Shirt, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { DEFAULT_TEXT_COLOR } from '../constants'
import { FieldLabel, PanelShell, SwatchGrid } from './panel-shell'

export type ArtworkTab = 'graphic' | 'text'

interface ArtworkPanelProps {
  tab: ArtworkTab
  onTabChange: (tab: ArtworkTab) => void
  hasLogo: boolean
  onUploadLogo: (dataUrl: string) => void
  onUploadLayer: (dataUrl: string) => void
  onRemoveLogo: () => void
  onAddText: (text: string, color: string) => void
  onClose: () => void
  /** "chest logo", "front print"… */
  printAreaLabel: string
}

function readImage(event: React.ChangeEvent<HTMLInputElement>, onLoad: (dataUrl: string) => void) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => typeof reader.result === 'string' && onLoad(reader.result)
  reader.readAsDataURL(file)
}

function UploadTile({
  icon: Icon,
  title,
  hint,
  onLoad,
}: {
  icon: typeof Shirt
  title: string
  hint: string
  onLoad: (dataUrl: string) => void
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-2.5 transition-colors hover:bg-muted/50">
      <Icon className="size-4 text-brand transition-transform group-hover:scale-105" />
      <span>
        <span className="block text-[11px] font-bold text-foreground">{title}</span>
        <span className="block text-[10px] text-muted-foreground">{hint}</span>
      </span>
      <input type="file" accept="image/*" onChange={(event) => readImage(event, onLoad)} className="hidden" />
    </label>
  )
}

export function ArtworkPanel(props: ArtworkPanelProps) {
  const { tab, onTabChange, hasLogo, onRemoveLogo, onClose } = props
  const [text, setText] = useState('')
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR)

  const addText = () => {
    if (!text.trim()) return
    props.onAddText(text.trim(), textColor)
    setText('')
  }

  return (
    <PanelShell title="Artwork & typography" icon={ImageIcon} onClose={onClose}>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {(
          [
            ['graphic', 'Graphic', ImageIcon],
            ['text', 'Typography', Type],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              'flex cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all',
              tab === id ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'graphic' ? (
        <div className="space-y-3">
          <FieldLabel>Upload graphic</FieldLabel>
          <UploadTile icon={Shirt} title={`Apply as ${props.printAreaLabel}`} hint="Fixed front placement" onLoad={props.onUploadLogo} />
          <UploadTile icon={Plus} title="Add as movable layer" hint="Scale & position freely" onLoad={props.onUploadLayer} />
          {hasLogo && (
            <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
              <span className="text-muted-foreground capitalize">{props.printAreaLabel} applied</span>
              <button type="button" onClick={onRemoveLogo} className="cursor-pointer font-semibold text-destructive hover:underline">
                Remove logo
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <FieldLabel>Add text layer</FieldLabel>
          <div className="flex gap-1.5">
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addText()
                }
              }}
              placeholder="Type something cool…"
              className="h-8 min-w-0 flex-1 text-xs"
            />
            <Button size="sm" onClick={addText} disabled={!text.trim()}>
              Add
            </Button>
          </div>
          <div className="space-y-2 border-t border-border/30 pt-2">
            <FieldLabel aside={textColor}>Text color</FieldLabel>
            <SwatchGrid value={textColor} onChange={setTextColor} />
          </div>
        </div>
      )}
    </PanelShell>
  )
}
