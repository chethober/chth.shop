'use client'

import { Suspense, useRef, useSyncExternalStore } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Decal, Html, useGLTF, useProgress, useTexture } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import { StudioEnvironment } from '@/components/three/studio-environment'
import { cn } from '@/lib/utils'
import { MODEL_TIPS, type ModelTip } from './content'

const MODEL_PATH = '/models/shirt_baked.glb'
useGLTF.preload(MODEL_PATH)

type Vec3 = [number, number, number]

interface Pose {
  progress: number
  desktop: { position: Vec3; scale: number }
  mobile: { position: Vec3; scale: number }
  rotation: Vec3
}

// On mobile the tee floats above the text, so only rotation changes between stages.
const MOBILE_POSE = { position: [0, 0.2, -0.1] as Vec3, scale: 0.78 }

/** Where the tee sits at each point of the page scroll (0 = top, 1 = bottom). */
const POSES: Pose[] = [
  // 1. Hero: right side, three-quarter front view
  { progress: 0, desktop: { position: [0.58, -0.02, 0], scale: 1.35 }, mobile: MOBILE_POSE, rotation: [0.1, -0.5, 0.04] },
  // …turning to face you while the garment tips appear
  { progress: 0.2, desktop: { position: [0.55, 0, 0.05], scale: 1.4 }, mobile: MOBILE_POSE, rotation: [0.04, -0.2, 0.02] },
  // 2. Collab: left side, turned around to show the back print area
  { progress: 0.42, desktop: { position: [-0.58, 0, 0], scale: 1.38 }, mobile: MOBILE_POSE, rotation: [0.05, 2.8, -0.03] },
  { progress: 0.62, desktop: { position: [-0.58, 0, 0], scale: 1.38 }, mobile: MOBILE_POSE, rotation: [0.05, 2.95, -0.03] },
  // 3. Design: right side, facing front to show the chest print
  { progress: 0.86, desktop: { position: [0.55, 0.02, 0.1], scale: 1.45 }, mobile: MOBILE_POSE, rotation: [0, -0.12, 0] },
  { progress: 1, desktop: { position: [0.55, 0.02, 0.1], scale: 1.45 }, mobile: MOBILE_POSE, rotation: [0, -0.12, 0] },
]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

/** Smoothly interpolated pose for a scroll progress. */
function poseAt(progress: number, isMobile: boolean) {
  const p = Math.min(1, Math.max(0, progress))
  const next = POSES.findIndex((pose) => pose.progress >= p)
  const b = POSES[Math.max(0, next)]
  const a = POSES[Math.max(0, next - 1)]
  const span = b.progress - a.progress
  const t = span === 0 ? 0 : (p - a.progress) / span
  const eased = t * t * (3 - 2 * t)
  const [from, to] = isMobile ? [a.mobile, b.mobile] : [a.desktop, b.desktop]

  return {
    position: lerp3(from.position, to.position, eased),
    rotation: lerp3(a.rotation, b.rotation, eased),
    scale: lerp(from.scale, to.scale, eased),
  }
}

function PrintDecal({ url, position, rotation }: { url: string; position: Vec3; rotation: Vec3 }) {
  const texture = useTexture(url, (loaded) => {
    loaded.anisotropy = 16
    loaded.colorSpace = THREE.SRGBColorSpace
  })
  // depthTest: otherwise the print shows through the tee when it faces away from the camera.
  return <Decal depthTest position={position} rotation={rotation} scale={[0.15, 0.15, 0.15]} map={texture} />
}

/** A dot pinned to the model with a leader line and label, shown while `visible`. */
function Tip({
  tip,
  side,
  visible,
  portal,
}: {
  tip: ModelTip
  side: 'left' | 'right'
  visible: boolean
  portal?: React.RefObject<HTMLElement | null>
}) {
  const left = side === 'left'
  return (
    <Html
      position={tip.anchor}
      portal={portal as React.RefObject<HTMLElement>}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: 'none' }}
      className={cn(tip.desktopOnly && 'max-lg:hidden')}
    >
      <div
        aria-hidden={!visible}
        className={cn('relative transition-opacity duration-500 ease-out', visible ? 'opacity-100' : 'opacity-0')}
      >
        <span className="absolute left-0 top-0 flex size-3 -translate-x-1/2 -translate-y-1/2">
          <span className={cn('absolute inset-0 rounded-full bg-brand/60', visible && 'animate-ping')} />
          <span className="relative size-3 rounded-full border-2 border-background bg-brand shadow" />
        </span>

        <div className={cn('absolute top-0 flex -translate-y-1/2 items-center', left ? 'right-1.5 flex-row-reverse' : 'left-1.5')}>
          <span
            className={cn(
              'h-px bg-foreground/40 transition-[width] delay-150 duration-500 ease-out',
              visible ? 'w-6 sm:w-14' : 'w-0'
            )}
          />
          <div
            className={cn(
              'rounded-xl border border-border bg-card/90 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-all delay-200 duration-500 sm:w-48 sm:px-3 sm:py-2',
              visible ? 'translate-x-0 opacity-100' : left ? 'translate-x-2 opacity-0' : '-translate-x-2 opacity-0'
            )}
          >
            <p className="whitespace-nowrap text-[11px] font-bold text-foreground sm:text-xs">{tip.title}</p>
            <p className="mt-0.5 hidden text-[11px] leading-snug text-muted-foreground sm:block">{tip.text}</p>
          </div>
        </div>
      </div>
    </Html>
  )
}

/**
 * On phones the tee is centered, so labels point toward the middle of the screen:
 * an anchor on the screen-left half of the tee gets its label on the right, and vice versa.
 */
function inwardSide(tip: ModelTip, progress: number): 'left' | 'right' {
  const screenX = tip.anchor[0] * Math.cos(poseAt(progress, true).rotation[1])
  return screenX > 0 ? 'left' : 'right'
}

interface FloatingTeeProps {
  progress: number
  color: string
  decalUrl: string
  isLaunching: boolean
  isMobile: boolean
  tipsPortal?: React.RefObject<HTMLElement | null>
}

function FloatingTee({ progress, color, decalUrl, isLaunching, isMobile, tipsPortal }: FloatingTeeProps) {
  const group = useRef<THREE.Group>(null)
  const placed = useRef(false)
  const { nodes, materials } = useGLTF(MODEL_PATH) as unknown as {
    nodes: Record<string, THREE.Mesh>
    materials: Record<string, THREE.MeshStandardMaterial>
  }

  useFrame((state, delta) => {
    if (!group.current) return
    const pose = poseAt(progress, isMobile)
    const time = state.clock.elapsedTime

    // Idle float, a little sway, and a hint of pointer parallax on top of the scroll pose.
    let position: Vec3 = [pose.position[0], pose.position[1] + Math.sin(time * 1.5) * 0.02, pose.position[2]]
    let rotation: Vec3 = [
      pose.rotation[0] - state.pointer.y * 0.06,
      pose.rotation[1] + state.pointer.x * 0.1 + Math.sin(time * 1.1) * 0.02,
      pose.rotation[2],
    ]
    let scale = pose.scale

    if (isLaunching) {
      position = [0, 0.04, 0.85]
      rotation = [0, 0, 0]
      scale = isMobile ? 2.4 : 3
    }

    // The first frame snaps into place; afterwards everything eases.
    if (!placed.current) {
      placed.current = true
      group.current.position.set(...position)
      group.current.rotation.set(...rotation)
      group.current.scale.setScalar(scale)
      materials.lambert1.color.set(color)
      return
    }

    easing.damp3(group.current.position, position, 0.35, delta)
    easing.dampE(group.current.rotation, rotation, 0.35, delta)
    easing.damp3(group.current.scale, [scale, scale, scale], 0.35, delta)
    easing.dampC(materials.lambert1.color, color, 0.25, delta)
  })

  return (
    <group ref={group} dispose={null}>
      <mesh castShadow receiveShadow geometry={nodes.T_Shirt_male.geometry} material={materials.lambert1} material-roughness={0.82}>
        <Suspense fallback={null}>
          <PrintDecal url={decalUrl} position={[0, 0.04, 0.15]} rotation={[0, 0, 0]} />
          <PrintDecal url={decalUrl} position={[0, 0.03, -0.13]} rotation={[0, Math.PI, 0]} />
        </Suspense>
      </mesh>
      {MODEL_TIPS.map((tip) => (
        <Tip
          key={tip.id}
          tip={tip}
          side={isMobile ? inwardSide(tip, progress) : tip.side}
          visible={!isLaunching && progress >= tip.from && progress < tip.to}
          portal={tipsPortal}
        />
      ))}
    </group>
  )
}

/** Shown where the tee will appear while the model downloads. */
function TeeLoading({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const { progress: loaded } = useProgress()
  return (
    <Html position={poseAt(progress, isMobile).position} center>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-12 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
        <span className="whitespace-nowrap text-[11px] font-semibold tabular-nums">Loading tee… {Math.round(loaded)}%</span>
      </div>
    </Html>
  )
}

/** Flies the camera into the tee when launching the studio. */
function CameraRig({ isLaunching }: { isLaunching: boolean }) {
  const { camera } = useThree()
  useFrame((_, delta) => {
    easing.damp3(camera.position, [0, isLaunching ? 0.04 : 0, isLaunching ? 0.75 : 2.5], isLaunching ? 0.25 : 0.5, delta)
    camera.lookAt(0, isLaunching ? 0.04 : 0, 0)
  })
  return null
}

const MOBILE_QUERY = '(max-width: 1023px)'

function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(MOBILE_QUERY)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )
}

export interface LandingSceneProps {
  /** Page scroll progress, 0–1. */
  progress: number
  color: string
  decalUrl: string
  isLaunching: boolean
  /** Element the tip labels render into, so they sit above the page text. */
  tipsPortal?: React.RefObject<HTMLElement | null>
}

export default function LandingScene(props: LandingSceneProps) {
  const isMobile = useIsMobile()

  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 25 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]} className="size-full">
      <CameraRig isLaunching={props.isLaunching} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow shadow-mapSize={1024} />
      {/* Rim light from behind: outlines the silhouette against a dark page. */}
      <directionalLight position={[-3, 3, -5]} intensity={1.4} />
      <directionalLight position={[4, 1, -4]} intensity={0.8} />
      <directionalLight position={[0, -4, 2]} intensity={0.25} />
      <StudioEnvironment />
      <Suspense fallback={<TeeLoading progress={props.progress} isMobile={isMobile} />}>
        <FloatingTee {...props} isMobile={isMobile} />
      </Suspense>
      <ContactShadows position={[0, -0.85, 0]} opacity={0.35} scale={4.5} blur={1.8} far={2} />
    </Canvas>
  )
}
