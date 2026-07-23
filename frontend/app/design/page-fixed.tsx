'use client'

import { useState, useRef, Suspense, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Text } from '@react-three/drei'
import { motion } from 'framer-motion'
import { Shirt, Palette, Download, Plus, RotateCcw, Type, ImageIcon, X, Move, Maximize2, Trash2, MousePointer2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

// Product types
const PRODUCT_TYPES = [
  { id: 'tshirt', name: 'T-shirt', icon: Shirt, modelPath: '/models/tshirt.glb' },
  { id: 'hoodie', name: 'Hoodie', icon: Shirt, modelPath: '/models/hoodie.glb' },
  { id: 'pants', name: 'Pants', icon: Shirt, modelPath: '/models/pants.glb' }
]

// Preload all models
PRODUCT_TYPES.forEach(product => {
  useGLTF.preload(product.modelPath)
})

// Color options
const COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Navy', value: '#1e3a8a' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Yellow', value: '#ca8a04' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Pink', value: '#ec4899' }
]

// Texture element interface
interface TextureElement {
  id: string
  type: 'image' | 'text'
  content: string
  position: [number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number]
  color?: string
  fontSize?: number
  imageUrl?: string
  uvPosition: [number, number]
  uvScale: [number, number]
}

function CanvasLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/10">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading 3D Studio...</p>
      </div>
    </div>
  )
}

// FIX #1: Improved texture creation with proper async image loading
function useTextureCanvas(textureElements: TextureElement[], onTextureReady?: (canvas: HTMLCanvasElement) => void) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesLoadedRef = useRef(0)
  const imagesToLoadRef = useRef(0)

  return useMemo(() => {
    const createCombinedTexture = async (): Promise<HTMLCanvasElement | null> => {
      if (textureElements.length === 0) return null

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Set canvas size for texture resolution
      canvas.width = 2048
      canvas.height = 2048

      // Fill with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // FIX #2: Handle images properly with Promise.all
      const imagePromises: Promise<HTMLImageElement>[] = []

      textureElements.forEach((element) => {
        if (element.type === 'text') {
          // Render text immediately
          const fontSize = Math.max(40, (element.fontSize || 0.5) * 200)
          ctx.font = `bold ${fontSize}px Arial, sans-serif`
          ctx.fillStyle = element.color || '#000000'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          // Convert 3D position to texture coordinates
          const texX = ((element.uvPosition[0]) * canvas.width)
          const texY = ((element.uvPosition[1]) * canvas.height)

          // Apply rotation and scale
          ctx.save()
          ctx.translate(texX, texY)
          ctx.rotate(element.rotation[2])

          const textScale = element.scale[0] * 50
          ctx.scale(textScale, textScale)

          ctx.fillText(element.content, 0, 0)
          ctx.restore()

        } else if (element.type === 'image' && element.imageUrl) {
          // Load image asynchronously
          imagePromises.push(
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image()
              img.onload = () => {
                // Draw image to canvas once loaded
                const scale = element.scale[0] * 300
                const texX = ((element.uvPosition[0]) * canvas.width)
                const texY = ((element.uvPosition[1]) * canvas.height)

                ctx.save()
                ctx.translate(texX, texY)
                ctx.rotate(element.rotation[2])
                ctx.drawImage(img, -scale / 2, -scale / 2, scale, scale)
                ctx.restore()

                resolve(img)
              }
              img.onerror = reject
              img.src = element.imageUrl
            })
          )
        }
      })

      // Wait for all images to load before returning canvas
      if (imagePromises.length > 0) {
        try {
          await Promise.all(imagePromises)
        } catch (error) {
          console.error('Error loading images for texture:', error)
        }
      }

      canvasRef.current = canvas
      if (onTextureReady) {
        onTextureReady(canvas)
      }
      return canvas
    }

    return createCombinedTexture
  }, [textureElements, onTextureReady])
}

// FIX #3: Improved 3D Model component with better texture application
function GLBModel({
  type,
  color,
  textureElements,
  onElementUpdate,
  onElementSelect,
  selectedElementId,
  isEditing,
  onStartEdit,
  onStopEdit
}: {
  type: string
  color: string
  textureElements: TextureElement[]
  onElementUpdate: (id: string, updates: Partial<TextureElement>) => void
  onElementSelect: (id: string) => void
  selectedElementId: string | null
  isEditing: boolean
  onStartEdit: (id: string) => void
  onStopEdit: () => void
}) {
  const modelPath = PRODUCT_TYPES.find(p => p.id === type)?.modelPath || '/models/tshirt.glb'
  const { scene } = useGLTF(modelPath)
  const texturesRef = useRef(new Map<THREE.Mesh, THREE.CanvasTexture>())

  const createCombinedTexture = useTextureCanvas(textureElements)

  // Apply base color and texture to all meshes
  useEffect(() => {
    if (!scene) return

    const applyTextures = async () => {
      const combinedCanvas = await createCombinedTexture()

      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          // Clone material to avoid affecting other instances
          const material = child.material.clone()
          material.color.setStyle(color)

          // Apply combined texture if elements exist
          if (combinedCanvas) {
            const texture = new THREE.CanvasTexture(combinedCanvas)
            texture.encoding = THREE.sRGBColorSpace
            texture.needsUpdate = true

            // FIX #4: Proper UV mapping wrapping
            texture.wrapS = THREE.ClampToEdgeWrapping
            texture.wrapT = THREE.ClampToEdgeWrapping
            texture.magFilter = THREE.LinearFilter
            texture.minFilter = THREE.LinearMipMapLinearFilter

            material.map = texture
            material.transparent = true
            material.alphaTest = 0.1
            material.side = THREE.FrontSide // Changed from DoubleSide for better performance
            material.depthWrite = true

            // Store for cleanup later
            const oldTexture = texturesRef.current.get(child)
            if (oldTexture) oldTexture.dispose()
            texturesRef.current.set(child, texture)
          } else {
            // Remove texture if no elements
            const oldTexture = texturesRef.current.get(child)
            if (oldTexture) oldTexture.dispose()
            texturesRef.current.delete(child)
            material.map = null
          }

          material.needsUpdate = true
          child.material = material
        }
      })
    }

    applyTextures()

    // Cleanup on unmount
    return () => {
      texturesRef.current.forEach(texture => texture.dispose())
      texturesRef.current.clear()
    }
  }, [scene, color, createCombinedTexture])

  return (
    <group>
      <primitive object={scene} />

      {/* FIX #5: Show visual representation of texture elements on the model */}
      {textureElements.map((element) => (
        <mesh
          key={element.id}
          position={element.position}
          scale={element.scale}
          rotation={element.rotation}
          onClick={(e) => {
            e.stopPropagation()
            onElementSelect(element.id)
          }}
        >
          {/* Transparent plane for interaction */}
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            transparent
            opacity={0.1}
            color={selectedElementId === element.id ? '#00ff00' : '#ffffff'}
          />
        </mesh>
      ))}

      {/* Selection indicator on model */}
      {selectedElementId && (
        <mesh position={textureElements.find(el => el.id === selectedElementId)?.position || [0, 0, 0]}>
          <boxGeometry args={[1.5, 1.5, 0.1]} />
          <meshBasicMaterial
            color={isEditing ? '#ff8800' : '#00ff00'}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}
    </group>
  )
}

export default function DesignPage() {
  const [selectedType, setSelectedType] = useState('tshirt')
  const [selectedColor, setSelectedColor] = useState('#ffffff')
  const [designName, setDesignName] = useState('')
  const [textureElements, setTextureElements] = useState<TextureElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isAddingElement, setIsAddingElement] = useState(false)
  const [newElementType, setNewElementType] = useState<'text' | 'image'>('text')
  const [newElementContent, setNewElementContent] = useState('')
  const [newElementColor, setNewElementColor] = useState('#000000')
  const [newElementFontSize, setNewElementFontSize] = useState(0.5)
  const [newElementImage, setNewElementImage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const handleAddElement = () => {
    if (newElementType === 'text' && !newElementContent.trim()) {
      alert('Please enter text content')
      return
    }

    if (newElementType === 'image' && !newElementImage) {
      alert('Please upload an image')
      return
    }

    const newElement: TextureElement = {
      id: Date.now().toString(),
      type: newElementType,
      content: newElementType === 'text' ? newElementContent : '',
      position: [0, 0, 0.1],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      color: newElementColor,
      fontSize: newElementFontSize,
      imageUrl: newElementType === 'image' ? newElementImage || undefined : undefined,
      uvPosition: [0.5, 0.5],
      uvScale: [1, 1]
    }

    setTextureElements(prev => [...prev, newElement])
    setSelectedElementId(newElement.id)

    // Reset form
    setNewElementContent('')
    setNewElementImage(null)
    setIsAddingElement(false)
  }

  const handleRemoveElement = () => {
    if (selectedElementId) {
      setTextureElements(prev => prev.filter(el => el.id !== selectedElementId))
      setSelectedElementId(null)
    }
  }

  const handleElementUpdate = (id: string, updates: Partial<TextureElement>) => {
    setTextureElements(prev =>
      prev.map(element =>
        element.id === id ? { ...element, ...updates } : element
      )
    )
  }

  const handleAddToStore = () => {
    if (!designName.trim()) {
      alert('Please enter a design name')
      return
    }

    console.log('Adding design to store:', {
      name: designName,
      type: selectedType,
      color: selectedColor,
      elements: textureElements
    })

    alert('Design added to store successfully!')
  }

  const handleReset = () => {
    setSelectedColor('#ffffff')
    setDesignName('')
    setTextureElements([])
    setSelectedElementId(null)
    setNewElementContent('')
    setNewElementColor('#000000')
    setNewElementFontSize(0.5)
    setNewElementImage(null)
    setIsAddingElement(false)
    setIsEditing(false)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewElementImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const selectedElement = textureElements.find(el => el.id === selectedElementId)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">3D Design Studio</h1>
          <p className="text-muted-foreground">
            Create and customize your merchandise designs with interactive 3D elements
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Product Type Selection */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Shirt className="w-5 h-5 mr-2" />
                Product Type
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {PRODUCT_TYPES.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedType(product.id)}
                    className={cn(
                      "flex items-center p-3 rounded-lg border transition-all",
                      selectedType === product.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <product.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{product.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Base Color
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      "w-12 h-12 rounded-lg border-2 transition-all",
                      selectedColor === color.value
                        ? "border-primary scale-110"
                        : "border-border hover:border-primary/50"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Add/Remove Elements - simplified for this fix */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Elements ({textureElements.length})
              </h3>
              <button
                onClick={() => setIsAddingElement(true)}
                className="w-full btn-primary flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Element
              </button>
            </div>

            {/* Design Name */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Design Name</h3>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="Enter design name..."
                className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Actions */}
            <div className="glass rounded-xl p-6 space-y-4">
              <button
                onClick={handleAddToStore}
                className="w-full btn-primary flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add to Store
              </button>

              <button
                onClick={handleReset}
                className="w-full btn-outline flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset Design
              </button>
            </div>
          </div>

          {/* Center - 3D Canvas */}
          <div className="lg:col-span-2">
            <div className="glass rounded-xl p-6">
              <div className="aspect-square w-full rounded-lg overflow-hidden bg-gradient-to-br from-muted/20 to-muted/10">
                <Suspense fallback={<CanvasLoader />}>
                  <Canvas
                    camera={{ position: [0, 0, 5], fov: 50 }}
                    className="w-full h-full"
                  >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <pointLight position={[-10, -10, -5]} intensity={0.5} />

                    <GLBModel
                      type={selectedType}
                      color={selectedColor}
                      textureElements={textureElements}
                      onElementUpdate={handleElementUpdate}
                      onElementSelect={setSelectedElementId}
                      selectedElementId={selectedElementId}
                      isEditing={isEditing}
                      onStartEdit={(id) => {
                        setIsEditing(true)
                        setSelectedElementId(id)
                      }}
                      onStopEdit={() => setIsEditing(false)}
                    />

                    <OrbitControls
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                      minDistance={2}
                      maxDistance={10}
                    />

                    <Environment preset="studio" />
                  </Canvas>
                </Suspense>
              </div>

              {/* Canvas Controls */}
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Scroll to zoom, right-click and drag to rotate model, click elements to select</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
