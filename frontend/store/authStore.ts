import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import { AuthStore, User, LoginCredentials, RegisterCredentials } from '@/types'
import toast from 'react-hot-toast'

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const { user, token } = await api.login(credentials)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })
          toast.success(`Welcome back, ${user.username}!`)
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Login failed')
          throw error
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true })
        try {
          const { user, token } = await api.register(credentials)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })
          toast.success(`Welcome to CHTH | چث, ${user.username}!`)
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Registration failed')
          throw error
        }
      },

      logout: () => {
        api.logout()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
        toast.success('Logged out successfully')

        // Redirect to home page
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true })
        try {
          const updatedUser = await api.updateProfile(data)
          set({
            user: updatedUser,
            isLoading: false
          })
          toast.success('Profile updated successfully')
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Failed to update profile')
          throw error
        }
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) return

        set({ isLoading: true })
        try {
          const user = await api.getProfile()
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error: any) {
          // Token is invalid, clear auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })
          api.logout()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
