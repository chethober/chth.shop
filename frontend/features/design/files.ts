import { GARMENTS, getFabric, getGarment, type DesignDoc } from './constants'
import { sceneBridge } from './scene-bridge'

export const MAX_UPLOAD_MB = 5

/** Reads an image file into a data URL, rejecting non-images and anything over the size limit. */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error(`${file.name} isn't an image`))
    if (file.size > MAX_UPLOAD_MB * 1e6) return reject(new Error(`${file.name} is over ${MAX_UPLOAD_MB} MB`))
    const reader = new FileReader()
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unreadable file')))
    reader.onerror = () => reject(reader.error ?? new Error('Unreadable file'))
    reader.readAsDataURL(file)
  })
}

export function download(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design'
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

/** A small JPEG of the current view, for draft cards. */
export async function captureThumbnail(size = 240): Promise<string | null> {
  const still = sceneBridge.capture?.()
  if (!still) return null
  const image = await loadImage(still)
  const canvas = document.createElement('canvas')
  const scale = size / Math.max(image.width, image.height)
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#F7F6F3'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

/** Front and back stills side by side with the spec underneath: something to hand a printer. */
export async function composeTechSheet(doc: DesignDoc): Promise<string | null> {
  const front = sceneBridge.capture?.('front')
  const back = sceneBridge.capture?.('back')
  if (!front || !back) return null
  const [frontImage, backImage] = await Promise.all([loadImage(front), loadImage(back)])

  const pad = 48
  const cell = Math.min(frontImage.width, 900)
  const cellHeight = Math.round((frontImage.height / frontImage.width) * cell)
  const canvas = document.createElement('canvas')
  canvas.width = cell * 2 + pad * 3
  canvas.height = cellHeight + pad * 2 + 200
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#F4F3EF'
  ctx.fillRect(pad, pad, cell, cellHeight)
  ctx.fillRect(pad * 2 + cell, pad, cell, cellHeight)
  ctx.drawImage(frontImage, pad, pad, cell, cellHeight)
  ctx.drawImage(backImage, pad * 2 + cell, pad, cell, cellHeight)

  const font = getComputedStyle(document.body).fontFamily
  ctx.fillStyle = '#71717A'
  ctx.font = `600 22px ${font}`
  ctx.fillText('FRONT', pad + 20, pad + 40)
  ctx.fillText('BACK', pad * 2 + cell + 20, pad + 40)

  const garment = getGarment(doc.garmentId)
  const prints = doc.layers.filter((layer) => layer.visible)
  const top = pad + cellHeight + 56
  ctx.fillStyle = '#0B0B0F'
  ctx.font = `700 36px ${font}`
  ctx.fillText(doc.name, pad, top)
  ctx.font = `400 24px ${font}`
  ctx.fillStyle = '#52525B'
  ctx.fillText(
    `${garment.name} · ${getFabric(doc.fabric).name} · ${doc.color} · ${prints.length} print${prints.length === 1 ? '' : 's'} ` +
      `(${prints.filter((l) => l.side === 'front').length} front, ${prints.filter((l) => l.side === 'back').length} back)`,
    pad,
    top + 44
  )
  ctx.fillStyle = doc.color
  ctx.fillRect(canvas.width - pad - 64, top - 36, 64, 64)
  ctx.strokeStyle = '#E4E4E7'
  ctx.strokeRect(canvas.width - pad - 64, top - 36, 64, 64)
  ctx.fillStyle = '#A1A1AA'
  ctx.font = `400 18px ${font}`
  ctx.fillText(`CHTH Design Studio · ${new Date().toLocaleDateString()}`, pad, top + 92)

  return canvas.toDataURL('image/png')
}

const FILE_VERSION = 1

export function exportDesignFile(doc: DesignDoc) {
  const blob = new Blob([JSON.stringify({ version: FILE_VERSION, design: doc }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  download(url, `${slugify(doc.name)}.chth.json`)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Parses a file written by `exportDesignFile`, checking just enough that the studio can render it. */
export async function readDesignFile(file: File): Promise<DesignDoc> {
  const parsed = JSON.parse(await file.text())
  const design = parsed?.design as DesignDoc | undefined
  const valid =
    design &&
    typeof design.name === 'string' &&
    GARMENTS.some((garment) => garment.id === design.garmentId) &&
    typeof design.color === 'string' &&
    Array.isArray(design.layers) &&
    design.layers.every((layer) => layer && typeof layer.id === 'string' && Array.isArray(layer.position))
  if (!valid) throw new Error("That file isn't a CHTH design")
  return design
}
