'use client'

import { useState, useRef, Suspense, useEffect, useCallback } from 'react'
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
  uvPosition: [number, number] // UV coordinates for texture mapping
  uvScale: [number, number] // UV scale for texture mapping
}

// Loading component for 3D canvas
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

// Interactive Texture Element Component
function InteractiveTextureElement({ 
  element, 
  onUpdate, 
  onSelect, 
  isSelected,
  isEditing,
  onStartEdit,
  onStopEdit,
  invisible = false
}: { 
  element: TextureElement
  onUpdate: (id: string, updates: Partial<TextureElement>) => void
  onSelect: (id: string) => void
  isSelected: boolean
  isEditing: boolean
  onStartEdit: (id: string) => void
  onStopEdit: () => void
  invisible?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0])
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState<[number, number]>([0, 0])
  
  // Handle mouse events for dragging and resizing
  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    onSelect(element.id)
    
    if (e.button === 0) { // Left click
      if (e.altKey) { // Alt + click for resizing
        setIsResizing(true)
        setResizeStart([e.clientX, e.clientY])
      } else if (isEditing) { // Only allow dragging in edit mode
        setIsDragging(true)
        setDragStart([e.clientX, e.clientY])
      }
    }
  }, [element.id, onSelect, isEditing])

  // Prevent orbit controls when interacting with elements
  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation()
    if (!isDragging && !isResizing) {
      document.body.style.cursor = isEditing ? 'move' : 'pointer'
    }
  }, [isDragging, isResizing, isEditing])

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation()
    if (!isDragging && !isResizing) {
      document.body.style.cursor = 'default'
    }
  }, [isDragging, isResizing])

  const handlePointerMove = useCallback((e: any) => {
    if (isDragging && meshRef.current) {
      const deltaX = (e.clientX - dragStart[0]) * 0.01
      const deltaY = (e.clientY - dragStart[1]) * 0.01
      
      const newPosition: [number, number, number] = [
        element.position[0] + deltaX,
        element.position[1] - deltaY,
        element.position[2]
      ]
      
      onUpdate(element.id, { position: newPosition })
      setDragStart([e.clientX, e.clientY])
    }
    
    if (isResizing && meshRef.current) {
      const deltaX = (e.clientX - resizeStart[0]) * 0.01
      const deltaY = (e.clientY - resizeStart[1]) * 0.01
      
      // Calculate new scale based on mouse movement
      const scaleFactor = 1 + (deltaX + deltaY) * 0.5
      const newScale: [number, number, number] = [
        Math.max(0.1, element.scale[0] * scaleFactor),
        Math.max(0.1, element.scale[1] * scaleFactor),
        element.scale[2]
      ]
      
      onUpdate(element.id, { scale: newScale })
      setResizeStart([e.clientX, e.clientY])
    }
  }, [isDragging, isResizing, dragStart, resizeStart, element, onUpdate])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...element.position)
      meshRef.current.scale.set(...element.scale)
      meshRef.current.rotation.set(...element.rotation)
    }
  }, [element])

  // Add global event listeners for mouse movement
  useEffect(() => {
    if (isDragging || isResizing) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          const deltaX = (e.clientX - dragStart[0]) * 0.01
          const deltaY = (e.clientY - dragStart[1]) * 0.01
          
          const newPosition: [number, number, number] = [
            element.position[0] + deltaX,
            element.position[1] - deltaY,
            element.position[2]
          ]
          
          onUpdate(element.id, { position: newPosition })
          setDragStart([e.clientX, e.clientY])
        }
        
        if (isResizing) {
          const deltaX = (e.clientX - resizeStart[0]) * 0.01
          const deltaY = (e.clientY - resizeStart[1]) * 0.01
          
          const newScale: [number, number, number] = [
            Math.max(0.1, element.scale[0] + deltaX),
            Math.max(0.1, element.scale[1] + deltaY),
            element.scale[2]
          ]
          
          onUpdate(element.id, { scale: newScale })
          setResizeStart([e.clientX, e.clientY])
        }
      }

      const handleGlobalMouseUp = () => {
        setIsDragging(false)
        setIsResizing(false)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, element, onUpdate])

    return (
    <group>
      {!invisible && (
        <>
          {element.type === 'text' ? (
            <Text
              ref={meshRef}
              position={element.position}
              scale={element.scale}
              rotation={element.rotation}
              fontSize={element.fontSize || 0.5}
              color={element.color || '#000000'}
              anchorX="center"
              anchorY="middle"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              {element.content}
            </Text>
          ) : (
            <mesh
              ref={meshRef}
              position={element.position}
              scale={element.scale}
              rotation={element.rotation}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                map={new THREE.TextureLoader().load(element.imageUrl || '')}
                transparent
                alphaTest={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </>
      )}
      
      {/* Invisible interaction mesh for editing when element is invisible */}
      {invisible && (
        <mesh
          ref={meshRef}
          position={element.position}
          scale={element.scale}
          rotation={element.rotation}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={element.position}>
          <boxGeometry args={[element.scale[0] * 2, element.scale[1] * 2, 0.1]} />
          <meshBasicMaterial 
            color={isEditing ? "#ff8800" : "#00ff00"} 
            transparent 
            opacity={0.3} 
            wireframe 
          />
        </mesh>
      )}
      
      {/* Edit mode indicator */}
      {isEditing && (
        <group position={element.position}>
          {/* Resize handles - corners */}
          <mesh 
            position={[element.scale[0], element.scale[1], 0]}
            onPointerDown={(e) => {
              e.stopPropagation()
              setIsResizing(true)
              setResizeStart([e.clientX, e.clientY])
            }}
            onPointerOver={() => document.body.style.cursor = 'nw-resize'}
            onPointerOut={() => document.body.style.cursor = 'default'}
          >
            <boxGeometry args={[0.2, 0.2, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          
          <mesh 
            position={[-element.scale[0], element.scale[1], 0]}
            onPointerDown={(e) => {
              e.stopPropagation()
              setIsResizing(true)
              setResizeStart([e.clientX, e.clientY])
            }}
            onPointerOver={() => document.body.style.cursor = 'ne-resize'}
            onPointerOut={() => document.body.style.cursor = 'default'}
          >
            <boxGeometry args={[0.2, 0.2, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          
          <mesh 
            position={[element.scale[0], -element.scale[1], 0]}
            onPointerDown={(e) => {
              e.stopPropagation()
              setIsResizing(true)
              setResizeStart([e.clientX, e.clientY])
            }}
            onPointerOver={() => document.body.style.cursor = 'sw-resize'}
            onPointerOut={() => document.body.style.cursor = 'default'}
          >
            <boxGeometry args={[0.2, 0.2, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          
          <mesh 
            position={[-element.scale[0], -element.scale[1], 0]}
            onPointerDown={(e) => {
              e.stopPropagation()
              setIsResizing(true)
              setResizeStart([e.clientX, e.clientY])
            }}
            onPointerOver={() => document.body.style.cursor = 'se-resize'}
            onPointerOut={() => document.body.style.cursor = 'default'}
          >
            <boxGeometry args={[0.2, 0.2, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          
          {/* Rotation handle */}
          <mesh 
            position={[0, element.scale[1] + 0.3, 0]}
            onPointerDown={(e) => {
              e.stopPropagation()
              // Start rotation mode
              const startAngle = Math.atan2(e.clientY - window.innerHeight / 2, e.clientX - window.innerWidth / 2)
              const startRotation = element.rotation[2]
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const currentAngle = Math.atan2(moveEvent.clientY - window.innerHeight / 2, moveEvent.clientX - window.innerWidth / 2)
                const deltaAngle = currentAngle - startAngle
                const newRotation = startRotation + deltaAngle
                
                onUpdate(element.id, { 
                  rotation: [element.rotation[0], element.rotation[1], newRotation] 
                })
              }
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }
              
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
            onPointerOver={() => document.body.style.cursor = 'grab'}
            onPointerOut={() => document.body.style.cursor = 'default'}
          >
            <torusGeometry args={[0.15, 0.05, 8, 16]} />
            <meshBasicMaterial color="#0000ff" />
          </mesh>
        </group>
      )}
    </group>
  )
}

// 3D Model Component with Surface Textures
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
  
  // Create a combined texture from all elements
  const createCombinedTexture = useCallback(() => {
    if (textureElements.length === 0) return null
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    // Set canvas size for texture resolution
    canvas.width = 1024
    canvas.height = 1024
    
    // Fill with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Render each element as a texture
    textureElements.forEach((element) => {
      if (element.type === 'text') {
        // Render text
        const fontSize = Math.max(20, (element.fontSize || 0.5) * 100)
        ctx.font = `${fontSize}px Arial, sans-serif`
        ctx.fillStyle = element.color || '#000000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Convert 3D position to texture coordinates (UV mapping)
        // Map from 3D space (-2 to 2) to texture space (0 to canvas size)
        const texX = ((element.position[0] + 2) / 4) * canvas.width
        const texY = ((element.position[1] + 2) / 4) * canvas.height
        
        // Apply rotation
        ctx.save()
        ctx.translate(texX, texY)
        ctx.rotate(element.rotation[2])
        
        // Apply scale
        const textScale = element.scale[0] * 2
        ctx.scale(textScale, textScale)
        
        // Draw text
        ctx.fillText(element.content, 0, 0)
        ctx.restore()
        
      } else if (element.type === 'image' && element.imageUrl) {
        // Render image
        const img = new Image()
        img.onload = () => {
          const scale = element.scale[0] * 200 // Scale factor for texture
          const texX = ((element.position[0] + 2) / 4) * canvas.width
          const texY = ((element.position[1] + 2) / 4) * canvas.height
          
          ctx.save()
          ctx.translate(texX, texY)
          ctx.rotate(element.rotation[2])
          ctx.drawImage(
            img, 
            -scale/2, -scale/2, 
            scale, scale
          )
          ctx.restore()
        }
        img.src = element.imageUrl
      }
    })
    
    return canvas
  }, [textureElements])
  
  // Function to update texture on existing materials
  const updateTexture = useCallback(() => {
    if (scene) {
      const combinedTexture = createCombinedTexture()
      
      scene.traverse((child: any) => {
        if (child.isMesh && child.material && child.userData.texture) {
          if (combinedTexture) {
            // Update existing texture
            child.userData.texture.image = combinedTexture
            child.userData.texture.needsUpdate = true
          } else {
            // Remove texture
            child.material.map = null
            child.userData.texture.dispose()
            delete child.userData.texture
          }
        }
      })
    }
  }, [scene, createCombinedTexture])

  // Apply base color and texture to the model
  useEffect(() => {
    if (scene) {
      const combinedTexture = createCombinedTexture()
      
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const material = child.material.clone()
          material.color.setStyle(color)
          
          // Apply the combined texture if we have elements
          if (combinedTexture) {
            const texture = new THREE.CanvasTexture(combinedTexture)
            texture.needsUpdate = true
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(1, 1)
            material.map = texture
            material.transparent = true
            material.alphaTest = 0.1
            material.side = THREE.DoubleSide
            
            // Store texture reference for updates
            child.userData.texture = texture
          } else {
            // Remove texture if no elements
            material.map = null
            if (child.userData.texture) {
              child.userData.texture.dispose()
              delete child.userData.texture
            }
          }
          
          material.needsUpdate = true
          child.material = material
        }
      })
    }
  }, [scene, color, createCombinedTexture])

  // Update texture when elements change
  useEffect(() => {
    updateTexture()
  }, [updateTexture])

  return (
    <group>
      <primitive object={scene} />
      
      {/* Render interactive handles for editing (invisible but functional) */}
      {textureElements.map((element) => (
        <InteractiveTextureElement
          key={element.id}
          element={element}
          onUpdate={onElementUpdate}
          onSelect={onElementSelect}
          isSelected={selectedElementId === element.id}
          isEditing={isEditing}
          onStartEdit={onStartEdit}
          onStopEdit={onStopEdit}
          invisible={true} // Make the element itself invisible since it's now a texture
        />
      ))}
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Add new texture element
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
      uvPosition: [0.5, 0.5], // Center of texture
      uvScale: [1, 1] // Full texture size
    }

    setTextureElements(prev => [...prev, newElement])
    setSelectedElementId(newElement.id)
    
    // Reset form
    setNewElementContent('')
    setNewElementImage(null)
    setIsAddingElement(false)
  }

  // Remove selected element
  const handleRemoveElement = () => {
    if (selectedElementId) {
      setTextureElements(prev => prev.filter(el => el.id !== selectedElementId))
      setSelectedElementId(null)
    }
  }

  // Update element properties
  const handleElementUpdate = (id: string, updates: Partial<TextureElement>) => {
    setTextureElements(prev =>
      prev.map(element =>
        element.id === id ? { ...element, ...updates } : element
      )
    )
  }

  const handleStartEdit = (id: string) => {
    setIsEditing(true)
    setSelectedElementId(id)
  }

  const handleStopEdit = () => {
    setIsEditing(false)
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

            {/* Add New Element */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add Element
              </h3>
              
              {!isAddingElement ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsAddingElement(true)
                      setNewElementType('text')
                    }}
                    className="w-full btn-outline flex items-center justify-center"
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Add Text
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingElement(true)
                      setNewElementType('image')
                    }}
                    className="w-full btn-outline flex items-center justify-center"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Element Type Selection */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setNewElementType('text')}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded border transition-all",
                        newElementType === 'text'
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setNewElementType('image')}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded border transition-all",
                        newElementType === 'image'
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      Image
                    </button>
                  </div>

                  {/* Text Input */}
                  {newElementType === 'text' && (
                    <>
                      <input
                        type="text"
                        value={newElementContent}
                        onChange={(e) => setNewElementContent(e.target.value)}
                        placeholder="Enter text content..."
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Text Color
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {COLORS.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setNewElementColor(color.value)}
                              className={cn(
                                "w-8 h-8 rounded-lg border-2 transition-all",
                                newElementColor === color.value
                                  ? "border-primary scale-110"
                                  : "border-border hover:border-primary/50"
                              )}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Font Size: {newElementFontSize}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="2"
                          step="0.1"
                          value={newElementFontSize}
                          onChange={(e) => setNewElementFontSize(parseFloat(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </>
                  )}

                  {/* Image Upload */}
                  {newElementType === 'image' && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {newElementImage && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                          <img
                            src={newElementImage}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={() => setNewElementImage(null)}
                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddElement}
                      className="flex-1 btn-primary"
                      disabled={
                        (newElementType === 'text' && !newElementContent.trim()) ||
                        (newElementType === 'image' && !newElementImage)
                      }
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingElement(false)
                        setNewElementContent('')
                        setNewElementImage(null)
                      }}
                      className="flex-1 btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Element Properties */}
            {selectedElement && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Move className="w-5 h-5 mr-2" />
                  Element Properties
                </h3>
                
                <div className="space-y-4">
                  {/* Edit Mode Toggle */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (isEditing) {
                          handleStopEdit()
                        } else {
                          handleStartEdit(selectedElement.id)
                        }
                      }}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded border transition-all flex items-center justify-center",
                        isEditing
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <MousePointer2 className="w-4 h-4 mr-2" />
                      {isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                    </button>
                  </div>

                  {/* Position Controls */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Position
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['X', 'Y', 'Z'].map((axis, index) => (
                        <div key={axis}>
                          <label className="block text-xs text-muted-foreground mb-1">
                            {axis}: {selectedElement.position[index].toFixed(2)}
                          </label>
                          <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            value={selectedElement.position[index]}
                            onChange={(e) => {
                              const newPosition = [...selectedElement.position] as [number, number, number]
                              newPosition[index] = parseFloat(e.target.value)
                              handleElementUpdate(selectedElement.id, { position: newPosition })
                            }}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scale Controls */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Scale
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['X', 'Y', 'Z'].map((axis, index) => (
                        <div key={axis}>
                          <label className="block text-xs text-muted-foreground mb-1">
                            {axis}: {selectedElement.scale[index].toFixed(2)}
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={selectedElement.scale[index]}
                            onChange={(e) => {
                              const newScale = [...selectedElement.scale] as [number, number, number]
                              newScale[index] = parseFloat(e.target.value)
                              handleElementUpdate(selectedElement.id, { scale: newScale })
                            }}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rotation Controls */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rotation (degrees)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['X', 'Y', 'Z'].map((axis, index) => (
                        <div key={axis}>
                          <label className="block text-xs text-muted-foreground mb-1">
                            {axis}: {(selectedElement.rotation[index] * 180 / Math.PI).toFixed(0)}°
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="15"
                            value={(selectedElement.rotation[index] * 180 / Math.PI)}
                            onChange={(e) => {
                              const newRotation = [...selectedElement.rotation] as [number, number, number]
                              newRotation[index] = (parseFloat(e.target.value) * Math.PI / 180)
                              handleElementUpdate(selectedElement.id, { rotation: newRotation })
                            }}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={handleRemoveElement}
                    className="w-full btn-outline text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Element
                  </button>
                </div>
              </div>
            )}

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
                    ref={canvasRef}
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
                      onStartEdit={handleStartEdit}
                      onStopEdit={handleStopEdit}
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
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  <p>
                    {isEditing 
                      ? 'Edit Mode: Drag elements to move, use corner handles to resize, blue ring to rotate'
                      : 'Click elements to select, scroll to zoom, right-click and drag to rotate model'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span>Type: {PRODUCT_TYPES.find(p => p.id === selectedType)?.name}</span>
                  <span>Color: {COLORS.find(c => c.value === selectedColor)?.name}</span>
                  <span>Elements: {textureElements.length}</span>
                  {isEditing && <span className="text-primary">Editing</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">How to Use</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">1. Choose Product</h4>
              <p className="text-sm text-muted-foreground">
                Select from T-shirts, Hoodies, or Pants to start your design
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">2. Add Elements</h4>
              <p className="text-sm text-muted-foreground">
                Add text or images that will be rendered as textures on the 3D model surface
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">3. Texture Mapping</h4>
              <p className="text-sm text-muted-foreground">
                Elements are now applied as actual textures that wrap around the model surface
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">4. Interactive Editing</h4>
              <p className="text-sm text-muted-foreground">
                Use edit mode to position, scale, and rotate texture elements on the model
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
