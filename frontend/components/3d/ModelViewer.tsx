'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three'
import { ProductType } from '@/types'
import { cn } from '@/lib/utils'

interface ModelViewerProps {
  productType: ProductType
  color?: string
  texture?: string | null
  design?: string | null
  className?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

// Loading component
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <div className="text-sm text-muted-foreground">
          Loading model... {Math.round(progress)}%
        </div>
      </div>
    </Html>
  )
}

// 3D Model Component
function Model({
  productType,
  color = '#ffffff',
  texture,
  design,
  onLoad,
  onError
}: {
  productType: ProductType
  color: string
  texture?: string | null
  design?: string | null
  onLoad?: () => void
  onError?: (error: Error) => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [modelData, setModelData] = useState<any>(null)

  // Create a simple geometric model as fallback
  const createFallbackModel = (type: ProductType) => {
    const geometry = new THREE.Group()

    switch (type) {
      case 'tshirt':
        // Simple T-shirt shape
        const tshirtBody = new THREE.BoxGeometry(1, 1.2, 0.1)
        const tshirtSleeves = new THREE.BoxGeometry(1.6, 0.4, 0.1)

        const bodyMesh = new THREE.Mesh(tshirtBody, new THREE.MeshStandardMaterial({ color }))
        const sleevesMesh = new THREE.Mesh(tshirtSleeves, new THREE.MeshStandardMaterial({ color }))

        bodyMesh.position.set(0, 0, 0)
        sleevesMesh.position.set(0, 0.4, 0)

        geometry.add(bodyMesh)
        geometry.add(sleevesMesh)
        break

      case 'hoodie':
        // Simple hoodie shape
        const hoodieBody = new THREE.BoxGeometry(1.2, 1.4, 0.12)
        const hoodieSleeves = new THREE.BoxGeometry(1.8, 0.5, 0.12)
        const hood = new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)

        const hBodyMesh = new THREE.Mesh(hoodieBody, new THREE.MeshStandardMaterial({ color }))
        const hSleevesMesh = new THREE.Mesh(hoodieSleeves, new THREE.MeshStandardMaterial({ color }))
        const hoodMesh = new THREE.Mesh(hood, new THREE.MeshStandardMaterial({ color }))

        hBodyMesh.position.set(0, 0, 0)
        hSleevesMesh.position.set(0, 0.45, 0)
        hoodMesh.position.set(0, 0.8, -0.1)
        hoodMesh.rotation.x = -Math.PI / 4

        geometry.add(hBodyMesh)
        geometry.add(hSleevesMesh)
        geometry.add(hoodMesh)
        break

      case 'pants':
        // Simple pants shape
        const waist = new THREE.BoxGeometry(1, 0.3, 0.1)
        const leftLeg = new THREE.BoxGeometry(0.4, 1.2, 0.1)
        const rightLeg = new THREE.BoxGeometry(0.4, 1.2, 0.1)

        const waistMesh = new THREE.Mesh(waist, new THREE.MeshStandardMaterial({ color }))
        const leftLegMesh = new THREE.Mesh(leftLeg, new THREE.MeshStandardMaterial({ color }))
        const rightLegMesh = new THREE.Mesh(rightLeg, new THREE.MeshStandardMaterial({ color }))

        waistMesh.position.set(0, 0.5, 0)
        leftLegMesh.position.set(-0.3, -0.1, 0)
        rightLegMesh.position.set(0.3, -0.1, 0)

        geometry.add(waistMesh)
        geometry.add(leftLegMesh)
        geometry.add(rightLegMesh)
        break
    }

    return geometry
  }

  // Load or create model
  useEffect(() => {
    try {
      // For now, we'll use fallback geometric models
      const fallbackModel = createFallbackModel(productType)
      setModelData(fallbackModel)
      onLoad?.()
    } catch (error) {
      console.error('Error loading model:', error)
      onError?.(error as Error)
    }
  }, [productType, onLoad, onError])

  // Update color when it changes
  useEffect(() => {
    if (modelData) {
      modelData.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.color.setStyle(color)
          child.material.needsUpdate = true
        }
      })
    }
  }, [modelData, color])

  // Animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  if (!modelData) return null

  return (
    <group ref={meshRef}>
      <primitive object={modelData} />

      {/* Add design overlay if provided */}
      {design && (
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[0.6, 0.8]} />
          <meshBasicMaterial
            map={new THREE.TextureLoader().load(design)}
            transparent
            alphaTest={0.1}
          />
        </mesh>
      )}
    </group>
  )
}

// Error Boundary Component
function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Html center>
      <div className="text-center p-4 max-w-sm">
        <div className="text-destructive text-sm mb-2">Failed to load 3D model</div>
        <div className="text-xs text-muted-foreground mb-4">{error.message}</div>
        <button
          onClick={onRetry}
          className="btn-outline text-xs px-3 py-1"
        >
          Retry
        </button>
      </div>
    </Html>
  )
}

// Main ModelViewer Component
const ModelViewer = ({
  productType,
  color = '#ffffff',
  texture,
  design,
  className,
  onLoad,
  onError
}: ModelViewerProps) => {
  const [error, setError] = useState<Error | null>(null)
  const [key, setKey] = useState(0) // For forcing re-render

  const handleError = (error: Error) => {
    setError(error)
    onError?.(error)
  }

  const handleRetry = () => {
    setError(null)
    setKey(prev => prev + 1)
  }

  const handleLoad = () => {
    setError(null)
    onLoad?.()
  }

  return (
    <div className={cn('w-full h-full relative bg-gradient-to-b from-background to-secondary/20', className)}>
      <Canvas
        key={key}
        camera={{ position: [0, 0, 4], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {/* Environment */}
        <Environment preset="studio" />

        {/* Ground */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
          resolution={512}
          color="#000000"
        />

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />

        {/* Model */}
        {error ? (
          <ErrorFallback error={error} onRetry={handleRetry} />
        ) : (
          <Suspense fallback={<Loader />}>
            <Model
              productType={productType}
              color={color}
              texture={texture}
              design={design}
              onLoad={handleLoad}
              onError={handleError}
            />
          </Suspense>
        )}
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        <div className="glass px-3 py-2 rounded-lg text-xs text-muted-foreground">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  )
}

export default ModelViewer
