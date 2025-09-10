/**
 * Supabase Middleware for Route Protection
 * Protects authenticated routes and redirects unauthenticated users
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
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
        remove(name: string, options: any) {
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

  // Get session from Supabase
  const { data } = await supabase.auth.getSession()
  const session = data.session

  // Get current path
  const path = req.nextUrl.pathname

  // Redirect unauthenticated users trying to access protected routes
  if (!session && (path.startsWith('/dashboard') || path.startsWith('/aoi') || path.startsWith('/analysis'))) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = `?callbackUrl=${encodeURIComponent(req.url)}`
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users trying to access auth pages
  if (session && path.startsWith('/auth')) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Allow access to public routes
  if (path === '/' || path.startsWith('/api/')) {
    return res
  }

  return res
}

// Configure matcher to only run on specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}