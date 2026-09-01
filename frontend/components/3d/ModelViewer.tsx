'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Html, useProgress, useGLTF, Decal, useTexture } from '@react-three/drei'
import { easing } from 'maath'
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
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <div className="text-xs text-muted-foreground">
          Loading 3D model... {Math.round(progress)}%
        </div>
      </div>
    </Html>
  )
}

// 3D Shirt Model
function ShirtModel({ color = '#ffffff', design }: { color?: string; design?: string | null }) {
  const { nodes, materials } = useGLTF('/models/shirt_baked.glb') as any
  const designTexture = design ? useTexture(design) : null

  useFrame((_, delta) => {
    if (materials?.lambert1?.color) {
      easing.dampC(materials.lambert1.color, color, 0.25, delta)
    }
  })

  return (
    <group dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes?.T_Shirt_male?.geometry}
        material={materials?.lambert1}
        material-roughness={1}
      >
        {designTexture && (
          <Decal
            position={[0, 0.04, 0.15]}
            rotation={[0, 0, 0]}
            scale={0.15}
            map={designTexture}
          />
        )}
      </mesh>
    </group>
  )
}

// Generic GLTF Model
function GenericModel({ modelPath, color = '#ffffff' }: { modelPath: string; color?: string }) {
  const { scene } = useGLTF(modelPath) as any

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.material && child.material.color) {
          child.material.color.set(color)
        }
      })
    }
  }, [scene, color])

  return <primitive object={scene} />
}

// Main ModelViewer Component
const ModelViewer = ({
  productType,
  color = '#ffffff',
  texture,
  design,
  className,
  onLoad
}: ModelViewerProps) => {
  return (
    <div className={cn('w-full h-full relative bg-gradient-to-b from-background to-secondary/20', className)}>
      <Canvas
        camera={{ position: [0, 0, 2.2], fov: 30 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <Environment preset="city" />

        <ContactShadows
          position={[0, -0.8, 0]}
          opacity={0.4}
          scale={5}
          blur={2}
          far={3}
          resolution={512}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.2}
          maxDistance={4}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />

        <Suspense fallback={<Loader />}>
          {productType === 'tshirt' ? (
            <ShirtModel color={color} design={design} />
          ) : (
            <GenericModel
              modelPath={productType === 'hoodie' ? '/models/hoodie.glb' : '/models/pants.glb'}
              color={color}
            />
          )}
        </Suspense>
      </Canvas>

      <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
        <div className="glass-pill px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  )
}

export default ModelViewer
