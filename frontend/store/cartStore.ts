import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildApiUrl } from '@/lib/config'

export interface CartItem {
  id: string
  productId: number
  quantity: number
  product: {
    id: number
    name: string
    type: string
    price: number
    imageUrl?: string
    artist: {
      id: number
      storeName?: string
      username: string
    }
  }
}

export interface Cart {
  id: number
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

interface CartStore {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCart: () => Promise<void>
  addToCart: (productId: number, quantity?: number) => Promise<void>
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
          const token = localStorage.getItem('token')
          if (!token) {
            set({ cart: null, isLoading: false })
            return
          }

          console.log('Fetching cart from:', buildApiUrl('/api/cart'))
          const response = await fetch(buildApiUrl('/api/cart'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          console.log('Cart response status:', response.status)

          if (response.ok) {
            const data = await response.json()
            set({ cart: data.cart, isLoading: false })
          } else if (response.status === 404) {
            // Cart doesn't exist yet, create an empty cart state
            set({ 
              cart: { 
                id: 0, 
                items: [], 
                totalItems: 0, 
                totalPrice: 0 
              }, 
              isLoading: false 
            })
          } else {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch cart`)
          }
        } catch (error) {
          console.error('Cart fetch error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch cart', 
            isLoading: false 
          })
        }
      },

      addToCart: async (productId: number, quantity: number = 1) => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('Authentication required')
          }

          const response = await fetch(buildApiUrl('/api/cart/add'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity })
          })

          if (response.ok) {
            // Refresh cart after adding item
            await get().fetchCart()
          } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to add item to cart')
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add item to cart', 
            isLoading: false 
          })
        }
      },

      updateCartItem: async (itemId: string, quantity: number) => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('Authentication required')
          }

          const response = await fetch(buildApiUrl(`/api/cart/items/${itemId}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
          })

          if (response.ok) {
            // Refresh cart after updating item
            await get().fetchCart()
          } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to update cart item')
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update cart item', 
            isLoading: false 
          })
        }
      },

      removeFromCart: async (itemId: string) => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('Authentication required')
          }

          const response = await fetch(buildApiUrl(`/api/cart/items/${itemId}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            // Refresh cart after removing item
            await get().fetchCart()
          } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to remove item from cart')
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove item from cart', 
            isLoading: false 
          })
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('Authentication required')
          }

          const response = await fetch(buildApiUrl('/api/cart/clear'), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            // Refresh cart after clearing
            await get().fetchCart()
          } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to clear cart')
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to clear cart', 
            isLoading: false 
          })
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