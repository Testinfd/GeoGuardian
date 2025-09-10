/**
 * AOI Polygon Component
 * Displays and manages AOI polygons on Sentinel satellite imagery with interactive features
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  MapPin, Calendar, BarChart3, AlertTriangle,
  Eye, Edit3, Trash2, Play, ExternalLink,
  Check, X, Clock, Activity
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import type { AOI, GeoJSONPolygon, AnalysisResult } from '@/types'

interface AOIPolygonProps {
  aoi: AOI
  isSelected?: boolean
  isHighlighted?: boolean
  showPopup?: boolean
  showTooltip?: boolean
  interactive?: boolean
  recentAnalysis?: AnalysisResult | null
  onSelect?: (aoi: AOI) => void
  onEdit?: (aoi: AOI) => void
  onDelete?: (aoi: AOI) => void
  onAnalyze?: (aoi: AOI) => void
  onViewDetails?: (aoi: AOI) => void
  className?: string
  // Sentinel-specific props
  mapBounds?: { north: number; south: number; east: number; west: number }
  mapWidth?: number
  mapHeight?: number
}

const AOIPolygon: React.FC<AOIPolygonProps> = ({
  aoi,
  isSelected = false,
  isHighlighted = false,
  showPopup = true,
  showTooltip = true,
  interactive = true,
  recentAnalysis,
  onSelect,
  onEdit,
  onDelete,
  onAnalyze,
  onViewDetails,
  className = '',
  mapBounds,
  mapWidth = 800,
  mapHeight = 600
}) => {
  const [area, setArea] = useState<number>(0)
  const [isHovered, setIsHovered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Convert GeoJSON coordinates to screen coordinates for Sentinel overlay
  const getScreenCoordinates = useCallback((geojson: GeoJSONPolygon): [number, number][] => {
    if (!mapBounds) return []

    try {
      const coords = geojson.coordinates[0]
      const bounds = mapBounds
      const width = mapWidth
      const height = mapHeight

      return coords.map(coord => {
        const [lng, lat] = coord
        const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * width
        const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * height
        return [x, y] as [number, number]
      })
    } catch (error) {
      console.error('Error converting coordinates:', error)
      return []
    }
  }, [mapBounds, mapWidth, mapHeight])

  // Calculate polygon area using geodesic calculation
  const calculateArea = useCallback((coordinates: [number, number][]): number => {
    if (!coordinates || coordinates.length < 3) return 0

    try {
      // Simple polygon area calculation using shoelace formula
      // For more accurate geodesic calculation, would need a dedicated library
      let area = 0
      for (let i = 0; i < coordinates.length; i++) {
        const j = (i + 1) % coordinates.length
        area += coordinates[i][0] * coordinates[j][1]
        area -= coordinates[j][0] * coordinates[i][1]
      }
      area = Math.abs(area) / 2

      // Convert to square meters (rough approximation)
      // This is a simplified calculation - in production you'd use a proper geospatial library
      const bounds = mapBounds!
      const latRange = Math.abs(bounds.north - bounds.south) || 1
      const lngRange = Math.abs(bounds.east - bounds.west) || 1

      const metersPerPixelLat = (latRange * 111000) / mapHeight // Rough conversion
      const metersPerPixelLng = (lngRange * 111000 * Math.cos(bounds.north * Math.PI / 180)) / mapWidth

      const avgMetersPerPixel = (metersPerPixelLat + metersPerPixelLng) / 2
      return area * avgMetersPerPixel * avgMetersPerPixel
    } catch (error) {
      console.error('Error calculating area:', error)
      return 0
    }
  }, [mapBounds, mapWidth, mapHeight])

  // Get polygon style based on state for SVG rendering
  const getPolygonStyle = useCallback(() => {
    const baseStyle = {
      strokeWidth: 2,
      strokeOpacity: 0.8,
      fillOpacity: 0.2,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const
    }

    if (isSelected) {
      return {
        ...baseStyle,
        stroke: '#3b82f6',
        fill: '#3b82f6',
        strokeWidth: 3,
        fillOpacity: 0.3
      }
    }

    if (isHighlighted || isHovered) {
      return {
        ...baseStyle,
        stroke: '#10b981',
        fill: '#10b981',
        strokeWidth: 3,
        fillOpacity: 0.25
      }
    }

    // Default style based on recent analysis status
    if (recentAnalysis) {
      switch (recentAnalysis.status) {
        case 'completed':
          return {
            ...baseStyle,
            stroke: recentAnalysis.results?.change_detected ? '#ef4444' : '#10b981',
            fill: recentAnalysis.results?.change_detected ? '#ef4444' : '#10b981'
          }
        case 'running':
          return {
            ...baseStyle,
            stroke: '#f59e0b',
            fill: '#f59e0b'
          }
        case 'failed':
          return {
            ...baseStyle,
            stroke: '#6b7280',
            fill: '#6b7280'
          }
        default:
          return {
            ...baseStyle,
            stroke: '#8b5cf6',
            fill: '#8b5cf6'
          }
      }
    }

    return {
      ...baseStyle,
      stroke: '#8b5cf6',
      fill: '#8b5cf6'
    }
  }, [isSelected, isHighlighted, isHovered, recentAnalysis])

  // Format area for display
  const formatArea = (areaM2: number): string => {
    const areaKm2 = areaM2 / 1000000
    if (areaKm2 < 1) {
      return `${(areaM2 / 10000).toFixed(2)} ha`
    }
    return `${areaKm2.toFixed(2)} km²`
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get status info for recent analysis
  const getAnalysisStatusInfo = () => {
    if (!recentAnalysis) return null

    const statusConfig = {
      queued: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', text: 'Queued' },
      running: { icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Running' },
      completed: { 
        icon: recentAnalysis.results?.change_detected ? AlertTriangle : Check, 
        color: recentAnalysis.results?.change_detected ? 'text-red-600' : 'text-green-600',
        bg: recentAnalysis.results?.change_detected ? 'bg-red-100' : 'bg-green-100',
        text: recentAnalysis.results?.change_detected ? 'Change Detected' : 'No Change'
      },
      failed: { icon: X, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Failed' },
      cancelled: { icon: X, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Cancelled' }
    }

    return statusConfig[recentAnalysis.status]
  }

  // Calculate area when component mounts or AOI changes
  useEffect(() => {
    const coords = getScreenCoordinates(aoi.geojson)
    const calculatedArea = calculateArea(coords)
    setArea(calculatedArea)
  }, [aoi.geojson, getScreenCoordinates, calculateArea])

  // Event handlers
  const handleClick = () => {
    if (interactive && onSelect) {
      onSelect(aoi)
    }
  }

  const handleMouseOver = () => {
    setIsHovered(true)
  }

  const handleMouseOut = () => {
    setIsHovered(false)
  }

  const screenCoords = getScreenCoordinates(aoi.geojson)
  const statusInfo = getAnalysisStatusInfo()
  const polygonStyle = getPolygonStyle()

  if (!screenCoords.length || !mapBounds) {
    return null
  }

  // Create SVG path from coordinates
  const pathData = screenCoords.reduce((path, [x, y], index) => {
    return path + (index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`) + (index === screenCoords.length - 1 ? ' Z' : '')
  }, '')

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* SVG Overlay for Polygon */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ width: mapWidth, height: mapHeight }}
      >
        <defs>
          <filter id={`glow-${aoi.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <path
          d={pathData}
          stroke={polygonStyle.stroke}
          strokeWidth={polygonStyle.strokeWidth}
          strokeOpacity={polygonStyle.strokeOpacity}
          fill={polygonStyle.fill}
          fillOpacity={polygonStyle.fillOpacity}
          strokeLinecap={polygonStyle.strokeLinecap}
          strokeLinejoin={polygonStyle.strokeLinejoin}
          filter={isSelected ? `url(#glow-${aoi.id})` : undefined}
          onClick={handleClick}
          onMouseEnter={handleMouseOver}
          onMouseLeave={handleMouseOut}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        />
      </svg>

      {/* Tooltip Overlay */}
      {showTooltip && isHovered && (
        <div
          className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 pointer-events-auto"
          style={{
            left: screenCoords[0]?.[0] || 0,
            top: (screenCoords[0]?.[1] || 0) - 60,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-sm">
            <div className="font-semibold">{aoi.name}</div>
            <div className="text-gray-600">{formatArea(area)}</div>
            {statusInfo && (
              <div className={`flex items-center mt-1 ${statusInfo.color}`}>
                <statusInfo.icon className="w-3 h-3 mr-1" />
                <span className="text-xs">{statusInfo.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Modal/Popup */}
      {showPopup && showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 pointer-events-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl">{aoi.name}</h3>
                  {aoi.description && (
                    <p className="text-sm text-gray-600 mt-1">{aoi.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Area Info */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{formatArea(area)}</div>
                  <div className="text-xs text-gray-500">Area</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {aoi.analysis_count || 0}
                  </div>
                  <div className="text-xs text-gray-500">Analyses</div>
                </div>
              </div>

              {/* Recent Analysis Status */}
              {recentAnalysis && statusInfo && (
                <div className="mb-4 p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Latest Analysis</span>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                      <statusInfo.icon className="w-3 h-3 mr-1" />
                      {statusInfo.text}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    <div>Type: {recentAnalysis.analysis_type.replace('_', ' ')}</div>
                    <div>Started: {formatDate(recentAnalysis.created_at)}</div>
                    {recentAnalysis.results?.confidence_score && (
                      <div>Confidence: {Math.round(recentAnalysis.results.confidence_score * 100)}%</div>
                    )}
                  </div>

                  {recentAnalysis.status === 'running' && recentAnalysis.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{recentAnalysis.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${recentAnalysis.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {aoi.tags && aoi.tags.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {aoi.tags.map((tag, index) => (
                      <Badge key={index} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Creation Date */}
              <div className="text-xs text-gray-500 mb-4 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Created {formatDate(aoi.created_at)}
              </div>

              {/* Action Buttons */}
              {interactive && (
                <div className="flex flex-wrap gap-2">
                  {onViewDetails && (
                    <Button variant="primary" size="sm" onClick={() => onViewDetails(aoi)}>
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                  )}

                  {onAnalyze && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAnalyze(aoi)}
                      disabled={recentAnalysis?.status === 'running'}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Analyze
                    </Button>
                  )}

                  {onEdit && (
                    <Button variant="ghost" size="sm" onClick={() => onEdit(aoi)}>
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}

                  {onDelete && (
                    <Button variant="ghost" size="sm" onClick={() => onDelete(aoi)}>
                      <Trash2 className="w-3 h-3 mr-1 text-red-500" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click handler for showing details */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          if (interactive) {
            if (onSelect) onSelect(aoi)
            if (showPopup) setShowDetails(true)
          }
        }}
        style={{
          clipPath: `polygon(${screenCoords.map(([x, y]) => `${x}px ${y}px`).join(', ')})`
        }}
      />
    </div>
  )
}

export default AOIPolygon