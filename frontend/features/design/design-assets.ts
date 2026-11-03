import api from '@/lib/api'
import type { Design, DesignLayer } from '@/types'

const PREVIEW_MAX_SIZE = 900

/**
 * Uploads any inline (data URL) images in the design so it can be saved,
 * reusing uploads already made in this session.
 */
export async function uploadDesignImages(
  design: { color: string; logoUrl: string; layers: DesignLayer[] },
  cache: Map<string, string>
): Promise<Design> {
  const upload = async (url: string | undefined) => {
    if (!url || !url.startsWith('data:')) return url
    const cached = cache.get(url)
    if (cached) return cached
    const uploaded = await api.uploadImage(url)
    cache.set(url, uploaded)
    return uploaded
  }

  const [logoUrl, ...layerUrls] = await Promise.all([upload(design.logoUrl), ...design.layers.map((layer) => upload(layer.imageUrl))])

  return {
    color: design.color,
    logoUrl: logoUrl || null,
    layers: design.layers.map((layer, index) => ({ ...layer, ...(layer.type === 'image' && { imageUrl: layerUrls[index] }) })),
  }
}

/** Captures the studio canvas as a downscaled PNG and uploads it as the product preview. */
export async function uploadStudioPreview(): Promise<string | undefined> {
  const source = document.querySelector<HTMLCanvasElement>('[data-studio-canvas] canvas')
  if (!source || source.width === 0) return undefined

  const scale = Math.min(1, PREVIEW_MAX_SIZE / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * scale)
  canvas.height = Math.round(source.height * scale)
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height)

  try {
    return await api.uploadImage(canvas.toDataURL('image/png'))
  } catch {
    // A missing preview shouldn't block the purchase; the stock photo is used instead.
    return undefined
  }
}
