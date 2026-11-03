'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import { GARMENTS, type DesignLayer, type Garment } from '../constants'
import { ChestDecal, LayerDecal } from './decals'
import { HatModel, MugModel, ToteModel } from './procedural-models'

GARMENTS.forEach((garment) => garment.modelPath && useGLTF.preload(garment.modelPath))

const COLOR_EASING = 0.25

interface GarmentModelProps {
  garment: Garment
  color: string
  logoUrl: string
  layers: DesignLayer[]
  onSelectLayer: (id: string) => void
}

/** Chest logo and user layers, projected onto the given mesh. */
function Decals({ garment, logoUrl, layers, onSelectLayer }: Omit<GarmentModelProps, 'color'>) {
  return (
    <>
      {logoUrl && <ChestDecal url={logoUrl} position={garment.chestPosition} scale={garment.chestScale} />}
      {layers.map((layer) => (
        <LayerDecal key={layer.id} layer={layer} onSelect={onSelectLayer} />
      ))}
    </>
  )
}

/** The baked T-shirt model: a single mesh with one material. */
function BakedTShirt({ color, logoUrl, ...rest }: GarmentModelProps) {
  const { nodes, materials } = useGLTF(rest.garment.modelPath!) as unknown as {
    nodes: Record<string, THREE.Mesh>
    materials: Record<string, THREE.MeshStandardMaterial>
  }

  useFrame((_, delta) => {
    easing.dampC(materials.lambert1.color, color, COLOR_EASING, delta)
  })

  return (
    // Re-mounting on logo change refreshes the decal projection.
    <group key={`${color}:${logoUrl}`} dispose={null}>
      <mesh castShadow receiveShadow geometry={nodes.T_Shirt_male.geometry} material={materials.lambert1} material-roughness={1}>
        <Decals logoUrl={logoUrl} {...rest} />
      </mesh>
    </group>
  )
}

/** Multi-part models (hoodie, pants): tint every mesh, project decals onto the largest one. */
function MultiPartGarment({ color, garment, ...rest }: GarmentModelProps) {
  const { scene } = useGLTF(garment.modelPath!)
  const model = useMemo(() => scene.clone(true), [scene])

  const { meshes, torso } = useMemo(() => {
    const found: THREE.Mesh[] = []
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) found.push(child as THREE.Mesh)
    })
    const vertexCount = (mesh: THREE.Mesh) => mesh.geometry.attributes.position?.count ?? 0
    const largest = found.reduce<THREE.Mesh | null>((best, mesh) => (!best || vertexCount(mesh) > vertexCount(best) ? mesh : best), null)
    found.forEach((mesh) => {
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return { meshes: found, torso: largest }
  }, [model])

  useFrame((_, delta) => {
    for (const mesh of meshes) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials) {
        if ('color' in material) easing.dampC((material as THREE.MeshStandardMaterial).color, color, COLOR_EASING, delta)
      }
    }
  })

  return (
    <group dispose={null}>
      <primitive object={model} />
      {torso && (
        // Invisible copy of the torso that receives the decals.
        <mesh geometry={torso.geometry} position={torso.position} rotation={torso.rotation} scale={torso.scale}>
          <meshBasicMaterial visible={false} />
          <Decals garment={garment} {...rest} />
        </mesh>
      )}
    </group>
  )
}

export function GarmentModel(props: GarmentModelProps) {
  switch (props.garment.renderer) {
    case 'baked-gltf':
      return <BakedTShirt {...props} />
    case 'mug':
      return <MugModel {...props} />
    case 'hat':
      return <HatModel {...props} />
    case 'tote':
      return <ToteModel {...props} />
    default:
      return <MultiPartGarment {...props} />
  }
}
