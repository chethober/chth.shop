import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { tokenStorage, type CartLineInput } from '@/lib/api'
import type { Cart } from '@/types'

interface CartState {
  cart: Cart | null
  isLoading: boolean
  fetchCart: () => Promise<void>
  addItem: (line: CartLineInput) => Promise<void>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clear: () => Promise<void>
  reset: () => void
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      /** Runs a cart mutation, then reloads the cart so totals stay server-accurate. */
      const mutate = async (action: () => Promise<unknown>) => {
        set({ isLoading: true })
        try {
          await action()
          await get().fetchCart()
        } finally {
          set({ isLoading: false })
        }
      }

      return {
        cart: null,
        isLoading: false,

        fetchCart: async () => {
          if (!tokenStorage.get()) {
            set({ cart: null })
            return
          }
          set({ isLoading: true })
          try {
            set({ cart: await api.cart.get() })
          } catch {
            set({ cart: null })
          } finally {
            set({ isLoading: false })
          }
        },

        addItem: (line) => mutate(() => api.cart.add(line)),
        updateItem: (itemId, quantity) => mutate(() => api.cart.updateItem(itemId, quantity)),
        removeItem: (itemId) => mutate(() => api.cart.removeItem(itemId)),
        clear: () => mutate(() => api.cart.clear()),
        reset: () => set({ cart: null, isLoading: false }),
      }
    },
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
)

export default useCartStore
