/**
 * Client Layout Component
 * Simple layout with clean navigation
 */

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@/stores/auth-store'
import { Navigation } from './Navigation'
import { NotificationProvider, ToastContainer } from '@/components/notifications/NotificationSystem'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const user = useUser()

  // Don't show navigation on auth pages
  const isAuthPage = pathname?.startsWith('/auth')

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {!isAuthPage && user && <Navigation />}
        
        <main className={!isAuthPage && user ? 'pl-64' : ''}>
          {children}
        </main>
        
        {/* Toast notifications */}
        <ToastContainer />
      </div>
    </NotificationProvider>
  )
}