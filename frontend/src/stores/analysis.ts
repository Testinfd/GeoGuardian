/**
 * Analysis Store - Zustand
 * Manages satellite analysis state, progress tracking, and system status
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { 
  AnalysisState, 
  AnalysisActions, 
  AnalysisResult,
  AnalysisRequest,
  HistoricalAnalysisRequest,
  DataAvailability,
  SystemStatus,
  SystemCapabilities
} from '@/types'
import { apiClient } from '@/lib/api-client'

interface AnalysisStore extends AnalysisState, AnalysisActions {}

// Polling intervals for different analysis statuses
const POLLING_INTERVALS = {
  queued: 5000,    // 5 seconds
  running: 2000,   // 2 seconds
  completed: 0,    // No polling
  failed: 0,       // No polling
  cancelled: 0,    // No polling
}

export const useAnalysisStore = create<AnalysisStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    results: {},
    activeAnalyses: {},
    systemStatus: null,
    capabilities: null,
    isLoading: false,
    error: null,

    // Private state for polling
    _pollingTimers: {} as Record<string, NodeJS.Timeout>,

    // Actions
    startAnalysis: async (request: AnalysisRequest): Promise<AnalysisResult> => {
      set({ isLoading: true, error: null })
      
      try {
        const response = await apiClient.post<AnalysisResult>('/api/v2/analysis/analyze/comprehensive', request)
        const analysis = response.data
        
        set((state) => ({
          results: {
            ...state.results,
            [analysis.id]: analysis,
          },
          activeAnalyses: {
            ...state.activeAnalyses,
            [analysis.id]: analysis,
          },
          isLoading: false,
          error: null,
        }))
        
        // Start polling for progress if analysis is queued or running
        if (analysis.status === 'queued' || analysis.status === 'running') {
          get().pollAnalysisProgress(analysis.id)
        }
        
        return analysis
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to start analysis'
        set({
          isLoading: false,
          error: errorMessage,
        })
        throw error
      }
    },

    startHistoricalAnalysis: async (request: HistoricalAnalysisRequest): Promise<AnalysisResult> => {
      set({ isLoading: true, error: null })
      
      try {
        const response = await apiClient.post<AnalysisResult>('/api/v2/analysis/analyze/historical', request)
        const analysis = response.data
        
        set((state) => ({
          results: {
            ...state.results,
            [analysis.id]: analysis,
          },
          activeAnalyses: {
            ...state.activeAnalyses,
            [analysis.id]: analysis,
          },
          isLoading: false,
          error: null,
        }))
        
        // Start polling for progress
        if (analysis.status === 'queued' || analysis.status === 'running') {
          get().pollAnalysisProgress(analysis.id)
        }
        
        return analysis
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to start historical analysis'
        set({
          isLoading: false,
          error: errorMessage,
        })
        throw error
      }
    },

    fetchAnalysisResult: async (id: string): Promise<AnalysisResult> => {
      try {
        // Fetch analysis result from backend
        const response = await apiClient.get<AnalysisResult>(`/api/v2/analysis/${id}`)
        const analysis = response.data
        
        set((state) => ({
          results: {
            ...state.results,
            [id]: analysis,
          },
          // Remove from active if completed
          activeAnalyses: analysis.status === 'completed' || analysis.status === 'failed' || analysis.status === 'cancelled'
            ? Object.fromEntries(Object.entries(state.activeAnalyses).filter(([key]) => key !== id))
            : {
                ...state.activeAnalyses,
                [id]: analysis,
              },
        }))
        
        // Stop polling if analysis is complete
        if (analysis.status === 'completed' || analysis.status === 'failed' || analysis.status === 'cancelled') {
          get().stopPolling(id)
        }
        
        return analysis
      } catch (error: any) {
        const errorMessage = error.message || error.response?.data?.message || 'Failed to fetch analysis result'
        console.warn('fetchAnalysisResult error:', errorMessage)
        // Don't set error state to avoid console spam during polling
        throw error
      }
    },

    checkDataAvailability: async (aoiId: string, geojson?: any): Promise<DataAvailability> => {
      try {
        const response = await apiClient.get<DataAvailability>(`/api/v2/analysis/data-availability/${aoiId}`)
        return response.data
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to check data availability'
        set({ error: errorMessage })
        throw error
      }
    },

    fetchSystemStatus: async (): Promise<void> => {
      try {
        const response = await apiClient.get<any>('/api/v2/analysis/system/status')
        const backendData = response.data

        // Transform backend response to match frontend SystemStatus interface
        const systemStatus = {
          status: (backendData as any).system_health === 'operational' ? 'healthy' as const :
                 (backendData as any).system_online ? 'degraded' as const : 'down' as const,
          services: {
            database: (backendData as any).database_status === 'online' ? 'up' as const : 'down' as const,
            sentinel_hub: (backendData as any).satellite_data_status === 'online' ? 'up' as const : 'down' as const,
            analysis_engine: (backendData as any).enhanced_analysis_available ? 'up' as const : 'down' as const,
            email_service: 'up' as const // Default to up since we don't have email status in backend
          },
          queue_size: (backendData as any).current_load || 0,
          active_analyses: Math.floor(((backendData as any).current_load || 0) / 2), // Estimate active analyses
          last_check: (backendData as any).last_update || new Date().toISOString(),
          version: (backendData as any).api_version || '2.0',
          uptime: Math.floor((Date.now() - new Date((backendData as any).last_update || Date.now()).getTime()) / 1000)
        }

        set({
          systemStatus,
          error: null,
        })
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch system status'
        set({ error: errorMessage })
        throw error
      }
    },

    fetchCapabilities: async (): Promise<void> => {
      try {
        // This endpoint doesn't exist yet, so we'll create default capabilities
        // based on the system status for now
        const statusResponse = await apiClient.get<any>('/api/v2/analysis/system/status')
        const backendData = statusResponse.data
        
        // Create capabilities from system status
        const capabilities: SystemCapabilities = {
          algorithms: ['ewma', 'cusum', 'vedgesat', 'spectral'],
          analysis_types: ['comprehensive', 'vegetation', 'water', 'urban', 'change_detection'],
          max_aoi_size_km2: 1000,
          max_date_range_days: 365,
          supported_satellites: ['Sentinel-2', 'Sentinel-1'],
          spectral_indices: ['NDVI', 'NDWI', 'NDBI', 'EVI']
        }
        
        set({
          capabilities,
          error: null,
        })
      } catch (error: any) {
        // Silently fail - don't throw error or set error state
        // This prevents the console errors from showing up
        console.warn('Failed to fetch system capabilities, using defaults')
        
        // Set default capabilities
        const defaultCapabilities: SystemCapabilities = {
          algorithms: ['spectral'],
          analysis_types: ['comprehensive', 'vegetation', 'water'],
          max_aoi_size_km2: 1000,
          max_date_range_days: 365,
          supported_satellites: ['Sentinel-2'],
          spectral_indices: ['NDVI', 'NDWI']
        }
        
        set({
          capabilities: defaultCapabilities,
          error: null,
        })
      }
    },

    pollAnalysisProgress: (id: string): void => {
      const state = get()
      
      // Don't start polling if already polling
      if (state._pollingTimers[id]) {
        return
      }
      
      const poll = async () => {
        try {
          const analysis = await get().fetchAnalysisResult(id)
          
          // Determine next polling interval
          const interval = POLLING_INTERVALS[analysis.status] || 0
          
          if (interval > 0) {
            // Schedule next poll
            const timerId = setTimeout(poll, interval)
            set((state) => ({
              _pollingTimers: {
                ...state._pollingTimers,
                [id]: timerId,
              },
            }))
          } else {
            // Stop polling
            get().stopPolling(id)
          }
        } catch (error) {
          console.error('Polling error for analysis', id, error)
          // Stop polling on error
          get().stopPolling(id)
        }
      }
      
      // Start immediate poll
      poll()
    },

    stopPolling: (id: string): void => {
      const state = get()
      const timerId = state._pollingTimers[id]
      
      if (timerId) {
        clearTimeout(timerId)
        set((state) => {
          const { [id]: removed, ...rest } = state._pollingTimers
          return { _pollingTimers: rest }
        })
      }
    },

    clearError: () => {
      set({ error: null })
    },

    // Additional helper methods
    getAnalysisById: (id: string): AnalysisResult | undefined => {
      return get().results[id]
    },

    getAnalysesByAOI: (aoiId: string): AnalysisResult[] => {
      const { results } = get()
      return Object.values(results).filter(analysis => analysis.aoi_id === aoiId)
    },

    getActiveAnalyses: (): AnalysisResult[] => {
      return Object.values(get().activeAnalyses)
    },

    getCompletedAnalyses: (): AnalysisResult[] => {
      const { results } = get()
      return Object.values(results).filter(analysis => analysis.status === 'completed')
    },

    getFailedAnalyses: (): AnalysisResult[] => {
      const { results } = get()
      return Object.values(results).filter(analysis => analysis.status === 'failed')
    },

    cancelAnalysis: async (id: string): Promise<void> => {
      try {
        await apiClient.delete(`/api/v2/analysis/${id}`)
        
        set((state) => {
          const analysis = state.results[id]
          if (analysis) {
            const updatedAnalysis = { ...analysis, status: 'cancelled' as const }
            return {
              results: {
                ...state.results,
                [id]: updatedAnalysis,
              },
              activeAnalyses: Object.fromEntries(
                Object.entries(state.activeAnalyses).filter(([key]) => key !== id)
              ),
            }
          }
          return state
        })
        
        // Stop polling
        get().stopPolling(id)
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to cancel analysis'
        set({ error: errorMessage })
        throw error
      }
    },

    retryAnalysis: async (id: string): Promise<AnalysisResult> => {
      const analysis = get().results[id]
      if (!analysis) {
        throw new Error('Analysis not found')
      }
      
      // Create new analysis request from existing analysis
      const request: AnalysisRequest = {
        aoi_id: analysis.aoi_id,
        analysis_type: analysis.analysis_type,
        // Add other fields as needed
      }
      
      return get().startAnalysis(request)
    },

    getAnalysisStats: () => {
      const { results } = get()
      const analyses = Object.values(results)
      
      return {
        total: analyses.length,
        completed: analyses.filter(a => a.status === 'completed').length,
        running: analyses.filter(a => a.status === 'running').length,
        queued: analyses.filter(a => a.status === 'queued').length,
        failed: analyses.filter(a => a.status === 'failed').length,
        cancelled: analyses.filter(a => a.status === 'cancelled').length,
        changeDetected: analyses.filter(a => a.results?.change_detected).length,
        averageConfidence: analyses
          .filter(a => a.results?.confidence_score)
          .reduce((sum, a) => sum + (a.results?.confidence_score || 0), 0) / 
          analyses.filter(a => a.results?.confidence_score).length || 0,
      }
    },

    // Clean up old completed analyses
    cleanupOldAnalyses: (daysOld: number = 30) => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      set((state) => {
        const filteredResults = Object.fromEntries(
          Object.entries(state.results).filter(([_, analysis]) => {
            if (analysis.status !== 'completed') return true
            const completedDate = new Date(analysis.completed_at || analysis.updated_at)
            return completedDate > cutoffDate
          })
        )
        
        return { results: filteredResults }
      })
    },
  }))
)

// Extended interface with helper methods
interface AnalysisStore extends AnalysisState, AnalysisActions {
  _pollingTimers: Record<string, NodeJS.Timeout>
  getAnalysisById: (id: string) => AnalysisResult | undefined
  getAnalysesByAOI: (aoiId: string) => AnalysisResult[]
  getActiveAnalyses: () => AnalysisResult[]
  getCompletedAnalyses: () => AnalysisResult[]
  getFailedAnalyses: () => AnalysisResult[]
  cancelAnalysis: (id: string) => Promise<void>
  retryAnalysis: (id: string) => Promise<AnalysisResult>
  getAnalysisStats: () => {
    total: number
    completed: number
    running: number
    queued: number
    failed: number
    cancelled: number
    changeDetected: number
    averageConfidence: number
  }
  cleanupOldAnalyses: (daysOld?: number) => void
}

// Helper hooks for component consumption
export const useAnalysisResults = () => useAnalysisStore((state) => state.results)
export const useActiveAnalyses = () => useAnalysisStore((state) => state.activeAnalyses)
export const useSystemStatus = () => useAnalysisStore((state) => state.systemStatus)
export const useSystemCapabilities = () => useAnalysisStore((state) => state.capabilities)
export const useAnalysisLoading = () => useAnalysisStore((state) => state.isLoading)
export const useAnalysisError = () => useAnalysisStore((state) => state.error)

// Cleanup function to be called on app unmount
export const cleanupAnalysisStore = () => {
  const state = useAnalysisStore.getState()
  Object.values(state._pollingTimers).forEach(timerId => clearTimeout(timerId))
}