'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { AI_PROMPT_PRESETS } from '../constants'
import { useStudio } from '../store'
import { PanelShell, Section } from './controls'

/**
 * Placeholder artwork generator: draws a gradient badge with the prompt text.
 * Swap this for a real image-generation call when one is available.
 */
function renderPlaceholderArtwork(prompt: string): string {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, '#8B5CF6')
    gradient.addColorStop(0.5, '#EC4899')
    gradient.addColorStop(1, '#3B82F6')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, 120, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#18181B'
    ctx.font = "bold 36px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(prompt.slice(0, 16), size / 2, size / 2)
  }
  return canvas.toDataURL('image/png')
}

export function AiPanel() {
  const addAsset = useStudio((state) => state.addAsset)
  const addLayer = useStudio((state) => state.addLayer)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = () => {
    const text = prompt.trim()
    if (!text) return
    setIsGenerating(true)
    setTimeout(() => {
      const asset = addAsset({ name: text.slice(0, 24), url: renderPlaceholderArtwork(text) })
      addLayer({ type: 'image', name: asset.name, content: '', imageUrl: asset.url })
      setIsGenerating(false)
    }, 1200)
  }

  return (
    <PanelShell title="AI artwork" description="Describe an idea; the result lands on the garment and in Uploads.">
      <Section title="Prompt">
        <Textarea
          rows={3}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) generate()
          }}
          placeholder="e.g. cyberpunk streetwear skull, neon outlines"
          className="min-h-0 resize-none text-sm"
        />
      </Section>
      <Section title="Try">
        <div className="flex flex-col gap-1.5">
          {AI_PROMPT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPrompt(preset)}
              className="cursor-pointer rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
            >
              {preset}
            </button>
          ))}
        </div>
      </Section>
      <Button className="w-full" onClick={generate} disabled={isGenerating || !prompt.trim()}>
        {isGenerating ? <Spinner /> : <Sparkles />}
        {isGenerating ? 'Generating…' : 'Generate artwork'}
      </Button>
    </PanelShell>
  )
}
