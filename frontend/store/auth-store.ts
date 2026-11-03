import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { onUnauthorized, tokenStorage } from '@/lib/api'
import useCartStore from './cart-store'
import useWishlistStore from './wishlist-store'
import type { TelegramAuthData, User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  /** Stores a session returned by any sign-in method. */
  signIn: (user: User, token: string) => void
  signInWithTelegram: (data: TelegramAuthData) => Promise<User>
  updateUsername: (newUsername: string) => Promise<void>
  /** Merges fields into the stored user after a server-side change. */
  patchUser: (changes: Partial<User>) => void
  /** Clears the local session (token, user, cart). */
  signOut: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      signIn: (user, token) => {
        tokenStorage.set(token)
        set({ user, isAuthenticated: true })
      },

      signInWithTelegram: async (data) => {
        const { user, token } = await api.auth.telegram(data)
        tokenStorage.set(token)
        set({ user, isAuthenticated: true })
        return user
      },

      updateUsername: async (newUsername) => {
        const { user, token } = await api.auth.updateUsername(newUsername)
        tokenStorage.set(token)
        set({ user })
      },

      patchUser: (changes) => set((state) => ({ user: state.user ? { ...state.user, ...changes } : null })),

      signOut: () => {
        tokenStorage.clear()
        useCartStore.getState().reset()
        useWishlistStore.getState().reset()
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// An expired or revoked token ends the session everywhere.
onUnauthorized(() => useAuthStore.getState().signOut())

export default useAuthStore
