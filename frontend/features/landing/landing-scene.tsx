'use client'

import { Suspense, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { Canvas, useFrame, type RootState } from '@react-three/fiber'
import { ContactShadows, Decal, Html, useGLTF, useProgress, useTexture } from '@react-three/drei'
import { cubicBezier, useReducedMotion } from 'framer-motion'
import { easing } from 'maath'
import * as THREE from 'three'
import { StudioEnvironment } from '@/components/three/studio-environment'
import { STUDIO_CAMERA, STUDIO_ROUGHNESS } from '@/features/design/handoff'
import { cn } from '@/lib/utils'
import { MODEL_TIPS, SECTION_IDS, type ModelTip, type SectionId } from './content'
import { TeeLoader } from './tee-loader'

const MODEL_PATH = '/models/shirt_baked.glb'
useGLTF.preload(MODEL_PATH)

type Vec3 = [number, number, number]

interface Pose {
  desktop: { position: Vec3; scale: number }
  mobile: { position: Vec3; scale: number }
  rotation: Vec3
}

// On mobile the tee floats above the text, so only rotation changes between sections.
const MOBILE_POSE = { position: [0, 0.27, -0.1] as Vec3, scale: 0.74 }

/** The tee's fixed pose for each section; it swings between them as the page snaps. */
const POSES: Record<SectionId, Pose> = {
  // Hero: right side, three-quarter front view for the garment tips
  hero: { desktop: { position: [0.5, -0.02, 0.03], scale: 1.18 }, mobile: MOBILE_POSE, rotation: [0.06, -0.3, 0.03] },
  // Collab: left side, turned around to show the back print area
  collab: { desktop: { position: [-0.52, -0.01, 0], scale: 1.18 }, mobile: MOBILE_POSE, rotation: [0.05, 2.9, -0.03] },
  // Design: right side, facing front to show the chest print
  design: { desktop: { position: [0.48, 0, 0.1], scale: 1.16 }, mobile: MOBILE_POSE, rotation: [0, -0.12, 0] },
}

function poseFor(section: SectionId, isMobile: boolean) {
  const pose = POSES[section]
  return { ...(isMobile ? pose.mobile : pose.desktop), rotation: pose.rotation }
}

/** Strong ease-in-out: the tee holds each pose near its snap point and swings in between. */
const swing = cubicBezier(0.77, 0, 0.175, 1)

/**
 * Tracks the scroll position in sections: 0 at the hero, 1 at collab, 2 at design.
 * Between two sections it moves only while the next one scrolls into view.
 */
function useSectionScroll() {
  const tops = useRef<number[]>([])
  useEffect(() => {
    const measure = () => {
      tops.current = SECTION_IDS.map((id) => (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  return () => {
    const y = window.scrollY
    const t = tops.current
    for (let i = 0; i < t.length - 1; i++) {
      if (y >= t[i + 1]) continue
      const start = Math.max(t[i], t[i + 1] - window.innerHeight)
      return i + THREE.MathUtils.clamp((y - start) / (t[i + 1] - start), 0, 1)
    }
    return Math.max(0, t.length - 1)
  }
}

/** The pose at a scroll position, blended between the two nearest sections. */
function poseAt(at: number, isMobile: boolean) {
  const i = THREE.MathUtils.clamp(Math.floor(at), 0, SECTION_IDS.length - 2)
  const t = swing(THREE.MathUtils.clamp(at - i, 0, 1))
  const from = poseFor(SECTION_IDS[i], isMobile)
  const to = poseFor(SECTION_IDS[i + 1], isMobile)
  const lerp3 = (a: Vec3, b: Vec3) => a.map((v, k) => THREE.MathUtils.lerp(v, b[k], t)) as Vec3
  return {
    position: lerp3(from.position, to.position),
    rotation: lerp3(from.rotation, to.rotation),
    scale: THREE.MathUtils.lerp(from.scale, to.scale, t),
  }
}

/** Seconds the tee lags behind the scroll; smooths out wheel steps. */
const SCROLL_SMOOTH_TIME = 0.2
/** Seconds the tee takes to fly into the studio frame. */
const LAUNCH_DURATION = 0.9
/** Tips pop in once the tee has mostly arrived, one after another. */
const TIP_DELAY_MS = 450
const TIP_STAGGER_MS = 140

/**
 * How far the launch into the studio has got: `t` runs 0 → 1 along the flight (eased),
 * `done` once it has had its full time. With reduced motion everything cuts straight to the end.
 */
function useLaunchProgress(isLaunching: boolean) {
  const startedAt = useRef<number | null>(null)
  const reduceMotion = useReducedMotion()
  return (time: number) => {
    if (!isLaunching) {
      startedAt.current = null
      return { t: 0, done: false }
    }
    startedAt.current ??= time
    const progress = Math.min(1, (time - startedAt.current) / LAUNCH_DURATION)
    return { t: reduceMotion ? 1 : swing(progress), done: progress === 1 }
  }
}

/** Renders the current frame and copies the part inside `frame`. */
function snapshotOf({ gl, scene, camera }: RootState, frame: HTMLElement) {
  // Copy straight after rendering, before the browser clears the drawing buffer.
  gl.render(scene, camera)
  const source = gl.domElement
  const ratio = source.width / source.clientWidth
  const from = source.getBoundingClientRect()
  const to = frame.getBoundingClientRect()
  const snapshot = document.createElement('canvas')
  snapshot.width = Math.round(to.width * ratio)
  snapshot.height = Math.round(to.height * ratio)
  snapshot
    .getContext('2d')
    ?.drawImage(source, (to.left - from.left) * ratio, (to.top - from.top) * ratio, snapshot.width, snapshot.height, 0, 0, snapshot.width, snapshot.height)
  return snapshot
}

function PrintDecal({
  url,
  position,
  rotation,
  isLaunching,
  keepOnLaunch = false,
}: {
  url: string
  position: Vec3
  rotation: Vec3
  isLaunching: boolean
  /** Stay on through the launch: the visitor's artwork, which the studio carries over as its chest logo. */
  keepOnLaunch?: boolean
}) {
  const decal = useRef<THREE.Mesh>(null)
  const launchProgress = useLaunchProgress(isLaunching)
  const texture = useTexture(url, (loaded) => {
    loaded.anisotropy = 16
    loaded.colorSpace = THREE.SRGBColorSpace
  })

  // The studio's tee starts without our logo, so it fades out on the way there.
  useFrame((state) => {
    if (decal.current) (decal.current.material as THREE.Material).opacity = keepOnLaunch ? 1 : 1 - launchProgress(state.clock.elapsedTime).t
  })

  // depthTest: otherwise the print shows through the tee when it faces away from the camera.
  return <Decal ref={decal} depthTest position={position} rotation={rotation} scale={[0.15, 0.15, 0.15]} map={texture} />
}

/** A dot pinned to the model with a leader line and label, shown while `visible`. */
function Tip({
  tip,
  side,
  visible,
  delay,
  portal,
}: {
  tip: ModelTip
  side: 'left' | 'right'
  visible: boolean
  /** Milliseconds before the tip appears; it hides immediately. */
  delay: number
  portal?: React.RefObject<HTMLElement | null>
}) {
  const left = side === 'left'
  return (
    <Html
      position={tip.anchor}
      portal={portal as React.RefObject<HTMLElement>}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        aria-hidden={!visible}
        className={cn('relative transition-opacity duration-500 ease-out-strong', visible ? 'opacity-100' : 'opacity-0')}
        style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      >
        <span className="absolute left-0 top-0 flex size-3 -translate-x-1/2 -translate-y-1/2">
          <span className={cn('absolute inset-0 rounded-full bg-brand/60', visible && 'animate-ping')} />
          <span className="relative size-3 rounded-full border-2 border-background bg-brand shadow" />
        </span>

        <div className={cn('absolute top-0 flex -translate-y-1/2 items-center', left ? 'right-1.5 flex-row-reverse' : 'left-1.5')}>
          <span
            className={cn(
              'h-px w-6 bg-foreground/40 transition-transform duration-500 ease-out-strong sm:w-14',
              left ? 'origin-right' : 'origin-left',
              visible ? 'scale-x-100' : 'scale-x-0'
            )}
            style={{ transitionDelay: visible ? `${delay + 150}ms` : '0ms' }}
          />
          <div
            className={cn(
              'rounded-xl border border-border bg-card/90 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-[opacity,translate] duration-500 ease-out-strong sm:w-48 sm:px-3 sm:py-2',
              visible ? 'translate-x-0 opacity-100' : left ? 'translate-x-2 opacity-0' : '-translate-x-2 opacity-0'
            )}
            style={{ transitionDelay: visible ? `${delay + 200}ms` : '0ms' }}
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
function inwardSide(tip: ModelTip, section: SectionId): 'left' | 'right' {
  const screenX = tip.anchor[0] * Math.cos(POSES[section].rotation[1])
  return screenX > 0 ? 'left' : 'right'
}

interface FloatingTeeProps {
  section: SectionId
  color: string
  decalUrl: string
  artworkUrl?: string
  isLaunching: boolean
  isMobile: boolean
  tipsPortal?: React.RefObject<HTMLElement | null>
  studioFrame?: React.RefObject<HTMLElement | null>
  onLaunched?: (snapshot: HTMLCanvasElement) => void
}

function FloatingTee({ section, color, decalUrl, artworkUrl, isLaunching, isMobile, tipsPortal, studioFrame, onLaunched }: FloatingTeeProps) {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>(null)
  const placed = useRef(false)
  const launchFrom = useRef<{ position: Vec3; rotation: Vec3; scale: number; roughness: number } | null>(null)
  const landed = useRef(false)
  const handedOff = useRef(false)
  const sectionScroll = useSectionScroll()
  const launchProgress = useLaunchProgress(isLaunching)
  const reduceMotion = useReducedMotion()
  const { nodes, materials } = useGLTF(MODEL_PATH) as unknown as {
    nodes: Record<string, THREE.Mesh>
    materials: Record<string, THREE.MeshStandardMaterial>
  }

  // The studio centres its tee on its bounding box, so it lands at minus the box's centre.
  const studioPosition = useMemo(() => {
    const geometry = nodes.T_Shirt_male.geometry
    geometry.computeBoundingBox()
    return geometry.boundingBox!.getCenter(new THREE.Vector3()).negate().toArray() as Vec3
  }, [nodes])

  useFrame((state, delta) => {
    if (!group.current) return

    // Launching: fly from wherever the tee is into the studio's pose, then hand the last frame over.
    if (isLaunching && placed.current && mesh.current) {
      const { t, done } = launchProgress(state.clock.elapsedTime)
      const material = mesh.current.material
      launchFrom.current ??= {
        position: group.current.position.toArray() as Vec3,
        rotation: [group.current.rotation.x, group.current.rotation.y, group.current.rotation.z],
        scale: group.current.scale.x,
        roughness: material.roughness,
      }
      const from = launchFrom.current
      const lerp = THREE.MathUtils.lerp
      group.current.position.set(...(from.position.map((v, k) => lerp(v, studioPosition[k], t)) as Vec3))
      group.current.rotation.set(...(from.rotation.map((v) => lerp(v, 0, t)) as Vec3))
      group.current.scale.setScalar(lerp(from.scale, 1, t))
      material.roughness = lerp(from.roughness, STUDIO_ROUGHNESS, t)
      easing.dampC(material.color, color, 0.25, delta)

      // Snapshot one frame after landing, once everything else (decals, lights) has finished too.
      if (landed.current && !handedOff.current && studioFrame?.current) {
        handedOff.current = true
        onLaunched?.(snapshotOf(state, studioFrame.current))
      }
      landed.current = done
      return
    }
    launchFrom.current = null
    // The tee follows the scroll from pose to pose; with reduced motion it holds the section's pose.
    const pose = reduceMotion ? poseFor(section, isMobile) : poseAt(sectionScroll(), isMobile)
    const time = state.clock.elapsedTime
    const ambient = reduceMotion ? 0 : 1

    // Idle float, a little sway, and a hint of pointer parallax on top of the pose.
    const position: Vec3 = [pose.position[0], pose.position[1] + Math.sin(time * 1.5) * 0.02 * ambient, pose.position[2]]
    const rotation: Vec3 = [
      pose.rotation[0] - state.pointer.y * 0.06 * ambient,
      pose.rotation[1] + (state.pointer.x * 0.1 + Math.sin(time * 1.1) * 0.02) * ambient,
      pose.rotation[2],
    ]
    const scale = pose.scale

    // The first frame snaps into place; afterwards everything eases.
    if (!placed.current) {
      placed.current = true
      group.current.position.set(...position)
      group.current.rotation.set(...rotation)
      group.current.scale.setScalar(scale)
      materials.lambert1.color.set(color)
      return
    }

    easing.dampC(materials.lambert1.color, color, 0.25, delta)

    // With reduced motion the tee cuts straight to each section's pose.
    if (reduceMotion) {
      group.current.position.set(...position)
      group.current.rotation.set(...rotation)
      group.current.scale.setScalar(scale)
      return
    }

    easing.damp3(group.current.position, position, SCROLL_SMOOTH_TIME, delta)
    easing.dampE(group.current.rotation, rotation, SCROLL_SMOOTH_TIME, delta)
    easing.damp3(group.current.scale, [scale, scale, scale], SCROLL_SMOOTH_TIME, delta)
  })

  return (
    <group ref={group} dispose={null}>
      <mesh ref={mesh} castShadow receiveShadow geometry={nodes.T_Shirt_male.geometry} material={materials.lambert1} material-roughness={0.82}>
        <Suspense fallback={null}>
          {/* An upload replaces the chest logo, at the studio's own chest spot, so it lands where the studio draws it. */}
          <PrintDecal
            url={artworkUrl ?? decalUrl}
            position={[0, 0.04, 0.15]}
            rotation={[0, 0, 0]}
            isLaunching={isLaunching}
            keepOnLaunch={Boolean(artworkUrl)}
          />
          <PrintDecal url={decalUrl} position={[0, 0.03, -0.13]} rotation={[0, Math.PI, 0]} isLaunching={isLaunching} />
        </Suspense>
      </mesh>
      {MODEL_TIPS.map((tip) => {
        const order = MODEL_TIPS.filter((t) => t.section === tip.section).indexOf(tip)
        return (
          <Tip
            key={tip.id}
            tip={tip}
            side={isMobile ? inwardSide(tip, section) : tip.side}
            visible={!isLaunching && tip.section === section}
            delay={TIP_DELAY_MS + order * TIP_STAGGER_MS}
            portal={tipsPortal}
          />
        )
      })}
    </group>
  )
}

/** Shown where the tee will appear while the model downloads. */
function TeeLoading({ section, isMobile }: { section: SectionId; isMobile: boolean }) {
  const { progress: loaded } = useProgress()
  return (
    <Html position={poseFor(section, isMobile).position} center>
      <TeeLoader progress={loaded} />
    </Html>
  )
}

const LANDING_CAMERA = { position: [0, 0, 2.5] as Vec3, fov: STUDIO_CAMERA.fov }
const STUDIO_CAMERA_POSITION = new THREE.Vector3(...STUDIO_CAMERA.position)

/**
 * When launching, moves the camera to the studio's and narrows its view onto the studio frame,
 * so the tee ends up drawn exactly where, and as big as, the studio draws it.
 */
function CameraRig({ isLaunching, studioFrame }: { isLaunching: boolean; studioFrame?: React.RefObject<HTMLElement | null> }) {
  const launchProgress = useLaunchProgress(isLaunching)
  const launch = useRef<{ position: THREE.Vector3; frame: DOMRect } | null>(null)

  useFrame((state) => {
    const camera = state.camera as THREE.PerspectiveCamera
    const { t } = launchProgress(state.clock.elapsedTime)

    if (isLaunching && studioFrame?.current) {
      launch.current ??= { position: camera.position.clone(), frame: studioFrame.current.getBoundingClientRect() }
      const { position, frame } = launch.current
      const { width, height, left, top } = state.size
      const lerp = THREE.MathUtils.lerp
      camera.position.lerpVectors(position, STUDIO_CAMERA_POSITION, t)
      // Render the whole canvas as if the studio frame were the full view.
      const fullWidth = lerp(width, frame.width, t)
      const fullHeight = lerp(height, frame.height, t)
      camera.aspect = fullWidth / fullHeight
      camera.setViewOffset(fullWidth, fullHeight, lerp(0, left - frame.left, t), lerp(0, top - frame.top, t), width, height)
    } else if (launch.current) {
      launch.current = null
      camera.position.set(...LANDING_CAMERA.position)
      camera.aspect = state.size.width / state.size.height
      camera.clearViewOffset()
    }
    camera.lookAt(0, 0, 0)
  })
  return null
}

/**
 * The landing's extra lights and floor shadow. They fade out during the launch,
 * leaving the light the studio uses (ambient 0.5 + environment).
 */
const SHADOW_OPACITY = 0.35

function LandingLights({ isLaunching }: { isLaunching: boolean }) {
  const launchProgress = useLaunchProgress(isLaunching)
  const ambient = useRef<THREE.AmbientLight>(null)
  const directional = useRef<THREE.Group>(null)
  const shadows = useRef<THREE.Group>(null)

  useFrame((state) => {
    const { t } = launchProgress(state.clock.elapsedTime)
    if (ambient.current) ambient.current.intensity = THREE.MathUtils.lerp(0.7, 0.5, t)
    directional.current?.children.forEach((light) => {
      ;(light as THREE.DirectionalLight).intensity = light.userData.intensity * (1 - t)
    })
    const shadowPlane = shadows.current?.children[0] as THREE.Mesh | undefined
    if (shadowPlane) (shadowPlane.material as THREE.Material).opacity = SHADOW_OPACITY * (1 - t)
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.7} />
      <group ref={directional}>
        <directionalLight position={[5, 8, 5]} intensity={1.1} userData={{ intensity: 1.1 }} castShadow shadow-mapSize={1024} />
        {/* Rim light from behind: outlines the silhouette against a dark page. */}
        <directionalLight position={[-3, 3, -5]} intensity={1.4} userData={{ intensity: 1.4 }} />
        <directionalLight position={[4, 1, -4]} intensity={0.8} userData={{ intensity: 0.8 }} />
        <directionalLight position={[0, -4, 2]} intensity={0.25} userData={{ intensity: 0.25 }} />
      </group>
      <ContactShadows ref={shadows} position={[0, -0.85, 0]} opacity={SHADOW_OPACITY} scale={4.5} blur={1.8} far={2} />
    </>
  )
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
  /** Section snapped into view; the tee holds that section's pose. */
  section: SectionId
  color: string
  decalUrl: string
  /** Image the visitor uploaded, as a data URL; it takes the chest print's place. */
  artworkUrl?: string
  isLaunching: boolean
  /** Element the tip labels render into, so they sit above the page text. */
  tipsPortal?: React.RefObject<HTMLElement | null>
  /** Copy of the studio's canvas area; launching flies the tee into it. */
  studioFrame?: React.RefObject<HTMLElement | null>
  /** Called once the tee has landed, with its last frame cropped to `studioFrame`. */
  onLaunched?: (snapshot: HTMLCanvasElement) => void
}

export default function LandingScene(props: LandingSceneProps) {
  const isMobile = useIsMobile()

  return (
    <Canvas camera={LANDING_CAMERA} gl={{ antialias: true, alpha: true }} dpr={[1, 2]} className="size-full">
      <CameraRig isLaunching={props.isLaunching} studioFrame={props.studioFrame} />
      <LandingLights isLaunching={props.isLaunching} />
      <StudioEnvironment />
      <Suspense fallback={<TeeLoading section={props.section} isMobile={isMobile} />}>
        <FloatingTee {...props} isMobile={isMobile} />
      </Suspense>
    </Canvas>
  )
}
