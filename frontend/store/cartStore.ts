import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import { Cart, CartItem } from '@/types'

interface CartStore {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateCartItem: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  setError: (error: string | null) => void
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,

      fetchCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const cart = await api.getCart()
          set({ cart, isLoading: false })
        } catch (error: any) {
          console.error('Cart fetch error:', error)
          // If not authenticated or cart empty, clear state gracefully
          set({ 
            cart: null,
            error: error.message || 'Failed to fetch cart', 
            isLoading: false 
          })
        }
      },

      addToCart: async (productId: string, quantity: number = 1) => {
        set({ isLoading: true, error: null })
        try {
          await api.addToCart(productId, quantity)
          // Refresh cart after adding
          await get().fetchCart()
        } catch (error: any) {
          console.error('Add to cart error:', error)
          set({ 
            error: error.message || 'Failed to add item to cart', 
            isLoading: false 
          })
          throw error
        }
      },

      updateCartItem: async (itemId: string, quantity: number) => {
        set({ isLoading: true, error: null })
        try {
          await api.updateCartItem(itemId, quantity)
          await get().fetchCart()
        } catch (error: any) {
          console.error('Update cart item error:', error)
          set({ 
            error: error.message || 'Failed to update cart item', 
            isLoading: false 
          })
          throw error
        }
      },

      removeFromCart: async (itemId: string) => {
        set({ isLoading: true, error: null })
        try {
          await api.removeFromCart(itemId)
          await get().fetchCart()
        } catch (error: any) {
          console.error('Remove from cart error:', error)
          set({ 
            error: error.message || 'Failed to remove item from cart', 
            isLoading: false 
          })
          throw error
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null })
        try {
          await api.clearCart()
          await get().fetchCart()
        } catch (error: any) {
          console.error('Clear cart error:', error)
          set({ 
            error: error.message || 'Failed to clear cart', 
            isLoading: false 
          })
          throw error
        }
      },

      setError: (error: string | null) => {
        set({ error })
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart })
    }
  )
)

export default useCartStore