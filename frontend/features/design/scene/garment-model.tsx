'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import { GARMENTS, getFabric, type DesignLayer, type Garment, type PrintSide, type Vec3 } from '../constants'
import { sceneBridge } from '../scene-bridge'
import { useStudio } from '../store'
import { LayerDecal } from './decals'

GARMENTS.forEach((garment) => garment.model && useGLTF.preload(garment.model.path))

const COLOR_EASING = 0.25
const BAKED_AO_INTENSITY = 0.35

interface GarmentModelProps {
  garment: Garment
  color: string
  /** Fabric id for apparel; null for rigid products, which keep their own finish. */
  fabric: string | null
}

type Controls = { enabled: boolean } | null

interface PrintDrag {
  startDrag: (layer: DesignLayer, event: ThreeEvent<PointerEvent>) => void
  onSurfaceMove: (event: ThreeEvent<PointerEvent>) => void
  hover: (layer: DesignLayer | null) => void
}

/**
 * Pressing a print selects it; dragging slides it across the fabric under the pointer, pausing orbit controls for
 * the duration. The garment wires `onSurfaceMove` to its surface mesh, since that's what the pointer slides over.
 */
function usePrintDrag(surface: React.RefObject<THREE.Mesh | null>): PrintDrag {
  const get = useThree((state) => state.get)
  const drag = useRef<{ id: string; offset: [number, number] } | null>(null)

  const toLocal = (point: THREE.Vector3) => surface.current?.worldToLocal(point.clone()) ?? null
  const setOrbit = (enabled: boolean) => {
    const controls = get().controls as Controls
    if (controls) controls.enabled = enabled
  }
  const setCursor = (cursor: string) => {
    get().gl.domElement.style.cursor = cursor
  }

  const endDrag = () => {
    drag.current = null
    setOrbit(true)
    setCursor('')
  }

  useEffect(() => endDrag, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    startDrag: (layer, event) => {
      event.stopPropagation()
      useStudio.getState().select(layer.id)
      const local = toLocal(event.point)
      if (layer.locked || !local) return
      drag.current = { id: layer.id, offset: [layer.position[0] - local.x, layer.position[1] - local.y] }
      setOrbit(false)
      setCursor('grabbing')
      window.addEventListener('pointerup', endDrag, { once: true })
    },

    onSurfaceMove: (event) => {
      const active = drag.current
      const mesh = surface.current
      const local = active && toLocal(event.point)
      if (!active || !mesh || !local) return
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
      const centerZ = mesh.geometry.boundingBox!.getCenter(new THREE.Vector3()).z
      const side: PrintSide = local.z >= centerZ ? 'front' : 'back'
      const position: Vec3 = [local.x + active.offset[0], local.y + active.offset[1], local.z]
      useStudio.getState().updateLayer(active.id, { position, side }, `drag:${active.id}`)
    },

    hover: (layer) => {
      if (drag.current) return
      setCursor(layer ? (layer.locked ? 'pointer' : 'grab') : '')
    },
  }
}

/** The user's prints, projected onto the parent mesh. */
function Prints({ drag, garment }: { drag: PrintDrag; garment: Garment }) {
  const layers = useStudio((state) => state.doc.layers)
  const selectedId = useStudio((state) => state.selectedId)
  return (
    <>
      {layers.map((layer, index) => (
        <LayerDecal
          key={layer.id}
          layer={layer}
          index={index}
          selected={layer.id === selectedId}
          onPointerDown={drag.startDrag}
          onHover={drag.hover}
          depth={garment.decalDepth}
          axisAligned={garment.axisPrints}
        />
      ))}
    </>
  )
}

/** Lets the studio UI snap prints onto this mesh, e.g. for placement presets. */
function useSurfaceProjection(surface: React.RefObject<THREE.Mesh | null>) {
  useEffect(() => {
    const raycaster = new THREE.Raycaster()
    sceneBridge.projectToSurface = (x, y, side) => {
      const mesh = surface.current
      if (!mesh) return null
      mesh.updateWorldMatrix(true, false)
      const direction = side === 'front' ? -1 : 1
      const origin = new THREE.Vector3(x, y, -direction * 5).applyMatrix4(mesh.matrixWorld)
      const toward = new THREE.Vector3(0, 0, direction).transformDirection(mesh.matrixWorld)
      raycaster.set(origin, toward)
      const hit = raycaster.intersectObject(mesh, false)[0]
      if (!hit) return null
      const local = mesh.worldToLocal(hit.point.clone())
      return [local.x, local.y, local.z]
    }
    // Prints carried over from another product only have an estimated depth until they're snapped onto this one.
    useStudio.getState().snapToSurface()
    return () => {
      sceneBridge.projectToSurface = undefined
    }
  }, [surface])
}

/** The mesh prints land on: projection for placement presets plus drag-to-move. */
function usePrintSurface() {
  const surface = useRef<THREE.Mesh>(null)
  useSurfaceProjection(surface)
  const drag = usePrintDrag(surface)
  return { surface, drag }
}

/** Eases materials toward the product color; apparel also takes the fabric's roughness. */
function useMaterialTint(materials: THREE.Material[], color: string, fabric: string | null) {
  const roughness = fabric ? getFabric(fabric).roughness : null
  useFrame((_, delta) => {
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue
      easing.dampC(material.color, color, COLOR_EASING, delta)
      if (roughness !== null) easing.damp(material, 'roughness', roughness, COLOR_EASING, delta)
    }
  })
}

/** A material owned by a procedural model, tinted like the GLB ones. */
function useOwnMaterial(params: THREE.MeshStandardMaterialParameters) {
  // Created once; the tint hook then eases its color every frame.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => new THREE.MeshStandardMaterial(params), [])
}

/** The baked T-shirt model: a single mesh with one material. */
function BakedTShirt({ garment, color, fabric }: GarmentModelProps) {
  const { nodes, materials } = useGLTF(garment.model!.path) as unknown as {
    nodes: Record<string, THREE.Mesh>
    materials: Record<string, THREE.MeshStandardMaterial>
  }
  const { surface, drag } = usePrintSurface()
  useMaterialTint(useMemo(() => [materials.lambert1], [materials]), color, fabric)

  return (
    <group dispose={null}>
      <mesh
        ref={surface}
        castShadow
        receiveShadow
        geometry={nodes.T_Shirt_male.geometry}
        material={materials.lambert1}
        // The baked occlusion was made for a front view and streaks the back; soften it so every side reads.
        material-aoMapIntensity={BAKED_AO_INTENSITY}
        onPointerMove={drag.onSurfaceMove}
      >
        <Prints drag={drag} garment={garment} />
      </mesh>
    </group>
  )
}

interface Part {
  name: string
  geometry: THREE.BufferGeometry
  material: THREE.MeshStandardMaterial
  tinted: boolean
}

/**
 * Loads a product GLB and bakes every mesh's world transform into its own geometry, centred and scaled so the
 * model's largest side is `targetSize`. Every product then shares one coordinate space (about ±0.3 units), which
 * is what the placements in constants.ts use. Skinned meshes (hoodie, joggers) are flattened to their bind pose.
 */
function useNormalizedModel(garment: Garment) {
  const model = garment.model!
  const { scene } = useGLTF(model.path)

  return useMemo(() => {
    scene.updateMatrixWorld(true)
    const found: THREE.Mesh[] = []
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) found.push(child as THREE.Mesh)
    })

    const bounds = new THREE.Box3()
    const parts: Part[] = found.map((mesh) => {
      const geometry = mesh.geometry.clone()
      geometry.applyMatrix4(mesh.matrixWorld)
      geometry.computeBoundingBox()
      bounds.union(geometry.boundingBox!)

      const source = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
      const material = source.clone()
      const tinted = !model.tintParts || model.tintParts.includes(mesh.name)
      // Baked colour textures would fight the tint; keep normal and roughness detail only.
      if (tinted && model.dropColorTextures) material.map = null
      material.needsUpdate = true
      return { name: mesh.name, geometry, material, tinted }
    })

    const center = bounds.getCenter(new THREE.Vector3())
    const size = bounds.getSize(new THREE.Vector3())
    const scale = (model.targetSize ?? 0.6) / Math.max(size.x, size.y, size.z)
    for (const part of parts) {
      part.geometry.translate(-center.x, -center.y, -center.z)
      part.geometry.scale(scale, scale, scale)
      part.geometry.computeBoundingBox()
    }

    const vertexCount = (part: Part) => part.geometry.attributes.position?.count ?? 0
    const printPart =
      parts.find((part) => part.name === model.printPart) ??
      parts.reduce((best, part) => (vertexCount(part) > vertexCount(best) ? part : best), parts[0])

    return { parts, printPart, tinted: parts.filter((part) => part.tinted).map((part) => part.material) }
  }, [scene, model])
}

/** Any other GLB product (hoodie, joggers, mug, cup, bottle, tote, phone case). */
function NormalizedGarment({ garment, color, fabric }: GarmentModelProps) {
  const { parts, printPart, tinted } = useNormalizedModel(garment)
  const { surface, drag } = usePrintSurface()
  useMaterialTint(tinted, color, fabric)

  return (
    <group dispose={null}>
      {parts.map((part) => (
        <mesh key={part.name} geometry={part.geometry} material={part.material} castShadow receiveShadow />
      ))}
      {/* Invisible copy of the print part that receives the prints and the pointer. */}
      <mesh ref={surface} geometry={printPart.geometry} onPointerMove={drag.onSurfaceMove}>
        <meshBasicMaterial visible={false} />
        <Prints drag={drag} garment={garment} />
      </mesh>
    </group>
  )
}

// Products with no suitable free model, built from primitives sized to sit next to the GLB products (about 0.6
// units across). Placements are in the local space of the mesh that receives prints.

/** Six-panel cap, tilted toward the camera so the curved brim reads from the front. */
function CapModel({ garment, color, fabric }: GarmentModelProps) {
  const twill = useOwnMaterial({ color, roughness: 0.85, side: THREE.DoubleSide })
  useMaterialTint(useMemo(() => [twill], [twill]), color, fabric)
  const { surface, drag } = usePrintSurface()
  const crown = useMemo(() => {
    // Upper half of a sphere, a little taller at the front like a structured cap.
    const geometry = new THREE.SphereGeometry(0.2, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2)
    geometry.scale(1, 0.82, 1.08)
    return geometry
  }, [])
  const brim = useMemo(() => {
    // Half-disc in front of the crown, curved down at the sides.
    const geometry = new THREE.CylinderGeometry(0.205, 0.205, 0.012, 64, 1, false, -Math.PI / 2, Math.PI)
    geometry.scale(1, 1, 1.35)
    const position = geometry.attributes.position
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i)
      position.setY(i, position.getY(i) - 0.9 * x * x)
    }
    geometry.computeVertexNormals()
    return geometry
  }, [])
  const seams = useMemo(() => {
    const geometry = new THREE.TorusGeometry(0.2, 0.0025, 6, 96, Math.PI)
    geometry.scale(1, 0.82, 1.08)
    return geometry
  }, [])

  return (
    <group dispose={null} rotation={[0.35, -0.35, 0]}>
      <mesh ref={surface} geometry={crown} material={twill} castShadow receiveShadow onPointerMove={drag.onSurfaceMove}>
        <Prints drag={drag} garment={garment} />
      </mesh>
      {[0, Math.PI / 3, -Math.PI / 3].map((angle) => (
        <mesh key={angle} geometry={seams} material={twill} rotation={[0, angle + Math.PI / 2, 0]} />
      ))}
      <mesh geometry={brim} material={twill} position={[0, 0.004, 0.07]} rotation={[-0.08, 0, 0]} castShadow />
      <mesh position={[0, 0.165, 0]} material={twill}>
        <sphereGeometry args={[0.014, 16, 16]} />
      </mesh>
    </group>
  )
}

/** Knit beanie: a dome over a folded cuff that carries the patch. */
function BeanieModel({ garment, color, fabric }: GarmentModelProps) {
  const knit = useOwnMaterial({ color, roughness: 1 })
  useMaterialTint(useMemo(() => [knit], [knit]), color, fabric)
  const { surface, drag } = usePrintSurface()
  const crown = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.2, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2)
    geometry.scale(1, 1.15, 1)
    return geometry
  }, [])
  const cuff = useMemo(() => new THREE.CylinderGeometry(0.205, 0.205, 0.11, 96, 4, true), [])

  return (
    <group dispose={null}>
      <mesh geometry={crown} material={knit} castShadow />
      <mesh ref={surface} geometry={cuff} material={knit} position={[0, -0.055, 0]} castShadow receiveShadow onPointerMove={drag.onSurfaceMove}>
        <Prints drag={drag} garment={garment} />
      </mesh>
      <mesh position={[0, 0.25, 0]} material={knit}>
        <sphereGeometry args={[0.045, 24, 24]} />
      </mesh>
    </group>
  )
}

/** Framed poster: the product color is the frame, prints go on the paper. */
function PosterModel({ garment, color }: GarmentModelProps) {
  const frame = useOwnMaterial({ color, roughness: 0.6 })
  useMaterialTint(useMemo(() => [frame], [frame]), color, null)
  const paper = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FAFAF7', roughness: 0.95 }), [])
  const { surface, drag } = usePrintSurface()

  return (
    <group dispose={null}>
      <RoundedBox args={[0.44, 0.6, 0.03]} radius={0.006} material={frame} castShadow />
      <mesh ref={surface} position={[0, 0, 0.0155]} material={paper} onPointerMove={drag.onSurfaceMove}>
        {/* Subdivided so the face has vertices of its own: decals orient to the nearest vertex's normal. */}
        <boxGeometry args={[0.39, 0.55, 0.002, 24, 32, 1]} />
        <Prints drag={drag} garment={garment} />
      </mesh>
    </group>
  )
}

/** Die-cut vinyl sticker: a thin round slab. */
function StickerModel({ garment, color }: GarmentModelProps) {
  const vinyl = useOwnMaterial({ color, roughness: 0.35, metalness: 0 })
  useMaterialTint(useMemo(() => [vinyl], [vinyl]), color, null)
  const { surface, drag } = usePrintSurface()
  const shape = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.008, 96)
    geometry.rotateX(Math.PI / 2)
    return geometry
  }, [])

  return (
    <group dispose={null} rotation={[-0.15, 0.25, 0]}>
      <mesh ref={surface} geometry={shape} material={vinyl} castShadow receiveShadow onPointerMove={drag.onSurfaceMove}>
        <Prints drag={drag} garment={garment} />
      </mesh>
    </group>
  )
}

export function GarmentModel(props: GarmentModelProps) {
  // Rigid products keep their own finish; only apparel takes the fabric's roughness.
  const tinted = { ...props, fabric: props.garment.fabric ? props.fabric : null }
  switch (props.garment.render) {
    case 'baked':
      return <BakedTShirt {...tinted} />
    case 'cap':
      return <CapModel {...tinted} />
    case 'beanie':
      return <BeanieModel {...tinted} />
    case 'poster':
      return <PosterModel {...tinted} />
    case 'sticker':
      return <StickerModel {...tinted} />
    default:
      return <NormalizedGarment key={props.garment.id} {...tinted} />
  }
}
