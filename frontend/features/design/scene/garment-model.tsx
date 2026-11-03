'use client'

import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import type * as THREE from 'three'
import { GARMENTS, type DesignLayer, type Garment, type PrintArea } from '../constants'
import { ChestDecal, LayerDecal } from './decals'
import { GltfProduct } from './gltf-product'
import { BeanieModel, CapModel, PosterModel, StickerModel } from './procedural-models'

GARMENTS.forEach((garment) => garment.model && useGLTF.preload(garment.model.path))

const COLOR_EASING = 0.25

interface GarmentModelProps {
  garment: Garment
  color: string
  logoUrl: string
  layers: DesignLayer[]
  onSelectLayer: (id: string) => void
  /** Reports where new artwork should land on this product. */
  onPrintArea?: (area: PrintArea) => void
}

/** The baked T-shirt model: a single mesh with one material. */
function BakedTShirt({ color, logoUrl, garment, layers, onSelectLayer }: GarmentModelProps) {
  const { nodes, materials } = useGLTF(garment.model!.path) as unknown as {
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
        {logoUrl && <ChestDecal url={logoUrl} position={garment.chestPosition} scale={garment.chestScale} />}
        {layers.map((layer) => (
          <LayerDecal key={layer.id} layer={layer} maxDepth={garment.decalDepth} onSelect={onSelectLayer} />
        ))}
      </mesh>
    </group>
  )
}

export function GarmentModel({ onPrintArea, ...props }: GarmentModelProps) {
  const { garment } = props
  const computesOwnArea = garment.renderer === 'gltf'

  // Products with a fixed print area report it here; GLB products measure theirs once loaded.
  useEffect(() => {
    if (!computesOwnArea) onPrintArea?.({ position: garment.chestPosition, scale: garment.chestScale })
  }, [computesOwnArea, garment, onPrintArea])

  switch (garment.renderer) {
    case 'baked-gltf':
      return <BakedTShirt {...props} />
    case 'cap':
      return <CapModel {...props} />
    case 'beanie':
      return <BeanieModel {...props} />
    case 'poster':
      return <PosterModel {...props} />
    case 'sticker':
      return <StickerModel {...props} />
    default:
      return <GltfProduct key={garment.id} {...props} onPrintArea={onPrintArea} />
  }
}
