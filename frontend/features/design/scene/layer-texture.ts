'use client'

import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { getFont, type DesignLayer } from '../constants'

const MAX_IMAGE_SIZE = 1024
const TEXT_PX = 160

const images = new Map<string, Promise<HTMLImageElement>>()

function loadImage(url: string) {
  let image = images.get(url)
  if (!image) {
    image = new Promise((resolve, reject) => {
      const element = new Image()
      element.crossOrigin = 'anonymous'
      element.onload = () => resolve(element)
      element.onerror = reject
      element.src = url
    })
    images.set(url, image)
  }
  return image
}

function createCanvas(width: number, height: number, flipX: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')!
  if (flipX) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }
  return { canvas, ctx }
}

async function drawImage(url: string, flipX: boolean) {
  const image = await loadImage(url)
  // SVGs without intrinsic dimensions report 0.
  const width = image.naturalWidth || 512
  const height = image.naturalHeight || 512
  const fit = Math.min(1, MAX_IMAGE_SIZE / Math.max(width, height))
  const { canvas, ctx } = createCanvas(width * fit, height * fit, flipX)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

/** next/font serves Geist under a generated family name, so read the real one off the page. */
function resolveFontFamily(fontId?: string) {
  const styles = getComputedStyle(document.body)
  if (fontId === 'mono') return `${styles.getPropertyValue('--font-geist-mono')}, ${getFont('mono').family}`
  if (!fontId || fontId === 'geist') return styles.fontFamily
  return getFont(fontId).family
}

async function drawText(layer: DesignLayer) {
  const font = `${layer.italic ? 'italic ' : ''}${layer.bold ? 800 : 500} ${TEXT_PX}px ${resolveFontFamily(layer.font)}`
  await document.fonts.load(font, layer.content).catch(() => undefined)

  const outlineWidth = layer.outline ? TEXT_PX * 0.08 : 0
  const pad = TEXT_PX * 0.2 + outlineWidth
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = font
  const width = Math.min(measure.measureText(layer.content).width + pad * 2, 4096)

  const { canvas, ctx } = createCanvas(width, TEXT_PX * 1.3 + pad, layer.flipX)
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const [x, y] = [canvas.width / 2, canvas.height / 2]
  if (layer.outline) {
    ctx.lineJoin = 'round'
    ctx.lineWidth = outlineWidth * 2
    ctx.strokeStyle = layer.outline
    ctx.strokeText(layer.content, x, y)
  }
  ctx.fillStyle = layer.color ?? '#000000'
  ctx.fillText(layer.content, x, y)
  return canvas
}

export interface LayerTexture {
  texture: THREE.CanvasTexture
  /** Height over width, so the print keeps the artwork's proportions. */
  aspect: number
}

/** Draws a layer's artwork or text to a texture, redrawing whenever its look changes. */
export function useLayerTexture(layer: DesignLayer): LayerTexture | null {
  const [result, setResult] = useState<LayerTexture | null>(null)
  const { type, imageUrl, content, color, font, bold, italic, outline, flipX } = layer

  useEffect(() => {
    let cancelled = false
    const draw = type === 'image' ? (imageUrl ? drawImage(imageUrl, flipX) : null) : drawText({ ...layer, content: content || ' ' })
    draw
      ?.then((canvas) => {
        if (cancelled) return
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = 8
        // drei's surface-aligned decal frame has v pointing down, matching canvas rows.
        texture.flipY = false
        setResult({ texture, aspect: canvas.height / canvas.width })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // `layer` is read only for the fields listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, imageUrl, content, color, font, bold, italic, outline, flipX])

  // Free each texture once it's been replaced.
  useEffect(() => () => result?.texture.dispose(), [result])

  return result
}

const frames = new Map<number, THREE.CanvasTexture>()

/** A thin outline with corner handles, drawn around the selected print. */
export function selectionFrameTexture(aspect: number) {
  const key = Math.round(aspect * 20) / 20
  let texture = frames.get(key)
  if (!texture) {
    const width = 512
    const { canvas, ctx } = createCanvas(width, width * key, false)
    const line = 4
    const handle = 18
    ctx.strokeStyle = '#F97316'
    ctx.lineWidth = line
    ctx.strokeRect(line, line, canvas.width - line * 2, canvas.height - line * 2)
    ctx.fillStyle = '#FFFFFF'
    for (const [x, y] of [
      [0, 0],
      [canvas.width - handle, 0],
      [0, canvas.height - handle],
      [canvas.width - handle, canvas.height - handle],
    ]) {
      ctx.fillRect(x, y, handle, handle)
      ctx.strokeRect(x + line / 2, y + line / 2, handle - line, handle - line)
    }
    texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    frames.set(key, texture)
  }
  return texture
}
