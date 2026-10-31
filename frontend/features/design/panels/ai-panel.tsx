'use client'

import { useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { AI_PROMPT_PRESETS } from '../constants'
import { FieldLabel, PanelShell } from './panel-shell'
import { useT } from '@/lib/i18n'

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

export function AiPanel({ onGenerated, onClose }: { onGenerated: (dataUrl: string) => void; onClose: () => void }) {
  const t = useT()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setTimeout(() => {
      onGenerated(renderPlaceholderArtwork(prompt))
      setIsGenerating(false)
    }, 1200)
  }

  return (
    <PanelShell title={t("AI artwork generator")} icon={Bot} onClose={onClose}>
      <div className="space-y-2">
        <FieldLabel>{t("Prompt")}</FieldLabel>
        <Textarea
          rows={2}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("Describe your artwork idea (e.g. cyberpunk streetwear skull)…")}
          className="min-h-0 resize-none text-xs"
        />
        <div className="flex flex-wrap gap-1">
          {AI_PROMPT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPrompt(preset)}
              className="cursor-pointer rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
      <Button className="w-full" onClick={generate} disabled={isGenerating || !prompt.trim()}>
        {isGenerating ? <Spinner /> : <Sparkles />}
        {isGenerating ? 'Generating…' : 'Generate artwork'}
      </Button>
    </PanelShell>
  )
}
