'use client'

import { Decal } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { DesignLayer, Vec3 } from '../constants'
import { selectionFrameTexture, useLayerTexture } from './layer-texture'

/** Default projection depth; each product sets its own (Garment.decalDepth). */
const DECAL_DEPTH = 0.28

/** The rotation drei gives a decal facing `side`, built the same way as its normal-following path, then rolled. */
function axisRotation(side: DesignLayer['side'], roll: number): Vec3 {
  const o = new THREE.Object3D()
  o.lookAt(0, 0, side === 'back' ? -1 : 1)
  o.rotateZ(Math.PI)
  o.rotateY(Math.PI)
  o.rotateZ(roll)
  return [o.rotation.x, o.rotation.y, o.rotation.z]
}

/** On-canvas helpers that must not appear in exported stills. */
export const sceneOverlays = new Set<THREE.Object3D>()

function registerOverlay(object: THREE.Object3D | null) {
  if (!object) return
  sceneOverlays.add(object)
  return () => {
    sceneOverlays.delete(object)
  }
}

interface LayerDecalProps {
  layer: DesignLayer
  /** Stack position; higher prints on top. */
  index: number
  selected: boolean
  onPointerDown: (layer: DesignLayer, event: ThreeEvent<PointerEvent>) => void
  onHover: (layer: DesignLayer | null) => void
  /** How deep the print projects along the surface normal. */
  depth?: number
  /** Face straight front/back instead of following the surface normal (see Garment.axisPrints). */
  axisAligned?: boolean
}

/** A user layer projected onto the garment surface, oriented to the fabric under it. */
export function LayerDecal({ layer, index, selected, onPointerDown, onHover, depth = DECAL_DEPTH, axisAligned = false }: LayerDecalProps) {
  const art = useLayerTexture(layer)
  if (!art || !layer.visible) return null

  const scale: Vec3 = [layer.size, layer.size * art.aspect, depth]
  // A number makes drei orient the decal to the surface normal, then roll it by that angle.
  const roll = layer.rotation || 0
  const rotation: number | Vec3 = axisAligned ? axisRotation(layer.side, roll) : roll

  return (
    <>
      <Decal
        position={layer.position}
        rotation={rotation}
        scale={scale}
        renderOrder={index + 1}
        depthTest
        polygonOffsetFactor={-4 - index}
        onPointerDown={(event) => onPointerDown(layer, event)}
        onPointerOver={(event) => {
          event.stopPropagation()
          onHover(layer)
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshStandardMaterial
          map={art.texture}
          transparent
          opacity={layer.opacity}
          depthTest
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-4 - index}
          roughness={0.85}
        />
      </Decal>
      {selected && (
        <Decal
          ref={registerOverlay}
          position={layer.position}
          rotation={rotation}
          scale={[scale[0] * 1.06 + 0.01, scale[1] * 1.06 + 0.01, depth]}
          renderOrder={999}
          raycast={() => null}
        >
          <meshBasicMaterial
            map={selectionFrameTexture(art.aspect)}
            transparent
            depthTest
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-40}
            toneMapped={false}
          />
        </Decal>
      )}
    </>
  )
}
