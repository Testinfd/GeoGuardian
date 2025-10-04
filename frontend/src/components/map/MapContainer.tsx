/**
 * MapContainer - Satellite Map component with Sentinel Hub integration
 * SSR-compatible alternative to Leaflet for satellite imagery display
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Loading } from '@/components/ui'
import SentinelMap from './SentinelMap'
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
  showControls?: boolean
  className?: string
}

// Main Map Component - Now using SentinelMap
// Default center: India (geographic center including full J&K region)
export default function Map({
  center = { lat: 20.5937, lng: 78.9629 },
  zoom = 5,
  height = '400px',
  aois = [],
  selectedAOI,
  drawingMode = false,
  onAOISelect,
  onMapClick,
  onPolygonCreated,
  onPolygonEdited,
  showControls = true,
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
      <SentinelMap
        center={center}
        zoom={zoom}
        height={height}
        aois={aois}
        selectedAOI={selectedAOI}
        drawingMode={drawingMode}
        onAOISelect={onAOISelect}
        onPolygonCreated={onPolygonCreated}
        className="w-full h-full"
        showControls={showControls}
      />

      {/* Drawing mode indicator */}
      {drawingMode && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm z-[1000]">
          Drawing Mode Active
        </div>
      )}
    </div>
  )
}