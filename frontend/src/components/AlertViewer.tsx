'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { aoiAPI } from '@/services/api'
import toast from 'react-hot-toast'
import HistoricalTrendsViewer from './HistoricalTrendsViewer'

interface AOI {
  id: string
  name: string
  geometry: any
  status: 'monitoring' | 'alert' | 'inactive'
  lastAlert?: Date
}

type AlertType = 'algal_bloom' | 'trash_dump' | 'illegal_construction' | 'vegetation_loss' | 'vegetation_gain' | 'deforestation' | 'construction' | 'coastal_erosion' | 'coastal_accretion' | 'water_quality_change' | 'other'

interface Alert {
  id: string
  aoiId: string
  type: AlertType
  confidence: number
  gifUrl: string
  timestamp: Date
  verified?: 'agree' | 'dismiss'
  // Enhanced analysis fields
  overall_confidence?: number
  priority_level?: string
  algorithm_results?: any[]
  spectral_indices?: any
  analysis_type?: string
  algorithms_used?: string[]
  detections?: any[]
}

interface AlertViewerProps {
  selectedAOI: AOI
  onBack: () => void
}

const alertTypeLabels = {
  algal_bloom: 'Algal Bloom',
  trash_dump: 'Trash Dump',
  illegal_construction: 'Illegal Construction',
  vegetation_loss: 'Vegetation Loss',
  vegetation_gain: 'Vegetation Gain',
  deforestation: 'Deforestation',
  construction: 'Construction Activity',
  coastal_erosion: 'Coastal Erosion',
  coastal_accretion: 'Coastal Accretion',
  water_quality_change: 'Water Quality Change',
  other: 'Other Anomaly',
}

const alertTypeColors = {
  algal_bloom: 'text-green-700 bg-green-100',
  trash_dump: 'text-orange-700 bg-orange-100',
  illegal_construction: 'text-red-700 bg-red-100',
  vegetation_loss: 'text-red-700 bg-red-100',
  vegetation_gain: 'text-green-700 bg-green-100',
  deforestation: 'text-red-700 bg-red-100',
  construction: 'text-orange-700 bg-orange-100',
  coastal_erosion: 'text-blue-700 bg-blue-100',
  coastal_accretion: 'text-blue-700 bg-blue-100',
  water_quality_change: 'text-purple-700 bg-purple-100',
  other: 'text-gray-700 bg-gray-100',
}

const alertTypeEmojis = {
  algal_bloom: '🌊',
  trash_dump: '🗑️',
  illegal_construction: '🏗️',
  vegetation_loss: '🌳❌',
  vegetation_gain: '🌳✅',
  deforestation: '🌲🔥',
  construction: '🏗️',
  coastal_erosion: '🏖️📉',
  coastal_accretion: '🏖️📈',
  water_quality_change: '💧⚠️',
  other: '⚠️',
}

export default function AlertViewer({ selectedAOI, onBack }: AlertViewerProps) {
  const [verifyingAlert, setVerifyingAlert] = useState<string | null>(null)
  const [showHistoricalTrends, setShowHistoricalTrends] = useState(false)

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['alerts', selectedAOI.id],
    queryFn: async () => {
      const response = await aoiAPI.getAlerts(selectedAOI.id)
      return response.data
    },
    enabled: !!selectedAOI,
  })

  const handleVerifyAlert = async (alertId: string, verification: 'agree' | 'dismiss') => {
    setVerifyingAlert(alertId)
    try {
      await aoiAPI.verifyAlert(alertId, verification)
      toast.success(verification === 'agree' ? 'Alert confirmed' : 'Alert dismissed')
      refetch()
    } catch (error) {
      console.error('Error verifying alert:', error)
      toast.error('Failed to verify alert')
    } finally {
      setVerifyingAlert(null)
    }
  }

  const latestAlert = alerts[0]

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 truncate">{selectedAOI.name}</h2>
            <p className="text-sm text-gray-600">
              {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} found
            </p>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
          selectedAOI.status === 'alert' ? 'bg-red-100 text-red-700' :
          selectedAOI.status === 'monitoring' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            selectedAOI.status === 'alert' ? 'bg-red-500' :
            selectedAOI.status === 'monitoring' ? 'bg-blue-500 animate-pulse' :
            'bg-gray-400'
          }`}></div>
          <span>
            {selectedAOI.status === 'alert' ? 'Alert Status' :
             selectedAOI.status === 'monitoring' ? 'Monitoring Active' :
             'Inactive'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading alerts...</p>
            </div>
          </div>
        ) : !latestAlert ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear</h3>
            <p className="text-gray-600 mb-4">
              No environmental anomalies detected in this area. Our AI is continuously monitoring for changes.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-700">
                <strong>🛰️ Monitoring:</strong> We check this area every few days using Sentinel-2 satellite imagery with 10-meter resolution.
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Latest Alert */}
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              {latestAlert.gifUrl && (
                <img
                  src={latestAlert.gifUrl}
                  alt="Environmental change detection"
                  className="w-full h-48 object-cover"
                />
              )}
            </div>

            {/* Alert Details */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${(alertTypeColors as any)[latestAlert.type] || alertTypeColors.other}`}>
                    <span>{(alertTypeEmojis as any)[latestAlert.type] || alertTypeEmojis.other}</span>
                    <span>{(alertTypeLabels as any)[latestAlert.type] || alertTypeLabels.other}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(latestAlert.timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Confidence Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {latestAlert.overall_confidence ? 'Overall AI Confidence:' : 'AI Confidence:'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((latestAlert.overall_confidence || latestAlert.confidence) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(latestAlert.overall_confidence || latestAlert.confidence) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-2 rounded-full ${
                        (latestAlert.overall_confidence || latestAlert.confidence) >= 0.8 ? 'bg-red-500' :
                        (latestAlert.overall_confidence || latestAlert.confidence) >= 0.6 ? 'bg-orange-500' :
                        'bg-yellow-500'
                      }`}
                    />
                  </div>
                  {/* Show priority level if available */}
                  {latestAlert.priority_level && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Priority Level:</span>
                      <span className={`font-semibold px-2 py-1 rounded text-xs ${
                        latestAlert.priority_level === 'high' ? 'bg-red-100 text-red-700' :
                        latestAlert.priority_level === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {latestAlert.priority_level.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Enhanced Analysis Details */}
                {(latestAlert.algorithms_used || latestAlert.analysis_type || latestAlert.detections) && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900">Analysis Details</h4>

                    {/* Analysis Type */}
                    {latestAlert.analysis_type && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Analysis Type:</span>
                        <span className="font-medium text-gray-900 capitalize">{latestAlert.analysis_type}</span>
                      </div>
                    )}

                    {/* Algorithms Used */}
                    {latestAlert.algorithms_used && latestAlert.algorithms_used.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">Algorithms Used:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {latestAlert.algorithms_used.map((algorithm: string, index: number) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {algorithm}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detections Summary */}
                    {latestAlert.detections && latestAlert.detections.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">Detections Found:</span>
                        <div className="space-y-1 mt-1">
                          {latestAlert.detections.slice(0, 3).map((detection: any, index: number) => (
                            <div key={index} className="flex items-center justify-between bg-white rounded px-2 py-1">
                              <span className="text-gray-700 capitalize">
                                {detection.type?.replace('_', ' ') || detection.algorithm}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                detection.confidence >= 0.8 ? 'bg-red-100 text-red-700' :
                                detection.confidence >= 0.6 ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {Math.round(detection.confidence * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spectral Indices Preview */}
                    {latestAlert.spectral_indices && (
                      <div className="text-sm">
                        <span className="text-gray-600">Key Spectral Indices:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {Object.entries(latestAlert.spectral_indices).slice(0, 4).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-white rounded px-2 py-1 text-xs">
                              <span className="text-gray-600 uppercase">{key}:</span>
                              <span className="text-gray-900 ml-1">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Verification Section */}
              {!latestAlert.verified ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Help Us Improve</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Your verification helps train our AI to better detect environmental changes.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleVerifyAlert(latestAlert.id, 'agree')}
                      disabled={verifyingAlert === latestAlert.id}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2 transition-colors focus-ring"
                    >
                      {verifyingAlert === latestAlert.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Confirm</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleVerifyAlert(latestAlert.id, 'dismiss')}
                      disabled={verifyingAlert === latestAlert.id}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center space-x-2 transition-colors focus-ring"
                    >
                      {verifyingAlert === latestAlert.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Dismiss</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-lg p-4 ${
                  latestAlert.verified === 'agree' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <svg className={`w-5 h-5 ${
                      latestAlert.verified === 'agree' ? 'text-green-600' : 'text-gray-600'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                    <span className={`font-medium ${
                      latestAlert.verified === 'agree' ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      Alert {latestAlert.verified === 'agree' ? 'confirmed' : 'dismissed'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    latestAlert.verified === 'agree' ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    Thank you for your feedback!
                  </p>
                </div>
              )}
            </div>

            {/* Previous Alerts */}
            {alerts.length > 1 && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Previous Alerts</h4>
                <div className="space-y-3">
                  {alerts.slice(1, 4).map((alert: Alert, index: number) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{alertTypeEmojis[alert.type]}</span>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {alertTypeLabels[alert.type]}
                          </span>
                          <div className="text-xs text-gray-500">
                            {Math.round(alert.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleDateString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Historical Trends Section */}
        {!showHistoricalTrends ? (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowHistoricalTrends(true)}
              className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="font-semibold text-indigo-900 group-hover:text-indigo-700">
                    📈 View Historical Trends
                  </h4>
                  <p className="text-sm text-indigo-600 mt-1">
                    Analyze long-term environmental changes over 12 months
                  </p>
                </div>
                <svg className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        ) : (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <HistoricalTrendsViewer
              aoiId={selectedAOI.id}
              aoiName={selectedAOI.name}
              onClose={() => setShowHistoricalTrends(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
