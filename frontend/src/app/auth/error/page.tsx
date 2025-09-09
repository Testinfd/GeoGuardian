/**
 * Authentication Error Page
 * Displays authentication errors with helpful messages
 */

import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Shield, AlertTriangle, ArrowLeft, Home } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Authentication Error | GeoGuardian',
  description: 'An error occurred during authentication.',
}

interface AuthErrorPageProps {
  searchParams: {
    error?: string
  }
}

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

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = searchParams
  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          
          <div className="flex justify-center">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">GeoGuardian</h1>
                <p className="text-sm text-gray-600">Environmental Monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-200">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {errorInfo.title}
            </h2>
            <p className="text-gray-600">
              {errorInfo.message}
            </p>
            
            {error && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500">
                  Error code: {error}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {errorInfo.action === 'Try Again' && (
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Try Again
                </Link>
              </Button>
            )}
            
            {errorInfo.action === 'Sign In' && (
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
            )}
            
            {errorInfo.action === 'Try Different Account' && (
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Try Different Account
                </Link>
              </Button>
            )}
            
            {errorInfo.action === 'Contact Support' && (
              <Button asChild className="w-full">
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
            )}
            
            {errorInfo.action === 'Request New Link' && (
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">
                  Request New Link
                </Link>
              </Button>
            )}

            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Still having trouble?{' '}
            <Link 
              href="/contact"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}