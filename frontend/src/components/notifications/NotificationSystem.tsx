/**
 * Notification System Components
 * Real-time notifications and notification center
 */

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import type { Notification } from '@/types'

// Notification Context
interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  markAsRead: (id: string) => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | null>(null)

// Notification Provider
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Auto-remove after duration (if specified)
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, notification.duration)
    }
    
    // Request browser notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      })
    }
  }, [])
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])
  
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])
  
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        markAsRead,
        unreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Notification Toast Component
export const NotificationToast: React.FC<{
  notification: Notification
  onClose: () => void
}> = ({ notification, onClose }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }
  
  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'info': return 'bg-blue-50 border-blue-200'
      default: return 'bg-white border-gray-200'
    }
  }
  
  return (
    <div className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border ${getBackgroundColor()}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
            {notification.message && (
              <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast Container Component
export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications()
  
  // Only show notifications with duration (toasts)
  const toastNotifications = notifications.filter(n => n.duration && n.duration > 0)
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {toastNotifications.slice(0, 5).map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// Notification Bell Component
export const NotificationBell: React.FC<{
  onClick: () => void
  className?: string
}> = ({ onClick, className = '' }) => {
  const { unreadCount } = useNotifications()
  
  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 ${className}`}
    >
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

// Notification Center Component
export const NotificationCenter: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const {
    notifications,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    unreadCount
  } = useNotifications()
  
  if (!isOpen) return null
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }
  
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="fixed top-16 right-4 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="ml-2 text-gray-300 hover:text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 h-2 w-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Alert-specific notification helpers
export const useAlertNotifications = () => {
  const { addNotification } = useNotifications()
  
  const notifyNewAlert = useCallback((alert: any) => {
    addNotification({
      type: alert.priority === 'critical' ? 'error' : 'warning',
      title: 'New Alert Detected',
      message: `${alert.title} in ${alert.aoi_name || 'AOI'}`,
      duration: 0 // Persistent notification
    })
  }, [addNotification])
  
  const notifyAlertResolved = useCallback((alert: any) => {
    addNotification({
      type: 'success',
      title: 'Alert Resolved',
      message: `${alert.title} has been marked as resolved`,
      duration: 5000
    })
  }, [addNotification])
  
  const notifyAnalysisComplete = useCallback((analysis: any) => {
    addNotification({
      type: 'success',
      title: 'Analysis Complete',
      message: `Analysis for ${analysis.aoi_name || 'AOI'} has finished processing`,
      duration: 0 // Persistent notification
    })
  }, [addNotification])
  
  const notifySystemStatus = useCallback((status: string, message: string) => {
    addNotification({
      type: status === 'healthy' ? 'success' : 'warning',
      title: 'System Status Update',
      message,
      duration: 5000
    })
  }, [addNotification])
  
  return {
    notifyNewAlert,
    notifyAlertResolved,
    notifyAnalysisComplete,
    notifySystemStatus
  }
}

// Real-time notification hook for WebSocket/polling
export const useRealTimeNotifications = () => {
  const { notifyNewAlert, notifyAnalysisComplete } = useAlertNotifications()
  
  useEffect(() => {
    // This would integrate with your WebSocket or polling system
    // For now, we'll just set up the structure
    
    const handleNewAlert = (alert: any) => {
      notifyNewAlert(alert)
    }
    
    const handleAnalysisComplete = (analysis: any) => {
      notifyAnalysisComplete(analysis)
    }
    
    // Example: Subscribe to events
    // eventBus.on('alert:new', handleNewAlert)
    // eventBus.on('analysis:complete', handleAnalysisComplete)
    
    return () => {
      // Cleanup subscriptions
      // eventBus.off('alert:new', handleNewAlert)
      // eventBus.off('analysis:complete', handleAnalysisComplete)
    }
  }, [notifyNewAlert, notifyAnalysisComplete])
}