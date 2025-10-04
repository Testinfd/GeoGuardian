/**
 * Clean Authentication Middleware
 * Simple session checking without complex logic
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create Supabase client for server-side operations
  const supabase = createServerClient(
    'https://exhuqtrrklcichdteauv.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aHVxdHJya2xjaWNoZHRlYXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODEyNzYsImV4cCI6MjA3Mjc1NzI3Nn0.g9KP70igo6rM2gTUhNyhY9Fg6bgKNdb8EeyG2p9devw',
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the current path
  const path = req.nextUrl.pathname

  // List of protected routes
  const protectedRoutes = ['/dashboard', '/aoi', '/analysis', '/alerts']
  const authRoutes = ['/auth/login', '/auth/register']

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))

  try {
    // Get current session - simple check, no complex validation
    const { data: { session } } = await supabase.auth.getSession()

    // Redirect logic
    if (isProtectedRoute && !session) {
      // User trying to access protected route without session
      const url = req.nextUrl.clone()
      url.pathname = '/auth/login'
      url.search = `?redirectTo=${encodeURIComponent(req.nextUrl.pathname)}`
      return NextResponse.redirect(url)
    }

    if (isAuthRoute && session) {
      // Authenticated user trying to access auth pages
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

  } catch (error) {
    console.error('Middleware auth check failed:', error)
    // On error, allow the request to continue
    // The client-side auth will handle the actual authentication
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}