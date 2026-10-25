'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { FolderOpen, ImagePlus, Layers, Palette, Shirt, Sparkles, Type, type LucideIcon } from 'lucide-react'
import { toast } from '@heroui/react'
import { cn } from '@/lib/utils'
import { BACKDROPS, DEFAULT_GARMENT_COLOR, EMPTY_DOC, getGarment, type DesignLayer } from './constants'
import { captureThumbnail, composeTechSheet, download, slugify } from './files'
import { clearStudioHandoff, peekStudioHandoff } from './handoff'
import { AiPanel } from './panels/ai-panel'
import { ColorPanel } from './panels/color-panel'
import { DraftsPanel } from './panels/drafts-panel'
import { Inspector } from './panels/inspector'
import { LayersPanel } from './panels/layers-panel'
import { ProductPanel } from './panels/product-panel'
import { TextPanel } from './panels/text-panel'
import { UploadsPanel, useImageUpload } from './panels/uploads-panel'
import { sceneBridge } from './scene-bridge'
import { useDrafts, useStudio, type Tool } from './store'
import { StudioShell } from './studio-shell'
import { Toolbar } from './toolbar'
import { useStudioShortcuts } from './use-shortcuts'
import { ViewportChrome } from './viewport-chrome'
import './studio.css'

// WebGL can't render on the server.
const StudioCanvas = dynamic(() => import('./scene/studio-canvas').then((m) => m.StudioCanvas), { ssr: false })

const TOOLS: { id: Tool; label: string; icon: LucideIcon }[] = [
  { id: 'product', label: 'Product', icon: Shirt },
  { id: 'color', label: 'Color', icon: Palette },
  { id: 'uploads', label: 'Uploads', icon: ImagePlus },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'drafts', label: 'Drafts', icon: FolderOpen },
]

function ToolRail() {
  const tool = useStudio((state) => state.tool)
  const layerCount = useStudio((state) => state.doc.layers.length)
  const setTool = useStudio((state) => state.setTool)

  return (
    <nav
      aria-label="Tools"
      className="flex shrink-0 gap-1 overflow-x-auto border-border p-1.5 max-lg:border-b lg:w-16 lg:flex-col lg:overflow-visible lg:border-r"
    >
      {TOOLS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={tool === id ? 'page' : undefined}
          onClick={() => setTool(id)}
          className={cn(
            'relative flex min-w-14 shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]',
            tool === id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          )}
        >
          <Icon className="size-[18px]" />
          {label}
          {id === 'layers' && layerCount > 0 && (
            <span className="absolute right-1.5 top-1 min-w-4 rounded-full bg-foreground px-1 text-[9px] font-semibold leading-4 text-background">
              {layerCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}

function ToolPanel({ onSave }: { onSave: () => void }) {
  const tool = useStudio((state) => state.tool)
  // Switching tools happens constantly while designing, so panels swap instantly.
  switch (tool) {
    case 'product':
      return <ProductPanel />
    case 'color':
      return <ColorPanel />
    case 'uploads':
      return <UploadsPanel />
    case 'text':
      return <TextPanel />
    case 'ai':
      return <AiPanel />
    case 'layers':
      return <LayersPanel />
    case 'drafts':
      return <DraftsPanel onSave={onSave} />
  }
}

/** The landing tee's last frame, held over the canvas until the studio's own tee has drawn. */
function HandoffSnapshot({ snapshot, hidden }: { snapshot: HTMLCanvasElement; hidden: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (gone) return
    host.current?.append(snapshot)
    return () => snapshot.remove()
  }, [snapshot, gone])

  if (gone) return null
  return (
    <div
      ref={host}
      aria-hidden
      onTransitionEnd={() => setGone(true)}
      className={cn('pointer-events-none absolute inset-0 transition-opacity [&>canvas]:size-full duration-200 ease-out-strong', hidden && 'opacity-0')}
    />
  )
}

function useStudioSession() {
  // Arriving from the landing page's launch: carry its tee over.
  const [handoff] = useState(peekStudioHandoff)

  useEffect(() => {
    clearStudioHandoff()
    void useDrafts.persist.rehydrate()
    void Promise.resolve(useStudio.persist.rehydrate()).then(() => {
      if (!handoff) return
      // A fresh design in the landing tee's colour, its artwork on the chest. Not undoable back to the old autosave.
      const garment = getGarment('tshirt')
      const placement = garment.placements[0]
      const layers: DesignLayer[] = handoff.logoUrl
        ? [
            {
              id: crypto.randomUUID(),
              type: 'image',
              name: 'Your artwork',
              content: '',
              imageUrl: handoff.logoUrl,
              position: [...garment.chestPosition],
              side: 'front',
              rotation: 0,
              size: placement.size,
              opacity: 1,
              flipX: false,
              visible: true,
              locked: false,
            },
          ]
        : []
      useStudio.setState({
        doc: { ...EMPTY_DOC, color: handoff.color, layers },
        past: [],
        future: [],
        selectedId: null,
        // The landing tee lands on the light backdrop; anything else would flash at the crossfade.
        backdrop: 'light',
      })
    })
  }, [handoff])

  return handoff
}

export function DesignStudio() {
  const handoff = useStudioSession()
  const [canvasDrawn, setCanvasDrawn] = useState(false)
  const [dropping, setDropping] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)

  const garmentId = useStudio((state) => state.doc.garmentId)
  const color = useStudio((state) => state.doc.color)
  const fabric = useStudio((state) => state.doc.fabric)
  const backdrop = useStudio((state) => state.backdrop)
  const upload = useImageUpload()

  const saveDraft = useCallback(async () => {
    const { doc } = useStudio.getState()
    const saved = useDrafts.getState().save(doc, await captureThumbnail())
    if (saved) toast.success(`Saved “${doc.name}”`)
    else toast.danger('Browser storage is full. Export a design file instead.')
  }, [])

  useStudioShortcuts({ onSave: saveDraft })

  const clear = () => {
    const { doc, load } = useStudio.getState()
    load({ ...doc, color: DEFAULT_GARMENT_COLOR, layers: [] })
    toast.info('Design cleared. Undo brings it back.')
  }

  const exportView = () => {
    const still = sceneBridge.capture?.()
    if (!still) return
    const { doc } = useStudio.getState()
    const filename = `${slugify(doc.name)}-${Date.now()}.png`
    if (backdrop === 'checker' || !viewport.current) return download(still, filename)

    // Paint the backdrop behind the render, since the canvas itself is transparent.
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = getComputedStyle(viewport.current!).backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0)
      download(canvas.toDataURL('image/png'), filename)
    }
    image.src = still
  }

  const exportSheet = async () => {
    const { doc } = useStudio.getState()
    const sheet = await composeTechSheet(doc)
    if (sheet) download(sheet, `${slugify(doc.name)}-tech-sheet.png`)
  }

  return (
    <StudioShell
      viewportRef={viewport}
      viewportClassName={cn(BACKDROPS[backdrop].className, 'transition-colors duration-200')}
      toolbar={<Toolbar onSave={saveDraft} onClear={clear} onExportView={exportView} onExportSheet={exportSheet} />}
      tools={
        <>
          <ToolRail />
          <ToolPanel onSave={saveDraft} />
        </>
      }
      inspector={<Inspector />}
      viewport={
        <div
          className="size-full"
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes('Files')) return
            event.preventDefault()
            setDropping(true)
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropping(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDropping(false)
            void upload(event.dataTransfer.files)
          }}
        >
          <StudioCanvas
            garment={getGarment(garmentId)}
            color={color}
            fabric={fabric}
            onDrawn={handoff ? () => setCanvasDrawn(true) : undefined}
          />
          {handoff && <HandoffSnapshot snapshot={handoff.snapshot} hidden={canvasDrawn} />}
          <ViewportChrome dropping={dropping} />
        </div>
      }
    />
  )
}
