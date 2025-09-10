/**
 * Register Page
 * User registration with email/password and Google OAuth
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/auth'
import { Eye, EyeOff, Mail, Lock, User, Chrome, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { Button, Input, Alert, Card } from '@/components/ui'
import { authAPI } from '@/services/api'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Join GeoGuardian to start monitoring environmental changes
            </p>
          </div>
          
          <div className="space-y-4">
            <GoogleSignIn />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">
                  Or create with email
                </span>
              </div>
            </div>
            <RegisterForm />
          </div>
          
          <div className="mt-6 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="font-medium text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
