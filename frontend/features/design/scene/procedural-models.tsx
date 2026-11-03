'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import * as THREE from 'three'
import type { Garment, DesignLayer } from '../constants'
import { ChestDecal, LayerDecal } from './decals'

// Mugs, caps and totes have no scanned models; they are built from primitives sized to
// sit next to the garment models (roughly 0.4 units tall).

const COLOR_EASING = 0.25

interface ProceduralModelProps {
  garment: Garment
  color: string
  logoUrl: string
  layers: DesignLayer[]
  onSelectLayer: (id: string) => void
}

/** A material whose color eases toward `color`, like the garment models. */
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

export function MugModel({ color, ...rest }: ProceduralModelProps) {
  const ceramic = useTintedMaterial(color, { roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide })
  const body = useMemo(() => new THREE.CylinderGeometry(0.16, 0.15, 0.36, 128, 8, true), [])
  // Re-mounting on logo change refreshes the decal projection.
  const key = `${rest.logoUrl}:${rest.layers.length}`

  return (
    <group dispose={null}>
      <mesh key={key} geometry={body} material={ceramic} castShadow receiveShadow>
        <PrintDecals {...rest} />
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ceramic}>
        <circleGeometry args={[0.15, 64]} />
      </mesh>
      {/* Handle on the right, curving out from the body. */}
      <mesh position={[0.16, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={ceramic} castShadow>
        <torusGeometry args={[0.09, 0.022, 24, 64, Math.PI]} />
      </mesh>
    </group>
  )
}

export function HatModel({ color, ...rest }: ProceduralModelProps) {
  const fabric = useTintedMaterial(color, { roughness: 0.9, side: THREE.DoubleSide })
  // Upper half of a slightly flattened sphere for the crown.
  const crown = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.18, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2)
    geometry.scale(1, 0.85, 1.05)
    return geometry
  }, [])
  // Half disc in front of the crown (+z), stretched forward into a brim.
  const brim = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.19, 0.19, 0.01, 64, 1, false, -Math.PI / 2, Math.PI)
    geometry.scale(1, 1, 1.25)
    return geometry
  }, [])
  const key = `${rest.logoUrl}:${rest.layers.length}`

  return (
    <group dispose={null} position={[0, -0.05, 0]}>
      <mesh key={key} geometry={crown} material={fabric} castShadow receiveShadow>
        <PrintDecals {...rest} />
      </mesh>
      <mesh geometry={brim} material={fabric} position={[0, 0.005, 0.02]} rotation={[0.12, 0, 0]} castShadow />
      <mesh position={[0, 0.153, 0]} material={fabric}>
        <sphereGeometry args={[0.012, 16, 16]} />
      </mesh>
    </group>
  )
}

export function ToteModel({ color, ...rest }: ProceduralModelProps) {
  const canvas = useTintedMaterial(color, { roughness: 1 })
  const strap = useTintedMaterial(color, { roughness: 1, side: THREE.DoubleSide })
  const body = useMemo(() => new THREE.BoxGeometry(0.36, 0.4, 0.06, 16, 16, 2), [])
  const key = `${rest.logoUrl}:${rest.layers.length}`

  return (
    <group dispose={null}>
      <mesh key={key} geometry={body} material={canvas} castShadow receiveShadow>
        <PrintDecals {...rest} />
      </mesh>
      {[0.022, -0.022].map((z) => (
        <mesh key={z} position={[0, 0.2, z]} material={strap} castShadow>
          <torusGeometry args={[0.08, 0.008, 12, 48, Math.PI]} />
        </mesh>
      ))}
    </group>
  )
}
