/**
 * Analysis API client
 * Handles satellite analysis, results, and system capabilities
 */

import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/utils/constants'
import type { 
  AnalysisRequest,
  AnalysisResult,
  SystemStatus,
  SystemCapabilities,
  DataAvailabilityResponse
} from '@/types'

export const analysisApi = {
  /**
   * Start comprehensive analysis
   */
  startComprehensiveAnalysis: async (request: AnalysisRequest): Promise<{ analysis_id: string }> => {
    const response = await apiClient.post<{ analysis_id: string }>(
      API_ENDPOINTS.ANALYSIS.COMPREHENSIVE,
      request
    )
    return response.data
  },

  /**
   * Start historical analysis
   */
  startHistoricalAnalysis: async (request: AnalysisRequest): Promise<{ analysis_id: string }> => {
    const response = await apiClient.post<{ analysis_id: string }>(
      API_ENDPOINTS.ANALYSIS.HISTORICAL,
      request
    )
    return response.data
  },

  /**
   * Get analysis result by ID
   */
  getAnalysisResult: async (id: string): Promise<AnalysisResult> => {
    const response = await apiClient.get<AnalysisResult>(
      API_ENDPOINTS.ANALYSIS.RESULT(id)
    )
    return response.data
  },

  /**
   * Get all analysis results
   */
  getAllResults: async (params?: {
    limit?: number
    offset?: number
    status?: string[]
    aoi_id?: string
  }): Promise<AnalysisResult[]> => {
    const response = await apiClient.get<AnalysisResult[]>(
      API_ENDPOINTS.ANALYSIS.RESULTS,
      { params }
    )
    return response.data
  },

  /**
   * Check data availability for AOI
   */
  checkDataAvailability: async (aoiId: string, params?: {
    start_date?: string
    end_date?: string
  }): Promise<DataAvailabilityResponse> => {
    const response = await apiClient.get<DataAvailabilityResponse>(
      API_ENDPOINTS.ANALYSIS.DATA_AVAILABILITY(aoiId),
      { params }
    )
    return response.data
  },

  /**
   * Get system status
   */
  getSystemStatus: async (): Promise<SystemStatus> => {
    const response = await apiClient.get<SystemStatus>(
      API_ENDPOINTS.ANALYSIS.STATUS
    )
    return response.data
  },

  /**
   * Get system capabilities
   */
  getSystemCapabilities: async (): Promise<SystemCapabilities> => {
    const response = await apiClient.get<SystemCapabilities>(
      API_ENDPOINTS.ANALYSIS.CAPABILITIES
    )
    return response.data
  },

  /**
   * Cancel ongoing analysis
   */
  cancelAnalysis: async (id: string): Promise<any> => {
    const response = await apiClient.delete<any>(
      API_ENDPOINTS.ANALYSIS.RESULT(id)
    )
    return response.data
  },

  /**
   * Retry failed analysis
   */
  retryAnalysis: async (id: string): Promise<{ analysis_id: string }> => {
    const response = await apiClient.post<{ analysis_id: string }>(
      `${API_ENDPOINTS.ANALYSIS.RESULT(id)}/retry`
    )
    return response.data
  },

  /**
   * Export analysis results
   */
  exportResults: async (id: string, format: 'pdf' | 'csv' | 'geojson'): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `${API_ENDPOINTS.ANALYSIS.RESULT(id)}/export`,
      {
        params: { format },
        responseType: 'blob',
      }
    )
    return response.data
  },

  /**
   * Get analysis statistics
   */
  getAnalysisStats: async (params?: {
    start_date?: string
    end_date?: string
    aoi_id?: string
  }): Promise<any> => {
    const response = await apiClient.get<any>(
      `${API_ENDPOINTS.ANALYSIS.RESULTS}/stats`,
      { params }
    )
    return response.data
  },

  /**
   * Download satellite imagery for analysis
   */
  downloadImagery: async (analysisId: string, imageType: 'before' | 'after' | 'change'): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `${API_ENDPOINTS.ANALYSIS.RESULT(analysisId)}/imagery/${imageType}`,
      { responseType: 'blob' }
    )
    return response.data
  },

  /**
   * Get analysis timeline/history
   */
  getAnalysisTimeline: async (aoiId: string, params?: {
    start_date?: string
    end_date?: string
    limit?: number
  }): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      `${API_ENDPOINTS.ANALYSIS.RESULTS}/timeline`,
      { 
        params: { aoi_id: aoiId, ...params }
      }
    )
    return response.data
  },

  /**
   * Get satellite imagery preview for an area
   */
  getSatelliteImageryPreview: async (geojson: any): Promise<any> => {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.ANALYSIS.PREVIEW,
      { geojson }  // Wrap geojson in object as expected by backend
    )
    return response.data
  }
}