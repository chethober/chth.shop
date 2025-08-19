'use client'

import { useState, useRef, Suspense, useEffect } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment, useProgress, Html } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { motion } from 'framer-motion'
import { Shirt, Palette, Download, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'


// Product types
const PRODUCT_TYPES = [
  { id: 'tshirt', name: 'T-shirt', icon: Shirt, modelPath: '/models/tshirt.glb' },
  { id: 'hoodie', name: 'Hoodie', icon: Shirt, modelPath: '/models/hoodie.glb' },
  { id: 'pants', name: 'Pants', icon: Shirt, modelPath: '/models/pants.glb' }
]

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

// GLB Model Component
function GLBModel({ type, color }: { type: string; color: string }) {
  const modelPath = PRODUCT_TYPES.find(p => p.id === type)?.modelPath || '/models/tshirt.glb'
  const gltf = useLoader(GLTFLoader, modelPath)
  
  // Apply color to all meshes in the model
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              if (mat.color) mat.color.setStyle(color)
            })
          } else {
            if (child.material.color) child.material.color.setStyle(color)
          }
        }
      })
    }
  }, [gltf, color])

  return <primitive object={gltf.scene} />
}

export default function DesignPage() {
  const [selectedType, setSelectedType] = useState('tshirt')
  const [selectedColor, setSelectedColor] = useState('#ffffff')
  const [designName, setDesignName] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleAddToStore = () => {
    if (!designName.trim()) {
      alert('Please enter a design name')
      return
    }
    
    // Here you would typically save the design to the backend
    console.log('Adding design to store:', {
      name: designName,
      type: selectedType,
      color: selectedColor
    })
    
    alert('Design added to store successfully!')
  }

  const handleReset = () => {
    setSelectedColor('#ffffff')
    setDesignName('')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">3D Design Studio</h1>
          <p className="text-muted-foreground">
            Create and customize your merchandise designs with our interactive 3D editor
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
                Color
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
                  
                                     <GLBModel type={selectedType} color={selectedColor} />
                  
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
                  <p>Use mouse to rotate, scroll to zoom</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span>Type: {PRODUCT_TYPES.find(p => p.id === selectedType)?.name}</span>
                  <span>Color: {COLORS.find(c => c.value === selectedColor)?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">How to Use</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">1. Choose Product</h4>
              <p className="text-sm text-muted-foreground">
                Select from T-shirts, Hoodies, or Pants to start your design
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">2. Customize Colors</h4>
              <p className="text-sm text-muted-foreground">
                Pick from our wide range of colors and see changes in real-time
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">3. Preview & Save</h4>
              <p className="text-sm text-muted-foreground">
                Rotate and zoom to preview your design, then add it to your store
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
