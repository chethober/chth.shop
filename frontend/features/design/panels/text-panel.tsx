'use client'

import { useState } from 'react'
import { Bold, Italic, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DEFAULT_TEXT_COLOR, FONTS, getGarment } from '../constants'
import { useStudio } from '../store'
import { ColorField, IconButton, PanelShell, Section } from './controls'

export function FontPicker({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Font">
      {FONTS.map((font) => (
        <button
          key={font.id}
          type="button"
          role="radio"
          aria-checked={(value ?? 'geist') === font.id}
          onClick={() => onChange(font.id)}
          style={{ fontFamily: font.id === 'geist' ? undefined : font.family }}
          className={cn(
            'h-9 cursor-pointer truncate rounded-lg border px-2 text-sm transition-[border-color,background-color] duration-150',
            (value ?? 'geist') === font.id ? 'border-foreground bg-muted text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          {font.label}
        </button>
      ))}
    </div>
  )
}

export function TextPanel() {
  const addLayer = useStudio((state) => state.addLayer)
  const garmentId = useStudio((state) => state.doc.garmentId)
  const [content, setContent] = useState('')
  const [font, setFont] = useState('geist')
  const [color, setColor] = useState(DEFAULT_TEXT_COLOR)
  const [bold, setBold] = useState(true)
  const [italic, setItalic] = useState(false)

  const add = () => {
    const text = content.trim()
    if (!text) return
    const placement = getGarment(garmentId).placements[0]
    addLayer({ type: 'text', name: text, content: text, font, color, bold, italic, outline: null }, { ...placement, size: Math.min(placement.size * 1.35, 0.3) })
    setContent('')
  }

  return (
    <PanelShell title="Text" description="Add type, then fine-tune it in the inspector.">
      <Section title="Text">
        <div className="flex gap-2">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && add()}
            placeholder="Your words here"
            maxLength={60}
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <IconButton icon={Bold} label="Bold" active={bold} onClick={() => setBold(!bold)} className="size-9 border border-border" />
          <IconButton icon={Italic} label="Italic" active={italic} onClick={() => setItalic(!italic)} className="size-9 border border-border" />
        </div>
        {content.trim() && (
          <div
            className="truncate rounded-lg bg-muted/60 px-3 py-4 text-center text-2xl"
            style={{
              color,
              fontWeight: bold ? 800 : 500,
              fontStyle: italic ? 'italic' : undefined,
              fontFamily: font === 'geist' ? undefined : FONTS.find((f) => f.id === font)?.family,
            }}
          >
            {content}
          </div>
        )}
      </Section>

      <Section title="Font">
        <FontPicker value={font} onChange={setFont} />
      </Section>

      <Section title="Color" aside={color}>
        <ColorField value={color} onChange={setColor} />
      </Section>

      <Button className="w-full" onClick={add} disabled={!content.trim()}>
        <Type />
        Add text to garment
      </Button>
    </PanelShell>
  )
}
