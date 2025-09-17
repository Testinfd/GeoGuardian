/**
 * Authentication Provider Component
 * Handles auth initialization and loading states
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useAuth, useAuthInitialized, useAuthLoading } from '@/stores/auth-store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuth((state) => state.initialize)
  const initialized = useAuthInitialized()
  const loading = useAuthLoading()
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (!hasInitialized) {
      initialize()
      setHasInitialized(true)
    }
  }, [initialize, hasInitialized])

  // Show loading screen while initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Route Protection Component
 * Simple redirect logic for protected routes
 */
interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/auth/login' }: ProtectedRouteProps) {
  const user = useAuth((state) => state.user)
  const initialized = useAuthInitialized()
  const loading = useAuthLoading()

  useEffect(() => {
    // Only redirect if auth is initialized and user is not authenticated
    if (initialized && !loading && !user) {
      window.location.href = redirectTo
    }
  }, [user, initialized, loading, redirectTo])

  // Show loading while checking auth
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!user) {
    return null
  }

  return <>{children}</>
}

/**
 * Public Route Component  
 * Redirects authenticated users away from auth pages
 */
interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
  const user = useAuth((state) => state.user)
  const initialized = useAuthInitialized()
  const loading = useAuthLoading()

  useEffect(() => {
    // Redirect authenticated users away from auth pages
    if (initialized && !loading && user) {
      window.location.href = redirectTo
    }
  }, [user, initialized, loading, redirectTo])

  // Show loading while checking auth
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Don't render children if authenticated
  if (user) {
    return null
  }

  return <>{children}</>
}
