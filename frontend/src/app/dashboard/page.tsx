/**
 * Dashboard Page
 * Main user dashboard after authentication
 */

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navigation } from '@/components/layout'
import { Button, Card, Loading, Alert } from '@/components/ui'
import { SystemStatus, AnalysisSelector } from '@/components/analysis'
import { useAOIStore } from '@/stores/aoi'
import { useAnalysisStore } from '@/stores/analysis'
import { useAlertStore } from '@/stores/alerts'
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
  Settings
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Store state
  const { 
    aois, 
    fetchAOIs, 
    isLoading: aoiLoading, 
    getAOIStats 
  } = useAOIStore()
  
  const { 
    getActiveAnalyses,
    getAnalysisStats,
    fetchSystemStatus,
    systemStatus
  } = useAnalysisStore()
  
  const { 
    alerts,
    fetchAlerts,
    getAlertStats,
    getRecentAlerts
  } = useAlertStore()
  
  useEffect(() => {
    if (session?.user && session?.accessToken) {
      console.log('Dashboard: Session found, fetching data...', { user: session.user.email, hasToken: !!session.accessToken })
      fetchAOIs()
      fetchAlerts()
      fetchSystemStatus()
    } else {
      console.log('Dashboard: No valid session, skipping data fetch', { session: !!session, user: !!session?.user, token: !!session?.accessToken })
    }
  }, [session, fetchAOIs, fetchAlerts, fetchSystemStatus])
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      </div>
    )
  }
  
  if (!session) {
    router.push('/auth/login')
    return null
  }
  
  const aoiStats = getAOIStats()
  const analysisStats = getAnalysisStats()
  const alertStats = getAlertStats()
  const activeAnalyses = getActiveAnalyses()
  const recentAlerts = getRecentAlerts(24)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {session.user?.name || session.user?.email}!
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor environmental changes with real-time satellite analysis
              </p>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create AOI</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
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

          <Card className="p-6">
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

          <Card className="p-6">
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

          <Card className="p-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
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
          <div className="lg:col-span-1">
            <SystemStatus compact={true} showCapabilities={false} className="h-fit" />
          </div>
        </div>

        {/* Map Overview & Recent Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AOI Map Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Areas of Interest
              </h2>
              <Button variant="outline" size="sm" onClick={() => router.push('/aoi')}>
                Manage AOIs
              </Button>
            </div>

            {aois.length > 0 ? (
              <div className="h-72 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-medium text-gray-900 mb-2">Map Loading...</h3>
                  <p className="text-sm text-gray-600">
                    Interactive map temporarily disabled due to SSR issues
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-medium text-gray-900 mb-2">No AOIs Created</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create your first Area of Interest to start monitoring
                  </p>
                  <Button onClick={() => router.push('/aoi/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create AOI
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Recent Alerts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Alerts
              </h2>
              <Button variant="outline" size="sm" onClick={() => router.push('/alerts')}>
                View All
              </Button>
            </div>
            
            {recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        alert.priority === 'critical' ? 'bg-red-100 text-red-600' :
                        alert.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{alert.title}</p>
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
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h3 className="font-medium text-gray-900 mb-2">No Alerts</h3>
                  <p className="text-sm text-gray-600">
                    No environmental changes detected in your areas
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}