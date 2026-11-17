import type { Product } from '@/types'

/**
 * Products the shopper has just seen in a grid, by id. Opening one shows it at once from here
 * (while the page refreshes it from the API), so its photo is on screen in the same frame and
 * can morph from the card into the product page.
 */
const seen = new Map<string, Product>()

export const productCache = {
  remember: (product: Product) => seen.set(product.id, product),
  get: (id: string) => seen.get(id),
}
