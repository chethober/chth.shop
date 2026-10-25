'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, ContactShadows, OrbitControls } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import { StudioEnvironment } from '@/components/three/studio-environment'
import { VIEWS, type Garment, type ViewId } from '../constants'
import { STUDIO_CAMERA } from '../handoff'
import { sceneBridge } from '../scene-bridge'
import { useStudio } from '../store'
import { sceneOverlays } from './decals'
import { GarmentModel } from './garment-model'

type Controls = THREE.EventDispatcher<{ start: object }> & { target: THREE.Vector3; update: () => void }

const viewSpherical = (view: ViewId) => new THREE.Spherical().setFromVector3(new THREE.Vector3(...VIEWS[view].position))

/**
 * Flies the camera to view presets along the orbit (so front → back swings around the garment rather than through
 * it), and renders stills for export.
 */
function CameraRig() {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as Controls | null
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const goal = useRef<THREE.Spherical | null>(null)
  const current = useRef(new THREE.Spherical())

  useEffect(() => {
    if (!controls) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    sceneBridge.setView = (view) => {
      controls.target.set(0, 0, 0)
      const target = viewSpherical(view)
      if (reduceMotion) {
        camera.position.setFromSpherical(target)
        controls.update()
      } else {
        // A fresh spherical, so a flight cut short doesn't leave its velocity behind for this one.
        current.current = new THREE.Spherical()
        goal.current = target
      }
    }
    sceneBridge.resetView = () => sceneBridge.setView?.('front')

    sceneBridge.capture = (view) => {
      const saved = camera.position.clone()
      if (view) {
        camera.position.setFromSpherical(viewSpherical(view))
        camera.lookAt(controls.target)
      }
      sceneOverlays.forEach((object) => (object.visible = false))
      gl.render(scene, camera)
      const url = gl.domElement.toDataURL('image/png')
      sceneOverlays.forEach((object) => (object.visible = true))
      camera.position.copy(saved)
      camera.lookAt(controls.target)
      return url
    }

    // Grabbing the canvas mid-flight hands the camera straight back to the user.
    const cancel = () => (goal.current = null)
    controls.addEventListener('start', cancel)
    return () => {
      controls.removeEventListener('start', cancel)
      sceneBridge.setView = sceneBridge.resetView = sceneBridge.capture = undefined
    }
  }, [camera, controls, gl, scene])

  useFrame((_, delta) => {
    const target = goal.current
    if (!target || !controls) return
    const spherical = current.current.setFromVector3(camera.position.clone().sub(controls.target))
    const theta = easing.dampAngle(spherical, 'theta', target.theta, 0.18, delta)
    const phi = easing.damp(spherical, 'phi', target.phi, 0.18, delta)
    const radius = easing.damp(spherical, 'radius', target.radius, 0.18, delta)
    spherical.makeSafe()
    camera.position.setFromSpherical(spherical).add(controls.target)
    controls.update()
    if (!theta && !phi && !radius) goal.current = null
  })

  return null
}

/** Reports once the garment has been drawn. */
function DrawnSignal({ onDrawn }: { onDrawn: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    if (++frames.current === 2) onDrawn()
  })
  return null
}

interface StudioCanvasProps {
  garment: Garment
  color: string
  fabric: string
  onDrawn?: () => void
}

export function StudioCanvas({ onDrawn, ...props }: StudioCanvasProps) {
  const autoRotate = useStudio((state) => state.autoRotate)
  const select = useStudio((state) => state.select)
  const [floor, setFloor] = useState(-0.4)

  return (
    // preserveDrawingBuffer lets exports read the rendered pixels; alpha keeps the backdrop out of them.
    <Canvas
      shadows
      camera={STUDIO_CAMERA}
      gl={{ preserveDrawingBuffer: true, alpha: true }}
      className="size-full"
      onPointerMissed={(event) => event.type === 'click' && select(null)}
    >
      <ambientLight intensity={0.5} />
      {/* The environment lights the front; this keeps the back readable when orbiting round. */}
      <directionalLight position={[0, 1.5, -4]} intensity={0.9} />
      <StudioEnvironment />
      <Center onCentered={({ height }) => setFloor(-height / 2 - 0.01)}>
        <Suspense fallback={null}>
          <GarmentModel {...props} />
          {onDrawn && <DrawnSignal onDrawn={onDrawn} />}
        </Suspense>
      </Center>
      <ContactShadows key={`${props.garment.id}:${floor}`} position={[0, floor, 0]} opacity={0.4} scale={2.5} blur={2.6} far={1.2} frames={1} />
      <OrbitControls makeDefault enablePan={false} minDistance={1.1} maxDistance={3.5} zoomSpeed={0.6} autoRotate={autoRotate} autoRotateSpeed={1.2} />
      <CameraRig />
    </Canvas>
  )
}
