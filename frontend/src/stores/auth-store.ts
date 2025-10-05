/**
 * Simple Authentication Store
 * Clean, minimal state management with no complex logic
 */

import { create } from 'zustand'
import { supabase, authFunctions, createUserInDatabase, type User } from '@/lib/auth'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  // Initialize auth state
  initialize: () => Promise<void>
  
  // Sign in methods
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  
  // Sign up
  signUp: (email: string, password: string, name?: string) => Promise<void>
  
  // Sign out
  signOut: () => Promise<void>
  
  // Reset password
  resetPassword: (email: string) => Promise<void>
  
  // Internal state setters
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

export const useAuth = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  loading: true,
  initialized: false,

  // Initialize authentication
  initialize: async () => {
    try {
      set({ loading: true })
      
      // Get current session from Supabase with timeout
      const { data: { session }, error } = await Promise.race([
        authFunctions.getSession(),
        new Promise<{ data: { session: null }, error: Error }>((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 3000)
        )
      ]).catch((timeoutError) => {
        return { data: { session: null }, error: timeoutError as Error }
      })
      
      if (error) {
        // Still mark as initialized even on error - don't block the app
        set({ user: null, loading: false, initialized: true })
        return
      }

      if (session?.user) {
        try {
          // Create/update user in database with timeout
          const dbUser = await Promise.race([
            createUserInDatabase(session.user),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database user creation timeout')), 2000)
            )
          ]).catch(() => null)
          
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: dbUser?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            picture: dbUser?.picture || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            created_at: session.user.created_at
          }

          set({ user, loading: false, initialized: true })
        } catch (error) {
          // Still initialize with user from session
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            created_at: session.user.created_at
          }
          set({ user, loading: false, initialized: true })
        }
      } else {
        set({ user: null, loading: false, initialized: true })
      }
    } catch (error) {
      // Always mark as initialized to prevent infinite loading
      set({ user: null, loading: false, initialized: true })
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      set({ loading: true })
      const { error } = await authFunctions.signInWithGoogle()
      
      if (error) {
        console.error('Google sign in error:', error)
        set({ loading: false })
        throw error
      }
      
      // Don't set loading to false here - the redirect will handle it
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  // Sign in with email/password
  signInWithPassword: async (email: string, password: string) => {
    try {
      set({ loading: true })
      
      const { data, error } = await authFunctions.signInWithPassword(email, password)
      
      if (error) {
        set({ loading: false })
        throw error
      }

      if (data.user) {
        // Create/update user in database
        const dbUser = await createUserInDatabase(data.user)
        
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: dbUser?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
          picture: dbUser?.picture || data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at
        }

        set({ user, loading: false })
      }
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  // Sign up with email/password
  signUp: async (email: string, password: string, name?: string) => {
    try {
      set({ loading: true })
      
      const { data, error } = await authFunctions.signUp(email, password, {
        data: { name }
      })
      
      if (error) {
        set({ loading: false })
        throw error
      }

      // Note: User will need to confirm email before they can sign in
      set({ loading: false })
      
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ loading: true })
      
      const { error } = await authFunctions.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Always clear user state, even if there was an error
      set({ user: null, loading: false })
      
    } catch (error) {
      console.error('Sign out failed:', error)
      // Still clear user state
      set({ user: null, loading: false })
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      const { error } = await authFunctions.resetPassword(email)
      
      if (error) {
        throw error
      }
    } catch (error) {
      throw error
    }
  },

  // Internal setters
  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading })
}))

// Set up auth state listener - this is the ONLY place we listen to auth changes
// Only set up once to prevent multiple listeners
let isListenerSetup = false
let lastProcessedEventTime = 0

if (!isListenerSetup) {
  isListenerSetup = true
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    const { setUser, setLoading, initialized, user: currentUser } = useAuth.getState()
    
    // Prevent processing duplicate events within 1 second
    const now = Date.now()
    if (event === 'SIGNED_IN' && now - lastProcessedEventTime < 1000) {
      return
    }
    lastProcessedEventTime = now
    
    // Skip processing if not yet initialized (will be handled by initialize())
    if (!initialized && event !== 'INITIAL_SESSION') {
      return
    }
    
    // Skip if we already have this user
    if (event === 'SIGNED_IN' && currentUser?.id === session?.user?.id) {
      return
    }
    
    if (event === 'SIGNED_OUT') {
      setUser(null)
      setLoading(false)
    } else if (event === 'SIGNED_IN') {
      if (session?.user) {
        try {
          // Create/update user in database (with timeout)
          const dbUser = await Promise.race([
            createUserInDatabase(session.user),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database user creation timeout')), 3000)
            )
          ]).catch(() => null)
          
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: (dbUser as any)?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            picture: (dbUser as any)?.picture || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            created_at: session.user.created_at
          }

          setUser(user)
          setLoading(false)
        } catch (error) {
          // Still set user even if DB update fails
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            created_at: session.user.created_at
          }
          setUser(user)
          setLoading(false)
        }
      }
    } else if (event === 'TOKEN_REFRESHED') {
      // For token refresh, just update silently without DB calls
      if (session?.user && !currentUser) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          created_at: session.user.created_at
        }
        setUser(user)
        setLoading(false)
      }
    }
  })
}

// Convenience hooks
export const useUser = () => useAuth((state) => state.user)
export const useAuthLoading = () => useAuth((state) => state.loading)
export const useAuthInitialized = () => useAuth((state) => state.initialized)
