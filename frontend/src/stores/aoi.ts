/**
 * AOI (Area of Interest) Store - Zustand
 * Manages Areas of Interest state, CRUD operations, and selection
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { 
  AOIState, 
  AOIActions, 
  AOI, 
  CreateAOIRequest, 
  UpdateAOIRequest 
} from '@/types'
import { aoiApi } from '@/lib/api'

interface AOIStore extends AOIState, AOIActions {}

export const useAOIStore = create<AOIStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    aois: [],
    selectedAOI: null,
    isLoading: false,
    error: null,

    // Actions
    fetchAOIs: async () => {
      set({ isLoading: true, error: null })
      
      try {
        const response = await aoiApi.getAllAOIs()
        const aois = Array.isArray(response.data) ? response.data : (response.data as any)?.data || []
        
        set({
          aois,
          isLoading: false,
          error: null,
        })
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch AOIs'
        set({
          isLoading: false,
          error: errorMessage,
        })
        throw error
      }
    },

    createAOI: async (aoiData: CreateAOIRequest): Promise<AOI> => {
      set({ isLoading: true, error: null })
      
      try {
        const response = await aoiApi.createAOI(aoiData)
        const newAOI = response.data
        
        set((state) => ({
          aois: [...state.aois, newAOI],
          isLoading: false,
          error: null,
        }))
        
        return newAOI
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to create AOI'
        set({
          isLoading: false,
          error: errorMessage,
        })
        throw error
      }
    },

    updateAOI: async (id: string, updates: UpdateAOIRequest): Promise<AOI> => {
      set({ isLoading: true, error: null })
      
      try {
        const response = await aoiApi.updateAOI(id, updates)
        const updatedAOI = response.data
        
        set((state) => ({
          aois: state.aois.map(aoi => 
            aoi.id === id ? updatedAOI : aoi
          ),
          selectedAOI: state.selectedAOI?.id === id ? updatedAOI : state.selectedAOI,
          isLoading: false,
          error: null,
        }))
        
        return updatedAOI
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to update AOI'
        set({
          isLoading: false,
          error: errorMessage,
        })
        throw error
      }
    },

    deleteAOI: async (id: string): Promise<void> => {
      set({ isLoading: true, error: null })
      
      try {
        await aoiApi.deleteAOI(id)
        
        set((state) => ({
          aois: state.aois.filter(aoi => aoi.id !== id),
          selectedAOI: state.selectedAOI?.id === id ? null : state.selectedAOI,
          isLoading: false,
          error: null,
        }))
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to delete AOI'
        set({
          isLoading: false,
          error: errorMessage,
        })
        throw error
      }
    },

    selectAOI: (aoi: AOI | null) => {
      set({ selectedAOI: aoi })
    },

    clearError: () => {
      set({ error: null })
    },

    // Additional helper methods
    getAOIById: (id: string): AOI | undefined => {
      return get().aois.find(aoi => aoi.id === id)
    },

    getAOIsByTag: (tag: string): AOI[] => {
      return get().aois.filter(aoi => 
        aoi.tags?.includes(tag)
      )
    },

    searchAOIs: (query: string): AOI[] => {
      const { aois } = get()
      const lowercaseQuery = query.toLowerCase()
      
      return aois.filter(aoi =>
        aoi.name.toLowerCase().includes(lowercaseQuery) ||
        aoi.description?.toLowerCase().includes(lowercaseQuery) ||
        aoi.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
    },

    // Sort AOIs by different criteria
    sortAOIs: (criteria: 'name' | 'created_at' | 'updated_at' | 'analysis_count') => {
      set((state) => {
        const sortedAOIs = [...state.aois].sort((a, b) => {
          switch (criteria) {
            case 'name':
              return a.name.localeCompare(b.name)
            case 'created_at':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'updated_at':
              return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            case 'analysis_count':
              return (b.analysis_count || 0) - (a.analysis_count || 0)
            default:
              return 0
          }
        })
        
        return { aois: sortedAOIs }
      })
    },

    // Filter AOIs
    filterAOIs: (filters: {
      tags?: string[]
      isPublic?: boolean
      hasAnalysis?: boolean
      dateRange?: { start: string; end: string }
    }) => {
      const { aois } = get()
      
      return aois.filter(aoi => {
        // Filter by tags
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag => 
            aoi.tags?.includes(tag)
          )
          if (!hasMatchingTag) return false
        }
        
        // Filter by public/private
        if (filters.isPublic !== undefined && aoi.is_public !== filters.isPublic) {
          return false
        }
        
        // Filter by analysis existence
        if (filters.hasAnalysis !== undefined) {
          const hasAnalysis = (aoi.analysis_count || 0) > 0
          if (hasAnalysis !== filters.hasAnalysis) return false
        }
        
        // Filter by date range
        if (filters.dateRange) {
          const aoiDate = new Date(aoi.created_at)
          const startDate = new Date(filters.dateRange.start)
          const endDate = new Date(filters.dateRange.end)
          
          if (aoiDate < startDate || aoiDate > endDate) {
            return false
          }
        }
        
        return true
      })
    },

    // Get AOI statistics
    getAOIStats: () => {
      const { aois } = get()
      
      return {
        total: aois.length,
        public: aois.filter(aoi => aoi.is_public).length,
        private: aois.filter(aoi => !aoi.is_public).length,
        withAnalysis: aois.filter(aoi => (aoi.analysis_count || 0) > 0).length,
        totalAnalyses: aois.reduce((sum, aoi) => sum + (aoi.analysis_count || 0), 0),
        tags: Array.from(new Set(aois.flatMap(aoi => aoi.tags || []))),
      }
    },

    // Refresh single AOI
    refreshAOI: async (id: string): Promise<AOI> => {
      try {
        const response = await aoiApi.getAOI(id)
        const updatedAOI = response.data
        
        set((state) => ({
          aois: state.aois.map(aoi => 
            aoi.id === id ? updatedAOI : aoi
          ),
          selectedAOI: state.selectedAOI?.id === id ? updatedAOI : state.selectedAOI,
        }))
        
        return updatedAOI
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to refresh AOI'
        set({ error: errorMessage })
        throw error
      }
    },
  }))
)

// Extended interface with helper methods
interface AOIStore extends AOIState, AOIActions {
  getAOIById: (id: string) => AOI | undefined
  getAOIsByTag: (tag: string) => AOI[]
  searchAOIs: (query: string) => AOI[]
  sortAOIs: (criteria: 'name' | 'created_at' | 'updated_at' | 'analysis_count') => void
  filterAOIs: (filters: {
    tags?: string[]
    isPublic?: boolean
    hasAnalysis?: boolean
    dateRange?: { start: string; end: string }
  }) => AOI[]
  getAOIStats: () => {
    total: number
    public: number
    private: number
    withAnalysis: number
    totalAnalyses: number
    tags: string[]
  }
  refreshAOI: (id: string) => Promise<AOI>
}

// Helper hooks for component consumption
export const useAOIs = () => useAOIStore((state) => state.aois)
export const useSelectedAOI = () => useAOIStore((state) => state.selectedAOI)
export const useAOILoading = () => useAOIStore((state) => state.isLoading)
export const useAOIError = () => useAOIStore((state) => state.error)

// Subscribe to AOI changes for side effects
useAOIStore.subscribe(
  (state) => state.selectedAOI,
  (selectedAOI) => {
    // You can add side effects here, like triggering analysis fetches
    console.log('Selected AOI changed:', selectedAOI)
  }
)