/**
 * Comprehensive API Client for GeoGuardian Frontend
 * Handles authentication, AOI management, analysis, and alerts
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { API_ENDPOINTS } from '@/utils/constants'
import { supabase } from '@/lib/supabase-auth'
import { useAuthStore } from '@/stores/auth'
import type {
  // Auth types
  User, AuthResponse, LoginRequest, RegisterRequest, GoogleOAuthRequest,
  // AOI types
  AOI, CreateAOIRequest, UpdateAOIRequest,
  // Analysis types
  AnalysisRequest, AnalysisResult, DataAvailability, SystemStatus, SystemCapabilities,
  // Alert types
  Alert, AlertVerificationRequest,
  // Utility types
  ApiResponse, PaginatedResponse
} from '@/types'

// API Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Create axios instance with default configuration
class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Try to get token from Supabase session
        try {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
            return config
          }
        } catch (error) {
          console.warn('Failed to get Supabase session:', error)
        }

        // Fallback to localStorage (legacy auth)
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`
        } else {
          console.log('No authentication token found - API call may fail')
        }
        
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear tokens and redirect to login
          if (typeof window !== 'undefined') {
            console.log('401 Unauthorized - clearing authentication and redirecting to login')
            
            // Clear localStorage tokens
            localStorage.removeItem('auth_token')
            
            // Clear auth store
            useAuthStore.getState().logout()
            
            // Redirect if we're not already on the login page
            if (!window.location.pathname.includes('/auth/login')) {
              window.location.href = '/auth/login?error=Session expired'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Generic API methods
  async get<T>(url: string): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url)
  }

  async post<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data)
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data)
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url)
  }
}

// Create single instance
const apiClient = new ApiClient()

// =============================================================================
// Authentication API
// =============================================================================
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AxiosResponse<AuthResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
  },

  register: async (userData: RegisterRequest): Promise<AxiosResponse<AuthResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData)
  },

  googleAuth: async (token: string): Promise<AxiosResponse<AuthResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.GOOGLE, { token })
  },

  oauth: async (data: GoogleOAuthRequest): Promise<AxiosResponse<AuthResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.OAUTH, data)
  },

  getCurrentUser: async (): Promise<AxiosResponse<User>> => {
    return apiClient.get(API_ENDPOINTS.AUTH.ME)
  },

  refreshToken: async (): Promise<AxiosResponse<any>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.REFRESH)
  },

  logout: async (): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  },
}

// =============================================================================
// AOI Management API
// =============================================================================
export const aoiAPI = {
  // Get all AOIs for the current user
  getAll: async (): Promise<AxiosResponse<AOI[]>> => {
    return apiClient.get(API_ENDPOINTS.AOI.BASE)
  },

  // Get public AOIs
  getPublic: async (): Promise<AxiosResponse<AOI[]>> => {
    return apiClient.get(API_ENDPOINTS.AOI.PUBLIC)
  },

  // Get single AOI by ID
  getById: async (id: string): Promise<AxiosResponse<AOI>> => {
    return apiClient.get(API_ENDPOINTS.AOI.BY_ID(id))
  },

  // Create new AOI
  create: async (aoiData: CreateAOIRequest): Promise<AxiosResponse<AOI>> => {
    return apiClient.post(API_ENDPOINTS.AOI.BASE, aoiData)
  },

  // Update existing AOI
  update: async (id: string, updates: UpdateAOIRequest): Promise<AxiosResponse<AOI>> => {
    return apiClient.put(API_ENDPOINTS.AOI.BY_ID(id), updates)
  },

  // Delete AOI
  delete: async (id: string): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.delete(API_ENDPOINTS.AOI.BY_ID(id))
  },

  // Get AOI statistics
  getStats: async (id: string): Promise<AxiosResponse<any>> => {
    return apiClient.get(API_ENDPOINTS.AOI.STATS(id))
  },

  // Get AOI analysis history
  getAnalyses: async (id: string): Promise<AxiosResponse<AnalysisResult[]>> => {
    return apiClient.get(API_ENDPOINTS.AOI.ANALYSES(id))
  },

  // Get available tags
  getTags: async (): Promise<AxiosResponse<string[]>> => {
    return apiClient.get(API_ENDPOINTS.AOI.TAGS)
  },
}

// =============================================================================
// Analysis API
// =============================================================================
export const analysisAPI = {
  // Get system capabilities
  getCapabilities: async (): Promise<AxiosResponse<SystemCapabilities>> => {
    return apiClient.get(API_ENDPOINTS.ANALYSIS.CAPABILITIES)
  },

  // Get system status
  getSystemStatus: async (): Promise<AxiosResponse<SystemStatus>> => {
    return apiClient.get(API_ENDPOINTS.ANALYSIS.STATUS)
  },

  // Check data availability for AOI
  checkDataAvailability: async (aoiId: string): Promise<AxiosResponse<DataAvailability>> => {
    return apiClient.get(API_ENDPOINTS.ANALYSIS.DATA_AVAILABILITY(aoiId))
  },

  // Start comprehensive analysis
  runComprehensiveAnalysis: async (request: AnalysisRequest): Promise<AxiosResponse<AnalysisResult>> => {
    return apiClient.post(API_ENDPOINTS.ANALYSIS.COMPREHENSIVE, request)
  },

  // Start historical analysis
  runHistoricalAnalysis: async (request: any): Promise<AxiosResponse<AnalysisResult>> => {
    return apiClient.post(API_ENDPOINTS.ANALYSIS.HISTORICAL, request)
  },

  // Get analysis result by ID
  getResult: async (id: string): Promise<AxiosResponse<AnalysisResult>> => {
    return apiClient.get(API_ENDPOINTS.ANALYSIS.RESULT(id))
  },

  // Get all analysis results
  getResults: async (): Promise<AxiosResponse<AnalysisResult[]>> => {
    return apiClient.get(API_ENDPOINTS.ANALYSIS.RESULTS)
  },

  // Cancel running analysis
  cancelAnalysis: async (id: string): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.post(`${API_ENDPOINTS.ANALYSIS.RESULT(id)}/cancel`)
  },

  // Enhanced analysis endpoints for specific types
  runVegetationAnalysis: async (aoiId: string, options?: any): Promise<AxiosResponse<AnalysisResult>> => {
    return apiClient.post('/api/v2/analyze/vegetation', { aoi_id: aoiId, ...options })
  },

  runWaterQualityAnalysis: async (aoiId: string, options?: any): Promise<AxiosResponse<AnalysisResult>> => {
    return apiClient.post('/api/v2/analyze/water-quality', { aoi_id: aoiId, ...options })
  },

  runCoastalAnalysis: async (aoiId: string, options?: any): Promise<AxiosResponse<AnalysisResult>> => {
    return apiClient.post('/api/v2/analyze/coastal', { aoi_id: aoiId, ...options })
  },

  runConstructionAnalysis: async (aoiId: string, options?: any): Promise<AxiosResponse<AnalysisResult>> => {
    return apiClient.post('/api/v2/analyze/construction', { aoi_id: aoiId, ...options })
  },

  runDeforestationAnalysis: async (aoiId: string, options?: any): Promise<AxiosResponse<AnalysisResult>> => {
    return apiClient.post('/api/v2/analyze/deforestation', { aoi_id: aoiId, ...options })
  },

  // Demo analysis for testing
  runDemoAnalysis: async (analysisType: string, aoiId?: string): Promise<AxiosResponse<any>> => {
    return apiClient.post('/api/v2/demo/analysis', { analysis_type: analysisType, aoi_id: aoiId })
  },
}

// =============================================================================
// Alerts API
// =============================================================================
export const alertsAPI = {
  // Get all alerts
  getAll: async (): Promise<AxiosResponse<Alert[]>> => {
    return apiClient.get(API_ENDPOINTS.ALERTS.BASE)
  },

  // Get alert by ID
  getById: async (id: string): Promise<AxiosResponse<Alert>> => {
    return apiClient.get(API_ENDPOINTS.ALERTS.BY_ID(id))
  },

  // Get alerts for specific AOI
  getByAOI: async (aoiId: string): Promise<AxiosResponse<Alert[]>> => {
    return apiClient.get(API_ENDPOINTS.ALERTS.BY_AOI(aoiId))
  },

  // Verify alert (vote)
  verify: async (request: AlertVerificationRequest): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.post(API_ENDPOINTS.ALERTS.VERIFY, request)
  },

  // Get alert statistics
  getStats: async (): Promise<AxiosResponse<any>> => {
    return apiClient.get(API_ENDPOINTS.ALERTS.STATS)
  },

  // Acknowledge alert
  acknowledge: async (id: string): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.post(`${API_ENDPOINTS.ALERTS.BY_ID(id)}/acknowledge`)
  },

  // Resolve alert
  resolve: async (id: string): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.post(`${API_ENDPOINTS.ALERTS.BY_ID(id)}/resolve`)
  },

  // Dismiss alert
  dismiss: async (id: string): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.post(`${API_ENDPOINTS.ALERTS.BY_ID(id)}/dismiss`)
  },
}

// =============================================================================
// Backwards compatibility with legacy API client
// =============================================================================

// Legacy exports for existing code
export const aoiApi = aoiAPI
export const alertApi = alertsAPI
export const authApi = authAPI
export const analysisApi = analysisAPI

// Export types for components
export type { 
  AOI, CreateAOIRequest, UpdateAOIRequest,
  AnalysisRequest, AnalysisResult, 
  Alert, AlertVerificationRequest,
  User, AuthResponse 
}

// Default export
export default {
  auth: authAPI,
  aoi: aoiAPI,
  analysis: analysisAPI,
  alerts: alertsAPI,
  
  // Direct access to axios instance for custom requests
  client: apiClient,
}