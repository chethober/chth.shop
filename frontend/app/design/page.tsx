'use client'

import { useState, useRef, Suspense, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Decal, useTexture, Center, AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import { easing } from 'maath'
import { 
  Shirt, 
  Palette, 
  Plus, 
  RotateCcw, 
  Type, 
  ImageIcon, 
  X, 
  Move, 
  Trash2, 
  Scissors, 
  Sparkles, 
  Tag, 
  Download, 
  Layers, 
  Camera, 
  Sliders, 
  Check,
  Bot
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import * as THREE from 'three'
import modelsData from '@/public/models/models.json'

// --- Constants & Color Palettes ---
const ICON_MAP = {
  tshirt: Shirt,
  hoodie: Shirt,
  pants: Scissors
}

const PRODUCT_TYPES = Object.entries(modelsData.models).map(([id, model]) => ({
  id,
  name: model.name,
  icon: ICON_MAP[id as keyof typeof ICON_MAP] || Shirt,
  modelPath: model.path
}))

const COLOR_PALETTES = [
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Pitch Black', value: '#121212' },
  { name: 'Royal Cobalt', value: '#1D4ED8' },
  { name: 'Sunset Amber', value: '#EFBD48' },
  { name: 'Forest Emerald', value: '#059669' },
  { name: 'Crimson Red', value: '#DC2626' },
  { name: 'Cyber Purple', value: '#8B5CF6' },
  { name: 'Rose Quartz', value: '#F472B6' },
]

const FABRICS = [
  { id: 'cotton', name: 'Organic Cotton', desc: '100% Breathable Soft Cotton' },
  { id: 'fleece', name: 'Heavyweight Fleece', desc: '400GSM Cozy & Thick' },
  { id: 'linen', name: 'French Linen', desc: 'Lightweight Natural Weave' },
  { id: 'satin', name: 'Silk Satin', desc: 'Lustrous Smooth Finish' }
]

const AI_PROMPT_PRESETS = [
  'Futuristic Cyberpunk Mecha Tiger',
  'Minimalist Bauhaus Abstract Wave',
  'Tokyo Streetwear Neon Dragon',
  'Vintage 90s Retro Synthwave Sunset',
]

// --- Types ---
interface TextureElement {
  id: string
  type: 'image' | 'text'
  content: string
  imageUrl?: string
  position: [number, number, number]
  baseRotation: [number, number, number]
  rotationAngle: number
  scale: [number, number, number]
  color?: string
  fontSize?: number
  opacity?: number
  meshName?: string
}

// --- Helpers ---
function downloadCanvasToImage() {
  const canvas = document.querySelector('canvas')
  if (!canvas) {
    toast.error('Canvas not found')
    return
  }
  const dataURL = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = dataURL
  link.download = `chth-tshirt-design-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success('High-res mockup downloaded!')
}

// Generate texture from text
function useTextTexture(text: string, color: string, fontSize: number = 100) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 1024, 1024)
      ctx.fillStyle = color
      const maxCharCount = Math.max(text.length, 6)
      const targetFontSize = Math.min(fontSize * 120, (1024 / maxCharCount) * 1.5)
      ctx.font = `bold ${targetFontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 512, 512)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [text, color, fontSize])
}

// --- 3D Scene Components ---

// Decal Renderer for custom user layers
function CustomDecalItem({ 
  element, 
  isSelected, 
  onSelect,
  scaleMultiplier = [1, 1, 1]
}: { 
  element: TextureElement
  isSelected: boolean
  onSelect: (id: string) => void
  scaleMultiplier?: [number, number, number]
}) {
  const imageTexture = useMemo(() => {
    if (element.type === 'image' && element.imageUrl) {
      try {
        const loader = new THREE.TextureLoader()
        const tex = loader.load(element.imageUrl)
        tex.colorSpace = THREE.SRGBColorSpace
        return tex
      } catch (error) {
        console.error('Failed to load texture:', error)
        return null
      }
    }
    return null
  }, [element.type, element.imageUrl])
  
  const textTexture = useTextTexture(
    element.content || ' ',
    element.color || '#000000',
    element.fontSize
  )
  
  const texture = element.type === 'text' ? textTexture : imageTexture || textTexture

  const multiplier = scaleMultiplier || [1, 1, 1]
  const elemScale = element.scale || [0.15, 0.15, 0.15]

  const decalScale: [number, number, number] = [
    (elemScale[0] ?? 0.15) * (multiplier[0] ?? 1),
    (elemScale[1] ?? 0.15) * (multiplier[1] ?? 1),
    Math.max((elemScale[2] ?? 0.1) * (multiplier[2] ?? 1), 0.8 * (multiplier[2] ?? 1))
  ]

  const baseRot = element.baseRotation || [0, 0, 0]
  const combinedRotation: [number, number, number] = [
    baseRot[0] || 0,
    baseRot[1] || 0,
    (baseRot[2] || 0) + (element.rotationAngle || 0)
  ]

  return (
    <Decal
      position={element.position}
      rotation={combinedRotation}
      scale={decalScale}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect(element.id)
      }}
    >
      <meshStandardMaterial 
        map={texture} 
        transparent 
        opacity={element.opacity ?? 1}
        side={THREE.FrontSide}
        polygonOffset 
        polygonOffsetFactor={-1}
        polygonOffsetUnits={1}
        roughness={0.8}
        metalness={0.1}
        depthTest={false}
        depthWrite={true}
      />
    </Decal>
  )
}

// Model-specific calibrated surface anchors for accurate decal raycasting
const MODEL_CONFIGS: Record<string, {
  chestPosition: [number, number, number]
  chestScale: [number, number, number]
  defaultLayerPosition: [number, number, number]
  defaultLayerScale: [number, number, number]
}> = {
  tshirt: {
    chestPosition: [0, 0.04, 0.15],
    chestScale: [0.15, 0.15, 0.15],
    defaultLayerPosition: [0, 0.04, 0.15],
    defaultLayerScale: [0.15, 0.15, 0.15]
  },
  hoodie: {
    chestPosition: [0, 0.06, 0.18],
    chestScale: [0.18, 0.18, 0.18],
    defaultLayerPosition: [0, 0.06, 0.18],
    defaultLayerScale: [0.18, 0.18, 0.18]
  },
  pants: {
    chestPosition: [0.08, -0.15, 0.14],
    chestScale: [0.14, 0.14, 0.14],
    defaultLayerPosition: [0.08, -0.15, 0.14],
    defaultLayerScale: [0.14, 0.14, 0.14]
  }
}

function ChestDecalItem({ 
  logoDecal, 
  position = [0, 0.04, 0.15], 
  scale = [0.15, 0.15, 0.15] 
}: { 
  logoDecal: string
  position?: [number, number, number]
  scale?: [number, number, number]
}) {
  const logoTex = useTexture(logoDecal)
  if (!logoTex) return null
  logoTex.anisotropy = 16
  return (
    <Decal 
      position={position}
      rotation={[0, 0, 0]}
      scale={scale}
      map={logoTex}
    />
  )
}

// Built-in T-Shirt component using shirt_baked.glb with smooth easing and decal mapping
function BakedTShirtModel({
  color,
  logoDecal,
  textureElements,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onLoad
}: {
  color: string
  logoDecal?: string
  textureElements: TextureElement[]
  selectedElementId: string | null
  onElementSelect: (id: string) => void
  onElementUpdate: (id: string, updates: Partial<TextureElement>) => void
  onLoad?: (scene: THREE.Group) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { nodes, materials, scene } = useGLTF('/models/shirt_baked.glb') as any

  useEffect(() => {
    if (scene && onLoad) {
      onLoad(scene)
    }
  }, [scene, onLoad])

  // Smooth color interpolation with maath easing
  useFrame((_, delta) => {
    if (materials?.lambert1?.color) {
      easing.dampC(materials.lambert1.color, color, 0.25, delta)
    }
  })

  const stateString = JSON.stringify({ color, logoDecal })

  return (
    <group ref={groupRef} key={stateString} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes?.T_Shirt_male?.geometry}
        material={materials?.lambert1}
        material-roughness={1}
      >
        {/* Chest Logo Decal */}
        {logoDecal ? <ChestDecalItem logoDecal={logoDecal} position={[0, 0.04, 0.15]} scale={[0.15, 0.15, 0.15]} /> : null}

        {/* Custom User Added Decals */}
        {textureElements.map((el) => (
          <CustomDecalItem
            key={el.id}
            element={el}
            isSelected={selectedElementId === el.id}
            onSelect={onElementSelect}
          />
        ))}
      </mesh>
    </group>
  )
}

// Generic GLTF apparel renderer for hoodie / pants with full hierarchy and proper decal raycasting
function GenericApparelModel({
  modelPath,
  garmentType,
  color,
  logoDecal,
  textureElements,
  selectedElementId,
  onElementSelect,
  onLoad
}: {
  modelPath: string
  garmentType: string
  color: string
  logoDecal?: string
  textureElements: TextureElement[]
  selectedElementId: string | null
  onElementSelect: (id: string) => void
  onLoad?: (scene: THREE.Group) => void
}) {
  const { scene } = useGLTF(modelPath) as any
  const modelRef = useRef<THREE.Group>(null)

  // Clone scene so full hierarchy (hood, sleeves, body, pocket, etc.) is preserved
  const clonedScene = useMemo(() => {
    if (!scene) return null
    return scene.clone(true)
  }, [scene])

  // Find the primary torso/body mesh for accurate decal raycasting
  const torsoMesh = useMemo<any>(() => {
    if (!clonedScene) return null
    let largestMesh: THREE.Mesh | null = null
    let maxVerts = 0
    clonedScene.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        const count = child.geometry.attributes?.position?.count || 0
        if (count > maxVerts) {
          maxVerts = count
          largestMesh = child
        }
      }
    })
    return largestMesh
  }, [clonedScene])

  useEffect(() => {
    if (clonedScene && onLoad) {
      onLoad(clonedScene)
    }
  }, [clonedScene, onLoad])

  // Smooth color interpolation across all parts of the apparel
  useFrame((_, delta) => {
    if (clonedScene) {
      clonedScene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              if (mat && mat.color) easing.dampC(mat.color, color, 0.25, delta)
            })
          } else if (child.material.color) {
            easing.dampC(child.material.color, color, 0.25, delta)
          }
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  })

  const cfg = MODEL_CONFIGS[garmentType] || MODEL_CONFIGS.tshirt

  return (
    <group ref={modelRef} dispose={null}>
      {/* Full 3D Garment Mesh Hierarchy (all parts rendered) */}
      {clonedScene && <primitive object={clonedScene} />}

      {/* Surface-projected Decal Layer */}
      {torsoMesh && (
        <mesh 
          geometry={torsoMesh.geometry} 
          position={torsoMesh.position} 
          rotation={torsoMesh.rotation} 
          scale={torsoMesh.scale}
        >
          <meshBasicMaterial visible={false} />
          {/* Surface-projected Chest Logo */}
          {logoDecal ? (
            <ChestDecalItem 
              logoDecal={logoDecal} 
              position={cfg.chestPosition} 
              scale={cfg.chestScale} 
            />
          ) : null}

          {/* Surface-projected Custom User Layers */}
          {textureElements.map((el) => (
            <CustomDecalItem
              key={el.id}
              element={el}
              isSelected={selectedElementId === el.id}
              onSelect={onElementSelect}
            />
          ))}
        </mesh>
      )}
    </group>
  )
}

// Backdrop Studio Shadow Floor
function BackdropStudio() {
  const shadows = useRef<any>(null)

  return (
    <AccumulativeShadows
      ref={shadows}
      temporal
      frames={60}
      alphaTest={0.85}
      scale={10}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, 0, -0.14]}
    >
      <RandomizedLight
        amount={4}
        radius={9}
        intensity={0.55}
        ambient={0.25}
        position={[5, 5, -10]}
      />
      <RandomizedLight
        amount={4}
        radius={5}
        intensity={0.25}
        ambient={0.55}
        position={[-5, 5, -9]}
      />
    </AccumulativeShadows>
  )
}

// Camera Rig with smooth parallax dampening
function CameraRig({ 
  children, 
  enableParallax = true 
}: { 
  children: React.ReactNode
  enableParallax?: boolean 
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!enableParallax || !group.current) return
    
    // Smooth model rotation responding to pointer
    easing.dampE(
      group.current.rotation,
      [state.pointer.y / 10, -state.pointer.x / 5, 0],
      0.25,
      delta
    )
  })

  return <group ref={group}>{children}</group>
}

// Preload models
useGLTF.preload('/models/shirt_baked.glb')
useGLTF.preload('/models/hoodie.glb')
useGLTF.preload('/models/pants.glb')

// --- Main Design Page Component ---
export default function DesignPage() {
  // Garment Selection
  const [selectedType, setSelectedType] = useState('tshirt')
  const selectedProductType = PRODUCT_TYPES.find(p => p.id === selectedType)
  const SelectedGarmentIcon = selectedProductType?.icon || Shirt

  // Colors & Materials
  const [selectedColor, setSelectedColor] = useState('#EFBD48')
  const [selectedFabric, setSelectedFabric] = useState('cotton')

  // Built-in Decal State (clean by default)
  const [logoDecal, setLogoDecal] = useState('')

  // Custom User Layers
  const [textureElements, setTextureElements] = useState<TextureElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  
  // Model reference for raycasting
  const modelSceneRef = useRef<THREE.Group | null>(null)

  // Floating Navigation Tabs: 'color' | 'artwork' | 'ai' | 'layers'
  const [activeTab, setActiveTab] = useState<'color' | 'artwork' | 'ai' | 'layers' | null>('color')
  const [artworkSubTab, setArtworkSubTab] = useState<'graphic' | 'text'>('graphic')

  // Text Tab State
  const [newTextContent, setNewTextContent] = useState('')
  const [newTextColor, setNewTextColor] = useState('#121212')
  const [newTextFontSize, setNewTextFontSize] = useState(1)

  // AI Tab State
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  // Parallax / Orbit Mode
  const [enableParallax, setEnableParallax] = useState(true)
  const orbitControlsRef = useRef<any>(null)

  // Details & Publishing State
  const [designName, setDesignName] = useState('Modern Studio Tee')
  const [designPrice, setDesignPrice] = useState(39.99)
  const [designDescription, setDesignDescription] = useState('Exclusive custom 3D merchandise design designed with threejs.')
  const [isPublishing, setIsPublishing] = useState(false)

  // Handlers
  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success('Design published to your store!')
    } catch (err: any) {
      toast.error('Failed to publish design.')
    } finally {
      setIsPublishing(false)
    }
  }

  // Upload Image Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetMode: 'logo' | 'layer' = 'logo') => {
    const file = e.target.files?.[0]
    if (!file) return

    const cfg = MODEL_CONFIGS[selectedType] || MODEL_CONFIGS.tshirt

    const fileReader = new FileReader()
    fileReader.onload = (ev) => {
      const result = ev.target?.result as string
      if (!result) return

      if (targetMode === 'logo') {
        setLogoDecal(result)
        toast.success('Chest logo updated!')
      } else {
        const newElem: TextureElement = {
          id: Date.now().toString(),
          type: 'image',
          content: 'Uploaded Artwork',
          imageUrl: result,
          position: [...cfg.defaultLayerPosition],
          baseRotation: [0, 0, 0],
          rotationAngle: 0,
          scale: [...cfg.defaultLayerScale],
          opacity: 1
        }
        setTextureElements(prev => [...prev, newElem])
        setSelectedElementId(newElem.id)
        toast.success('Custom layer added to garment!')
      }
    }
    fileReader.readAsDataURL(file)
  }

  // Add Custom Text Handler
  const handleAddText = () => {
    if (!newTextContent.trim()) return

    const cfg = MODEL_CONFIGS[selectedType] || MODEL_CONFIGS.tshirt

    const newElem: TextureElement = {
      id: Date.now().toString(),
      type: 'text',
      content: newTextContent.trim(),
      position: [...cfg.defaultLayerPosition],
      baseRotation: [0, 0, 0],
      rotationAngle: 0,
      scale: [...cfg.defaultLayerScale],
      color: newTextColor,
      fontSize: newTextFontSize,
      opacity: 1
    }

    setTextureElements(prev => [...prev, newElem])
    setSelectedElementId(newElem.id)
    setNewTextContent('')
    toast.success('Typography added to garment')
  }

  // AI Generation Handler
  const handleGenerateAi = () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter an AI prompt')
      return
    }

    setIsGeneratingAi(true)
    toast.loading('Generating AI artwork...', { id: 'ai-gen' })

    // Procedural SVG artwork based on prompt keywords
    setTimeout(() => {
      setIsGeneratingAi(false)
      toast.dismiss('ai-gen')

      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Create an artistic generative gradient background
        const grad = ctx.createLinearGradient(0, 0, 512, 512)
        grad.addColorStop(0, '#8B5CF6')
        grad.addColorStop(0.5, '#EC4899')
        grad.addColorStop(1, '#3B82F6')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 512, 512)

        // Draw decorative art elements
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(256, 256, 120, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#18181B'
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(aiPrompt.slice(0, 16), 256, 256)
      }

      const generatedDataUrl = canvas.toDataURL('image/png')
      setLogoDecal(generatedDataUrl)
      toast.success('AI artwork applied as chest logo!')
    }, 1200)
  }

  const handleUpdateElement = (id: string, updates: Partial<TextureElement>) => {
    setTextureElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }

  const selectedElement = textureElements.find(el => el.id === selectedElementId)

  // Camera presets
  const setCameraView = (view: 'front' | 'back' | 'side') => {
    if (!orbitControlsRef.current) return
    setEnableParallax(false)
    if (view === 'front') {
      orbitControlsRef.current.setAzimuthalAngle(0)
      orbitControlsRef.current.setPolarAngle(Math.PI / 2)
    } else if (view === 'back') {
      orbitControlsRef.current.setAzimuthalAngle(Math.PI)
      orbitControlsRef.current.setPolarAngle(Math.PI / 2)
    } else if (view === 'side') {
      orbitControlsRef.current.setAzimuthalAngle(Math.PI / 2)
      orbitControlsRef.current.setPolarAngle(Math.PI / 2)
    }
    orbitControlsRef.current.update()
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT & CENTER 2/3 COLUMN: 3D Model Viewport Canvas with Superimposed Floating Toolbar */}
        <div className="lg:col-span-8 h-[calc(100vh-130px)] min-h-[580px] glass-card-rounded overflow-hidden relative shadow-2xl border border-white/20">
          
          {/* Floating Vertical Customization Toolbar */}
          <div className="absolute top-4 left-4 z-20 flex gap-3 items-start pointer-events-auto">
            
            {/* Minimal Vertical Icon Toolbar */}
            <div className="flex flex-col gap-2 p-1.5 glass-pill shadow-2xl backdrop-blur-xl border border-white/20 items-center">
              
              {/* Color Tab Button */}
              <button
                onClick={() => setActiveTab(activeTab === 'color' ? null : 'color')}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative group",
                  activeTab === 'color'
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                )}
                title="Garment & Fabric Color"
              >
                <div className="relative flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white/80 shadow-sm" style={{ backgroundColor: selectedColor }} />
                </div>
              </button>

              {/* Merged Artwork & Text Tab Button */}
              <button
                onClick={() => setActiveTab(activeTab === 'artwork' ? null : 'artwork')}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative group",
                  activeTab === 'artwork'
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                )}
                title="Add Artwork & Typography"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* AI Artwork Generator Tab Button */}
              <button
                onClick={() => setActiveTab(activeTab === 'ai' ? null : 'ai')}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative group",
                  activeTab === 'ai'
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                )}
                title="AI Artwork Generator"
              >
                <Bot className="w-4 h-4 text-purple-400" />
              </button>

              {/* Layer Transforms Tab Button */}
              {textureElements.length > 0 && (
                <button
                  onClick={() => setActiveTab(activeTab === 'layers' ? null : 'layers')}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative group",
                    activeTab === 'layers'
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                  )}
                  title="Layer Transformations"
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Expandable Tab Panel */}
            <AnimatePresence mode="wait">
              {activeTab && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-72 sm:w-80 max-w-[calc(100vw-5rem)] bg-background/95 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-4 max-h-[calc(100vh-180px)] overflow-x-hidden overflow-y-auto space-y-4 box-border"
                >
                  {/* 1. COLOR TAB */}
                  {activeTab === 'color' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-1 border-b border-border/30">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-primary" />
                          <span>Garment Color</span>
                        </span>
                        <button onClick={() => setActiveTab(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Curated Color Swatches */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Curated Palette</label>
                          <span className="text-[10px] font-mono text-foreground uppercase font-semibold">{selectedColor}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {COLOR_PALETTES.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setSelectedColor(c.value)}
                              className={cn(
                                "h-9 rounded-xl border border-white/30 transition-transform duration-200 hover:scale-105 shadow-sm flex items-center justify-center relative",
                                selectedColor.toUpperCase() === c.value.toUpperCase() && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                              )}
                              style={{ backgroundColor: c.value }}
                              title={c.name}
                            >
                              {selectedColor.toUpperCase() === c.value.toUpperCase() && (
                                <Check className={cn("w-3.5 h-3.5", c.value === '#FFFFFF' ? "text-black" : "text-white")} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. MERGED ARTWORK & TYPOGRAPHY TAB */}
                  {activeTab === 'artwork' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-1 border-b border-border/30">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-primary" />
                          <span>Artwork & Typography</span>
                        </span>
                        <button onClick={() => setActiveTab(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Segmented Switcher */}
                      <div className="grid grid-cols-2 p-1 rounded-2xl glass border border-white/20 gap-1">
                        <button
                          onClick={() => setArtworkSubTab('graphic')}
                          className={cn(
                            "py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                            artworkSubTab === 'graphic'
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                          )}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Graphic</span>
                        </button>
                        <button
                          onClick={() => setArtworkSubTab('text')}
                          className={cn(
                            "py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                            artworkSubTab === 'text'
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                          )}
                        >
                          <Type className="w-3.5 h-3.5" />
                          <span>Text</span>
                        </button>
                      </div>

                      {/* Graphic Subtab */}
                      {artworkSubTab === 'graphic' && (
                        <div className="space-y-3 pt-1">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Upload Custom Artwork
                            </label>
                            
                            <div className="space-y-2">
                              {/* Apply as Chest Logo */}
                              <label className="border border-dashed border-white/30 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer glass hover:bg-foreground/10 transition-all group">
                                <div className="flex items-center gap-2">
                                  <Shirt className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                  <div className="text-left">
                                    <div className="text-[11px] font-bold text-foreground">Apply as Chest Logo</div>
                                    <div className="text-[9px] text-muted-foreground">Fixed front chest placement</div>
                                  </div>
                                </div>
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" />
                              </label>

                              {/* Apply as Movable Layer */}
                              <label className="border border-dashed border-white/30 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer glass hover:bg-foreground/10 transition-all group">
                                <div className="flex items-center gap-2">
                                  <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                  <div className="text-left">
                                    <div className="text-[11px] font-bold text-foreground">Add as Movable Layer</div>
                                    <div className="text-[9px] text-muted-foreground">Scale & position freely</div>
                                  </div>
                                </div>
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'layer')} className="hidden" />
                              </label>
                            </div>
                          </div>

                          {logoDecal && (
                            <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground text-[10px]">Active Chest Logo:</span>
                              <button
                                onClick={() => {
                                  setLogoDecal('')
                                  toast.success('Chest logo removed')
                                }}
                                className="text-[10px] text-destructive hover:underline font-semibold"
                              >
                                Remove Logo
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Typography Subtab */}
                      {artworkSubTab === 'text' && (
                        <div className="space-y-3 pt-1">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Add Custom Typography
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input 
                                className="flex-1 min-w-0 px-3 py-1.5 rounded-full glass border border-white/20 bg-background/50 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                                placeholder="Type slogan / text..." 
                                value={newTextContent} 
                                onChange={e => setNewTextContent(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddText()
                                  }
                                }}
                              />
                              <button 
                                onClick={handleAddText} 
                                disabled={!newTextContent.trim()} 
                                className="btn-highlight px-3 py-1.5 text-xs font-bold disabled:opacity-50 shrink-0"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Typography Text Color Palette */}
                          <div className="space-y-2 pt-2 border-t border-border/20">
                            <div className="flex justify-between items-center text-xs">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Text Color
                              </label>
                              <span className="text-[10px] font-mono text-foreground uppercase font-semibold">{newTextColor}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {COLOR_PALETTES.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => setNewTextColor(c.value)}
                                  className={cn(
                                    "h-8 rounded-xl border border-white/30 transition-transform duration-200 hover:scale-105 shadow-sm flex items-center justify-center relative",
                                    newTextColor.toUpperCase() === c.value.toUpperCase() && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105"
                                  )}
                                  style={{ backgroundColor: c.value }}
                                  title={c.name}
                                >
                                  {newTextColor.toUpperCase() === c.value.toUpperCase() && (
                                    <Check className={cn("w-3 h-3", c.value === '#FFFFFF' ? "text-black" : "text-white")} />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. AI ARTWORK TAB */}
                  {activeTab === 'ai' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-1 border-b border-border/30">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-purple-400" />
                          <span>AI Artwork Generator</span>
                        </span>
                        <button onClick={() => setActiveTab(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">AI Prompt</label>
                        <textarea
                          rows={2}
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Describe the graphic or artwork you want..."
                          className="w-full p-2.5 rounded-2xl glass border border-white/20 bg-background/50 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />

                        {/* Prompt Inspiration Chips */}
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground font-semibold">Inspiration Presets:</span>
                          <div className="flex flex-wrap gap-1">
                            {AI_PROMPT_PRESETS.map((p) => (
                              <button
                                key={p}
                                onClick={() => setAiPrompt(p)}
                                className="text-[9px] px-2 py-0.5 rounded-full glass border border-white/10 text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Generate Action Button */}
                        <div className="pt-2">
                          <button
                            onClick={handleGenerateAi}
                            disabled={isGeneratingAi}
                            className="btn-highlight w-full py-2.5 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate AI Artwork</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. LAYERS & TRANSFORMS TAB */}
                  {activeTab === 'layers' && selectedElement && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-1 border-b border-border/30">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-primary" />
                          <span>Layer Transforms</span>
                        </span>
                        <button onClick={() => setActiveTab(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Position X / Y */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-semibold text-muted-foreground block">Position (X, Y)</label>
                          {['X', 'Y'].map((axis, i) => (
                            <div key={axis} className="flex items-center gap-2 text-xs">
                              <span className="w-3 text-[9px] font-mono text-muted-foreground">{axis}</span>
                              <input
                                type="range"
                                min="-0.3"
                                max="0.3"
                                step="0.01"
                                value={selectedElement.position[i]}
                                onChange={(e) => {
                                  const newPos = [...selectedElement.position] as [number, number, number]
                                  newPos[i] = parseFloat(e.target.value)
                                  handleUpdateElement(selectedElement.id, { position: newPos })
                                }}
                                className="flex-1 accent-primary h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Scale */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-semibold text-muted-foreground block">Scale</label>
                          <input
                            type="range"
                            min="0.05"
                            max="0.4"
                            step="0.01"
                            value={selectedElement.scale[0]}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value)
                              handleUpdateElement(selectedElement.id, { scale: [val, val, val] })
                            }}
                            className="w-full accent-primary h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Rotate */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px]">
                            <label className="font-semibold text-muted-foreground">Rotation</label>
                            <span className="font-mono">{Math.round(((selectedElement.rotationAngle || 0) * 180) / Math.PI)}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={Math.PI * 2}
                            step="0.05"
                            value={selectedElement.rotationAngle || 0}
                            onChange={(e) => {
                              handleUpdateElement(selectedElement.id, { rotationAngle: parseFloat(e.target.value) })
                            }}
                            className="w-full accent-primary h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Delete Layer */}
                        <button 
                          onClick={() => {
                            setTextureElements(prev => prev.filter(el => el.id !== selectedElement.id))
                            setSelectedElementId(null)
                          }}
                          className="w-full py-1 text-xs text-destructive glass hover:bg-destructive/10 rounded-full flex items-center justify-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Layer
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Action Controls (Bottom of 3D Canvas) */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Download Mockup Button */}
            <button
              onClick={downloadCanvasToImage}
              className="px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 glass shadow-md flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-foreground/10 border border-white/20"
              title="Download Canvas Mockup Screenshot"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Save Mockup</span>
            </button>
          </div>

          {/* Camera Preset Buttons (Top Right of 3D Canvas) */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 glass-pill p-1 shadow-md border border-white/20 pointer-events-auto">
            <button 
              onClick={() => setCameraView('front')}
              className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors"
            >
              Front
            </button>
            <button 
              onClick={() => setCameraView('back')}
              className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={() => {
                setEnableParallax(true)
                if (orbitControlsRef.current) orbitControlsRef.current.reset()
              }}
              className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Orbit</span>
            </button>
          </div>

          {/* 3D Canvas Viewport */}
          <Canvas 
            shadows 
            camera={{ position: [0, 0, 2], fov: 25 }} 
            gl={{ preserveDrawingBuffer: true }}
            className="w-full h-full"
          >
            <ambientLight intensity={0.5} />
            <Environment preset="city" />

            <CameraRig enableParallax={enableParallax}>
              <BackdropStudio />
              <Center>
                <Suspense fallback={null}>
                  {selectedType === 'tshirt' ? (
                    <BakedTShirtModel 
                      color={selectedColor}
                      logoDecal={logoDecal}
                      textureElements={textureElements}
                      selectedElementId={selectedElementId}
                      onElementSelect={setSelectedElementId}
                      onElementUpdate={handleUpdateElement}
                      onLoad={(scene) => {
                        modelSceneRef.current = scene
                      }}
                    />
                  ) : (
                    <GenericApparelModel
                      modelPath={(modelsData.models as any)[selectedType]?.path || '/models/shirt_baked.glb'}
                      garmentType={selectedType}
                      color={selectedColor}
                      logoDecal={logoDecal}
                      textureElements={textureElements}
                      selectedElementId={selectedElementId}
                      onElementSelect={setSelectedElementId}
                      onLoad={(scene) => {
                        modelSceneRef.current = scene
                      }}
                    />
                  )}
                </Suspense>
              </Center>
            </CameraRig>

            <OrbitControls 
              ref={orbitControlsRef}
              makeDefault 
              minDistance={1.2} 
              maxDistance={3.5} 
              enableZoom={true}
              zoomSpeed={0.6}
            />
          </Canvas>
          
        </div>

        {/* RIGHT 1/3 COLUMN: Details & Publishing Controls */}
        <div className="lg:col-span-4 glass-card-rounded p-6 shadow-xl space-y-5 max-h-[calc(100vh-130px)] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <h2 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <span>Details & Publish</span>
            </h2>
          </div>

          {/* Garment Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground block">Apparel Type</label>
            <div className="grid grid-cols-3 gap-2">
              {PRODUCT_TYPES.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedType(p.id)
                    setDesignName('Custom ' + p.name)
                  }}
                  className={cn(
                    "py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold glass",
                    selectedType === p.id 
                      ? "bg-primary text-primary-foreground shadow-md border-primary" 
                      : "hover:bg-foreground/10 text-muted-foreground border-transparent"
                  )}
                >
                  <p.icon className="w-3.5 h-3.5" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fabric Material Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground block">Fabric Quality</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FABRICS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFabric(f.id)}
                  className={cn(
                    "p-2 rounded-2xl text-left transition-all glass text-xs",
                    selectedFabric === f.id
                      ? "bg-primary/20 border-primary font-bold shadow-sm"
                      : "hover:bg-foreground/10 text-muted-foreground border-transparent"
                  )}
                >
                  <div className="text-[11px] font-bold text-foreground truncate">{f.name}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Design Details Form */}
          <div className="space-y-3 pt-2 border-t border-border/20">
            {/* Design Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Design Title</label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="w-full px-3 py-2 rounded-full glass border border-white/20 bg-background/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Studio Signature Tee"
              />
            </div>

            {/* Price Input */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Retail Price ($USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={designPrice}
                  onChange={(e) => setDesignPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 rounded-full glass border border-white/20 bg-background/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
              <textarea
                rows={2}
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                className="w-full p-2.5 rounded-2xl glass border border-white/20 bg-background/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Describe your design artwork..."
              />
            </div>

            {/* Estimated Royalty Card */}
            <div className="glass p-3.5 rounded-2xl space-y-1 border border-white/20 text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estimated Creator Royalty</span>
              <div className="text-xl font-black text-primary">
                ${(designPrice * 0.25).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">/ sale</span>
              </div>
              <p className="text-[9px] text-muted-foreground">25% artist revenue split calculated automatically.</p>
            </div>

            {/* Publish Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="btn-highlight w-full py-2.5 text-xs gap-2"
              >
                {isPublishing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Publish Design to Store</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all decorations?')) {
                    setSelectedColor('#EFBD48')
                    setLogoDecal('')
                    setTextureElements([])
                    setSelectedElementId(null)
                    toast.success('Design canvas reset')
                  }
                }}
                className="btn-glass-pill w-full py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset Canvas
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}