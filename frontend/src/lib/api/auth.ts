/**
 * Authentication API client
 * Handles user authentication, registration, and OAuth flows
 */

import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/utils/constants'
import type { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  GoogleOAuthRequest,
  User 
} from '@/types'

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<{ data: AuthResponse }> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    )
    return response
  },

  /**
   * Register new user account
   */
  register: async (userData: RegisterRequest): Promise<{ data: AuthResponse }> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    )
    return response
  },

  /**
   * Google OAuth login
   */
  googleLogin: async (request: GoogleOAuthRequest): Promise<{ data: AuthResponse }> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.OAUTH,
      request
    )
    return response
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<{ data: User }> => {
    const response = await apiClient.get<User>(
      API_ENDPOINTS.AUTH.ME
    )
    return response
  },

  /**
   * Get current user (alias for getProfile for compatibility)
   */
  getCurrentUser: async (): Promise<{ data: User }> => {
    const response = await apiClient.get<User>(
      API_ENDPOINTS.AUTH.ME
    )
    return response
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (): Promise<{ data: { access_token: string } }> => {
    const response = await apiClient.post<{ access_token: string }>(
      API_ENDPOINTS.AUTH.REFRESH
    )
    return response
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  },

  /**
   * Verify email address
   */
  verifyEmail: async (token: string): Promise<{ data: { message: string } }> => {
    const response = await apiClient.post<{ message: string }>(
      `/api/v1/auth/verify-email/${token}`
    )
    return response
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<{ data: { message: string } }> => {
    const response = await apiClient.post<{ message: string }>(
      '/api/v1/auth/forgot-password',
      { email }
    )
    return response
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, password: string): Promise<{ data: { message: string } }> => {
    const response = await apiClient.post<{ message: string }>(
      `/api/v1/auth/reset-password/${token}`,
      { password }
    )
    return response
  },
}