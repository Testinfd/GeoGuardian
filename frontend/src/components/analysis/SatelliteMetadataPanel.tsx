/**
 * Satellite Metadata Panel
 * Displays satellite image quality, cloud coverage, and band information
 */

'use client'

import React from 'react'
import { Card, Badge } from '@/components/ui'
import { Satellite, Cloud, Calendar, Layers, CheckCircle, AlertTriangle } from 'lucide-react'
import type { SatelliteImageMetadata } from '@/types'

interface SatelliteMetadataPanelProps {
  metadata: {
    recent_image?: SatelliteImageMetadata
    baseline_image?: SatelliteImageMetadata
    time_separation_days?: number
  }
  className?: string
}

function ImageMetadataCard({ 
  image, 
  label, 
  color 
}: { 
  image: SatelliteImageMetadata
  label: string
  color: string
}) {
  const getQualityBadge = (score: number): { variant: 'success' | 'warning' | 'danger'; label: string } => {
    if (score >= 0.7) return { variant: 'success', label: 'High Quality' }
    if (score >= 0.4) return { variant: 'warning', label: 'Medium Quality' }
    return { variant: 'danger', label: 'Low Quality' }
  }

  const qualityBadge = getQualityBadge(image.quality_score)

  const getCloudCoverageStatus = (coverage: number): { 
    icon: React.ReactNode
    color: string
    label: string
  } => {
    if (coverage < 0.1) return { 
      icon: <CheckCircle className="w-4 h-4" />, 
      color: 'text-green-600', 
      label: 'Clear' 
    }
    if (coverage < 0.3) return { 
      icon: <Cloud className="w-4 h-4" />, 
      color: 'text-blue-600', 
      label: 'Partly Cloudy' 
    }
    if (coverage < 0.6) return { 
      icon: <Cloud className="w-4 h-4" />, 
      color: 'text-yellow-600', 
      label: 'Cloudy' 
    }
    return { 
      icon: <AlertTriangle className="w-4 h-4" />, 
      color: 'text-red-600', 
      label: 'Very Cloudy' 
    }
  }

  const cloudStatus = getCloudCoverageStatus(image.cloud_coverage)

  return (
    <div className={`p-4 rounded-lg border-2 ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{label}</h4>
        <Badge variant={qualityBadge.variant} size="sm">
          {qualityBadge.label}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Timestamp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Captured</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {new Date(image.timestamp).toLocaleDateString()}
          </span>
        </div>

        {/* Quality Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>Quality</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {(image.quality_score * 100).toFixed(1)}%
          </span>
        </div>

        {/* Cloud Coverage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Cloud className="w-4 h-4 mr-2" />
            <span>Cloud Cover</span>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-medium mr-2 ${cloudStatus.color}`}>
              {(image.cloud_coverage * 100).toFixed(1)}%
            </span>
            <span className={cloudStatus.color}>
              {cloudStatus.icon}
            </span>
          </div>
        </div>

        {/* Resolution */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Layers className="w-4 h-4 mr-2" />
            <span>Resolution</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {image.resolution}m
          </span>
        </div>

        {/* Spectral Bands */}
        <div className="pt-3 border-t border-gray-200">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Spectral Bands</h5>
          <div className="flex flex-wrap gap-1">
            {image.bands.slice(0, 6).map((band) => (
              <Badge key={band} variant="outline" size="sm">
                {band}
              </Badge>
            ))}
            {image.bands.length > 6 && (
              <Badge variant="outline" size="sm">
                +{image.bands.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SatelliteMetadataPanel({ metadata, className = '' }: SatelliteMetadataPanelProps) {
  if (!metadata || (!metadata.recent_image && !metadata.baseline_image)) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Satellite className="w-5 h-5 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Satellite Data Quality</h3>
          </div>
          {metadata.time_separation_days !== undefined && (
            <Badge variant="default">
              {metadata.time_separation_days} days apart
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Image */}
          {metadata.recent_image && (
            <ImageMetadataCard 
              image={metadata.recent_image} 
              label="Recent Image" 
              color="border-blue-200 bg-blue-50"
            />
          )}

          {/* Baseline Image */}
          {metadata.baseline_image && (
            <ImageMetadataCard 
              image={metadata.baseline_image} 
              label="Baseline Image" 
              color="border-gray-200 bg-gray-50"
            />
          )}
        </div>

        {/* Data Quality Warnings */}
        {(metadata.recent_image || metadata.baseline_image) && (
          <div className="mt-4">
            {(metadata.recent_image && metadata.recent_image.cloud_coverage > 0.3) || 
             (metadata.baseline_image && metadata.baseline_image.cloud_coverage > 0.3) ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-900">High Cloud Coverage Detected</h4>
                    <p className="text-xs text-yellow-800 mt-1">
                      Cloud coverage above 30% may affect analysis accuracy. Results should be interpreted with caution.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-900">Good Data Quality</h4>
                    <p className="text-xs text-green-800 mt-1">
                      Low cloud coverage provides reliable analysis conditions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Information Box */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">About Satellite Data</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Sentinel-2 satellites provide 10-60m resolution imagery</li>
            <li>• 13 spectral bands capture visible, near-infrared, and shortwave infrared light</li>
            <li>• Quality score considers cloud coverage, atmospheric conditions, and sensor calibration</li>
            <li>• Best results achieved with cloud coverage below 30%</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

