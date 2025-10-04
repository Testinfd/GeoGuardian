/**
 * Authentication Error Page
 * Displays authentication errors with helpful messages
 */

'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Alert } from '@/components/ui'
import { Shield, AlertTriangle, ArrowLeft, Home, AlertCircle } from 'lucide-react'

// This page now uses client-side hooks for search params

const getErrorMessage = (error: string | undefined) => {
  switch (error) {
    case 'Configuration':
      return {
        title: 'Server Configuration Error',
        message: 'There is a problem with the server configuration. Please contact support.',
        action: 'Contact Support',
      }
    case 'AccessDenied':
      return {
        title: 'Access Denied',
        message: 'You do not have permission to sign in.',
        action: 'Try Different Account',
      }
    case 'Verification':
      return {
        title: 'Unable to Sign In',
        message: 'The sign in link is no longer valid. It may have been used already or it may have expired.',
        action: 'Request New Link',
      }
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'EmailCreateAccount':
    case 'Callback':
      return {
        title: 'OAuth Error',
        message: 'There was an error with the OAuth provider. Please try again.',
        action: 'Try Again',
      }
    case 'OAuthAccountNotLinked':
      return {
        title: 'Account Not Linked',
        message: 'To confirm your identity, sign in with the same account you used originally.',
        action: 'Sign In',
      }
    case 'EmailSignin':
      return {
        title: 'Unable to Send Email',
        message: 'The email could not be sent. Please contact support.',
        action: 'Contact Support',
      }
    case 'CredentialsSignin':
      return {
        title: 'Sign In Failed',
        message: 'Invalid email or password. Please check your credentials and try again.',
        action: 'Try Again',
      }
    case 'SessionRequired':
      return {
        title: 'Authentication Required',
        message: 'You must be signed in to view this page.',
        action: 'Sign In',
      }
    default:
      return {
        title: 'Authentication Error',
        message: 'Sorry, there was an error with authentication. Please try again.',
        action: 'Try Again',
      }
  }
}

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || undefined
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h1>
              <p className="text-gray-600">Something went wrong with your authentication</p>
            </div>

            {error && (
              <Alert variant="danger" className="mb-6">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">Error</span>
                </div>
                <p>
                  {error === 'OAuthCallback'
                    ? 'Failed to complete OAuth sign-in. Please try again.'
                    : error === 'Session expired'
                    ? 'Your session has expired. Please sign in again.'
                    : 'Authentication failed. Please try again.'}
                </p>
              </Alert>
            )}

            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                Please try signing in again
              </p>
              <div className="flex justify-center">
                <Button onClick={() => router.push('/auth/login')} className="w-full">
                  Try Again
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <p className="text-center text-xs text-gray-500">
              Having trouble? Contact support at{' '}
              <a href="mailto:support@geoguardian.com" className="font-medium text-primary-600 hover:underline">
                support@geoguardian.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
