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

      loginWithGoogle: async () => {
        set({ isLoading: true })
        try {
          await api.initiateGoogleAuth()
          // Redirect will happen
        } catch (error: any) {
          set({ isLoading: false })
          toast.error('Google login failed. Please try again.')
          throw error
        }
      },

      completeOAuth: async (user: User, token: string) => {
        try {
          await api.handleGoogleCallback(token, user)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
          toast.success(`Welcome, ${user.username}!`)
        } catch (error: any) {
          set({ isLoading: false })
          toast.error('Failed to complete authentication')
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
          toast.success('Profile updated successfully!')
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Failed to update profile')
          throw error
        }
      },

      updateUsername: async (newUsername: string) => {
        set({ isLoading: true })
        try {
          const result = await api.updateUsername(newUsername)
          set({
            user: result.user,
            token: result.token,
            isLoading: false
          })
          toast.success('Username updated successfully!')
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Failed to update username')
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
        } catch (error) {
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
