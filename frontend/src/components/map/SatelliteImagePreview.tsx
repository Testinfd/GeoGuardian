/**
 * Satellite Image Preview Component
 * Fetches and displays actual satellite imagery for AOIs
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, Loading, Badge } from '@/components/ui'
import { Satellite, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { GeoJSONPolygon } from '@/types'

interface SatelliteImagePreviewProps {
  geojson: GeoJSONPolygon
  aoiName?: string
  className?: string
  height?: string
  showMetadata?: boolean
}

interface PreviewData {
  success: boolean
  preview_url?: string
  metadata?: {
    timestamp: string
    cloud_coverage: number
    quality_score: number
    resolution: string
  }
  error?: string
  recommendation?: string
  fallback_available?: boolean
}

export default function SatelliteImagePreview({ 
  geojson, 
  aoiName, 
  className = '',
  height = '300px',
  showMetadata = true
}: SatelliteImagePreviewProps) {
  const [loading, setLoading] = useState(true)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [imageError, setImageError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    fetchSatellitePreview()
  }, [geojson, retryCount])

  const fetchSatellitePreview = async () => {
    setLoading(true)
    setImageError(false)

    try {
      const response = await apiClient.post<PreviewData>(
        '/api/v2/analysis/data-availability/preview',
        { geojson }
      )

      setPreviewData(response.data)
    } catch (error: any) {
      console.warn('Failed to fetch satellite preview:', error.message)
      setPreviewData({
        success: false,
        error: 'Satellite imagery temporarily unavailable',
        recommendation: 'Using fallback map view',
        fallback_available: true
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center" style={{ height }}>
          <Loading className="mb-4" />
          <p className="text-sm text-gray-600">Loading satellite imagery...</p>
          <p className="text-xs text-gray-500 mt-2">Fetching recent Sentinel-2 data</p>
        </div>
      </Card>
    )
  }

  // Fallback or error state
  if (!previewData?.success || !previewData?.preview_url || imageError) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center" style={{ height }}>
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Satellite Preview Unavailable</h3>
            <p className="text-sm text-gray-600 mb-4">
              {previewData?.error || 'Unable to load satellite imagery for this area'}
            </p>
            {previewData?.recommendation && (
              <p className="text-xs text-gray-500 mb-4">{previewData.recommendation}</p>
            )}
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </Card>
    )
  }

  // Success state with satellite image
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative" style={{ height }}>
        <img
          src={previewData.preview_url}
          alt={aoiName ? `Satellite imagery of ${aoiName}` : 'Satellite imagery'}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Overlay badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="default" className="bg-black bg-opacity-70 text-white">
            <Satellite className="w-3 h-3 mr-1" />
            Sentinel-2
          </Badge>
        </div>

        {/* Metadata overlay (optional) */}
        {showMetadata && previewData.metadata && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center space-x-3">
                <div>
                  <span className="opacity-75">Captured: </span>
                  <span className="font-medium">
                    {new Date(previewData.metadata.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="opacity-75">Quality: </span>
                  <span className="font-medium">
                    {Math.round(previewData.metadata.quality_score * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <span className="opacity-75">Cloud: </span>
                <span className={`font-medium ${
                  previewData.metadata.cloud_coverage < 0.3 ? 'text-green-400' : 
                  previewData.metadata.cloud_coverage < 0.6 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {Math.round(previewData.metadata.cloud_coverage * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-600">
            <ImageIcon className="w-3 h-3 mr-1" />
            <span>Recent satellite view</span>
          </div>
          <button
            onClick={handleRetry}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </button>
        </div>
      </div>
    </Card>
  )
}

