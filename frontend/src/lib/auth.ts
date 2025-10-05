/**
 * Clean Supabase Authentication Client
 * Simple, reliable auth implementation following best practices
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://exhuqtrrklcichdteauv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aHVxdHJya2xjaWNoZHRlYXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODEyNzYsImV4cCI6MjA3Mjc1NzI3Nn0.g9KP70igo6rM2gTUhNyhY9Fg6bgKNdb8EeyG2p9devw'

// Create Supabase client with clean configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Let Supabase handle everything automatically
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use secure cookie-based storage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Add flow type for better compatibility
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'geoguardian-frontend'
    }
  },
  db: {
    schema: 'public'
  },
  // Add realtime configuration to prevent hanging
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Types for user data
export interface User {
  id: string
  email: string
  name?: string
  full_name?: string
  picture?: string
  avatar_url?: string
  created_at?: string
}

// Simple auth functions - no complex logic, just Supabase calls
export const authFunctions = {
  // Get current session
  getSession: () => supabase.auth.getSession(),
  
  // Get current user
  getUser: () => supabase.auth.getUser(),
  
  // Sign in with Google OAuth
  signInWithGoogle: (redirectTo?: string) => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/dashboard`
      }
    })
  },
  
  // Sign in with email/password
  signInWithPassword: (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  },
  
  // Sign up with email/password
  signUp: (email: string, password: string, options?: { data?: any }) => {
    return supabase.auth.signUp({ email, password, options })
  },
  
  // Sign out
  signOut: () => supabase.auth.signOut(),
  
  // Reset password
  resetPassword: (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
  }
}

// Cache for user creation to prevent duplicate calls
const userCreationCache = new Map<string, Promise<any>>()

// Create or update user in database
export const createUserInDatabase = async (user: any) => {
  // Check if we're already creating this user
  const cacheKey = user.id
  if (userCreationCache.has(cacheKey)) {
    return userCreationCache.get(cacheKey)
  }

  const creationPromise = (async () => {
    try {
      // First check if users table exists and user can access it
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id, email, name, picture')
        .eq('id', user.id)
        .maybeSingle()

      // If there's an error accessing the table, it might not exist or have proper RLS
      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "not found"
        return { id: user.id, email: user.email } // Return minimal user data
      }

      // If user already exists, return without updating
      if (existingUser) {
        return existingUser
      }

      // Try to create/update user
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
          picture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: true
        })
        .select()
        .single()

      if (error) {
        // If it's a duplicate key error, just silently return minimal data
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          return { 
            id: user.id, 
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0]
          }
        }
        // Return minimal user data if database operation fails
        return { 
          id: user.id, 
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0]
        }
      }

      return data
    } catch (error) {
      // Return minimal user data to allow auth to continue
      return { 
        id: user.id, 
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0]
      }
    } finally {
      // Clear cache after a short delay
      setTimeout(() => {
        userCreationCache.delete(cacheKey)
      }, 5000)
    }
  })()

  // Store in cache
  userCreationCache.set(cacheKey, creationPromise)
  
  return creationPromise
}
