/**
 * Alerts Store - Zustand
 * Manages environmental alerts state, verification, and filtering
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { 
  AlertState, 
  AlertActions, 
  Alert,
  AlertVerificationRequest,
  AlertPriority,
  AlertStatus
} from '@/types'
import { apiClient } from '@/lib/api-client'
import { alertsApi } from '@/lib/api/alerts'

interface AlertStore extends AlertState, AlertActions {}

export const useAlertStore = create<AlertStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    alerts: [],
    unreadCount: 0,
    selectedAlert: null,
    filters: {},
    isLoading: false,
    error: null,

    // Actions
    fetchAlerts: async (aoiId?: string): Promise<void> => {
      set({ isLoading: true, error: null })
      
      try {
        const response = aoiId 
          ? await alertsApi.getAlertsByAOI(aoiId)
          : await alertsApi.getAllAlerts({})
        
        const alerts = Array.isArray(response.data) ? response.data : (response.data as any)?.data || []
        
        set({
          alerts,
          unreadCount: alerts.filter((alert: any) => !alert.metadata?.read).length,
          isLoading: false,
          error: null,
        })
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch alerts'
        set({
          isLoading: false,
          error: errorMessage,
        })
        throw error
      }
    },

    fetchAlert: async (id: string): Promise<Alert> => {
      try {
        const response = await alertsApi.getAlert(id)
        const alert = response.data
        
        set((state) => ({
          alerts: state.alerts.map(a => a.id === id ? alert : a),
          selectedAlert: state.selectedAlert?.id === id ? alert : state.selectedAlert,
        }))
        
        return alert
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch alert'
        set({ error: errorMessage })
        throw error
      }
    },

    verifyAlert: async (request: AlertVerificationRequest): Promise<void> => {
      try {
        await alertsApi.verifyAlert(request.alert_id, request)
        
        // Update the alert with new verification data
        set((state) => ({
          alerts: state.alerts.map(alert => {
            if (alert.id === request.alert_id) {
              const currentVotes = alert.verification_votes || { agree: 0, disagree: 0 }
              
              // Update vote counts
              const updatedVotes = {
                ...currentVotes,
                [request.vote]: currentVotes[request.vote] + 1,
                user_vote: request.vote,
              }
              
              return {
                ...alert,
                verification_votes: updatedVotes,
              }
            }
            return alert
          }),
          selectedAlert: state.selectedAlert?.id === request.alert_id
            ? {
                ...state.selectedAlert,
                verification_votes: {
                  ...(state.selectedAlert.verification_votes || { agree: 0, disagree: 0 }),
                  [request.vote]: (state.selectedAlert.verification_votes?.[request.vote] || 0) + 1,
                  user_vote: request.vote,
                },
              }
            : state.selectedAlert,
        }))
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to verify alert'
        set({ error: errorMessage })
        throw error
      }
    },

    acknowledgeAlert: async (id: string): Promise<void> => {
      try {
        await alertsApi.acknowledgeAlert(id)
        
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id ? { ...alert, status: 'acknowledged' as AlertStatus } : alert
          ),
          selectedAlert: state.selectedAlert?.id === id
            ? { ...state.selectedAlert, status: 'acknowledged' as AlertStatus }
            : state.selectedAlert,
        }))
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to acknowledge alert'
        set({ error: errorMessage })
        throw error
      }
    },

    resolveAlert: async (id: string): Promise<void> => {
      try {
        await alertsApi.resolveAlert(id)
        
        const resolvedAt = new Date().toISOString()
        
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id 
              ? { ...alert, status: 'resolved' as AlertStatus, resolved_at: resolvedAt }
              : alert
          ),
          selectedAlert: state.selectedAlert?.id === id
            ? { ...state.selectedAlert, status: 'resolved' as AlertStatus, resolved_at: resolvedAt }
            : state.selectedAlert,
        }))
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to resolve alert'
        set({ error: errorMessage })
        throw error
      }
    },

    dismissAlert: async (id: string): Promise<void> => {
      try {
        await alertsApi.dismissAlert(id)
        
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id ? { ...alert, status: 'dismissed' as AlertStatus } : alert
          ),
          selectedAlert: state.selectedAlert?.id === id
            ? { ...state.selectedAlert, status: 'dismissed' as AlertStatus }
            : state.selectedAlert,
        }))
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to dismiss alert'
        set({ error: errorMessage })
        throw error
      }
    },

    setFilters: (filters: Partial<AlertState['filters']>) => {
      set((state) => ({
        filters: { ...state.filters, ...filters },
      }))
    },

    selectAlert: (alert: Alert | null) => {
      set({ selectedAlert: alert })
      
      // Mark as read if selecting an alert
      if (alert && !alert.metadata?.read) {
        get().markAsRead(alert.id)
      }
    },

    markAsRead: (id: string) => {
      set((state) => {
        const alertIndex = state.alerts.findIndex(alert => alert.id === id)
        if (alertIndex === -1 || state.alerts[alertIndex].metadata?.read) {
          return state
        }
        
        const updatedAlerts = [...state.alerts]
        updatedAlerts[alertIndex] = {
          ...updatedAlerts[alertIndex],
          metadata: {
            ...updatedAlerts[alertIndex].metadata,
            read: true,
          },
        }
        
        return {
          alerts: updatedAlerts,
          unreadCount: Math.max(0, state.unreadCount - 1),
        }
      })
    },

    clearError: () => {
      set({ error: null })
    },

    // Additional helper methods
    getFilteredAlerts: (): Alert[] => {
      const { alerts, filters } = get()
      
      return alerts.filter(alert => {
        // Filter by priority
        if (filters.priority && filters.priority.length > 0) {
          if (!filters.priority.includes(alert.priority)) {
            return false
          }
        }
        
        // Filter by status
        if (filters.status && filters.status.length > 0) {
          if (!filters.status.includes(alert.status)) {
            return false
          }
        }
        
        // Filter by date range
        if (filters.dateRange) {
          const alertDate = new Date(alert.detection_date)
          const startDate = new Date(filters.dateRange.start)
          const endDate = new Date(filters.dateRange.end)
          
          if (alertDate < startDate || alertDate > endDate) {
            return false
          }
        }
        
        return true
      })
    },

    searchAlerts: (query: string): Alert[] => {
      const { alerts } = get()
      const lowercaseQuery = query.toLowerCase()
      
      return alerts.filter(alert =>
        alert.title.toLowerCase().includes(lowercaseQuery) ||
        alert.description.toLowerCase().includes(lowercaseQuery) ||
        alert.change_type.toLowerCase().includes(lowercaseQuery)
      )
    },

    sortAlerts: (criteria: 'date' | 'priority' | 'confidence' | 'area') => {
      set((state) => {
        const sortedAlerts = [...state.alerts].sort((a, b) => {
          switch (criteria) {
            case 'date':
              return new Date(b.detection_date).getTime() - new Date(a.detection_date).getTime()
            case 'priority':
              const priorityOrder: Record<AlertPriority, number> = {
                critical: 4, high: 3, medium: 2, low: 1
              }
              return priorityOrder[b.priority] - priorityOrder[a.priority]
            case 'confidence':
              return b.confidence_score - a.confidence_score
            case 'area':
              return b.affected_area_km2 - a.affected_area_km2
            default:
              return 0
          }
        })
        
        return { alerts: sortedAlerts }
      })
    },

    getAlertStats: () => {
      const { alerts } = get()
      
      const stats = {
        total: alerts.length,
        unread: alerts.filter(alert => !alert.metadata?.read).length,
        byPriority: {
          critical: alerts.filter(alert => alert.priority === 'critical').length,
          high: alerts.filter(alert => alert.priority === 'high').length,
          medium: alerts.filter(alert => alert.priority === 'medium').length,
          low: alerts.filter(alert => alert.priority === 'low').length,
        },
        byStatus: {
          active: alerts.filter(alert => alert.status === 'active').length,
          acknowledged: alerts.filter(alert => alert.status === 'acknowledged').length,
          resolved: alerts.filter(alert => alert.status === 'resolved').length,
          dismissed: alerts.filter(alert => alert.status === 'dismissed').length,
        },
        averageConfidence: alerts.reduce((sum, alert) => sum + alert.confidence_score, 0) / alerts.length || 0,
        totalAffectedArea: alerts.reduce((sum, alert) => sum + alert.affected_area_km2, 0),
        verificationRatio: alerts.filter(alert => {
          const votes = alert.verification_votes
          return votes && votes.agree > votes.disagree
        }).length / alerts.length || 0,
      }
      
      return stats
    },

    getRecentAlerts: (hours: number = 24): Alert[] => {
      const { alerts } = get()
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - hours)
      
      return alerts.filter(alert => 
        new Date(alert.detection_date) > cutoffTime
      )
    },

    getHighPriorityAlerts: (): Alert[] => {
      const { alerts } = get()
      return alerts.filter(alert => 
        alert.priority === 'high' || alert.priority === 'critical'
      )
    },

    // Bulk operations
    bulkAcknowledge: async (alertIds: string[]): Promise<void> => {
      try {
        await Promise.all(alertIds.map(id => alertsApi.acknowledgeAlert(id)))
        
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alertIds.includes(alert.id) 
              ? { ...alert, status: 'acknowledged' as AlertStatus }
              : alert
          ),
        }))
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to acknowledge alerts'
        set({ error: errorMessage })
        throw error
      }
    },

    bulkDismiss: async (alertIds: string[]): Promise<void> => {
      try {
        await Promise.all(alertIds.map(id => alertsApi.dismissAlert(id)))
        
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alertIds.includes(alert.id) 
              ? { ...alert, status: 'dismissed' as AlertStatus }
              : alert
          ),
        }))
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to dismiss alerts'
        set({ error: errorMessage })
        throw error
      }
    },

    // Real-time updates (can be called from WebSocket or polling)
    addAlert: (alert: Alert) => {
      set((state) => ({
        alerts: [alert, ...state.alerts],
        unreadCount: state.unreadCount + 1,
      }))
    },

    updateAlert: (updatedAlert: Alert) => {
      set((state) => ({
        alerts: state.alerts.map(alert =>
          alert.id === updatedAlert.id ? updatedAlert : alert
        ),
        selectedAlert: state.selectedAlert?.id === updatedAlert.id 
          ? updatedAlert 
          : state.selectedAlert,
      }))
    },
  }))
)

// Extended interface with helper methods
interface AlertStore extends AlertState, AlertActions {
  getFilteredAlerts: () => Alert[]
  searchAlerts: (query: string) => Alert[]
  sortAlerts: (criteria: 'date' | 'priority' | 'confidence' | 'area') => void
  getAlertStats: () => {
    total: number
    unread: number
    byPriority: Record<AlertPriority, number>
    byStatus: Record<AlertStatus, number>
    averageConfidence: number
    totalAffectedArea: number
    verificationRatio: number
  }
  getRecentAlerts: (hours?: number) => Alert[]
  getHighPriorityAlerts: () => Alert[]
  bulkAcknowledge: (alertIds: string[]) => Promise<void>
  bulkDismiss: (alertIds: string[]) => Promise<void>
  addAlert: (alert: Alert) => void
  updateAlert: (alert: Alert) => void
}

// Helper hooks for component consumption
export const useAlerts = () => useAlertStore((state) => state.alerts)
export const useFilteredAlerts = () => useAlertStore((state) => state.getFilteredAlerts())
export const useSelectedAlert = () => useAlertStore((state) => state.selectedAlert)
export const useUnreadCount = () => useAlertStore((state) => state.unreadCount)
export const useAlertFilters = () => useAlertStore((state) => state.filters)
export const useAlertLoading = () => useAlertStore((state) => state.isLoading)
export const useAlertError = () => useAlertStore((state) => state.error)