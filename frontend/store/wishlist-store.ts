import { create } from 'zustand'
import api, { tokenStorage } from '@/lib/api'

interface WishlistState {
  ids: Set<string>
  loaded: boolean
  load: () => Promise<void>
  toggle: (productId: string) => Promise<boolean>
  reset: () => void
}

let inFlight: Promise<void> | null = null

/** Saved product ids for the heart buttons; the full list lives on the account page. */
const useWishlistStore = create<WishlistState>()((set, get) => ({
  ids: new Set(),
  loaded: false,

  load: () => {
    if (get().loaded || !tokenStorage.get()) return Promise.resolve()
    // Every heart on the page calls this on mount; share one request.
    inFlight ??= api.wishlist
      .list()
      .then(({ ids }) => set({ ids: new Set(ids), loaded: true }))
      .catch(() => set({ loaded: true }))
      .finally(() => {
        inFlight = null
      })
    return inFlight
  },

  /** Returns whether the product is saved afterwards. */
  toggle: async (productId) => {
    const previous = get().ids
    const saved = previous.has(productId)
    const next = new Set(previous)
    if (saved) next.delete(productId)
    else next.add(productId)
    set({ ids: next }) // optimistic
    try {
      await (saved ? api.wishlist.remove(productId) : api.wishlist.add(productId))
      return !saved
    } catch (error) {
      set({ ids: previous })
      throw error
    }
  },

  reset: () => set({ ids: new Set(), loaded: false }),
}))

export default useWishlistStore
