'use client'

import dynamic from 'next/dynamic'
import { ArrowRight } from 'lucide-react'
import { UploadDropzone } from '@/components/custom/upload-dropzone'
import { Button } from '@/components/ui/button'
import { SECTION_LABELS, type Colorway } from '../content'
import { LandingSection, Reveal, SectionIndex, SectionTitle } from '../section-parts'

// The first palette is random, so a server render would never match the browser's. The placeholder holds its height.
const Palette = dynamic(() => import('@/components/custom/palette').then((m) => m.Palette), {
  ssr: false,
  loading: () => <div className="h-[78px]" />,
})

/** A generated swatch as a colorway: named by its hex, with whichever logo reads on it. */
function colorwayFromHex(hex: string): Colorway {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return { name: hex.toUpperCase(), hex, decal: luma > 0.6 ? '/logo-black.png' : '/logo-white.png' }
}

interface DesignSectionProps {
  colorway: Colorway
  onColorwayChange: (colorway: Colorway) => void
  /** An uploaded image as a data URL, or null once it is removed. */
  onArtworkChange: (dataUrl: string | null) => void
  onOpenStudio: () => void
}

export function DesignSection({ colorway, onColorwayChange, onArtworkChange, onOpenStudio }: DesignSectionProps) {
  return (
    <LandingSection id="design" align="left">
      <Reveal>
        <SectionIndex index={3}>{SECTION_LABELS.design}</SectionIndex>
      </Reveal>
      <Reveal>
        <SectionTitle>Make it yours.</SectionTitle>
      </Reveal>

      {/* `data-stroke` gives both blocks their hairline, so their white card still has an edge on the light page. */}
      <Reveal className="space-y-3">
        <p className="font-mono text-xs lowercase text-muted-foreground">
          Try a colorway · <span className="text-foreground">{colorway.name}</span>
        </p>
        {/* Full width on phones and tablets, Bencho's own 300px beside the tee on desktop. */}
        <div data-stroke="on" className="[--pal-w:100%] lg:[--pal-w:300px]">
          <Palette picked={colorway.hex} onPick={(hex) => onColorwayChange(colorwayFromHex(hex))} />
        </div>
      </Reveal>

      {/* Tap-to-browse on phones, drag-and-drop on desktop; it shows the "add your artwork" step in action. */}
      <Reveal>
        <div data-stroke="on" className="[--upl-w:100%] lg:[--upl-w:300px]">
          <UploadDropzone onUpload={(file) => onArtworkChange(file.dataUrl)} onClear={() => onArtworkChange(null)} />
        </div>
      </Reveal>

      <Reveal>
        <Button size="lg" onClick={onOpenStudio} className="group w-full sm:w-auto">
          Open design studio
          <ArrowRight className="transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
        </Button>
      </Reveal>
    </LandingSection>
  )
}
