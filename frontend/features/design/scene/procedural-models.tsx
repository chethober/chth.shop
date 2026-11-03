'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import type { DesignLayer, Garment } from '../constants'
import { ChestDecal, LayerDecal } from './decals'

// Print areas (Garment.chestPosition) are in the local space of the mesh that receives decals.
// Products with no suitable free model (cap, beanie, poster, sticker), built from primitives
// sized to sit next to the GLB products (about 0.6 units across).

const COLOR_EASING = 0.25

interface ProceduralModelProps {
  garment: Garment
  color: string
  logoUrl: string
  layers: DesignLayer[]
  onSelectLayer: (id: string) => void
}

/** A material whose color eases toward `color`, like the GLB products. */
function useTintedMaterial(color: string, params: THREE.MeshStandardMaterialParameters) {
  // Created once; the color is then eased every frame instead of recreating the material.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color, ...params }), [])
  useFrame((_, delta) => {
    easing.dampC(material.color, color, COLOR_EASING, delta)
  })
  return material
}

/** Print area logo and user layers, projected onto the parent mesh. */
function PrintDecals({ garment, logoUrl, layers, onSelectLayer }: Omit<ProceduralModelProps, 'color'>) {
  return (
    <>
      {logoUrl && (
        <ChestDecal
          url={logoUrl}
          position={garment.chestPosition}
          scale={[garment.chestScale[0], garment.chestScale[1], garment.decalDepth]}
        />
      )}
      {layers.map((layer) => (
        <LayerDecal key={layer.id} layer={layer} maxDepth={garment.decalDepth} onSelect={onSelectLayer} />
      ))}
    </>
  )
}

const decalKey = (props: Pick<ProceduralModelProps, 'logoUrl' | 'layers'>) => `${props.logoUrl}:${props.layers.length}`

/** Six-panel cap, tilted toward the camera so the curved brim reads from the front. */
export function CapModel({ color, ...rest }: ProceduralModelProps) {
  const twill = useTintedMaterial(color, { roughness: 0.85, side: THREE.DoubleSide })
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
    <group dispose={null} rotation={[0.35, -0.35, 0]} position={[0, -0.05, 0]}>
      <mesh key={decalKey(rest)} geometry={crown} material={twill} castShadow receiveShadow>
        <PrintDecals {...rest} />
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

/** Knit beanie: a dome over a folded cuff, with a ribbed look from the segment count. */
export function BeanieModel({ color, ...rest }: ProceduralModelProps) {
  const knit = useTintedMaterial(color, { roughness: 1, flatShading: false })
  const crown = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.2, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2)
    geometry.scale(1, 1.15, 1)
    return geometry
  }, [])
  const cuff = useMemo(() => new THREE.CylinderGeometry(0.205, 0.205, 0.11, 96, 4, true), [])

  return (
    <group dispose={null}>
      <mesh geometry={crown} material={knit} castShadow />
      <mesh key={decalKey(rest)} geometry={cuff} material={knit} position={[0, -0.055, 0]} castShadow receiveShadow>
        <PrintDecals {...rest} />
      </mesh>
      <mesh position={[0, 0.25, 0]} material={knit}>
        <sphereGeometry args={[0.045, 24, 24]} />
      </mesh>
    </group>
  )
}

/** Framed poster: the product color is the frame, prints go on the paper. */
export function PosterModel({ color, ...rest }: ProceduralModelProps) {
  const frame = useTintedMaterial(color, { roughness: 0.6 })
  const paper = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FAFAF7', roughness: 0.95 }), [])

  return (
    <group dispose={null}>
      <RoundedBox args={[0.44, 0.6, 0.03]} radius={0.006} material={frame} castShadow />
      <mesh key={decalKey(rest)} position={[0, 0, 0.0155]} material={paper}>
        <boxGeometry args={[0.39, 0.55, 0.002]} />
        <PrintDecals {...rest} />
      </mesh>
    </group>
  )
}

/** Die-cut vinyl sticker: a thin rounded slab with a white border. */
export function StickerModel({ color, ...rest }: ProceduralModelProps) {
  const vinyl = useTintedMaterial(color, { roughness: 0.35, metalness: 0 })
  const shape = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.008, 96)
    geometry.rotateX(Math.PI / 2)
    return geometry
  }, [])

  return (
    <group dispose={null} rotation={[-0.15, 0.25, 0]}>
      <mesh key={decalKey(rest)} geometry={shape} material={vinyl} castShadow receiveShadow>
        <PrintDecals {...rest} />
      </mesh>
    </group>
  )
}
