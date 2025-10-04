/**
 * Analysis List Page
 * Displays all analyses with filtering, search, and status tracking
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/AuthProvider'
import {
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  TrendingUp,
  Activity,
  RotateCcw,
  BarChart3
} from 'lucide-react'
import { Navigation } from '@/components/layout'
import { Button, Card, Input, Loading, Badge, Modal, Alert } from '@/components/ui'
import { useAnalysisStore } from '@/stores/analysis'
import { useAOIStore } from '@/stores/aoi'
import type { AnalysisResult, AnalysisStatus, AnalysisType } from '@/types'

interface AnalysisCardProps {
  analysis: AnalysisResult
  onView: (analysis: AnalysisResult) => void
  onCancel?: (analysis: AnalysisResult) => void
  onRetry?: (analysis: AnalysisResult) => void
  onDelete?: (analysis: AnalysisResult) => void
}

function AnalysisCard({ analysis, onView, onCancel, onRetry, onDelete }: AnalysisCardProps) {
  const { getAOIById } = useAOIStore()
  const aoi = getAOIById(analysis.aoi_id)

  const statusConfig = {
    queued: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', badge: 'default' as const },
    running: { icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-100', badge: 'warning' as const },
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', badge: 'success' as const },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', badge: 'danger' as const },
    cancelled: { icon: Pause, color: 'text-gray-600', bg: 'bg-gray-100', badge: 'default' as const },
  }

  const config = statusConfig[analysis.status]
  const StatusIcon = config.icon

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className={`p-2 rounded-lg ${config.bg} ${config.color} mr-3`}>
              <StatusIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 capitalize">
                {analysis.analysis_type.replace('_', ' ')} Analysis
              </h3>
              <p className="text-sm text-gray-600">{aoi?.name || 'Unknown AOI'}</p>
            </div>
          </div>

          {analysis.results?.summary && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {analysis.results.summary}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
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

          {analysis.status === 'running' && analysis.progress !== undefined && (
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{analysis.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysis.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1 ml-4">
          <Badge variant={config.badge} size="sm">
            {analysis.status}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onView(analysis)}>
            <Eye className="w-4 h-4" />
          </Button>
          
          {analysis.status === 'running' && onCancel && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(analysis)}>
              <Pause className="w-4 h-4" />
            </Button>
          )}
          
          {analysis.status === 'failed' && onRetry && (
            <Button variant="ghost" size="sm" onClick={() => onRetry(analysis)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          
          {onDelete && ['completed', 'failed', 'cancelled'].includes(analysis.status) && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(analysis)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {analysis.status === 'completed' && analysis.completed_at && (
            <>Completed {new Date(analysis.completed_at).toLocaleTimeString()}</>
          )}
          {analysis.status === 'running' && (
            <>Started {new Date(analysis.created_at).toLocaleTimeString()}</>
          )}
          {analysis.status === 'failed' && analysis.error_message && (
            <span className="text-red-500">Error occurred</span>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function AnalysisListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAuthenticated = !!useUser()
  const [isClient, setIsClient] = useState(false)

  // Mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // URL params
  const aoiFilter = searchParams.get('aoi')
  
  // Store state
  const { 
    results,
    activeAnalyses,
    getAnalysesByAOI,
    getAnalysisStats,
    cancelAnalysis,
    retryAnalysis,
    isLoading,
    error 
  } = useAnalysisStore()

  const { aois } = useAOIStore()
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AnalysisStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<AnalysisType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteConfirmAnalysis, setDeleteConfirmAnalysis] = useState<AnalysisResult | null>(null)

  // Derived state
  const allAnalyses = Object.values(results)
  const filteredAnalyses = React.useMemo(() => {
    let filtered = allAnalyses

    // Filter by AOI if specified in URL
    if (aoiFilter) {
      filtered = getAnalysesByAOI(aoiFilter)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(analysis => 
        analysis.analysis_type.toLowerCase().includes(query) ||
        analysis.results?.summary?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.analysis_type === typeFilter)
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [allAnalyses, aoiFilter, searchQuery, statusFilter, typeFilter, getAnalysesByAOI])

  const stats = getAnalysisStats()

  // Handlers
  const handleViewAnalysis = (analysis: AnalysisResult) => {
    router.push(`/analysis/${analysis.id}`)
  }

  const handleCancelAnalysis = async (analysis: AnalysisResult) => {
    try {
      await cancelAnalysis(analysis.id)
    } catch (error) {
      console.error('Failed to cancel analysis:', error)
    }
  }

  const handleRetryAnalysis = async (analysis: AnalysisResult) => {
    try {
      await retryAnalysis(analysis.id)
    } catch (error) {
      console.error('Failed to retry analysis:', error)
    }
  }

  const handleDeleteAnalysis = (analysis: AnalysisResult) => {
    setDeleteConfirmAnalysis(analysis)
  }

  const confirmDelete = async () => {
    if (deleteConfirmAnalysis) {
      // Implement delete logic here
      setDeleteConfirmAnalysis(null)
    }
  }

  const handleStartNewAnalysis = () => {
    router.push('/analysis/new')
  }

  // Redirect if not authenticated - only on client side
  if (isClient && !isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
              <p className="mt-2 text-gray-600">
                Monitor and track your environmental analysis progress
              </p>
            </div>
            <Button onClick={handleStartNewAnalysis} className="flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>New Analysis</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-xl font-bold text-gray-900">{stats.running}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-xl font-bold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.averageConfidence ? Math.round(stats.averageConfidence * 100) : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search analyses..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="comprehensive">Comprehensive</option>
              <option value="vegetation">Vegetation</option>
              <option value="water">Water Quality</option>
              <option value="urban">Urban Development</option>
              <option value="change_detection">Change Detection</option>
            </select>

            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : error ? (
          <Alert variant="danger">
            <AlertTriangle className="w-4 h-4" />
            <div>
              <h4 className="font-medium">Error Loading Analyses</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </Alert>
        ) : filteredAnalyses.length === 0 ? (
          <Card className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {allAnalyses.length === 0 ? 'No Analyses Yet' : 'No Analyses Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {allAnalyses.length === 0 
                ? 'Start your first analysis to monitor environmental changes.'
                : 'Try adjusting your search or filters to find what you\'re looking for.'
              }
            </p>
            {allAnalyses.length === 0 && (
              <Button onClick={handleStartNewAnalysis}>Start First Analysis</Button>
            )}
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }>
            {filteredAnalyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                onView={handleViewAnalysis}
                onCancel={handleCancelAnalysis}
                onRetry={handleRetryAnalysis}
                onDelete={handleDeleteAnalysis}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmAnalysis}
        onClose={() => setDeleteConfirmAnalysis(null)}
        title="Delete Analysis"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Analysis Result?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The analysis result and associated data will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setDeleteConfirmAnalysis(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Analysis
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}