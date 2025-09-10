/**
 * Client Layout Component
 * Handles client-side logic including auth state and routing
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useIsAuthenticated, useAuthLoading } from '@/stores/auth'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase-auth'
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
  const { initializeAuth } = useAuthStore()
  const [isClient, setIsClient] = useState(false)

  // Mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }

    initAuth()
  }, [initializeAuth])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Handle unauthenticated access - only on client side
  if (isClient && !isAuthenticated && pathname !== '/auth/login' && pathname !== '/auth/register') {
    // Redirect to login page
    router.push('/auth/login')
    return null
  }

  return (
    <SessionProvider>
      <NotificationProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToastContainer />
        </ThemeProvider>
      </NotificationProvider>
    </SessionProvider>
  )
}
