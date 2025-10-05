/**
 * Analysis Results Detail Page
 * Displays detailed analysis results with visualizations and progress tracking
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useUser } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/AuthProvider'
import { 
  ArrowLeft,
  Download,
  Share,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Calendar,
  MapPin,
  Cpu,
  Eye,
  RotateCcw,
  ExternalLink,
  Leaf,
  Droplets,
  Shield
} from 'lucide-react'
import { Button, Card, Badge, Loading, Alert, Progress } from '@/components/ui'
import { SentinelMap } from '@/components/map'
import { 
  SpectralIndicesPanel, 
  EnvironmentalHealthScore,
  SpatialMetricsDisplay,
  FusionResultsPanel,
  SatelliteMetadataPanel
} from '@/components/analysis'
import { useAnalysisStore } from '@/stores/analysis'
import { useAOIStore } from '@/stores/aoi'
import type { AnalysisResult } from '@/types'

interface AnalysisMetricProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

function AnalysisMetric({ label, value, icon, color = 'blue' }: AnalysisMetricProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <Card className="p-4">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  )
}

interface AlgorithmResultProps {
  name?: string
  detected?: boolean
  confidence?: number
  details?: Record<string, any>
}

function AlgorithmResult({ name, detected, confidence, details }: AlgorithmResultProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div 
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">{name || 'Unknown Algorithm'}</h3>
          <div className="flex items-center space-x-2">
            <Badge variant={detected ? 'warning' : 'success'} size="sm">
              {detected ? 'Change Detected' : 'No Change'}
            </Badge>
            <span className="text-xs text-gray-500">
              {expanded ? '▼' : '▶'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Confidence</span>
            <span className="font-medium">{Math.round((confidence || 0) * 100)}%</span>
          </div>
          <Progress value={(confidence || 0) * 100} className="h-2" />

          {expanded && details && Object.keys(details).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
              <div className="space-y-1">
                {Object.entries(details).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">
                      {typeof value === 'number' ? value.toFixed(3) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

interface VisualizationGalleryProps {
  visualizations: {
    before_image_url?: string
    after_image_url?: string
    difference_image_url?: string
    gif_url?: string
  }
}

function VisualizationGallery({ visualizations }: VisualizationGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const images = [
    { key: 'before_image_url', label: 'Before Image', url: visualizations.before_image_url, category: 'primary' },
    { key: 'after_image_url', label: 'After Image', url: visualizations.after_image_url, category: 'primary' },
    { key: 'difference_image_url', label: 'Change Map', url: visualizations.difference_image_url, category: 'primary' },
    { key: 'gif_url', label: 'Time-lapse', url: visualizations.gif_url, category: 'primary' },
    // Advanced visualizations from backend
    { key: 'ndvi', label: 'NDVI Heatmap', url: (visualizations as any).ndvi, category: 'spectral' },
    { key: 'ndwi', label: 'NDWI Heatmap', url: (visualizations as any).ndwi, category: 'spectral' },
    { key: 'ndbi', label: 'NDBI Heatmap', url: (visualizations as any).ndbi, category: 'spectral' },
    { key: 'rgb', label: 'RGB Composite', url: (visualizations as any).rgb, category: 'spectral' },
    { key: 'change_overlay', label: 'Change Overlay', url: (visualizations as any).change_overlay, category: 'advanced' },
    { key: 'ndvi_comparison', label: 'NDVI Comparison', url: (visualizations as any).ndvi_comparison, category: 'advanced' },
    { key: 'multi_spectral', label: 'Multi-spectral', url: (visualizations as any).multi_spectral, category: 'advanced' },
  ].filter(img => img.url && !imageErrors[img.key])

  const primaryImages = images.filter(img => img.category === 'primary')
  const spectralImages = images.filter(img => img.category === 'spectral')
  const advancedImages = images.filter(img => img.category === 'advanced')

  const handleImageError = (key: string) => {
    setImageErrors(prev => ({ ...prev, [key]: true }))
  }

  if (images.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">No Visualizations Available</h3>
        <p className="text-gray-600">Visualizations are being generated or may not be available yet.</p>
      </Card>
    )
  }

  const renderImageGrid = (imageList: typeof images, title?: string) => {
    if (imageList.length === 0) return null
    
    return (
      <div className="space-y-3">
        {title && <h4 className="text-sm font-semibold text-gray-700">{title}</h4>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {imageList.map((image) => (
            <div
              key={image.key}
              className="relative cursor-pointer group"
              onClick={() => setSelectedImage(image.url!)}
            >
              <img
                src={image.url}
                alt={image.label}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:border-blue-500 transition-colors"
                onError={() => handleImageError(image.key)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-gray-700 mt-2 text-center">{image.label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderImageGrid(primaryImages, primaryImages.length > 0 ? 'Primary Visualizations' : undefined)}
      {renderImageGrid(spectralImages, spectralImages.length > 0 ? 'Spectral Index Heatmaps' : undefined)}
      {renderImageGrid(advancedImages, advancedImages.length > 0 ? 'Advanced Analysis' : undefined)}

      {/* Modal for full-size image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={selectedImage}
              alt="Full size visualization"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisResultPage() {
  const router = useRouter()
  const params = useParams()
  const isAuthenticated = !!useUser()
  const [isClient, setIsClient] = useState(false)

  // Mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const analysisId = params.id as string

  // Store state
  const { 
    getAnalysisById,
    fetchAnalysisResult,
    cancelAnalysis,
    retryAnalysis,
    pollAnalysisProgress,
    stopPolling,
    isLoading,
    error 
  } = useAnalysisStore()

  const { getAOIById } = useAOIStore()

  // Local state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    if (isClient && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (analysisId && isMounted) {
      loadAnalysis()
    }

    return () => {
      isMounted = false
      // Stop polling when component unmounts
      if (analysisId) {
        stopPolling(analysisId)
      }
    }
    // Only run once when page loads or analysisId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId])

  const loadAnalysis = async () => {
    try {
      // Try to get from store first
      let analysisData = getAnalysisById(analysisId)
      
      if (!analysisData) {
        // Fetch from API if not in store
        analysisData = await fetchAnalysisResult(analysisId)
      }
      
      setAnalysis(analysisData)

      // Start polling if analysis is still running
      if (analysisData.status === 'queued' || analysisData.status === 'running') {
        pollAnalysisProgress(analysisId)
      }
    } catch (error) {
      console.error('Failed to load analysis:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const updatedAnalysis = await fetchAnalysisResult(analysisId)
      setAnalysis(updatedAnalysis)
    } catch (error) {
      console.error('Failed to refresh analysis:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleCancel = async () => {
    if (!analysis) return
    
    try {
      await cancelAnalysis(analysis.id)
      await loadAnalysis()
    } catch (error) {
      console.error('Failed to cancel analysis:', error)
    }
  }

  const handleRetry = async () => {
    if (!analysis) return
    
    try {
      const newAnalysis = await retryAnalysis(analysis.id)
      router.push(`/analysis/${newAnalysis.id}`)
    } catch (error) {
      console.error('Failed to retry analysis:', error)
    }
  }

  const handleDownload = () => {
    // Implement download functionality
    console.log('Download analysis results')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Analysis Results: ${analysis?.analysis_type}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading || !analysis) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    )
  }

  const aoi = getAOIById(analysis.aoi_id)
  
  const statusConfig: Record<string, { icon: any, color: string, bg: string, badge: 'default' | 'warning' | 'success' | 'danger' }> = {
    queued: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', badge: 'default' as const },
    running: { icon: Cpu, color: 'text-yellow-600', bg: 'bg-yellow-100', badge: 'warning' as const },
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', badge: 'success' as const },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', badge: 'danger' as const },
    cancelled: { icon: Pause, color: 'text-gray-600', bg: 'bg-gray-100', badge: 'default' as const },
    insufficient_data: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', badge: 'warning' as const },
  }

  // Safely get config with fallback to 'queued' if status is not recognized
  const config = statusConfig[analysis.status] || statusConfig.queued
  const StatusIcon = config.icon

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-3xl font-bold text-gray-900 capitalize">
                  {analysis.analysis_type ? analysis.analysis_type.replace(/_/g, ' ') : 'Comprehensive'} Analysis
                </h1>
                <p className="mt-2 text-gray-600">
                  {aoi?.name || 'Unknown AOI'} • Created {new Date(analysis.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RotateCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              {analysis.status === 'completed' && (
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>

          {/* Status and Progress */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${config.bg} ${config.color} mr-3`}>
                <StatusIcon className="w-5 h-5" />
              </div>
              <div>
                <Badge variant={config.badge} size="sm" className="mb-1">
                  {analysis.status}
                </Badge>
                {analysis.status === 'running' && analysis.progress !== undefined && (
                  <div className="flex items-center space-x-2">
                    <Progress value={analysis.progress} className="w-32 h-2" />
                    <span className="text-sm text-gray-600">{analysis.progress}%</span>
                  </div>
                )}
              </div>
            </div>

            {analysis.status === 'running' && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <Pause className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}

            {['failed', 'insufficient_data'].includes(analysis.status) && (
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <Play className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {analysis.status === 'failed' && analysis.error_message && (
          <Alert variant="danger" className="mb-6">
            <AlertTriangle className="w-4 h-4" />
            <div>
              <h4 className="font-medium">Analysis Failed</h4>
              <p className="text-sm mt-1">{analysis.error_message}</p>
            </div>
          </Alert>
        )}

        {/* Insufficient Data Warning */}
        {analysis.status === 'insufficient_data' && (
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="w-4 h-4" />
            <div>
              <h4 className="font-medium">Insufficient Satellite Data</h4>
              <p className="text-sm mt-1">
                Not enough recent satellite imagery is available for this area within the selected timeframe.
                {analysis.results?.processing_metadata?.error && ` ${analysis.results.processing_metadata.error}`}
              </p>
              <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm font-medium text-yellow-900 mb-2">What you can try:</p>
                <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                  <li>Wait a few days for new satellite passes over this area</li>
                  <li>Try again with a longer time range (60-90 days)</li>
                  <li>Check if the area has persistent cloud coverage</li>
                  <li>Try a different location with better satellite coverage</li>
                  {analysis.results?.processing_metadata?.helpful_tips?.map((tip: string, idx: number) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={handleRetry}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/aoi')}>
                  Try Different Location
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {/* Content based on status */}
        {analysis.status === 'completed' && analysis.results ? (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h2>
              <p className="text-gray-700 mb-4">{analysis.results.summary || 'Analysis completed successfully.'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <AnalysisMetric
                  label="Overall Confidence"
                  value={`${Math.round(((analysis.results.overall_confidence || analysis.results.confidence_score) || 0) * 100)}%`}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color={analysis.results.change_detected ? 'red' : 'green'}
                />
                <AnalysisMetric
                  label="Change Detected"
                  value={analysis.results.change_detected ? 'Yes' : 'No'}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  color={analysis.results.change_detected ? 'yellow' : 'green'}
                />
                <AnalysisMetric
                  label="Processing Time"
                  value={analysis.processing_time ? `${Math.round(analysis.processing_time)}s` : 'N/A'}
                  icon={<Clock className="w-5 h-5" />}
                />
                <AnalysisMetric
                  label="Completed"
                  value={analysis.completed_at ? new Date(analysis.completed_at).toLocaleTimeString() : 'N/A'}
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="green"
                />
              </div>
            </Card>

            {/* Environmental Health Score */}
            {(analysis.results.environmental_health || (analysis.results.indices || analysis.results.spectral_indices)) && (
              <EnvironmentalHealthScore 
                healthScore={analysis.results.environmental_health}
                indices={analysis.results.indices || analysis.results.spectral_indices}
              />
            )}

            {/* Multi-Sensor Fusion Analysis */}
            {analysis.results.fusion_analysis && (
              <FusionResultsPanel fusion={analysis.results.fusion_analysis} />
            )}

            {/* Satellite Metadata */}
            {analysis.results.satellite_metadata && (
              <SatelliteMetadataPanel metadata={analysis.results.satellite_metadata} />
            )}

            {/* Spectral Indices */}
            {(analysis.results.indices || analysis.results.spectral_indices) && (
              <SpectralIndicesPanel 
                indices={(analysis.results.indices || analysis.results.spectral_indices)!} 
              />
            )}

            {/* Spatial Metrics */}
            {analysis.results.spatial_metrics && (
              <SpatialMetricsDisplay metrics={analysis.results.spatial_metrics} />
            )}

            {/* Algorithm Results */}
            {analysis.results.detections && analysis.results.detections.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Algorithm Detection Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.results.detections.map((detection, index) => (
                    <AlgorithmResult
                      key={index}
                      name={detection.algorithm}
                      detected={detection.detected || detection.change_detected}
                      confidence={detection.confidence}
                      details={
                        detection.spatial_metrics || detection.details 
                          ? { 
                              ...(detection.spatial_metrics || {}),
                              ...(detection.details ? { content: detection.details } : {}),
                              ...(detection.change_type ? { change_type: detection.change_type } : {}),
                              ...(detection.severity ? { severity: detection.severity } : {}),
                              ...(detection.change_percentage !== undefined ? { change_percentage: `${detection.change_percentage.toFixed(2)}%` } : {})
                            }
                          : {}
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Visualizations */}
            {analysis.results.visualizations && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Visual Evidence</h2>
                <VisualizationGallery visualizations={{
                  before_image_url: analysis.results.visualizations.before_image,
                  after_image_url: analysis.results.visualizations.after_image,
                  difference_image_url: analysis.results.visualizations.change_map,
                  gif_url: analysis.results.visualizations.gif_visualization
                }} />
              </div>
            )}

            {/* Statistics */}
            {analysis.results.statistics && Object.keys(analysis.results.statistics).length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistical Analysis</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analysis.results.statistics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {typeof value === 'number' ? value.toFixed(3) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* In Progress or Failed State */
          <Card className="p-6 text-center">
            <div className={`w-16 h-16 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <StatusIcon className={`w-8 h-8 ${config.color}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">
              Analysis {analysis.status}
            </h2>
            <p className="text-gray-600 mb-6">
              {analysis.status === 'queued' && 'Your analysis is queued and will start processing soon.'}
              {analysis.status === 'running' && 'Analysis is currently processing. This may take several minutes.'}
              {analysis.status === 'failed' && 'Analysis failed. Please check the error message above and try again.'}
              {analysis.status === 'cancelled' && 'Analysis was cancelled before completion.'}
              {analysis.status === 'insufficient_data' && 'Satellite data is limited for this area and timeframe. We searched for imagery within a 30-90 day window but found insufficient data for analysis. Please see suggestions above.'}
            </p>
            
            {analysis.status === 'running' && (
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{analysis.progress || 0}%</span>
                </div>
                <Progress value={analysis.progress || 0} className="h-3" />
              </div>
            )}
          </Card>
        )}

        {/* AOI Map */}
        {aoi && (
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Area</h2>
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
        )}
      </main>
    </div>
  )
}