/**
 * API Modules Index
 * Central export point for all API clients
 */

import { authApi } from './auth'
import { aoiApi } from './aoi'
import { analysisApi } from './analysis'
import { alertsApi } from './alerts'

export { authApi }
export { aoiApi }
export { analysisApi }
export { alertsApi }

// Re-export API client for direct use if needed
import { apiClient } from '@/lib/api-client'
export { apiClient }

// Create a combined API object for convenience
export const geoGuardianApi = {
  auth: authApi,
  aoi: aoiApi,
  analysis: analysisApi,
  alerts: alertsApi,
}

// Re-export types for convenience
export type { 
  ApiResponse, 
  ApiError,
  AuthResponse,
  User,
  LoginRequest,
  RegisterRequest,
  GoogleOAuthRequest,
  AOI,
  CreateAOIRequest,
  UpdateAOIRequest,
  AnalysisResult,
  AnalysisRequest,
  HistoricalAnalysisRequest,
  DataAvailability,
  SystemStatus,
  SystemCapabilities,
  Alert,
  AlertVerificationRequest,
  AlertPriority,
  AlertStatus,
  PaginatedResponse
} from '@/types'

// Health check for all services
export const checkAllServices = async () => {
  const services = {
    main: false,
    auth: false,
    analysis: false,
    alerts: false,
  }

  try {
    // Check main API health
    try {
      await apiClient.get('/health')
      services.main = true
    } catch (error) {
      services.main = false
    }
    
    // Check authentication service
    try {
      await geoGuardianApi.auth.getProfile()
      services.auth = true
    } catch (error: any) {
      // 401 is expected if not authenticated
      services.auth = error.status_code === 401
    }
    
    // Check analysis service
    try {
      await geoGuardianApi.analysis.getSystemStatus()
      services.analysis = true
    } catch (error) {
      services.analysis = false
    }
    
    // Check alerts service
    try {
      await geoGuardianApi.alerts.getAllAlerts({ limit: 1 })
      services.alerts = true
    } catch (error: any) {
      // 401 is expected if not authenticated
      services.alerts = error.status_code === 401
    }
    
  } catch (error) {
    console.error('Service health check failed:', error)
  }

  return services
}

// API error handler utility
export const handleApiError = (error: any, context?: string) => {
  const message = error.message || 'An unexpected error occurred'
  const statusCode = error.status_code || 500
  
  console.error(`API Error${context ? ` in ${context}` : ''}:`, {
    message,
    statusCode,
    details: error.details,
  })
  
  // Return user-friendly error message
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.'
    case 401:
      return 'Authentication required. Please log in and try again.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'Server error. Please try again later.'
    case 503:
      return 'Service temporarily unavailable. Please try again later.'
    default:
      return message
  }
}

// API request wrapper with error handling
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  context?: string,
  fallback?: T
): Promise<{ data: T | null; error: string | null; success: boolean }> => {
  try {
    const data = await apiCall()
    return { data, error: null, success: true }
  } catch (error: any) {
    const errorMessage = handleApiError(error, context)
    console.error(`Safe API call failed${context ? ` in ${context}` : ''}:`, error)
    
    return {
      data: fallback || null,
      error: errorMessage,
      success: false,
    }
  }
}

// Batch API calls with error handling
export const batchApiCalls = async <T>(
  calls: Array<() => Promise<T>>,
  options: {
    stopOnError?: boolean
    maxConcurrent?: number
    context?: string
  } = {}
): Promise<Array<{ data: T | null; error: string | null; success: boolean }>> => {
  const { stopOnError = false, maxConcurrent = 5, context } = options
  const results: Array<{ data: T | null; error: string | null; success: boolean }> = []
  
  for (let i = 0; i < calls.length; i += maxConcurrent) {
    const batch = calls.slice(i, i + maxConcurrent)
    
    const batchPromises = batch.map(async (call, index) => {
      return safeApiCall(call, `${context} - batch ${Math.floor(i / maxConcurrent) + 1}, item ${index + 1}`)
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Stop if there's an error and stopOnError is true
    if (stopOnError && batchResults.some(result => !result.success)) {
      break
    }
  }
  
  return results
}

// API cache utility (simple in-memory cache)
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export const cachedApiCall = async <T>(
  key: string,
  apiCall: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> => {
  const cached = apiCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  
  const data = await apiCall()
  apiCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
  
  return data
}

// Clear API cache
export const clearApiCache = (keyPattern?: string) => {
  if (keyPattern) {
    const regex = new RegExp(keyPattern)
    for (const key of apiCache.keys()) {
      if (regex.test(key)) {
        apiCache.delete(key)
      }
    }
  } else {
    apiCache.clear()
  }
}

// Default export
export default geoGuardianApi