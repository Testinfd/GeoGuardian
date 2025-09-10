/**
 * Login Page
 * User authentication with email/password and Google OAuth
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'
import { LoginForm } from '@/components/auth/LoginForm'
import { Card } from '@/components/ui'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Sign in to GeoGuardian</h1>
              <p className="mt-2 text-gray-600">Welcome back! Sign in to continue</p>
            </div>

            <div className="space-y-4">
              <GoogleSignIn />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-50 px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>
              <LoginForm />
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-medium text-primary-600 hover:underline">
                Sign up
              </Link>
            </p>
            <p className="text-center text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="font-medium text-primary-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-primary-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
