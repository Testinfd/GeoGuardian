/**
 * SystemStatus Component
 * Displays real-time system health and capabilities
 */

'use client'

import React, { useEffect, useState } from 'react'
import { 
  Server, 
  Database, 
  Satellite, 
  Cpu, 
  Mail,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  RefreshCw,
  Info
} from 'lucide-react'
import { Button, Card, Badge, Loading, Alert } from '@/components/ui'
import { useAnalysisStore } from '@/stores/analysis'
import type { SystemStatus, SystemCapabilities } from '@/types'

interface ServiceStatusProps {
  name: string
  status: 'up' | 'down' | 'degraded'
  icon: React.ReactNode
  description?: string
}

function ServiceStatus({ name, status, icon, description }: ServiceStatusProps) {
  const statusConfig = {
    up: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      badge: 'success' as const,
      icon: <CheckCircle className="w-4 h-4" />
    },
    degraded: {
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-100',
      badge: 'warning' as const,
      icon: <AlertTriangle className="w-4 h-4" />
    },
    down: {
      color: 'text-red-600',
      bgColor: 'bg-red-100', 
      badge: 'danger' as const,
      icon: <XCircle className="w-4 h-4" />
    }
  }

  const config = statusConfig[status]

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${config.bgColor} ${config.color} mr-3`}>
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{name}</h3>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={config.badge} size="sm" className="flex items-center">
            {config.icon}
            <span className="ml-1 capitalize">{status}</span>
          </Badge>
        </div>
      </div>
    </Card>
  )
}

interface SystemStatsProps {
  stats: {
    uptime: number
    activeAnalyses: number
    queueSize: number
    version: string
  }
}

function SystemStats({ stats }: SystemStatsProps) {
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 text-center">
        <div className="p-2 bg-blue-100 rounded-lg inline-block mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-sm font-medium text-gray-600">Uptime</p>
        <p className="text-lg font-bold text-gray-900">{formatUptime(stats.uptime)}</p>
      </Card>

      <Card className="p-4 text-center">
        <div className="p-2 bg-green-100 rounded-lg inline-block mb-2">
          <Activity className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-600">Active Analyses</p>
        <p className="text-lg font-bold text-gray-900">{stats.activeAnalyses}</p>
      </Card>

      <Card className="p-4 text-center">
        <div className="p-2 bg-yellow-100 rounded-lg inline-block mb-2">
          <BarChart3 className="w-5 h-5 text-yellow-600" />
        </div>
        <p className="text-sm font-medium text-gray-600">Queue Size</p>
        <p className="text-lg font-bold text-gray-900">{stats.queueSize}</p>
      </Card>

      <Card className="p-4 text-center">
        <div className="p-2 bg-purple-100 rounded-lg inline-block mb-2">
          <Server className="w-5 h-5 text-purple-600" />
        </div>
        <p className="text-sm font-medium text-gray-600">Version</p>
        <p className="text-lg font-bold text-gray-900">{stats.version}</p>
      </Card>
    </div>
  )
}

interface CapabilitiesDisplayProps {
  capabilities: SystemCapabilities
}

function CapabilitiesDisplay({ capabilities }: CapabilitiesDisplayProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Capabilities</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Available Algorithms</h4>
          <div className="flex flex-wrap gap-2">
            {capabilities.algorithms.map((algorithm) => (
              <Badge key={algorithm} variant="default" size="sm">
                {algorithm.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Analysis Types</h4>
          <div className="flex flex-wrap gap-2">
            {capabilities.analysis_types.map((type) => (
              <Badge key={type} variant="outline" size="sm">
                {type.replace('_', ' ').toLowerCase()}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Supported Satellites</h4>
          <div className="flex flex-wrap gap-2">
            {capabilities.supported_satellites.map((satellite) => (
              <Badge key={satellite} variant="secondary" size="sm">
                {satellite}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Spectral Indices</h4>
          <div className="text-sm text-gray-600">
            {capabilities.spectral_indices.length} indices available
            <div className="mt-1 flex flex-wrap gap-1">
              {capabilities.spectral_indices.slice(0, 5).map((index) => (
                <Badge key={index} variant="outline" size="sm" className="text-xs">
                  {index}
                </Badge>
              ))}
              {capabilities.spectral_indices.length > 5 && (
                <Badge variant="outline" size="sm" className="text-xs">
                  +{capabilities.spectral_indices.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Max AOI Size:</span>
            <span className="ml-2 text-gray-600">{capabilities.max_aoi_size_km2} km²</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Max Date Range:</span>
            <span className="ml-2 text-gray-600">{capabilities.max_date_range_days} days</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface SystemStatusProps {
  compact?: boolean
  showCapabilities?: boolean
  refreshInterval?: number
  className?: string
}

export default function SystemStatus({ 
  compact = false,
  showCapabilities = true,
  refreshInterval = 30000, // 30 seconds
  className = ''
}: SystemStatusProps) {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  const { 
    systemStatus,
    capabilities,
    fetchSystemStatus,
    fetchCapabilities,
    isLoading,
    error 
  } = useAnalysisStore()

  // Auto-refresh system status
  useEffect(() => {
    const refreshData = async () => {
      try {
        await fetchSystemStatus()
        if (showCapabilities && !capabilities) {
          await fetchCapabilities()
        }
        setLastRefresh(new Date())
      } catch (error) {
        console.error('Failed to refresh system status:', error)
      }
    }

    // Initial load
    refreshData()

    // Set up interval
    const interval = setInterval(refreshData, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchSystemStatus, fetchCapabilities, showCapabilities, capabilities, refreshInterval])

  const handleManualRefresh = async () => {
    try {
      await fetchSystemStatus()
      if (showCapabilities) {
        await fetchCapabilities()
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to refresh system status:', error)
    }
  }

  if (isLoading && !systemStatus) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loading />
      </div>
    )
  }

  if (error && !systemStatus) {
    return (
      <Alert variant="danger" className={className}>
        <AlertTriangle className="w-4 h-4" />
        <div>
          <h4 className="font-medium">Failed to Load System Status</h4>
          <p className="text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </Alert>
    )
  }

  if (!systemStatus) {
    return null
  }

  // Overall system health
  const isHealthy = systemStatus.status === 'healthy'
  const hasIssues = systemStatus.status === 'degraded'
  const isDown = systemStatus.status === 'down'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">System Status</h2>
          <p className="text-sm text-gray-600">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status Alert */}
      {hasIssues && (
        <Alert variant="warning">
          <AlertTriangle className="w-4 h-4" />
          <div>
            <h4 className="font-medium">System Degraded</h4>
            <p className="text-sm mt-1">
              Some services are experiencing issues. Analysis may be slower than usual.
            </p>
          </div>
        </Alert>
      )}

      {isDown && (
        <Alert variant="danger">
          <XCircle className="w-4 h-4" />
          <div>
            <h4 className="font-medium">System Down</h4>
            <p className="text-sm mt-1">
              Critical services are unavailable. Please try again later.
            </p>
          </div>
        </Alert>
      )}

      {/* Service Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Service Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ServiceStatus
            name="Database"
            status={systemStatus.services?.database || 'down'}
            icon={<Database className="w-5 h-5" />}
            description="AOI and analysis data storage"
          />
          <ServiceStatus
            name="Sentinel Hub"
            status={systemStatus.services?.sentinel_hub || 'down'}
            icon={<Satellite className="w-5 h-5" />}
            description="Satellite imagery provider"
          />
          <ServiceStatus
            name="Analysis Engine"
            status={systemStatus.services?.analysis_engine || 'down'}
            icon={<Cpu className="w-5 h-5" />}
            description="Environmental change detection"
          />
          <ServiceStatus
            name="Email Service"
            status={systemStatus.services?.email_service || 'down'}
            icon={<Mail className="w-5 h-5" />}
            description="Alert notifications"
          />
        </div>
      </div>

      {/* System Statistics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">System Statistics</h3>
        <SystemStats
          stats={{
            uptime: systemStatus.uptime || 0,
            activeAnalyses: systemStatus.active_analyses || 0,
            queueSize: systemStatus.queue_size || 0,
            version: systemStatus.version || 'Unknown'
          }}
        />
      </div>

      {/* System Capabilities */}
      {showCapabilities && capabilities && (
        <CapabilitiesDisplay capabilities={capabilities} />
      )}

      {/* Additional Info */}
      {!compact && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">System Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• System status is automatically updated every 30 seconds</li>
                <li>• Analysis queue is processed in order of submission</li>
                <li>• Service degradation may result in longer processing times</li>
                <li>• Critical alerts will be displayed when services are unavailable</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}