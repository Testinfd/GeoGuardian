/**
 * Session Provider Component
 * Simple wrapper for Supabase authentication context
 */

'use client'

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  // For now, just pass through children since we're handling auth directly in stores
  return <>{children}</>
}