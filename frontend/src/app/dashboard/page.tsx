/**
 * Dashboard Page
 * Main user dashboard after authentication
 */

'use client'

import { useUser } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Loading, Alert } from '@/components/ui'
import { AnalysisSelector } from '@/components/analysis'
import { useAOIStore } from '@/stores/aoi'
import { useAnalysisStore } from '@/stores/analysis'
import { useAlertStore } from '@/stores/alerts'
import { apiClient } from '@/lib/api-client'
import {
  BarChart3,
  Map,
  AlertTriangle,
  Plus,
  Activity,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  Settings,
  Users,
  Target,
  XCircle,
  RefreshCw,
  Database,
  Satellite,
  Cpu
} from 'lucide-react'
import { MapContainer } from '@/components/map'
import type { AOI, AnalysisResult, Alert as AlertType, SystemStatus as SystemStatusType } from '@/types'

// Compact System Status Widget for Dashboard
function SystemStatusWidget({ className = '' }: { className?: string }) {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { systemStatus, fetchSystemStatus, isLoading } = useAnalysisStore()

  useEffect(() => {
    const refreshData = async () => {
      try {
        await fetchSystemStatus()
        setLastRefresh(new Date())
      } catch (error) {
        console.error('Failed to refresh system status:', error)
      }
    }

    refreshData()
    const interval = setInterval(refreshData, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [fetchSystemStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-red-600 bg-red-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />
      case 'degraded': return <AlertTriangle className="w-4 h-4" />
      default: return <XCircle className="w-4 h-4" />
    }
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {/* Overall Status */}
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-full ${getStatusColor(systemStatus?.status || 'down')}`}>
          {getStatusIcon(systemStatus?.status || 'down')}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900 capitalize">
            {systemStatus?.status || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500">
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Service Indicators */}
        <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Database className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Database</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            systemStatus?.services?.database === 'up' ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Satellite className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Satellite</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            systemStatus?.services?.sentinel_hub === 'up' ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Cpu className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Analysis</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            systemStatus?.services?.analysis_engine === 'up' ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-600">Active</p>
          <p className="text-lg font-semibold text-gray-900">
            {systemStatus?.active_analyses || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Queue</p>
          <p className="text-lg font-semibold text-gray-900">
            {systemStatus?.queue_size || 0}
          </p>
        </div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const user = useUser()
  const router = useRouter()

  // State for dashboard data
  const [aoiStats, setAoiStats] = useState({ total: 0, withAnalysis: 0 })
  const [analysisStats, setAnalysisStats] = useState({ total: 0, running: 0 })
  const [alertStats, setAlertStats] = useState({ byStatus: { active: 0 } })
  const [recentAlerts, setRecentAlerts] = useState<AlertType[]>([])
  const [activeAnalyses, setActiveAnalyses] = useState<AnalysisResult[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatusType>({
    status: 'down',
    services: {
      database: 'down',
      sentinel_hub: 'down', 
      analysis_engine: 'down',
      email_service: 'down'
    },
    queue_size: 0,
    active_analyses: 0,
    last_check: new Date().toISOString(),
    version: '1.0.0',
    uptime: 0
  })
  const [aois, setAois] = useState<AOI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch dashboard data only once on mount
  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Fetch data in parallel with proper error handling and abort signal
        const [aoiResponse, analysisResponse, alertResponse, statusResponse] = await Promise.allSettled([
          apiClient.get('/api/v2/aoi').catch((error: any) => {
            console.error('AOI API error:', error)
            // Return empty array on error to prevent dashboard from breaking
            return { data: [] }
          }),
          apiClient.get('/api/v2/analysis/results').catch((error: any) => {
            console.error('Analysis API error:', error)
            // Return empty array on error to prevent dashboard from breaking
            return { data: [] }
          }),
          apiClient.get('/api/v2/alerts').catch((error: any) => {
            console.warn('Alerts API error (this is expected if no alerts exist):', error.message)
            // Don't throw error for alerts - just return empty array
            return { data: [] }
          }),
          apiClient.get('/api/v2/analysis/system/status').catch((error: any) => {
            console.error('System status API error:', error)
            // Return default status on error
            return {
              data: {
                status: 'degraded',
                services: {
                  database: 'unknown',
                  sentinel_hub: 'unknown',
                  analysis_engine: 'unknown',
                  email_service: 'unknown'
                },
                queue_size: 0,
                active_analyses: 0,
                last_check: new Date().toISOString(),
                version: '1.0.0',
                uptime: 0
              }
            }
          })
        ])

        // Check if component is still mounted before updating state
        if (!isMounted) return

        // Process AOI data
        if (aoiResponse.status === 'fulfilled') {
          try {
            const aoiData = Array.isArray(aoiResponse.value.data) ? aoiResponse.value.data : []
            setAois(aoiData)
            setAoiStats({
              total: aoiData.length,
              withAnalysis: aoiData.filter((aoi: any) => aoi.analysis_count > 0).length
            })
          } catch (error) {
            console.error('Error processing AOI data:', error)
            setAoiStats({ total: 0, withAnalysis: 0 })
          }
        } else {
          console.error('AOI fetch failed:', aoiResponse.reason)
          setAoiStats({ total: 0, withAnalysis: 0 })
        }

        // Process analysis data
        if (analysisResponse.status === 'fulfilled') {
          try {
            const analysisData = Array.isArray(analysisResponse.value.data) ? analysisResponse.value.data : []
            setActiveAnalyses(analysisData)
            setAnalysisStats({
              total: analysisData.length,
              running: analysisData.filter((analysis: any) => analysis.status === 'running').length
            })
          } catch (error) {
            console.error('Error processing analysis data:', error)
            setAnalysisStats({ total: 0, running: 0 })
          }
        } else {
          console.error('Analysis fetch failed:', analysisResponse.reason)
          setAnalysisStats({ total: 0, running: 0 })
        }

        // Process alerts data
        if (alertResponse.status === 'fulfilled') {
          try {
            const alertData = Array.isArray(alertResponse.value.data) ? alertResponse.value.data : []
            setRecentAlerts(alertData)
            setAlertStats({
              byStatus: {
                active: alertData.filter((alert: any) => alert.status === 'active').length
              }
            })
          } catch (error) {
            console.error('Error processing alerts data:', error)
            setAlertStats({ byStatus: { active: 0 } })
          }
        } else {
          console.error('Alerts fetch failed:', alertResponse.reason)
          setAlertStats({ byStatus: { active: 0 } })
        }

        // Process system status
        if (statusResponse.status === 'fulfilled') {
          try {
            const systemData = statusResponse.value.data
            if (systemData && typeof systemData === 'object') {
              setSystemStatus(systemData as SystemStatusType)
            } else {
              setSystemStatus({
                status: 'down' as const,
                services: { 
                  database: 'down' as const, 
                  sentinel_hub: 'down' as const, 
                  analysis_engine: 'down' as const, 
                  email_service: 'down' as const 
                },
                queue_size: 0,
                active_analyses: 0,
                last_check: new Date().toISOString(),
                version: '1.0.0',
                uptime: 0
              })
            }
          } catch (error) {
            console.error('Error processing system status:', error)
          }
        } else {
          console.error('System status fetch failed:', statusResponse.reason)
        }

      } catch (error) {
        if (!isMounted) return
        
        console.error('Failed to fetch dashboard data:', error)
        // Set default values to prevent undefined errors
        setAoiStats({ total: 0, withAnalysis: 0 })
        setAnalysisStats({ total: 0, running: 0 })
        setAlertStats({ byStatus: { active: 0 } })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    fetchDashboardData()
    
    // Cleanup function
    return () => {
      isMounted = false
      controller.abort()
    }
    // Only run once on mount - user dependency handled inside function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  

  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </div>
    )
  }
  
  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.full_name || user?.name || user?.email}!
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor environmental changes with real-time satellite analysis
              </p>
            </div>
            <Button
              className="flex items-center space-x-2 self-start sm:self-center"
              onClick={() => router.push('/aoi/create')}
            >
              <Plus className="w-4 h-4" />
              <span>Create AOI</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Map className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active AOIs</p>
                <p className="text-2xl font-bold text-gray-900">{aoiStats.total}</p>
                <p className="text-xs text-gray-500">{aoiStats.withAnalysis} with analysis</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{analysisStats.total}</p>
                <p className="text-xs text-gray-500">{analysisStats.running} running</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-500">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alertStats.byStatus.active || 0}</p>
                <p className="text-xs text-gray-500">{recentAlerts.length} recent</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus?.status === 'healthy' ? '100%' :
                   systemStatus?.status === 'degraded' ? '75%' : '0%'}
                </p>
                <p className="text-xs text-gray-500 capitalize">{systemStatus?.status || 'unknown'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions & Recent Activity */}
          <div className="xl:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/aoi/create')}
                  className="hidden sm:flex"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New AOI
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push('/aoi/create')}
                >
                  <Map className="w-4 h-4 mr-3" />
                  Create AOI
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push('/analysis/new')}
                >
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Start Analysis
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push('/aoi')}
                >
                  <Eye className="w-4 h-4 mr-3" />
                  View AOIs
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push('/alerts')}
                >
                  <AlertTriangle className="w-4 h-4 mr-3" />
                  View Alerts
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
                <Button variant="outline" size="sm" onClick={() => router.push('/analysis')}>
                  View All
                </Button>
              </div>

              {activeAnalyses.length > 0 ? (
                <div className="space-y-3">
                  {activeAnalyses.slice(0, 3).map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {analysis.analysis_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">Progress: {analysis.progress || 0}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 capitalize">{analysis.status}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(analysis.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No active analyses</p>
                  <p className="text-sm">Start your first analysis to see activity here</p>
                </div>
              )}
            </Card>
          </div>

          {/* System Status Sidebar */}
          <div className="xl:col-span-1 order-first xl:order-last">
            <SystemStatusWidget />
          </div>
        </div>

        {/* Section Divider */}
        <div className="border-t border-gray-200 pt-10"></div>

        {/* Map Overview & Recent Alerts */}
        <div className="space-y-6">
          {/* AOI Map Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Areas of Interest
              </h2>
              <Button variant="outline" size="sm" onClick={() => router.push('/aoi')}>
                <Map className="w-4 h-4 mr-2" />
                Manage AOIs
              </Button>
            </div>

            {aois.length > 0 ? (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  height="320px"
                  aois={aois}
                  center={{ lat: 20.5937, lng: 78.9629 }}
                  zoom={5}
                  className="w-full"
                  showControls={true}
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center max-w-sm">
                  <Map className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No AOIs Created</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Create your first Area of Interest to start monitoring environmental changes
                  </p>
                  <Button onClick={() => router.push('/aoi/create')} size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create AOI
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Recent Alerts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Alerts
              </h2>
              <Button variant="outline" size="sm" onClick={() => router.push('/alerts')}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>

            {recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-4 ${
                        alert.priority === 'critical' ? 'bg-red-100 text-red-600' :
                        alert.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">{alert.title}</p>
                        <p className="text-sm text-gray-600">
                          {alert.change_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {alert.priority}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(alert.detection_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear</h3>
                  <p className="text-sm text-gray-600">
                    No environmental changes detected in your monitored areas
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}