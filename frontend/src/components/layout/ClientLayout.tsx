/**
 * Client Layout Component
 * Handles client-side logic including auth state and routing
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useIsAuthenticated, useAuthLoading } from '@/stores/auth'
import { useAuthStore } from '@/stores/auth'
import { initializeAuth } from '@/lib/supabase-auth'
import { SessionProvider } from '@/components/auth/SessionProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { Icons } from '@/components/icons'
import { NotificationProvider, ToastContainer } from '@/components/notifications/NotificationSystem'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()
  const { login } = useAuthStore()
  const [isClient, setIsClient] = useState(false)
  const [authInitializing, setAuthInitializing] = useState(true)
  const [authRetryCount, setAuthRetryCount] = useState(0)
  const [redirectInProgress, setRedirectInProgress] = useState(false)

  // Mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize auth on mount - only once with retry logic
  useEffect(() => {
    let isMounted = true
    const MAX_RETRIES = 3

    const initAuth = async (retryCount = 0) => {
      try {
        console.log(`Initializing authentication... (attempt ${retryCount + 1}/${MAX_RETRIES})`)

        if (retryCount > 0) {
          // Add exponential backoff delay for retries
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000)
          console.log(`Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const authData: { user: any; token: string | null; isAuthenticated: boolean } | null = await initializeAuth()

        if (isMounted) {
          if (authData && typeof authData === 'object' && 'isAuthenticated' in authData && 'user' in authData && authData.isAuthenticated && authData.user) {
            console.log('Authentication successful:', authData.user.email)
            // Update auth store with the session data
            useAuthStore.getState().setUser(authData.user)
            if (authData.token) {
              useAuthStore.getState().setToken(authData.token)
              // Ensure token is also stored in localStorage
              localStorage.setItem('auth_token', authData.token)
            }
            // Reset retry count on success
            setAuthRetryCount(0)
          } else {
            console.log('No valid session found - checking localStorage...')
            // Try to get token from localStorage as fallback
            const storedToken = localStorage.getItem('auth_token')
            if (storedToken) {
              console.log('Found stored token, attempting to validate...')
              // If we have a stored token, try to use it
              useAuthStore.getState().setToken(storedToken)
              setAuthRetryCount(0)
            } else {
              console.log('No stored token found either')
              // If no token and we've exceeded retries, give up
              if (retryCount >= MAX_RETRIES - 1) {
                console.log('Max retries exceeded, giving up authentication')
              }
            }
          }
        }
      } catch (error) {
        console.error(`Auth initialization failed (attempt ${retryCount + 1}):`, error)

        // Retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES - 1 && isMounted) {
          console.log('Retrying authentication...')
          setAuthRetryCount(retryCount + 1)
          return initAuth(retryCount + 1)
        }

        // Even if initialization fails, we should still complete the loading state
        // so the user doesn't get stuck in an infinite loading state
        console.log('Authentication initialization failed after all retries')
      } finally {
        if (isMounted) {
          setAuthInitializing(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [])

  // Handle unauthenticated access - prevent hydration mismatch
  // Only redirect if we're not on auth pages AND auth initialization is complete AND user is not authenticated
  const shouldRedirect = !isAuthenticated &&
                        !authInitializing &&
                        pathname !== '/auth/login' &&
                        pathname !== '/auth/register' &&
                        pathname !== '/' &&
                        !pathname.includes('/auth/login?error=')

  // Use useEffect for client-side redirect to avoid hydration issues
  useEffect(() => {
    if (shouldRedirect && !redirectInProgress) {
      console.log('Redirecting to login - user not authenticated')
      setRedirectInProgress(true)

      // Add a small delay to prevent rapid redirects
      setTimeout(() => {
        router.push('/auth/login?error=Session expired')
        setRedirectInProgress(false)
      }, 500)
    }
  }, [shouldRedirect, redirectInProgress, router])

  // If user is authenticated and on login page, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !authInitializing && pathname === '/auth/login' && !redirectInProgress) {
      console.log('User is already authenticated, redirecting to dashboard')
      setRedirectInProgress(true)

      // Add a small delay to prevent rapid redirects
      setTimeout(() => {
        router.push('/dashboard')
        setRedirectInProgress(false)
      }, 500)
    }
  }, [isAuthenticated, authInitializing, pathname, redirectInProgress, router])

  // Handle loading state or hydration mismatch
  if (authInitializing || isLoading || (!isClient && shouldRedirect)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            {authInitializing ? 'Initializing...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <SessionProvider>
      <NotificationProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <ToastContainer />
        </ThemeProvider>
      </NotificationProvider>
    </SessionProvider>
  )
}
