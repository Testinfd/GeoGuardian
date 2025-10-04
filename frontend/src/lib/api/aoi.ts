/**
 * Areas of Interest (AOI) API client
 * Handles AOI management, CRUD operations, and GeoJSON
 */

import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/utils/constants'
import type { 
  AOI, 
  CreateAOIRequest, 
  UpdateAOIRequest,
  GeoJSONFeature 
} from '@/types'

export const aoiApi = {
  /**
   * Get all AOIs for current user
   */
  getAllAOIs: async (): Promise<{ data: AOI[] }> => {
    const response = await apiClient.get<AOI[]>(
      API_ENDPOINTS.AOI.BASE
    )
    return response
  },

  /**
   * Get specific AOI by ID
   */
  getAOI: async (id: string): Promise<{ data: AOI }> => {
    const response = await apiClient.get<AOI>(
      API_ENDPOINTS.AOI.BY_ID(id)
    )
    return response
  },

  /**
   * Create new AOI
   */
  createAOI: async (aoiData: CreateAOIRequest): Promise<{ data: AOI }> => {
    const response = await apiClient.post<AOI>(
      API_ENDPOINTS.AOI.BASE,
      aoiData
    )
    return response
  },

  /**
   * Update existing AOI
   */
  updateAOI: async (id: string, aoiData: UpdateAOIRequest): Promise<{ data: AOI }> => {
    const response = await apiClient.put<AOI>(
      API_ENDPOINTS.AOI.BY_ID(id),
      aoiData
    )
    return response
  },

  /**
   * Delete AOI
   */
  deleteAOI: async (id: string): Promise<{ data: any }> => {
    const response = await apiClient.delete(
      API_ENDPOINTS.AOI.BY_ID(id)
    )
    return response
  },

  /**
   * Get AOI statistics
   */
  getAOIStats: async (id: string): Promise<{ data: any }> => {
    const response = await apiClient.get(
      API_ENDPOINTS.AOI.STATS(id)
    )
    return response
  },

  /**
   * Get analyses for specific AOI
   */
  getAOIAnalyses: async (id: string): Promise<{ data: any[] }> => {
    const response = await apiClient.get<any[]>(
      API_ENDPOINTS.AOI.ANALYSES(id)
    )
    return response
  },

  /**
   * Get public AOIs (if feature exists)
   */
  getPublicAOIs: async (): Promise<{ data: AOI[] }> => {
    const response = await apiClient.get<AOI[]>(
      API_ENDPOINTS.AOI.PUBLIC
    )
    return response
  },

  /**
   * Get available tags for AOIs
   */
  getAOITags: async (): Promise<{ data: string[] }> => {
    const response = await apiClient.get<string[]>(
      API_ENDPOINTS.AOI.TAGS
    )
    return response
  },

  /**
   * Validate GeoJSON for AOI creation
   */
  validateGeoJSON: async (geoJson: GeoJSONFeature): Promise<{ data: { valid: boolean, errors?: string[] } }> => {
    const response = await apiClient.post<{ valid: boolean, errors?: string[] }>(
      `${API_ENDPOINTS.AOI.BASE}/validate`,
      { geojson: geoJson }
    )
    return response
  },

  /**
   * Upload GeoJSON file for AOI creation
   */
  uploadGeoJSON: async (file: File): Promise<{ data: GeoJSONFeature }> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<GeoJSONFeature>(
      `${API_ENDPOINTS.AOI.BASE}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },

  /**
   * Export AOI to various formats
   */
  exportAOI: async (id: string, format: 'geojson' | 'kml' | 'shapefile'): Promise<{ data: Blob }> => {
    const response = await apiClient.get<Blob>(
      `${API_ENDPOINTS.AOI.BY_ID(id)}/export`,
      {
        params: { format },
        responseType: 'blob',
      }
    )
    return response
  },
}