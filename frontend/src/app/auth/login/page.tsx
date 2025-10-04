/**
 * Login Page
 * Clean login with new auth system
 */

'use client'

import React from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { PublicRoute } from '@/components/auth/AuthProvider'

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to GeoGuardian
            </h1>
            <p className="text-gray-600">
              Monitor and protect your areas of interest with satellite imagery
            </p>
          </div>
          
          <LoginForm />
          
          <div className="text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}
