/**
 * Spatial Metrics Display
 * Shows pixel counts, change percentages, and spatial analysis
 */

'use client'

import React from 'react'
import { Card, Badge, Progress } from '@/components/ui'
import { Map, Grid, Percent, TrendingUp, TrendingDown, Layers } from 'lucide-react'

interface SpatialMetricsProps {
  metrics: {
    total_pixels: number
    changed_pixels: number
    change_percentage?: number
    vegetation_loss_pixels?: number
    vegetation_gain_pixels?: number
    mean_ndvi_change?: number
    max_ndvi_change?: number
    [key: string]: any
  }
  className?: string
}

export default function SpatialMetricsDisplay({ metrics, className = '' }: SpatialMetricsProps) {
  if (!metrics) {
    return null
  }

  const changePercentage = metrics.change_percentage || 
    ((metrics.changed_pixels / metrics.total_pixels) * 100)

  // Determine severity based on change percentage
  const getSeverity = (percentage: number): {
    label: string
    color: string
    badgeVariant: 'success' | 'warning' | 'danger' | 'default'
  } => {
    if (percentage < 5) return { label: 'Minor', color: 'text-green-600', badgeVariant: 'success' }
    if (percentage < 15) return { label: 'Moderate', color: 'text-yellow-600', badgeVariant: 'warning' }
    if (percentage < 30) return { label: 'Significant', color: 'text-orange-600', badgeVariant: 'danger' }
    return { label: 'Major', color: 'text-red-600', badgeVariant: 'danger' }
  }

  const severity = getSeverity(changePercentage)

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Grid className="w-5 h-5 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Spatial Analysis</h3>
          </div>
          <Badge variant={severity.badgeVariant}>{severity.label} Change</Badge>
        </div>

        {/* Change Overview */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Area Changed</span>
            <span className="text-2xl font-bold text-gray-900">{changePercentage.toFixed(2)}%</span>
          </div>
          <Progress value={changePercentage} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatNumber(metrics.changed_pixels)} pixels changed</span>
            <span>{formatNumber(metrics.total_pixels)} total pixels</span>
          </div>
        </div>

        {/* Pixel Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Layers className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Total Pixels</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(metrics.total_pixels)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Analyzed area</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Map className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Changed Pixels</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(metrics.changed_pixels)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Detected changes</p>
          </div>
        </div>

        {/* Vegetation Change Details (if available) */}
        {(metrics.vegetation_loss_pixels !== undefined || metrics.vegetation_gain_pixels !== undefined) && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Vegetation Changes</h4>
            <div className="grid grid-cols-2 gap-4">
              {metrics.vegetation_loss_pixels !== undefined && (
                <div className="flex items-start">
                  <TrendingDown className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(metrics.vegetation_loss_pixels)}
                    </div>
                    <div className="text-xs text-gray-600">Vegetation Loss</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((metrics.vegetation_loss_pixels / metrics.total_pixels) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}

              {metrics.vegetation_gain_pixels !== undefined && (
                <div className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(metrics.vegetation_gain_pixels)}
                    </div>
                    <div className="text-xs text-gray-600">Vegetation Gain</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((metrics.vegetation_gain_pixels / metrics.total_pixels) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NDVI Change Details (if available) */}
        {(metrics.mean_ndvi_change !== undefined || metrics.max_ndvi_change !== undefined) && (
          <div className="pt-4 border-t border-gray-200 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">NDVI Change Analysis</h4>
            <div className="space-y-2">
              {metrics.mean_ndvi_change !== undefined && (
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Mean NDVI Change</span>
                  <span className={`text-sm font-medium ${metrics.mean_ndvi_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.mean_ndvi_change > 0 ? '+' : ''}{metrics.mean_ndvi_change.toFixed(3)}
                  </span>
                </div>
              )}

              {metrics.max_ndvi_change !== undefined && (
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Max NDVI Change</span>
                  <span className={`text-sm font-medium ${metrics.max_ndvi_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.max_ndvi_change > 0 ? '+' : ''}{metrics.max_ndvi_change.toFixed(3)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Metrics */}
        {Object.keys(metrics).filter(key => 
          !['total_pixels', 'changed_pixels', 'change_percentage', 'vegetation_loss_pixels', 
            'vegetation_gain_pixels', 'mean_ndvi_change', 'max_ndvi_change'].includes(key)
        ).length > 0 && (
          <div className="pt-4 border-t border-gray-200 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(metrics)
                .filter(([key]) => 
                  !['total_pixels', 'changed_pixels', 'change_percentage', 'vegetation_loss_pixels', 
                    'vegetation_gain_pixels', 'mean_ndvi_change', 'max_ndvi_change'].includes(key)
                )
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900">
                      {typeof value === 'number' ? value.toFixed(3) : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

