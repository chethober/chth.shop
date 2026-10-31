'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Download, ImageIcon, Layers, Palette, RotateCcw, Sparkles, Tag, Type } from 'lucide-react'
import { toast } from '@heroui/react'
import { Notch, type NotchItem } from '@/components/custom/notch'
import { ConfirmButton } from '@/components/shared/confirm-button'
import { Button } from '@/components/ui/button'
import type { ProductType } from '@/types'
import {
  COLOR_PALETTE,
  DEFAULT_GARMENT_COLOR,
  FABRICS,
  GARMENTS,
  getGarment,
  type DesignLayer,
} from './constants'
import { AiPanel } from './panels/ai-panel'
import { ArtworkPanel, type ArtworkTab } from './panels/artwork-panel'
import { ColorPanel } from './panels/color-panel'
import { LayersPanel } from './panels/layers-panel'
import { useT } from '@/lib/i18n'

// WebGL can't render on the server.
const StudioCanvas = dynamic(() => import('./scene/studio-canvas').then((m) => m.StudioCanvas), { ssr: false })

type Panel = 'color' | 'artwork' | 'ai' | 'layers'

function downloadMockup(message: string) {
  const canvas = document.querySelector('canvas')
  if (!canvas) return
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `chth-design-${Date.now()}.png`
  link.click()
  toast.success(message)
}

export function DesignStudio() {
  const t = useT()
  const [garmentId, setGarmentId] = useState<ProductType>('tshirt')
  const [color, setColor] = useState(DEFAULT_GARMENT_COLOR)
  const [fabric, setFabric] = useState(FABRICS[0].id)
  const [logoUrl, setLogoUrl] = useState('')
  const [layers, setLayers] = useState<DesignLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel | null>('color')
  const [artworkTab, setArtworkTab] = useState<ArtworkTab>('graphic')

  const garment = getGarment(garmentId)
  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId)

  const addLayer = (layer: Omit<DesignLayer, 'id' | 'position' | 'rotation' | 'scale'>) => {
    const id = crypto.randomUUID()
    setLayers((current) => [
      ...current,
      { ...layer, id, position: [...garment.chestPosition], rotation: 0, scale: [...garment.chestScale] },
    ])
    setSelectedLayerId(id)
  }

  const updateLayer = (id: string, changes: Partial<DesignLayer>) =>
    setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, ...changes } : layer)))

  const removeLayer = (id: string) => {
    setLayers((current) => current.filter((layer) => layer.id !== id))
    setSelectedLayerId(null)
  }

  const reset = () => {
    setColor(DEFAULT_GARMENT_COLOR)
    setLogoUrl('')
    setLayers([])
    setSelectedLayerId(null)
    toast.info(t("Design reset"))
  }

  const notchItems: NotchItem[] = useMemo(() => {
    const GarmentIcon = getGarment(garmentId).icon
    return [
      {
        id: 'garment',
        label: t('Products'),
        icon: <GarmentIcon className="size-3.5" />,
        value: garmentId,
        options: GARMENTS.map(({ id, name, icon: Icon }) => ({
          id,
          label: name,
          icon: <Icon className="size-3.5 text-neutral-300" />,
        })),
        onChange: (id) => setGarmentId(id as ProductType),
      },
      {
        id: 'color',
        label: t('Color'),
        icon: <span className="inline-block size-3 rounded-full border border-white/60" style={{ backgroundColor: color }} />,
        value: color,
        options: COLOR_PALETTE.map((swatch) => ({
          id: swatch.value,
          label: swatch.name,
          icon: <span className="size-3.5 shrink-0 rounded-full border border-white/40" style={{ backgroundColor: swatch.value }} />,
        })),
        onChange: setColor,
      },
      {
        id: 'fabric',
        label: t('Fabric'),
        icon: <Tag className="size-3.5 text-neutral-300" />,
        value: fabric,
        options: FABRICS.map(({ id, name, description }) => ({ id, label: name, description })),
        onChange: setFabric,
      },
      {
        id: 'studio',
        label: t('Studio'),
        icon: <Sparkles className="size-3.5 text-amber-400" />,
        options: [
          { id: 'graphic', label: t('Add graphic / artwork'), icon: <ImageIcon className="size-3.5" /> },
          { id: 'text', label: t('Text'), icon: <Type className="size-3.5" /> },
          { id: 'ai', label: t('AI generator'), icon: <Bot className="size-3.5 text-amber-400" /> },
          ...(layers.length > 0
            ? [{ id: 'layers', label: t('Transform layers ({count})', { count: layers.length }), icon: <Layers className="size-3.5" /> }]
            : []),
          { id: 'color', label: t('Color palette'), icon: <Palette className="size-3.5" /> },
        ],
        onChange: (id) => {
          if (id === 'graphic' || id === 'text') {
            setArtworkTab(id)
            setPanel('artwork')
          } else {
            setPanel(id as Panel)
          }
        },
      },
    ]
  }, [garmentId, color, fabric, layers.length])

  const closePanel = () => setPanel(null)

  return (
    <div className="relative h-[calc(100vh-140px)] min-h-[600px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-border/60 bg-card/75 px-3 py-1.5 shadow-xs backdrop-blur-md">
        <span className="size-1.5 rounded-full bg-brand" />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{t("Design studio")}</span>
      </div>

      <AnimatePresence mode="wait">
        {panel && (
          <motion.div
            key={panel}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-4 top-4 z-20 max-h-[calc(100vh-180px)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md sm:w-80"
          >
            {panel === 'color' && <ColorPanel color={color} onColorChange={setColor} onClose={closePanel} />}
            {panel === 'artwork' && (
              <ArtworkPanel
                tab={artworkTab}
                onTabChange={setArtworkTab}
                hasLogo={Boolean(logoUrl)}
                onUploadLogo={(url) => {
                  setLogoUrl(url)
                  toast.success(t("Chest logo updated"))
                }}
                onUploadLayer={(url) => {
                  addLayer({ type: 'image', content: 'Uploaded artwork', imageUrl: url })
                  toast.success(t("Layer added"))
                }}
                onRemoveLogo={() => setLogoUrl('')}
                onAddText={(text, textColor) => addLayer({ type: 'text', content: text, color: textColor })}
                onClose={closePanel}
              />
            )}
            {panel === 'ai' && (
              <AiPanel
                onGenerated={(url) => {
                  setLogoUrl(url)
                  toast.success(t("Artwork applied as chest logo"))
                }}
                onClose={closePanel}
              />
            )}
            {panel === 'layers' && selectedLayer && (
              <LayersPanel
                layer={selectedLayer}
                onChange={(changes) => updateLayer(selectedLayer.id, changes)}
                onRemove={() => removeLayer(selectedLayer.id)}
                onClose={closePanel}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => downloadMockup(t('Mockup downloaded'))} className="bg-card shadow-xs">
          <Download />
          {t("Save mockup")}
        </Button>
        <ConfirmButton
          variant="outline"
          className="bg-card text-muted-foreground shadow-xs"
          question="Reset all decorations?"
          confirmLabel="Reset"
          onConfirm={reset}
        >
          <RotateCcw />
          {t("Reset")}
        </ConfirmButton>
      </div>

      <StudioCanvas
        garment={garment}
        color={color}
        logoUrl={logoUrl}
        layers={layers}
        onSelectLayer={(id) => {
          setSelectedLayerId(id)
          setPanel('layers')
        }}
      />

      <Notch items={notchItems} position="bottom" align="center" variant="docked" offset={16} accentColor={color} />
    </div>
  )
}
