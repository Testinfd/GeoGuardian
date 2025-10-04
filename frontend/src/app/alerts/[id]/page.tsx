/**
 * Alert Details Page
 * Detailed view of individual alerts with verification and actions
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, AlertTriangle, MapPin, Calendar, TrendingUp, Eye, 
  ThumbsUp, ThumbsDown, MessageSquare, Download, Share2, 
  CheckCircle, XCircle, Clock, ExternalLink
} from 'lucide-react'
import { useAlertStore } from '@/stores/alerts'
import { useAOIStore } from '@/stores/aoi'
import { FusionDetails } from '@/components/alerts'
import type { Alert, VoteType } from '@/types'

interface AlertDetailsPageProps {
  params: Promise<{ id: string }>
}

const AlertDetailsPage: React.FC<AlertDetailsPageProps> = ({ params }) => {
  const [alertId, setAlertId] = useState<string | null>(null)
  const router = useRouter()
  const {
    selectedAlert,
    fetchAlert,
    verifyAlert,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    isLoading,
    error,
    clearError
  } = useAlertStore()
  
  const { getAOIById } = useAOIStore()
  
  const [userVote, setUserVote] = useState<VoteType | null>(null)
  const [comment, setComment] = useState('')
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  
  // Resolve params and fetch alert data
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setAlertId(resolvedParams.id)
      if (resolvedParams.id) {
        fetchAlert(resolvedParams.id)
      }
    }
    resolveParams()
  }, [params, fetchAlert])
  
  // Set user vote from alert data
  useEffect(() => {
    if (selectedAlert?.verification_votes?.user_vote) {
      setUserVote(selectedAlert.verification_votes.user_vote)
    }
  }, [selectedAlert])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Alert</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError()
              router.push('/alerts')
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Alerts
          </button>
        </div>
      </div>
    )
  }
  
  if (!selectedAlert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Alert Not Found</h2>
          <p className="text-gray-600 mb-4">The alert you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/alerts')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Alerts
          </button>
        </div>
      </div>
    )
  }
  
  const alert = selectedAlert
  const associatedAOI = getAOIById(alert.aoi_id)
  
  // Handle verification vote
  const handleVote = async (vote: VoteType) => {
    if (userVote === vote) return // Already voted this way
    
    try {
      await verifyAlert({
        alert_id: alert.id,
        vote,
        comment: comment.trim() || undefined
      })
      
      setUserVote(vote)
      setComment('')
      setShowCommentBox(false)
    } catch (error) {
      console.error('Failed to submit vote:', error)
    }
  }
  
  // Handle alert actions
  const handleAcknowledge = async () => {
    try {
      await acknowledgeAlert(alert.id)
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }
  
  const handleResolve = async () => {
    try {
      await resolveAlert(alert.id)
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }
  
  const handleDismiss = async () => {
    try {
      await dismissAlert(alert.id)
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50'
      case 'acknowledged': return 'text-yellow-600 bg-yellow-50'
      case 'resolved': return 'text-green-600 bg-green-50'
      case 'dismissed': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Prepare visualization images
  const visualizations = alert.visualizations
  const images = [
    visualizations?.before_image ? { url: visualizations.before_image, label: 'Before' } : null,
    visualizations?.after_image ? { url: visualizations.after_image, label: 'After' } : null,
    visualizations?.change_map ? { url: visualizations.change_map, label: 'Change Map' } : null,
    visualizations?.thumbnail ? { url: visualizations.thumbnail, label: 'Thumbnail' } : null
  ].filter((item): item is { url: string; label: string } => item !== null)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/alerts')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Alerts
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
              
              <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Alert Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(alert.priority)}`}>
                      {alert.priority.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{alert.title}</h1>
                  <p className="text-lg text-gray-600">{alert.description}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {Math.round(alert.confidence_score)}%
                  </div>
                  <div className="text-sm text-gray-500">Confidence</div>
                </div>
              </div>
              
              {/* Alert Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(alert.detection_date)}
                  </div>
                  <div className="text-xs text-gray-500">Detection Date</div>
                </div>
                
                <div className="text-center">
                  <TrendingUp className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {alert.affected_area_km2.toFixed(2)} km²
                  </div>
                  <div className="text-xs text-gray-500">Affected Area</div>
                </div>
                
                <div className="text-center">
                  <Eye className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {alert.change_type}
                  </div>
                  <div className="text-xs text-gray-500">Change Type</div>
                </div>
                
                <div className="text-center">
                  <MapPin className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">
                    {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                  </div>
                  <div className="text-xs text-gray-500">Coordinates</div>
                </div>
              </div>
            </div>
            
            {/* Visualizations */}
            {images.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Visual Evidence</h2>
                
                {/* Image Tabs */}
                <div className="flex space-x-1 mb-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        activeImageIndex === index
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {image.label}
                    </button>
                  ))}
                </div>
                
                {images[activeImageIndex] && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={images[activeImageIndex].url}
                      alt={images[activeImageIndex].label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Fusion Analysis Section */}
            {alert.fusion_analysis && alert.fusion_analysis.change_detected && (
              <FusionDetails fusionAnalysis={alert.fusion_analysis} />
            )}
            
            {/* Verification Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Verification</h2>
              
              {alert.verification_votes && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Community consensus:</span>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center text-green-600">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {alert.verification_votes.agree}
                      </span>
                      <span className="flex items-center text-red-600">
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {alert.verification_votes.disagree}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(alert.verification_votes.agree / (alert.verification_votes.agree + alert.verification_votes.disagree)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Voting Buttons */}
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => handleVote('agree')}
                  disabled={userVote === 'agree'}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                    userVote === 'agree'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Agree
                </button>
                
                <button
                  onClick={() => handleVote('disagree')}
                  disabled={userVote === 'disagree'}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                    userVote === 'disagree'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Disagree
                </button>
                
                <button
                  onClick={() => setShowCommentBox(!showCommentBox)}
                  className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </button>
              </div>
              
              {/* Comment Box */}
              {showCommentBox && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your verification comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => {
                        setComment('')
                        setShowCommentBox(false)
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleVote(userVote || 'agree')}
                      disabled={!comment.trim()}
                      className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Associated AOI */}
            {associatedAOI && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Associated AOI</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{associatedAOI.name}</div>
                    {associatedAOI.description && (
                      <div className="text-sm text-gray-600">{associatedAOI.description}</div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => router.push(`/aoi/${associatedAOI.id}`)}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View AOI Details
                  </button>
                </div>
              </div>
            )}
            
            {/* Alert Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {alert.status === 'active' && (
                  <button
                    onClick={handleAcknowledge}
                    className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Acknowledge
                  </button>
                )}
                
                {(alert.status === 'active' || alert.status === 'acknowledged') && (
                  <button
                    onClick={handleResolve}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </button>
                )}
                
                {alert.status !== 'dismissed' && (
                  <button
                    onClick={handleDismiss}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Dismiss Alert
                  </button>
                )}
              </div>
            </div>
            
            {/* Metadata */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Alert ID:</span>
                  <span className="font-mono text-gray-900">{alert.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Analysis ID:</span>
                  <span className="font-mono text-gray-900">{alert.analysis_id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{formatDate(alert.created_at)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span className="text-gray-900">{formatDate(alert.updated_at)}</span>
                </div>
                
                {alert.resolved_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved:</span>
                    <span className="text-gray-900">{formatDate(alert.resolved_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertDetailsPage