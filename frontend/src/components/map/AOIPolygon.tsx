/**
 * AOI Polygon Component
 * Displays and manages AOI polygons on the map with interactive features
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Polygon, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
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
  className = ''
}) => {
  const map = useMap()
  const [polygonRef, setPolygonRef] = useState<L.Polygon | null>(null)
  const [area, setArea] = useState<number>(0)
  const [isHovered, setIsHovered] = useState(false)

  // Convert GeoJSON coordinates to Leaflet format
  const getLatLngs = useCallback((geojson: GeoJSONPolygon): [number, number][] => {
    try {
      return geojson.coordinates[0].map(coord => [coord[1], coord[0]] as [number, number])
    } catch (error) {
      console.error('Error converting coordinates:', error)
      return []
    }
  }, [])

  // Calculate polygon area
  const calculateArea = useCallback((latlngs: [number, number][]): number => {
    if (!latlngs.length || !L.GeometryUtil?.geodesicArea) return 0
    
    try {
      return L.GeometryUtil.geodesicArea(latlngs as any)
    } catch (error) {
      console.error('Error calculating area:', error)
      return 0
    }
  }, [])

  // Get polygon style based on state
  const getPolygonStyle = useCallback(() => {
    const baseStyle = {
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.2,
      lineCap: 'round' as const,
      lineJoin: 'round' as const
    }

    if (isSelected) {
      return {
        ...baseStyle,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        weight: 3,
        fillOpacity: 0.3
      }
    }

    if (isHighlighted || isHovered) {
      return {
        ...baseStyle,
        color: '#10b981',
        fillColor: '#10b981',
        weight: 3,
        fillOpacity: 0.25
      }
    }

    // Default style based on recent analysis status
    if (recentAnalysis) {
      switch (recentAnalysis.status) {
        case 'completed':
          return {
            ...baseStyle,
            color: recentAnalysis.results?.change_detected ? '#ef4444' : '#10b981',
            fillColor: recentAnalysis.results?.change_detected ? '#ef4444' : '#10b981'
          }
        case 'running':
          return {
            ...baseStyle,
            color: '#f59e0b',
            fillColor: '#f59e0b'
          }
        case 'failed':
          return {
            ...baseStyle,
            color: '#6b7280',
            fillColor: '#6b7280'
          }
        default:
          return {
            ...baseStyle,
            color: '#8b5cf6',
            fillColor: '#8b5cf6'
          }
      }
    }

    return {
      ...baseStyle,
      color: '#8b5cf6',
      fillColor: '#8b5cf6'
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

  // Calculate area when polygon loads
  useEffect(() => {
    if (polygonRef) {
      const latlngs = getLatLngs(aoi.geojson)
      const calculatedArea = calculateArea(latlngs)
      setArea(calculatedArea)
    }
  }, [polygonRef, aoi.geojson, getLatLngs, calculateArea])

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

  const latlngs = getLatLngs(aoi.geojson)
  const statusInfo = getAnalysisStatusInfo()

  if (!latlngs.length) {
    return null
  }

  return (
    <Polygon
      ref={setPolygonRef}
      positions={latlngs}
      pathOptions={getPolygonStyle()}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut
      }}
      className={className}
    >
      {/* Tooltip */}
      {showTooltip && (
        <Tooltip direction="top" offset={[0, -10]} opacity={1}>
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
        </Tooltip>
      )}

      {/* Detailed Popup */}
      {showPopup && (
        <Popup maxWidth={400} minWidth={300} closeButton={true}>
          <div className="p-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{aoi.name}</h3>
                {aoi.description && (
                  <p className="text-sm text-gray-600 mt-1">{aoi.description}</p>
                )}
              </div>
              {aoi.is_public && (
                <Badge variant="default" size="sm">
                  Public
                </Badge>
              )}
            </div>

            {/* Area Info */}
            <div className="grid grid-cols-2 gap-4 mb-3 p-2 bg-gray-50 rounded">
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
              <div className="mb-3 p-2 border rounded">
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
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Tags</div>
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
            <div className="text-xs text-gray-500 mb-3 flex items-center">
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
        </Popup>
      )}
    </Polygon>
  )
}

export default AOIPolygon