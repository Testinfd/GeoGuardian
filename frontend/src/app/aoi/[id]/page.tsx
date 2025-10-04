/**
 * AOI Details Page
 * Displays detailed information about a specific Area of Interest
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useUser } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/AuthProvider'
import { 
  ArrowLeft, 
  Edit,
  Trash2,
  Play,
  BarChart3,
  Calendar,
  MapPin,
  Activity,
  AlertTriangle,
  Eye,
  Share,
  Download,
  Settings,
  TrendingUp,
  Clock
} from 'lucide-react'
import { Navigation } from '@/components/layout'
import { Button, Card, Loading, Badge, Alert, Modal } from '@/components/ui'
import { SentinelMap } from '@/components/map'
import { useAOIStore } from '@/stores/aoi'
import { useAnalysisStore } from '@/stores/analysis'
import { useAlertStore } from '@/stores/alerts'
import type { AOI, AnalysisResult, Alert as AlertType } from '@/types'

interface AOIStatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

function AOIStatsCard({ title, value, icon, trend, color = 'blue' }: AOIStatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

interface RecentAnalysisProps {
  analyses: AnalysisResult[]
  onViewAnalysis: (analysis: AnalysisResult) => void
}

function RecentAnalysis({ analyses, onViewAnalysis }: RecentAnalysisProps) {
  if (analyses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analyses Yet</h3>
        <p className="text-gray-600">Run your first analysis to monitor environmental changes.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {analyses.slice(0, 5).map((analysis) => (
        <Card key={analysis.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1" onClick={() => onViewAnalysis(analysis)}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">
                  {analysis.analysis_type.replace('_', ' ')} Analysis
                </h4>
                <Badge 
                  variant={
                    analysis.status === 'completed' ? 'success' :
                    analysis.status === 'failed' ? 'danger' :
                    analysis.status === 'running' ? 'warning' : 'default'
                  }
                  size="sm"
                >
                  {analysis.status}
                </Badge>
              </div>
              
              {analysis.results?.summary && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {analysis.results.summary}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(analysis.created_at).toLocaleDateString()}
                </div>
                {analysis.results?.confidence_score && (
                  <div className="flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {Math.round(analysis.results.confidence_score * 100)}% confidence
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-4">
              <Button variant="ghost" size="sm" onClick={() => onViewAnalysis(analysis)}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

interface RecentAlertsProps {
  alerts: AlertType[]
  onViewAlert: (alert: AlertType) => void
}

function RecentAlerts({ alerts, onViewAlert }: RecentAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts</h3>
        <p className="text-gray-600">No environmental changes detected yet.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.slice(0, 5).map((alert) => (
        <Card key={alert.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between" onClick={() => onViewAlert(alert)}>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{alert.title}</h4>
                <Badge 
                  variant={
                    alert.priority === 'critical' ? 'danger' :
                    alert.priority === 'high' ? 'warning' :
                    'default'
                  }
                  size="sm"
                >
                  {alert.priority}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {alert.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(alert.detection_date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {Math.round(alert.confidence_score * 100)}% confidence
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default function AOIDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const isAuthenticated = !!useUser()
  const [isClient, setIsClient] = useState(false)

  // Mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const aoiId = params.id as string

  // Store state
  const { 
    getAOIById,
    refreshAOI,
    deleteAOI,
    selectAOI,
    selectedAOI,
    isLoading: aoiLoading 
  } = useAOIStore()

  const {
    fetchAnalysisResult,
    startAnalysis,
    isLoading: analysisLoading
  } = useAnalysisStore()

  const {
    fetchAlerts,
    alerts,
    isLoading: alertsLoading
  } = useAlertStore()

  // Local state
  const [aoi, setAOI] = useState<AOI | null>(null)
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([])
  const [aoiAlerts, setAOIAlerts] = useState<AlertType[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analyses' | 'alerts'>('overview')

  // Effects
  useEffect(() => {
    let isMounted = true
    
    if (isClient && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (aoiId && isMounted) {
      loadAOIData()
    }

    return () => {
      isMounted = false
    }
    // Only run once when page loads or aoiId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aoiId])

  const loadAOIData = async () => {
    try {
      // Get AOI details
      const aoiData = getAOIById(aoiId)
      if (aoiData) {
        setAOI(aoiData)
        selectAOI(aoiData)
      } else {
        // Try to refresh from API
        const refreshedAOI = await refreshAOI(aoiId)
        setAOI(refreshedAOI)
        selectAOI(refreshedAOI)
      }

      // Load alerts for this AOI
      await fetchAlerts(aoiId)
      const relevantAlerts = alerts.filter(alert => alert.aoi_id === aoiId)
      setAOIAlerts(relevantAlerts)

    } catch (error) {
      console.error('Failed to load AOI data:', error)
      router.push('/aoi')
    }
  }

  // Handlers
  const handleEdit = () => {
    router.push(`/aoi/${aoiId}/edit`)
  }

  const handleDelete = async () => {
    try {
      await deleteAOI(aoiId)
      router.push('/aoi')
    } catch (error) {
      console.error('Failed to delete AOI:', error)
    }
  }

  const handleStartAnalysis = async (analysisType: string) => {
    if (!aoi) return

    try {
      await startAnalysis({
        aoi_id: aoi.id,
        analysis_type: analysisType as any,
        geojson: aoi.geojson,
      })
      // Refresh analyses
      loadAOIData()
    } catch (error) {
      console.error('Failed to start analysis:', error)
    }
  }

  const handleViewAnalysis = (analysis: AnalysisResult) => {
    router.push(`/analysis/${analysis.id}`)
  }

  const handleViewAlert = (alert: AlertType) => {
    router.push(`/alerts/${alert.id}`)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `AOI: ${aoi?.name}`,
        text: `Check out this Area of Interest: ${aoi?.name}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      // Show toast notification
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (aoiLoading || !aoi) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'analyses', label: 'Analyses', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{aoi.name}</h1>
                <p className="mt-2 text-gray-600">
                  {aoi.description || 'Area of Interest details and monitoring results'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* AOI Meta Info */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Created {new Date(aoi.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Last updated {new Date(aoi.updated_at).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {aoi.is_public ? 'Public' : 'Private'}
            </div>
          </div>

          {/* Tags */}
          {aoi.tags && aoi.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {aoi.tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Area Location</h2>
              <SentinelMap
                height="400px"
                aois={[aoi]}
                selectedAOI={aoi}
                center={{
                  lat: aoi.geojson.coordinates[0][0][1],
                  lng: aoi.geojson.coordinates[0][0][0]
                }}
                zoom={12}
              />
            </Card>

            {/* Tabs */}
            <Card className="p-4">
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                          isActive
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
                  {aoi.description ? (
                    <p className="text-gray-600 mb-4">{aoi.description}</p>
                  ) : (
                    <p className="text-gray-400 mb-4 italic">No description provided.</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                      <dl className="text-sm">
                        <div className="flex justify-between py-1">
                          <dt className="text-gray-500">Created</dt>
                          <dd>{new Date(aoi.created_at).toLocaleDateString()}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-gray-500">Visibility</dt>
                          <dd>{aoi.is_public ? 'Public' : 'Private'}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-gray-500">Analyses</dt>
                          <dd>{aoi.analysis_count || 0}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analyses' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Analysis History</h3>
                    <Button onClick={() => handleStartAnalysis('comprehensive')}>
                      <Play className="w-4 h-4 mr-2" />
                      Run Analysis
                    </Button>
                  </div>
                  <RecentAnalysis analyses={analyses} onViewAnalysis={handleViewAnalysis} />
                </div>
              )}

              {activeTab === 'alerts' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
                  <RecentAlerts alerts={aoiAlerts} onViewAlert={handleViewAlert} />
                </div>
              )}
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="space-y-4">
                <AOIStatsCard
                  title="Total Analyses"
                  value={aoi.analysis_count || 0}
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="blue"
                />
                
                <AOIStatsCard
                  title="Active Alerts"
                  value={aoiAlerts.filter(a => a.status === 'active').length}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  color={aoiAlerts.some(a => a.status === 'active') ? 'red' : 'green'}
                />

                <AOIStatsCard
                  title="Last Analysis"
                  value={aoi.last_analysis ? new Date(aoi.last_analysis).toLocaleDateString() : 'Never'}
                  icon={<Clock className="w-5 h-5" />}
                  color="yellow"
                />
              </div>

              {/* Quick Actions */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleStartAnalysis('comprehensive')}
                    disabled={analysisLoading}
                  >
                    <Play className="w-4 h-4 mr-3" />
                    Run Comprehensive Analysis
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleStartAnalysis('vegetation')}
                    disabled={analysisLoading}
                  >
                    <Activity className="w-4 h-4 mr-3" />
                    Vegetation Analysis
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push(`/analysis?aoi=${aoiId}`)}
                  >
                    <BarChart3 className="w-4 h-4 mr-3" />
                    View All Analyses
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push(`/alerts?aoi=${aoiId}`)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-3" />
                    View All Alerts
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete AOI"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete "{aoi.name}"?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All associated analyses and alerts will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete AOI
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}