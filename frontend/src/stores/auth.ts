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
  RegisterRequest
} from '@/types'
import {
  supabase,
  getCurrentUser,
  getCurrentSession,
  getAuthToken,
  isAuthenticated,
  signInWithGoogle,
  signOut,
  createDatabaseUser
} from '@/lib/supabase-auth'

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
          // Use Supabase auth directly for email/password login
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          })
          
          if (error) {
            throw error
          }
          
          // Create user object from Supabase user
          const userData = {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            avatar_url: data.user.user_metadata?.avatar_url || undefined,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString()
          }
          
          // Create user in database if needed
          const { error: dbError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
              avatar_url: data.user.user_metadata?.avatar_url || undefined,
              updated_at: new Date().toISOString()
            })
          
          set({
            user: userData,
            token: data.session?.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // Store token in localStorage for persistence
          const token = data.session?.access_token
          if (token) {
            localStorage.setItem('auth_token', token)
          }
          
        } catch (error: any) {
          const errorMessage = error.message || 'Login failed'
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
          // Create user with Supabase auth
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                name: userData.full_name || userData.email.split('@')[0]
              }
            }
          })
          
          if (error || !data.user) {
            throw error || new Error('Registration failed')
          }
          
          // Create user object from Supabase user
          const userDataObject = {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            avatar_url: data.user.user_metadata?.avatar_url || undefined,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString()
          }
          
          // Create user in database if needed
          const { error: dbError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
              avatar_url: data.user.user_metadata?.avatar_url || undefined,
              updated_at: new Date().toISOString()
            })
          
          set({
            user: userDataObject,
            token: data.session?.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // Store token in localStorage for persistence
          const token = data.session?.access_token
          if (token) {
            localStorage.setItem('auth_token', token)
          }
          
        } catch (error: any) {
          const errorMessage = error.message || 'Registration failed'
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

      loginWithGoogle: async (callbackUrl: string = '/dashboard') => {
        set({ isLoading: true, error: null })
        
        try {
          // Sign in with Google via Supabase
          await signInWithGoogle(callbackUrl)
          
          // Get current user and session
          const user = await getCurrentUser()
          const token = await getAuthToken()
          
          if (!user || !token) {
            throw new Error('Failed to get user data after Google login')
          }
          
          // Create user object from Supabase data
          const userData = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
            created_at: user.created_at,
            updated_at: new Date().toISOString()
          }
          
          // Create user in database if needed
          const { error: dbError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url || undefined,
              updated_at: new Date().toISOString()
            })
          
          set({
            user: userData,
            token: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // Store token in localStorage for persistence
          localStorage.setItem('auth_token', token)
          
        } catch (error: any) {
          const errorMessage = error.message || 'Google login failed'
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

      // Auto-login on app start using Supabase session
      initializeAuth: async () => {
        set({ isLoading: true, error: null })

        try {
          // Get current session directly to avoid circular import
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            throw error
          }
          
          if (data.session) {
            const user = data.session.user
            const userData = {
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url || undefined,
              provider: (user.app_metadata?.provider === 'google' ? 'google' : 'email') as 'email' | 'google',
              created_at: user.created_at,
              updated_at: new Date().toISOString()
            }
            
            localStorage.setItem('auth_token', data.session.access_token)
            
            set({
              user: userData,
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
            
            localStorage.removeItem('auth_token')
          }

        } catch (error: any) {
          console.error('Auth initialization error:', error)

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Authentication initialization failed',
          })

          localStorage.removeItem('auth_token')
        }
      },

      // Refresh token if needed
      refreshToken: async () => {
        try {
          // Refresh Supabase session
          const { data, error } = await supabase.auth.refreshSession()
          
          if (error) {
            throw error
          }
          
          const { session } = data
          
          if (!session) {
            throw new Error('No session found after refresh')
          }
          
          // Get current user
          const user = await getCurrentUser()
          
          // Create user object from Supabase data
          const userData = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url || undefined,
            created_at: user.created_at,
            updated_at: new Date().toISOString()
          }
          
          set({
            user: userData,
            token: session.access_token,
            isAuthenticated: true,
            error: null,
          })
          
          // Store token in localStorage for persistence
          localStorage.setItem('auth_token', session.access_token)
          
          return session.access_token
        } catch (error) {
          // Refresh failed, logout user
          get().logout()
          throw error
        }
      },

      // Check if token is expired
      isTokenExpired: async (): Promise<boolean> => {
        const { token } = get()
        
        if (!token) return true
        
        try {
          // Get current session from Supabase
          const session = await getCurrentSession()
          
          if (!session) {
            return true
          }
          
          // Check if session is expired
          const currentTime = Math.floor(Date.now() / 1000)
          return session.expires_at < currentTime
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

// Helper hooks for common authentication checks
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthToken = () => useAuthStore((state) => state.token)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)