/**
/**
 * Authentication Store - Zustand
 * Manages user authentication state, login/logout, and JWT token handling
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { 
  AuthState, 
  AuthActions, 
  User, 
  LoginRequest, 
  RegisterRequest,
  AuthResponse 
} from '@/types'
import { authAPI } from '@/services/api'

interface AuthStore extends AuthState, AuthActions {}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.login(credentials)
          const { access_token, id, email, name } = response.data

          // Create user object from response data
          const user = {
            id,
            email,
            full_name: name,
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // Store token in localStorage for persistence
          localStorage.setItem('auth_token', access_token)
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed'
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.register(userData)
          const { access_token, id, email, name } = response.data

          // Create user object from response data
          const user = {
            id,
            email,
            full_name: name,
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          localStorage.setItem('auth_token', access_token)
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed'
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      loginWithGoogle: async (token: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.googleAuth(token)
          const { access_token, id, email, name } = response.data

          // Create user object from response data
          const user = {
            id,
            email,
            full_name: name,
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          localStorage.setItem('auth_token', access_token)
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Google login failed'
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      logout: () => {
        // Clear authentication state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        
        // Remove token from localStorage
        localStorage.removeItem('auth_token')
        
        // Clear other stores if needed
        // Note: You might want to clear other stores here too
      },

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        })
      },

      setToken: (token: string | null) => {
        set({ 
          token, 
          isAuthenticated: !!token 
        })
        
        if (token) {
          localStorage.setItem('auth_token', token)
        } else {
          localStorage.removeItem('auth_token')
        }
      },

      clearError: () => {
        set({ error: null })
      },

      // Auto-login on app start if token exists
      initializeAuth: async () => {
        const storedToken = localStorage.getItem('auth_token')
        
        if (storedToken) {
          set({ isLoading: true })
          
          try {
            // Verify token with backend
            const response = await authAPI.getCurrentUser()
            const user = response.data
            
            set({
              user,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } catch (error) {
            // Token is invalid, clear it
            localStorage.removeItem('auth_token')
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          }
        }
      },

      // Refresh token if needed
      refreshToken: async () => {
        const { token } = get()
        
        if (!token) {
          throw new Error('No token to refresh')
        }
        
        try {
          const response = await authAPI.refreshToken()
          const { access_token, id, email, name } = response.data

          // Create user object from response data
          const user = {
            id,
            email,
            full_name: name,
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            error: null,
          })
          
          localStorage.setItem('auth_token', access_token)
          
          return access_token
        } catch (error) {
          // Refresh failed, logout user
          get().logout()
          throw error
        }
      },

      // Check if token is expired
      isTokenExpired: (): boolean => {
        const { token } = get()
        
        if (!token) return true
        
        try {
          // Decode JWT token to check expiration
          const payload = JSON.parse(atob(token.split('.')[1]))
          const currentTime = Date.now() / 1000
          
          return payload.exp < currentTime
        } catch (error) {
          return true
        }
      },
    }),
    {
      name: 'geoguardian-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Add the new methods to the interface
interface AuthStore extends AuthState, AuthActions {
  initializeAuth: () => Promise<void>
  refreshToken: () => Promise<string>
  isTokenExpired: () => boolean
}

// Helper hooks for common authentication checks
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthToken = () => useAuthStore((state) => state.token)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)