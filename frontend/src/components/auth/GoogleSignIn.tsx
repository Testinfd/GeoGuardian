/**
 * Google Sign-In Component
 * Handles Google OAuth authentication flow
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithGoogle } from '@/lib/supabase-auth'
import { Button } from '@/components/ui'
import { Icons } from '@/components/icons'

export function GoogleSignIn({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign in error:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={className}
      variant="outline"
      size="lg"
      type="button"
    >
      {isLoading ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <Icons.google className="mr-2 h-4 w-4" />
          Continue with Google
        </>
      )}
    </Button>
  )
}
