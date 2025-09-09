/**
 * NextAuth Middleware for Route Protection
 * Protects authenticated routes and redirects unauthenticated users
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Optional: Add additional middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const { pathname } = req.nextUrl
        
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/login',
          '/auth/register',
          '/auth/error',
          '/auth/forgot-password',
          '/about',
          '/contact',
          '/terms',
          '/privacy',
        ]

        // API routes that don't require authentication
        const publicApiRoutes = [
          '/api/auth',
          '/api/health',
        ]

        // Check if current path is public
        const isPublicRoute = publicRoutes.some(route => pathname === route)
        const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
        
        // Allow access to public routes and API routes
        if (isPublicRoute || isPublicApiRoute) {
          return true
        }

        // For protected routes, require authentication
        return !!token
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
  }
)

// Configure which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}