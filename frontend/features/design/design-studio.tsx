'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Download, ImageIcon, Layers, Lock, Palette, Rocket, RotateCcw, ShoppingBag, Sparkles, Tag, Type } from 'lucide-react'
import { toast } from '@heroui/react'
import { Notch, type NotchItem } from '@/components/custom/notch'
import { ConfirmButton } from '@/components/shared/confirm-button'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useCatalog } from '@/hooks/use-catalog'
import { useHydrated } from '@/hooks/use-hydrated'
import api from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { isProductType } from '@/lib/products'
import useAuthStore from '@/store/auth-store'
import useCartStore from '@/store/cart-store'
import type { Product, ProductType } from '@/types'
import { DEFAULT_GARMENT_COLOR, FABRICS, GARMENTS, getGarment, type DesignLayer, type LayerDraft } from './constants'
import { uploadDesignImages, uploadStudioPreview } from './design-assets'
import { AiPanel } from './panels/ai-panel'
import { ArtworkPanel, type ArtworkTab } from './panels/artwork-panel'
import { ColorPanel } from './panels/color-panel'
import { LayersPanel } from './panels/layers-panel'
import { PublishDialog, type PublishDetails } from './publish-dialog'

// WebGL can't render on the server.
const StudioCanvas = dynamic(() => import('./scene/studio-canvas').then((m) => m.StudioCanvas), { ssr: false })

type Panel = 'color' | 'artwork' | 'ai' | 'layers'
type Busy = 'cart' | 'publish' | null

const APPAREL: ProductType[] = ['tshirt', 'hoodie', 'pants']

function downloadMockup() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-studio-canvas] canvas')
  if (!canvas) return
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `chth-design-${Date.now()}.png`
  link.click()
  toast.success('Mockup downloaded')
}

export function DesignStudio() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('product')
  const typeParam = searchParams.get('type')

  const hydrated = useHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSeller = useAuthStore((state) => Boolean(state.user?.isSeller))
  const addToCart = useCartStore((state) => state.addItem)
  const { get: getCatalogItem } = useCatalog()

  const [garmentId, setGarmentId] = useState<ProductType>(isProductType(typeParam) ? typeParam : 'tshirt')
  const [color, setColor] = useState(DEFAULT_GARMENT_COLOR)
  const [size, setSize] = useState('')
  const [fabric, setFabric] = useState(FABRICS[0].id)
  const [logoUrl, setLogoUrl] = useState('')
  const [layers, setLayers] = useState<DesignLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel | null>('color')
  const [artworkTab, setArtworkTab] = useState<ArtworkTab>('graphic')
  /** The store listing being personalized, when opened with `?product=`. */
  const [baseProduct, setBaseProduct] = useState<Product | null>(null)
  /** Seller layers on a personalized listing: shown, but not editable by the buyer. */
  const [lockedLayerIds, setLockedLayerIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<Busy>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const uploadCache = useRef(new Map<string, string>())

  const garment = getGarment(garmentId)
  const catalogItem = getCatalogItem(garmentId)
  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId)
  const isPersonalizing = Boolean(baseProduct)

  /** Colors on offer: the listing's choices (none if its color is fixed), else the catalog's. */
  const colors = useMemo(() => {
    if (baseProduct) {
      if (baseProduct.colors.length > 0) return baseProduct.colors
      if (baseProduct.design?.color) return []
    }
    return catalogItem?.colors ?? []
  }, [baseProduct, catalogItem])
  const sizes = useMemo(
    () => (baseProduct?.sizes.length ? baseProduct.sizes : catalogItem?.sizes) ?? [],
    [baseProduct, catalogItem]
  )
  // The picked color and size, falling back to valid ones when the product changes.
  const activeColor = colors.length > 0 && !colors.some((c) => c.toUpperCase() === color.toUpperCase()) ? colors[0] : color
  const activeSize = sizes.includes(size) ? size : sizes.length === 1 ? sizes[0] : ''
  const price = baseProduct?.price ?? catalogItem?.retailPrice ?? 0

  // Load the listing to personalize.
  useEffect(() => {
    if (!productId) return
    let cancelled = false
    api.products
      .get(productId)
      .then((product) => {
        if (cancelled) return
        if (!product.customizable) {
          toast.warning('This product cannot be personalized')
          router.replace('/design')
          return
        }
        setBaseProduct(product)
        if (isProductType(product.type)) setGarmentId(product.type)
        const design = product.design
        if (design?.color) setColor(design.color)
        else if (product.colors[0]) setColor(product.colors[0])
        setLogoUrl(design?.logoUrl ?? '')
        setLayers(design?.layers ?? [])
        setLockedLayerIds(new Set(design?.layers.map((layer) => layer.id)))
        setPanel('artwork')
      })
      .catch(() => {
        if (cancelled) return
        toast.danger('Product not found')
        router.replace('/design')
      })
    return () => {
      cancelled = true
    }
  }, [productId, router])

  const addLayer = (layer: LayerDraft) => {
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
    const design = baseProduct?.design
    setColor(design?.color ?? colors[0] ?? DEFAULT_GARMENT_COLOR)
    setLogoUrl(design?.logoUrl ?? '')
    setLayers(design?.layers ?? [])
    setSelectedLayerId(null)
    toast.info('Design reset')
  }

  const switchGarment = (id: ProductType) => {
    setGarmentId(id)
    // Placements are per product; carry the artwork over at the new product's print area.
    const next = getGarment(id)
    setLayers((current) =>
      current.map((layer) => ({ ...layer, position: [...next.chestPosition], scale: [...next.chestScale] }))
    )
  }

  const requireSignIn = () => {
    if (hydrated && isAuthenticated) return false
    toast.warning('Please sign in first')
    const returnTo = productId ? `/design?product=${productId}` : `/design?type=${garmentId}`
    router.push(`/auth?redirect=${encodeURIComponent(returnTo)}`)
    return true
  }

  const hasArtwork = Boolean(logoUrl) || layers.length > 0
  const buyerAddedArtwork = isPersonalizing
    ? layers.some((layer) => !lockedLayerIds.has(layer.id)) || logoUrl !== (baseProduct?.design?.logoUrl ?? '')
    : hasArtwork

  const handleAddToCart = async () => {
    if (requireSignIn()) return
    if (sizes.length > 0 && !activeSize) {
      toast.warning('Pick a size first')
      return
    }
    if (!buyerAddedArtwork) {
      toast.warning(isPersonalizing ? 'Add your text or image first' : 'Add some artwork first')
      return
    }

    setBusy('cart')
    try {
      const [design, previewUrl] = await Promise.all([
        uploadDesignImages({ color: activeColor, logoUrl, layers }, uploadCache.current),
        uploadStudioPreview(),
      ])
      const options = {
        ...(activeSize && { size: activeSize }),
        ...(colors.length > 0 && { color: activeColor }),
        design,
        ...(previewUrl && { previewUrl }),
      }
      await addToCart(baseProduct ? { productId: baseProduct.id, options } : { type: garmentId, options })
      toast.success('Added to cart')
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not add to cart')
    } finally {
      setBusy(null)
    }
  }

  const handlePublish = async (details: PublishDetails) => {
    setBusy('publish')
    try {
      const [design, imageUrl] = await Promise.all([
        uploadDesignImages({ color: activeColor, logoUrl, layers }, uploadCache.current),
        uploadStudioPreview(),
      ])
      await api.products.create({
        ...details,
        type: garmentId,
        imageUrl: imageUrl ?? null,
        design,
        colors: [activeColor.toUpperCase()],
      })
      setPublishOpen(false)
      toast.success('Published! It is live in your store.')
      router.push('/account?tab=store')
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not publish the design')
    } finally {
      setBusy(null)
    }
  }

  const notchItems: NotchItem[] = useMemo(() => {
    const GarmentIcon = garment.icon
    const items: NotchItem[] = []

    if (!isPersonalizing) {
      items.push({
        id: 'garment',
        label: 'Products',
        icon: <GarmentIcon className="size-3.5" />,
        value: garmentId,
        options: GARMENTS.map(({ id, name, icon: Icon }) => ({
          id,
          label: name,
          icon: <Icon className="size-3.5 text-neutral-300" />,
        })),
        onChange: (id) => switchGarment(id as ProductType),
      })
    }

    if (colors.length > 0) {
      items.push({
        id: 'color',
        label: 'Color',
        icon: <span className="inline-block size-3 rounded-full border border-white/60" style={{ backgroundColor: activeColor }} />,
        value: activeColor,
        options: colors.map((value) => ({
          id: value,
          label: value,
          icon: <span className="size-3.5 shrink-0 rounded-full border border-white/40" style={{ backgroundColor: value }} />,
        })),
        onChange: setColor,
      })
    }

    if (APPAREL.includes(garmentId)) {
      items.push({
        id: 'fabric',
        label: 'Fabric',
        icon: <Tag className="size-3.5 text-neutral-300" />,
        value: fabric,
        options: FABRICS.map(({ id, name, description }) => ({ id, label: name, description })),
        onChange: setFabric,
      })
    }

    items.push({
      id: 'studio',
      label: 'Studio',
      icon: <Sparkles className="size-3.5 text-amber-400" />,
      options: [
        { id: 'graphic', label: 'Add graphic / artwork', icon: <ImageIcon className="size-3.5" /> },
        { id: 'text', label: 'Text', icon: <Type className="size-3.5" /> },
        { id: 'ai', label: 'AI generator', icon: <Bot className="size-3.5 text-amber-400" /> },
        ...(layers.length > lockedLayerIds.size
          ? [{ id: 'layers', label: `Transform layers (${layers.length - lockedLayerIds.size})`, icon: <Layers className="size-3.5" /> }]
          : []),
        ...(colors.length > 0 ? [{ id: 'color', label: 'Color palette', icon: <Palette className="size-3.5" /> }] : []),
      ],
      onChange: (id) => {
        if (id === 'graphic' || id === 'text') {
          setArtworkTab(id)
          setPanel('artwork')
        } else if (id === 'layers') {
          const firstEditable = layers.find((layer) => !lockedLayerIds.has(layer.id))
          if (firstEditable) setSelectedLayerId(firstEditable.id)
          setPanel('layers')
        } else {
          setPanel(id as Panel)
        }
      },
    })

    return items
  }, [garment, garmentId, activeColor, colors, fabric, layers, lockedLayerIds, isPersonalizing])

  const closePanel = () => setPanel(null)

  return (
    <div className="relative h-[calc(100vh-140px)] min-h-[600px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex max-w-[60%] items-center gap-2 rounded-full border border-border/60 bg-card/75 px-3 py-1.5 shadow-xs backdrop-blur-md">
        <span className="size-1.5 shrink-0 rounded-full bg-brand" />
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-foreground">
          {baseProduct ? `Personalize · ${baseProduct.name}` : `Design studio · ${garment.name}`}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {panel && (
          <motion.div
            key={panel}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-4 top-4 z-20 max-h-[calc(100vh-260px)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md sm:w-80"
          >
            {panel === 'color' && <ColorPanel color={activeColor} colors={colors} onColorChange={setColor} onClose={closePanel} />}
            {panel === 'artwork' && (
              <ArtworkPanel
                tab={artworkTab}
                onTabChange={setArtworkTab}
                printAreaLabel={garment.printAreaLabel}
                hasLogo={Boolean(logoUrl)}
                onUploadLogo={(url) => {
                  setLogoUrl(url)
                  toast.success(`${garment.printAreaLabel[0].toUpperCase()}${garment.printAreaLabel.slice(1)} updated`)
                }}
                onUploadLayer={(url) => {
                  addLayer({ type: 'image', content: 'Uploaded artwork', imageUrl: url })
                  toast.success('Layer added')
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
                  toast.success(`Artwork applied as ${garment.printAreaLabel}`)
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

      <div className="absolute bottom-20 left-4 z-20 flex flex-wrap items-center gap-2 sm:bottom-4">
        <Button variant="outline" size="sm" onClick={downloadMockup} className="bg-card shadow-xs">
          <Download />
          <span className="hidden sm:inline">Save mockup</span>
        </Button>
        <ConfirmButton
          variant="outline"
          className="bg-card text-muted-foreground shadow-xs"
          question="Reset all decorations?"
          confirmLabel="Reset"
          onConfirm={reset}
        >
          <RotateCcw />
          <span className="hidden sm:inline">Reset</span>
        </ConfirmButton>
      </div>

      <div className="absolute right-4 top-14 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/90 p-1.5 shadow-xs backdrop-blur-md">
          {sizes.length > 1 && (
            <Select aria-label="Size" value={activeSize} onChange={(event) => setSize(event.target.value)} className="h-8">
              <option value="" disabled>
                Size
              </option>
              {sizes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
          <Button size="sm" onClick={handleAddToCart} disabled={busy !== null || !catalogItem}>
            {busy === 'cart' ? <Spinner /> : <ShoppingBag />}
            {formatPrice(price)}
          </Button>
        </div>
        {isSeller && !isPersonalizing && catalogItem && (
          <Button
            size="sm"
            variant="outline"
            className="bg-card shadow-xs"
            disabled={busy !== null || !hasArtwork}
            title={hasArtwork ? undefined : 'Add some artwork first'}
            onClick={() => setPublishOpen(true)}
          >
            <Rocket />
            Publish to store
          </Button>
        )}
        {isPersonalizing && lockedLayerIds.size > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-md">
            <Lock className="size-3" />
            Seller artwork is locked
          </span>
        )}
      </div>

      <div data-studio-canvas className="size-full">
        <StudioCanvas
          garment={garment}
          color={activeColor}
          logoUrl={logoUrl}
          layers={layers}
          onSelectLayer={(id) => {
            if (lockedLayerIds.has(id)) return
            setSelectedLayerId(id)
            setPanel('layers')
          }}
        />
      </div>

      <Notch items={notchItems} position="bottom" align="center" variant="docked" offset={16} accentColor={activeColor} />

      {catalogItem && (
        <PublishDialog
          key={garmentId}
          open={publishOpen}
          catalogItem={catalogItem}
          publishing={busy === 'publish'}
          onClose={() => setPublishOpen(false)}
          onPublish={handlePublish}
        />
      )}
    </div>
  )
}
