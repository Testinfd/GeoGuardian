/**
 * Advanced Features API Client
 * Provides access to temporal analysis, hotspot detection, alert prioritization, and visualizations
 */

import { apiClient } from '../api-client'
import type {
  TemporalAnalysisRequest,
  TemporalAnalysisResponse,
  HotspotAnalysisRequest,
  HotspotAnalysisResponse,
  AlertPrioritizationRequest,
  AlertPrioritizationResponse,
  VisualizationRequest,
  VisualizationResponse,
} from '@/types'

const BASE_PATH = '/api/v2/analysis'

/**
 * Temporal Analysis API
 */
export const temporalAnalysis = {
  /**
   * Perform multi-temporal analysis to detect trends, velocity, and acceleration
   */
  analyze: async (request: TemporalAnalysisRequest): Promise<TemporalAnalysisResponse> => {
    const response = await apiClient.post<TemporalAnalysisResponse>(
      `${BASE_PATH}/temporal-analysis`,
      request
    )
    return response.data
  },
}

/**
 * Hotspot Analysis API
 */
export const hotspotAnalysis = {
  /**
   * Detect spatial hotspots of change within an AOI
   */
  analyze: async (request: HotspotAnalysisRequest): Promise<HotspotAnalysisResponse> => {
    const response = await apiClient.post<HotspotAnalysisResponse>(
      `${BASE_PATH}/hotspot-analysis`,
      request
    )
    return response.data
  },
}

/**
 * Alert Prioritization API
 */
export const alertPrioritization = {
  /**
   * Intelligently prioritize alerts based on multiple factors
   */
  prioritize: async (request: AlertPrioritizationRequest = {}): Promise<AlertPrioritizationResponse> => {
    const response = await apiClient.post<AlertPrioritizationResponse>(
      `${BASE_PATH}/alerts/prioritize`,
      request
    )
    return response.data
  },
}

/**
 * Visualization API
 */
export const visualization = {
  /**
   * Generate advanced visualizations for change detection
   */
  generate: async (request: VisualizationRequest): Promise<VisualizationResponse> => {
    const response = await apiClient.post<VisualizationResponse>(
      `${BASE_PATH}/visualize`,
      request
    )
    return response.data
  },
}

/**
 * Convenience function to get all advanced analysis for an AOI
 */
export const getAdvancedAnalysis = async (aoi_id: string, geojson: any) => {
  try {
    // Run all analyses in parallel
    const [temporal, hotspots, prioritized] = await Promise.allSettled([
      temporalAnalysis.analyze({
        aoi_id,
        index_name: 'ndvi',
        lookback_days: 365,
      }),
      hotspotAnalysis.analyze({
        aoi_id,
        geojson,
        date_range_days: 30,
        grid_size: 10,
      }),
      alertPrioritization.prioritize({
        limit: 10,
      }),
    ])

    return {
      temporal: temporal.status === 'fulfilled' ? temporal.value : null,
      hotspots: hotspots.status === 'fulfilled' ? hotspots.value : null,
      prioritized: prioritized.status === 'fulfilled' ? prioritized.value : null,
    }
  } catch (error) {
    console.error('Failed to get advanced analysis:', error)
    throw error
  }
}

export default {
  temporalAnalysis,
  hotspotAnalysis,
  alertPrioritization,
  visualization,
  getAdvancedAnalysis,
}
