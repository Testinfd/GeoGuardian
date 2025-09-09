/**
 * Store Index - Central exports for all Zustand stores
 * Provides a single import point for all state management
 */

// Import stores for internal use
import { useAuthStore } from './auth'
import { useAOIStore } from './aoi'
import { useAnalysisStore, cleanupAnalysisStore } from './analysis'
import { useAlertStore } from './alerts'

// Store exports
export { useAuthStore, useUser, useIsAuthenticated, useAuthToken, useAuthLoading, useAuthError } from './auth'
export { useAOIStore, useAOIs, useSelectedAOI, useAOILoading, useAOIError } from './aoi'
export { 
  useAnalysisStore, 
  useAnalysisResults, 
  useActiveAnalyses, 
  useSystemStatus, 
  useSystemCapabilities,
  useAnalysisLoading, 
  useAnalysisError,
  cleanupAnalysisStore 
} from './analysis'
export { 
  useAlertStore, 
  useAlerts, 
  useFilteredAlerts, 
  useSelectedAlert, 
  useUnreadCount,
  useAlertFilters,
  useAlertLoading, 
  useAlertError 
} from './alerts'

// Combined store hook for accessing all stores
export const useStores = () => ({
  auth: useAuthStore(),
  aoi: useAOIStore(),
  analysis: useAnalysisStore(),
  alerts: useAlertStore(),
})

// Store cleanup functions
export const cleanupStores = () => {
  cleanupAnalysisStore()
  // Add other cleanup functions as needed
}

// Global store initialization
export const initializeStores = async () => {
  try {
    // Initialize auth store (check for existing token)
    await useAuthStore.getState().initializeAuth?.()
    
    // Fetch system capabilities if authenticated
    if (useAuthStore.getState().isAuthenticated) {
      await useAnalysisStore.getState().fetchCapabilities()
      await useAnalysisStore.getState().fetchSystemStatus()
    }
  } catch (error) {
    console.error('Failed to initialize stores:', error)
  }
}

// Store reset function (useful for logout)
export const resetStores = () => {
  // Reset auth store (handled by logout)
  useAuthStore.getState().logout()
  
  // Reset other stores
  useAOIStore.setState({
    aois: [],
    selectedAOI: null,
    isLoading: false,
    error: null,
  })
  
  useAnalysisStore.setState({
    results: {},
    activeAnalyses: {},
    systemStatus: null,
    capabilities: null,
    isLoading: false,
    error: null,
  })
  
  useAlertStore.setState({
    alerts: [],
    unreadCount: 0,
    selectedAlert: null,
    filters: {},
    isLoading: false,
    error: null,
  })
  
  // Cleanup any ongoing operations
  cleanupStores()
}

// Store hydration for SSR (if needed)
export const hydrateStores = (serverState?: any) => {
  if (serverState) {
    // Hydrate stores with server state if using SSR
    if (serverState.auth) {
      useAuthStore.setState(serverState.auth)
    }
    // Add other store hydrations as needed
  }
}

// Global error handler for store errors
export const handleStoreError = (error: any, storeName: string) => {
  console.error(`Store error in ${storeName}:`, error)
  
  // You can implement global error handling here
  // For example, show toast notifications, log to monitoring service, etc.
  
  // Example: Show toast notification
  // toast.error(`${storeName}: ${error.message}`)
}

// Store subscribers for cross-store communication
export const setupStoreSubscribers = () => {
  // Subscribe to auth changes and reset other stores on logout
  let previousIsAuthenticated = useAuthStore.getState().isAuthenticated
  
  useAuthStore.subscribe((state) => {
    const currentIsAuthenticated = state.isAuthenticated
    
    if (previousIsAuthenticated !== currentIsAuthenticated) {
      if (!currentIsAuthenticated) {
        // Clear other stores when user logs out
        useAOIStore.setState({
          aois: [],
          selectedAOI: null,
          isLoading: false,
          error: null,
        })
        
        useAnalysisStore.setState({
          results: {},
          activeAnalyses: {},
          isLoading: false,
          error: null,
        })
        
        useAlertStore.setState({
          alerts: [],
          unreadCount: 0,
          selectedAlert: null,
          filters: {},
          isLoading: false,
          error: null,
        })
        
        cleanupStores()
      } else {
        // Initialize stores when user logs in
        initializeStores()
      }
      
      previousIsAuthenticated = currentIsAuthenticated
    }
  })
  
  // Subscribe to AOI selection and fetch related data
  let previousSelectedAOI = useAOIStore.getState().selectedAOI
  
  useAOIStore.subscribe((state) => {
    const currentSelectedAOI = state.selectedAOI
    
    if (previousSelectedAOI?.id !== currentSelectedAOI?.id) {
      if (currentSelectedAOI) {
        // Fetch alerts for selected AOI
        useAlertStore.getState().fetchAlerts(currentSelectedAOI.id)
      }
      
      previousSelectedAOI = currentSelectedAOI
    }
  })
  
  // Subscribe to analysis completion and trigger alert fetch
  let previousResults = Object.values(useAnalysisStore.getState().results)
  
  useAnalysisStore.subscribe((state) => {
    const currentResults = Object.values(state.results)
    
    // Check for newly completed analyses
    const newlyCompleted = currentResults.filter(
      (analysis: any) => {
        const wasCompleted = previousResults.some(
          (prev: any) => prev.id === analysis.id && prev.status === 'completed'
        )
        return analysis.status === 'completed' && 
               analysis.results?.change_detected && 
               !wasCompleted
      }
    )
    
    if (newlyCompleted.length > 0) {
      // Refresh alerts when new analyses complete with changes
      useAlertStore.getState().fetchAlerts()
    }
    
    previousResults = currentResults
  })
}

// Types for store composition
export type AuthStore = ReturnType<typeof useAuthStore>
export type AOIStore = ReturnType<typeof useAOIStore>
export type AnalysisStore = ReturnType<typeof useAnalysisStore>
export type AlertStore = ReturnType<typeof useAlertStore>

export type AllStores = {
  auth: AuthStore
  aoi: AOIStore
  analysis: AnalysisStore
  alerts: AlertStore
}