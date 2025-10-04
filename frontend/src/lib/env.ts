/**
 * Environment Configuration
 * Validates and exports environment variables with type safety
 */

// Create a function to get environment variables with fallbacks
function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] || fallback
  if (!value) {
    console.warn(`Environment variable ${key} is not set`)
    return fallback || ''
  }
  return value
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: getEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8000'),
  TIMEOUT: parseInt(getEnvVar('NEXT_PUBLIC_API_TIMEOUT', '30000')),
  POLLING_INTERVAL: parseInt(getEnvVar('NEXT_PUBLIC_POLLING_INTERVAL', '2000')),
} as const

// Authentication Configuration
export const AUTH_CONFIG = {
  NEXTAUTH_SECRET: getEnvVar('NEXTAUTH_SECRET', 'dummy-secret-for-development'),
  NEXTAUTH_URL: getEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID', 'dummy-google-client-id'),
  GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET', 'dummy-google-client-secret'),
} as const

// Application Configuration
export const APP_CONFIG = {
  NAME: getEnvVar('NEXT_PUBLIC_APP_NAME', 'GeoGuardian'),
  VERSION: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
  ENVIRONMENT: getEnvVar('NEXT_PUBLIC_ENVIRONMENT', 'development'),
} as const

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    LAT: parseFloat(getEnvVar('NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT', '39.8283')),
    LNG: parseFloat(getEnvVar('NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG', '-98.5795')),
  },
  DEFAULT_ZOOM: parseInt(getEnvVar('NEXT_PUBLIC_DEFAULT_MAP_ZOOM', '4')),
} as const

// Supabase Configuration
export const SUPABASE_CONFIG = {
  URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://dummy.supabase.co'),
  ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'dummy-supabase-anon-key'),
} as const

// Development mode check
export const IS_DEVELOPMENT = APP_CONFIG.ENVIRONMENT === 'development'
export const IS_PRODUCTION = APP_CONFIG.ENVIRONMENT === 'production'

// Validation function
export function validateEnvironment() {
  const warnings: string[] = []
  
  // Check critical environment variables in production
  if (IS_PRODUCTION) {
    if (AUTH_CONFIG.NEXTAUTH_SECRET === 'dummy-secret-for-development') {
      warnings.push('NEXTAUTH_SECRET should be set to a secure value in production')
    }
    
    if (AUTH_CONFIG.GOOGLE_CLIENT_ID === 'dummy-google-client-id') {
      warnings.push('GOOGLE_CLIENT_ID should be set to real credentials in production')
    }
    
    if (SUPABASE_CONFIG.URL === 'https://dummy.supabase.co') {
      warnings.push('SUPABASE_URL should be set to real Supabase project in production')
    }
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('Environment Configuration Warnings:')
    warnings.forEach(warning => console.warn(`- ${warning}`))
  }
  
  return warnings.length === 0
}

// Auto-validate on import
if (typeof window === 'undefined') {
  // Only validate on server-side
  validateEnvironment()
}