/**
 * Alerts API client
 * Handles environmental alerts, verification, and management
 */

import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/utils/constants'
import type { 
  Alert, 
  AlertVerificationRequest,
  AlertPriority,
  AlertStatus
} from '@/types'

export const alertsApi = {
  /**
   * Get all alerts with optional filtering
   */
  getAllAlerts: async (params?: {
    priority?: AlertPriority[]
    status?: AlertStatus[]
    limit?: number
    offset?: number
  }): Promise<{ data: Alert[] }> => {
    const response = await apiClient.get<Alert[]>(
      API_ENDPOINTS.ALERTS.BASE,
      { params }
    )
    return response
  },

  /**
   * Get alerts for specific AOI
   */
  getAlertsByAOI: async (aoiId: string) => {
    const response = await apiClient.get<Alert[]>(
      API_ENDPOINTS.ALERTS.BY_AOI(aoiId)
    )
    return response
  },

  /**
   * Get specific alert by ID
   */
  getAlert: async (id: string): Promise<{ data: Alert }> => {
    const response = await apiClient.get<Alert>(
      API_ENDPOINTS.ALERTS.BY_ID(id)
    )
    return response
  },

  /**
   * Verify alert with user vote
   */
  verifyAlert: async (id: string, request: AlertVerificationRequest): Promise<{ data: any }> => {
    const response = await apiClient.post(
      API_ENDPOINTS.ALERTS.VERIFY,
      request
    )
    return response
  },

  /**
   * Acknowledge alert
   */
  acknowledgeAlert: async (id: string): Promise<{ data: any }> => {
    const response = await apiClient.put(
      `${API_ENDPOINTS.ALERTS.BY_ID(id)}/acknowledge`
    )
    return response
  },

  /**
   * Resolve alert
   */
  resolveAlert: async (id: string): Promise<{ data: any }> => {
    const response = await apiClient.put(
      `${API_ENDPOINTS.ALERTS.BY_ID(id)}/resolve`
    )
    return response
  },

  /**
   * Dismiss alert
   */
  dismissAlert: async (id: string): Promise<{ data: any }> => {
    const response = await apiClient.put(
      `${API_ENDPOINTS.ALERTS.BY_ID(id)}/dismiss`
    )
    return response
  },

  /**
   * Get alert statistics
   */
  getAlertStats: async (): Promise<{ data: any }> => {
    const response = await apiClient.get(
      API_ENDPOINTS.ALERTS.STATS
    )
    return response
  },

  /**
   * Export alerts to CSV/PDF
   */
  exportAlerts: async (format: 'csv' | 'pdf', alertIds?: string[]): Promise<Blob> => {
    const response = await apiClient.post<Blob>(
      `${API_ENDPOINTS.ALERTS.BASE}/export`,
      { format, alert_ids: alertIds },
      { responseType: 'blob' }
    )
    return response.data
  },
}