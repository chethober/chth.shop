'use client'

import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import type { DesignLayer, Garment, PrintArea } from '../constants'
import { ChestDecal, LayerDecal } from './decals'

const COLOR_EASING = 0.25

interface Part {
  name: string
  geometry: THREE.BufferGeometry
  material: THREE.MeshStandardMaterial
  tinted: boolean
}

/**
 * Loads a product GLB and bakes every mesh's world transform into its own geometry, centred and
 * scaled so the model's largest side is `targetSize`. Every product then shares one coordinate
 * space (≈ ±0.3 units), which is what decal positions and the layer sliders use.
 * Skinned meshes (the garment avatars) are flattened to their bind pose.
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
      if (model.rotationY) geometry.rotateY(model.rotationY)
      geometry.computeBoundingBox()
      bounds.union(geometry.boundingBox!)

      const source = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
      const material = source.clone()
      const tinted = !model.tintParts || model.tintParts.includes(mesh.name)
      // Baked colour textures would fight the tint; keep normal / roughness detail only.
      if (tinted && model.dropColorTextures) material.map = null
      material.needsUpdate = true
      return { name: mesh.name, geometry, material, tinted }
    })

    const center = bounds.getCenter(new THREE.Vector3())
    const size = bounds.getSize(new THREE.Vector3())
    const scale = model.targetSize / Math.max(size.x, size.y, size.z)
    for (const part of parts) {
      part.geometry.translate(-center.x, -center.y, -center.z)
      part.geometry.scale(scale, scale, scale)
      part.geometry.computeBoundingBox()
    }

    const vertexCount = (part: Part) => part.geometry.attributes.position?.count ?? 0
    const printPart =
      parts.find((part) => part.name === model.printPart) ??
      parts.reduce((best, part) => (vertexCount(part) > vertexCount(best) ? part : best), parts[0])

    // Print area: `printU` across and `printV` up the print part, on its front (+z) face.
    const box = printPart.geometry.boundingBox!
    const width = (box.max.x - box.min.x) * (model.printWidth ?? 0.5)
    const printArea: PrintArea = {
      position: [
        box.min.x + (box.max.x - box.min.x) * (model.printU ?? 0.5),
        box.min.y + (box.max.y - box.min.y) * (model.printV ?? 0.5),
        box.max.z,
      ],
      scale: [width, width, width],
    }

    return { parts, printPart, printArea }
  }, [scene, model])
}

interface GltfProductProps {
  garment: Garment
  color: string
  logoUrl: string
  layers: DesignLayer[]
  onSelectLayer: (id: string) => void
  onPrintArea?: (area: PrintArea) => void
}

export function GltfProduct({ garment, color, logoUrl, layers, onSelectLayer, onPrintArea }: GltfProductProps) {
  const { parts, printPart, printArea } = useNormalizedModel(garment)

  useEffect(() => {
    onPrintArea?.(printArea)
  }, [printArea, onPrintArea])

  useFrame((_, delta) => {
    for (const part of parts) {
      if (part.tinted) easing.dampC(part.material.color, color, COLOR_EASING, delta)
    }
  })

  return (
    <group dispose={null}>
      {parts.map((part) => (
        <mesh key={part.name} geometry={part.geometry} material={part.material} castShadow receiveShadow />
      ))}
      {/* Invisible copy of the print part that receives the decals; re-mounted when artwork changes. */}
      <mesh key={`${logoUrl}:${layers.length}`} geometry={printPart.geometry}>
        <meshBasicMaterial visible={false} />
        {logoUrl && (
          <ChestDecal
            url={logoUrl}
            position={printArea.position}
            scale={[printArea.scale[0], printArea.scale[1], garment.decalDepth]}
          />
        )}
        {layers.map((layer) => (
          <LayerDecal key={layer.id} layer={layer} maxDepth={garment.decalDepth} onSelect={onSelectLayer} />
        ))}
      </mesh>
    </group>
  )
}
