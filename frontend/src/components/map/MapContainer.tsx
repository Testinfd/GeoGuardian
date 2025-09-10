/**
 * MapContainer - Satellite Map component with Sentinel Hub integration
 * SSR-compatible alternative to Leaflet for satellite imagery display
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Loading } from '@/components/ui'
import type { AOI, GeoJSONPolygon, LatLng } from '@/types'
import { useAOIStore } from '@/stores/aoi'

interface MapProps {
  center?: LatLng
  zoom?: number
  height?: string
  aois?: AOI[]
  selectedAOI?: AOI | null
  drawingMode?: boolean
  onAOISelect?: (aoi: AOI) => void
  onMapClick?: (latlng: LatLng) => void
  onPolygonCreated?: (polygon: GeoJSONPolygon) => void
  onPolygonEdited?: (aoi: AOI, newGeometry: GeoJSONPolygon) => void
  className?: string
}

// Main Map Component - Now using SentinelMap
export default function Map({
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 10,
  height = '400px',
  aois = [],
  selectedAOI,
  drawingMode = false,
  onAOISelect,
  onMapClick,
  onPolygonCreated,
  onPolygonEdited,
  className = '',
}: MapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ height }}>
        <Loading />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Satellite Map Placeholder - Replace with SentinelMap component */}
      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Satellite Map Component</p>
          <p className="text-sm text-gray-500">Replace this with SentinelMap component</p>
          {aois.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {aois.length} AOI(s) to display
            </p>
          )}
        </div>
      </div>

      {/* Drawing mode indicator */}
      {drawingMode && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm z-[1000]">
          Drawing Mode Active
        </div>
      )}
    </div>
  )
}