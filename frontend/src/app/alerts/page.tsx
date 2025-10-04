/**
 * Alerts Dashboard Page
 * Main alerts management interface with filtering, search, and verification
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Bell, AlertTriangle, CheckCircle, XCircle, Eye, MoreVertical } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/AuthProvider'
import { useAlertStore } from '@/stores/alerts'
import { useAOIStore } from '@/stores/aoi'
import { FusionBadge, CategoryBadge } from '@/components/alerts'
import type { Alert, AlertPriority, AlertStatus } from '@/types'
import { ALERT_PRIORITY, ALERT_STATUS } from '@/utils/constants'

const AlertsPage: React.FC = () => {
  const {
    alerts,
    unreadCount,
    filters,
    isLoading,
    error,
    fetchAlerts,
    setFilters,
    selectAlert,
    getFilteredAlerts,
    searchAlerts,
    getAlertStats,
    bulkAcknowledge,
    bulkDismiss,
    clearError
  } = useAlertStore()
  
  const { aois } = useAOIStore()
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  
  // Initialize data
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])
  
  // Get filtered and searched alerts
  const filteredAlerts = searchQuery ? searchAlerts(searchQuery) : getFilteredAlerts()
  const alertStats = getAlertStats()
  
  // Handle alert selection
  const handleAlertSelect = useCallback((alert: Alert) => {
    setSelectedAlert(alert)
    selectAlert(alert)
  }, [selectAlert])
  
  // Handle bulk operations
  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) return
    
    try {
      await bulkAcknowledge(selectedAlerts)
      setSelectedAlerts([])
    } catch (error) {
      console.error('Failed to acknowledge alerts:', error)
    }
  }
  
  const handleBulkDismiss = async () => {
    if (selectedAlerts.length === 0) return
    
    try {
      await bulkDismiss(selectedAlerts)
      setSelectedAlerts([])
    } catch (error) {
      console.error('Failed to dismiss alerts:', error)
    }
  }
  
  // Handle filter changes
  const handleFilterChange = (filterType: string, value: any) => {
    setFilters({ [filterType]: value })
  }
  
  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
  
  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50'
      case 'acknowledged': return 'text-yellow-600 bg-yellow-50'
      case 'resolved': return 'text-green-600 bg-green-50'
      case 'dismissed': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-primary-600" />
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">Alerts Dashboard</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount} unread alerts • {alertStats.total} total
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Bulk Actions */}
              {selectedAlerts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkAcknowledge}
                    className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Acknowledge ({selectedAlerts.length})
                  </button>
                  <button
                    onClick={handleBulkDismiss}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Dismiss ({selectedAlerts.length})
                  </button>
                </div>
              )}
              
              {/* View Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alertStats.byPriority.critical}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{alertStats.unread}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{alertStats.byStatus.resolved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {Math.round(alertStats.averageConfidence)}%
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(alertStats.averageConfidence)}%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
          
          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={filters.priority?.[0] || ''}
                    onChange={(e) => handleFilterChange('priority', e.target.value ? [e.target.value] : [])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status?.[0] || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : [])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    onChange={(e) => {
                      const value = e.target.value
                      if (value) {
                        const endDate = new Date()
                        const startDate = new Date()
                        
                        switch (value) {
                          case '7d':
                            startDate.setDate(startDate.getDate() - 7)
                            break
                          case '30d':
                            startDate.setDate(startDate.getDate() - 30)
                            break
                          case '90d':
                            startDate.setDate(startDate.getDate() - 90)
                            break
                          default:
                            return
                        }
                        
                        handleFilterChange('dateRange', {
                          start: startDate.toISOString(),
                          end: endDate.toISOString()
                        })
                      } else {
                        handleFilterChange('dateRange', null)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={clearError}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Alerts List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'No alerts match your search criteria.' : 'No alerts have been detected yet.'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                viewMode={viewMode}
                isSelected={selectedAlerts.includes(alert.id)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedAlerts([...selectedAlerts, alert.id])
                  } else {
                    setSelectedAlerts(selectedAlerts.filter(id => id !== alert.id))
                  }
                }}
                onClick={() => handleAlertSelect(alert)}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
      </div>
      
        {/* Alert Details Modal */}
        {selectedAlert && (
          <AlertDetailsModal
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

// Alert Card Component
interface AlertCardProps {
  alert: Alert
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onClick: () => void
  getPriorityColor: (priority: AlertPriority) => string
  getStatusColor: (status: AlertStatus) => string
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  viewMode,
  isSelected,
  onSelect,
  onClick,
  getPriorityColor,
  getStatusColor
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900 cursor-pointer hover:text-primary-600" onClick={onClick}>
                  {alert.title}
                </h3>
                
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(alert.priority)}`}>
                  {alert.priority}
                </span>
                
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                  {alert.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Confidence: {Math.round(alert.confidence_score)}%</span>
                <span>Area: {alert.affected_area_km2.toFixed(2)} km²</span>
                <span>{formatDate(alert.detection_date)}</span>
              </div>
              
              {/* Fusion Analysis Badges */}
              {alert.fusion_analysis && alert.fusion_analysis.change_detected && (
                <div className="flex items-center gap-2 mt-3">
                  <CategoryBadge category={alert.fusion_analysis.category} size="sm" />
                  <FusionBadge 
                    riskLevel={alert.fusion_analysis.risk_level}
                    riskScore={alert.fusion_analysis.composite_risk_score}
                  />
                </div>
              )}
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded">
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Alert Image/Thumbnail */}
      {alert.visualizations?.thumbnail && (
        <div className="h-48 bg-gray-200">
          <img
            src={alert.visualizations.thumbnail}
            alt={alert.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={onClick}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(alert.priority)}`}>
              {alert.priority}
            </span>
          </div>
          
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
            {alert.status}
          </span>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2 cursor-pointer hover:text-primary-600" onClick={onClick}>
          {alert.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{alert.description}</p>
        
        {/* Fusion Analysis Badges */}
        {alert.fusion_analysis && alert.fusion_analysis.change_detected && (
          <div className="flex flex-col gap-2 mb-3">
            <CategoryBadge category={alert.fusion_analysis.category} size="sm" />
            <FusionBadge 
              riskLevel={alert.fusion_analysis.risk_level}
              riskScore={alert.fusion_analysis.composite_risk_score}
            />
          </div>
        )}
        
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Confidence:</span>
            <span className="font-medium">{Math.round(alert.confidence_score)}%</span>
          </div>
          
          <div className="flex justify-between">
            <span>Affected Area:</span>
            <span className="font-medium">{alert.affected_area_km2.toFixed(2)} km²</span>
          </div>
          
          <div className="flex justify-between">
            <span>Detected:</span>
            <span className="font-medium">{formatDate(alert.detection_date)}</span>
          </div>
          
          {alert.verification_votes && (
            <div className="flex justify-between">
              <span>Verification:</span>
              <span className="font-medium">
                {alert.verification_votes.agree}👍 {alert.verification_votes.disagree}👎
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Alert Details Modal (placeholder - will create separate component)
const AlertDetailsModal: React.FC<{ alert: Alert; onClose: () => void }> = ({ alert, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{alert.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <XCircle className="h-6 w-6 text-gray-400" />
            </button>
          </div>
          
          <div className="text-center py-8">
            <p className="text-gray-600">Alert details component will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertsPage