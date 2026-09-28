'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AccumulativeShadows, Center, OrbitControls, RandomizedLight } from '@react-three/drei'
import { easing } from 'maath'
import type * as THREE from 'three'
import { StudioEnvironment } from '@/components/three/studio-environment'
import type { DesignLayer, Garment } from '../constants'
import { GarmentModel } from './garment-model'

/** Soft studio floor shadows. */
function StudioShadows() {
  return (
    <AccumulativeShadows temporal frames={60} alphaTest={0.85} scale={10} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.14]}>
      <RandomizedLight amount={4} radius={9} intensity={0.55} ambient={0.25} position={[5, 5, -10]} />
      <RandomizedLight amount={4} radius={5} intensity={0.25} ambient={0.55} position={[-5, 5, -9]} />
    </AccumulativeShadows>
  )
}

/** Gently tilts the model toward the pointer. */
function PointerParallax({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (group.current) {
      easing.dampE(group.current.rotation, [state.pointer.y / 10, -state.pointer.x / 5, 0], 0.25, delta)
    }
  })
  return <group ref={group}>{children}</group>
}

interface StudioCanvasProps {
  garment: Garment
  color: string
  logoUrl: string
  layers: DesignLayer[]
  onSelectLayer: (id: string) => void
}

export function StudioCanvas(props: StudioCanvasProps) {
  return (
    // preserveDrawingBuffer lets "Save mockup" read the rendered pixels.
    <Canvas shadows camera={{ position: [0, 0, 2], fov: 25 }} gl={{ preserveDrawingBuffer: true }} className="size-full">
      <ambientLight intensity={0.5} />
      <StudioEnvironment />
      <PointerParallax>
        <StudioShadows />
        <Center>
          <Suspense fallback={null}>
            <GarmentModel {...props} />
          </Suspense>
        </Center>
      </PointerParallax>
      <OrbitControls makeDefault minDistance={1.2} maxDistance={3.5} zoomSpeed={0.6} />
    </Canvas>
  )
}
