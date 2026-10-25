'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import { GARMENTS, getFabric, type DesignLayer, type Garment, type PrintSide, type Vec3 } from '../constants'
import { sceneBridge } from '../scene-bridge'
import { useStudio } from '../store'
import { LayerDecal } from './decals'

GARMENTS.forEach((garment) => useGLTF.preload(garment.modelPath))

const COLOR_EASING = 0.25
const BAKED_AO_INTENSITY = 0.35

interface GarmentModelProps {
  garment: Garment
  color: string
  fabric: string
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
function Prints({ drag }: { drag: PrintDrag }) {
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
    return () => {
      sceneBridge.projectToSurface = undefined
    }
  }, [surface])
}

function useMaterialTint(materials: THREE.Material[], color: string, fabric: string) {
  const { roughness } = getFabric(fabric)
  useFrame((_, delta) => {
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue
      easing.dampC(material.color, color, COLOR_EASING, delta)
      easing.damp(material, 'roughness', roughness, COLOR_EASING, delta)
    }
  })
}

/** The baked T-shirt model: a single mesh with one material. */
function BakedTShirt({ garment, color, fabric }: GarmentModelProps) {
  const { nodes, materials } = useGLTF(garment.modelPath) as unknown as {
    nodes: Record<string, THREE.Mesh>
    materials: Record<string, THREE.MeshStandardMaterial>
  }
  const surface = useRef<THREE.Mesh>(null)
  useSurfaceProjection(surface)
  const drag = usePrintDrag(surface)
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
        <Prints drag={drag} />
      </mesh>
    </group>
  )
}

/** Multi-part models (hoodie, pants): tint every mesh, project prints onto the largest one. */
function MultiPartGarment({ garment, color, fabric }: GarmentModelProps) {
  const { scene } = useGLTF(garment.modelPath)
  const model = useMemo(() => scene.clone(true), [scene])
  const surface = useRef<THREE.Mesh>(null)
  useSurfaceProjection(surface)
  const drag = usePrintDrag(surface)

  const { materials, torso } = useMemo(() => {
    const meshes: THREE.Mesh[] = []
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh)
    })
    const vertexCount = (mesh: THREE.Mesh) => mesh.geometry.attributes.position?.count ?? 0
    const largest = meshes.reduce<THREE.Mesh | null>((best, mesh) => (!best || vertexCount(mesh) > vertexCount(best) ? mesh : best), null)
    meshes.forEach((mesh) => {
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return { materials: meshes.flatMap((mesh) => (Array.isArray(mesh.material) ? mesh.material : [mesh.material])), torso: largest }
  }, [model])

  useMaterialTint(materials, color, fabric)

  return (
    <group dispose={null}>
      <primitive object={model} />
      {torso && (
        // Invisible copy of the torso that receives the prints and the pointer.
        <mesh
          ref={surface}
          geometry={torso.geometry}
          position={torso.position}
          rotation={torso.rotation}
          scale={torso.scale}
          onPointerMove={drag.onSurfaceMove}
        >
          <meshBasicMaterial visible={false} />
          <Prints drag={drag} />
        </mesh>
      )}
    </group>
  )
}

export function GarmentModel(props: GarmentModelProps) {
  return props.garment.id === 'tshirt' ? <BakedTShirt {...props} /> : <MultiPartGarment {...props} />
}
