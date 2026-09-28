'use client'

import { useMemo } from 'react'
import { Decal, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { DesignLayer } from '../constants'

const TEXTURE_SIZE = 1024

/** Renders text onto a transparent canvas texture. */
function useTextTexture(text: string, color: string, fontSize = 1) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = TEXTURE_SIZE
    canvas.height = TEXTURE_SIZE
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const size = Math.min(fontSize * 120, (TEXTURE_SIZE / Math.max(text.length, 6)) * 1.5)
      ctx.fillStyle = color
      ctx.font = `bold ${size}px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [text, color, fontSize])
}

function useImageTexture(url?: string) {
  return useMemo(() => {
    if (!url) return null
    const texture = new THREE.TextureLoader().load(url)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [url])
}

/** A user layer projected onto the garment surface. Clicking it selects it. */
export function LayerDecal({ layer, onSelect }: { layer: DesignLayer; onSelect: (id: string) => void }) {
  const textTexture = useTextTexture(layer.content || ' ', layer.color || '#000000', layer.fontSize)
  const imageTexture = useImageTexture(layer.type === 'image' ? layer.imageUrl : undefined)
  const texture = imageTexture ?? textTexture

  const [sx, sy, sz] = layer.scale
  // Deep projection box so the decal wraps around curved fabric.
  const scale: [number, number, number] = [sx, sy, Math.max(sz, 0.8)]

  return (
    <Decal
      position={layer.position}
      rotation={[0, 0, layer.rotation]}
      scale={scale}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect(layer.id)
      }}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        side={THREE.FrontSide}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={1}
        roughness={0.8}
        metalness={0.1}
        depthWrite
      />
    </Decal>
  )
}

/** The fixed chest logo. */
export function ChestDecal({
  url,
  position,
  scale,
}: {
  url: string
  position: [number, number, number]
  scale: [number, number, number]
}) {
  const texture = useTexture(url, (loaded) => {
    loaded.anisotropy = 16
  })
  return <Decal depthTest position={position} rotation={[0, 0, 0]} scale={scale} map={texture} />
}
