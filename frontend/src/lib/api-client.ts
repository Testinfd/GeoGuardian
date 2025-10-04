/**
 * Simple API Client
 * Clean HTTP client without complex token refresh logic
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { supabase } from './auth'

// API Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance
  private cachedToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Initialize token cache from auth state changes
    this.initializeTokenCache()

    // Simple request interceptor - use cached token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Only fetch token if cache is expired or missing
          if (!this.cachedToken || Date.now() >= this.tokenExpiry) {
            await this.refreshTokenCache()
          }
          
          if (this.cachedToken) {
            config.headers.Authorization = `Bearer ${this.cachedToken}`
          }
        } catch (error) {
          console.warn('Failed to get auth token for request:', error)
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Simple response interceptor - no complex refresh logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token might be expired, refresh cache and retry once
          await this.refreshTokenCache()
          
          // Retry the request once with new token
          if (this.cachedToken && error.config && !error.config._retry) {
            error.config._retry = true
            error.config.headers.Authorization = `Bearer ${this.cachedToken}`
            return this.client.request(error.config)
          }
          
          console.warn('API request unauthorized - user may need to sign in')
        }
        return Promise.reject(error)
      }
    )
  }

  private async initializeTokenCache() {
    try {
      // Listen for auth state changes to update token cache
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.access_token) {
          this.cachedToken = session.access_token
          // Cache for 50 minutes (tokens typically expire in 60 minutes)
          this.tokenExpiry = Date.now() + (50 * 60 * 1000)
        } else {
          this.cachedToken = null
          this.tokenExpiry = 0
        }
      })

      // Get initial session
      await this.refreshTokenCache()
    } catch (error) {
      console.warn('Failed to initialize token cache:', error)
    }
  }

  private async refreshTokenCache() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.access_token) {
        this.cachedToken = session.access_token
        // Cache for 50 minutes (tokens typically expire in 60 minutes)
        this.tokenExpiry = Date.now() + (50 * 60 * 1000)
      } else {
        this.cachedToken = null
        this.tokenExpiry = 0
      }
    } catch (error) {
      console.error('Failed to refresh token cache:', error)
      this.cachedToken = null
      this.tokenExpiry = 0
    }
  }

  // HTTP Methods - Return full AxiosResponse for flexibility
  async get<T>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, { params })
  }

  async post<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data)
  }

  async patch<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data)
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.client.delete(url)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient