/**
 * MapContainer - Main map component with Leaflet integration
 * Handles map initialization, AOI display, and drawing capabilities
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet'
import { FeatureGroup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import { MAP_CONFIG } from '@/utils/constants'
import type { AOI, GeoJSONPolygon, LatLng } from '@/types'
import { useAOIStore } from '@/stores/aoi'
import { Loading } from '@/components/ui'

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

// Drawing Controls Component
interface DrawingControlsProps {
  onPolygonCreated?: (polygon: GeoJSONPolygon) => void
  onPolygonEdited?: (polygon: GeoJSONPolygon) => void
  drawingEnabled?: boolean
}

function DrawingControls({ onPolygonCreated, onPolygonEdited, drawingEnabled = false }: DrawingControlsProps) {
  const map = useMap()
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup())

  useEffect(() => {
    if (!map) return

    const featureGroup = featureGroupRef.current
    map.addLayer(featureGroup)

    // Drawing control options
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: featureGroup,
        remove: true,
      },
      draw: {
        polygon: drawingEnabled ? {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Polygon edges cannot cross!'
          },
          shapeOptions: MAP_CONFIG.DRAWING_OPTIONS,
          showArea: true,
          metric: true,
        } : false,
        rectangle: drawingEnabled ? {
          shapeOptions: MAP_CONFIG.DRAWING_OPTIONS,
          showArea: true,
          metric: true,
        } : false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
    })

    if (drawingEnabled) {
      map.addControl(drawControl)
    }

    // Event handlers
    const onDrawCreated = (e: any) => {
      const { layer } = e
      featureGroup.addLayer(layer)

      if (layer instanceof L.Polygon) {
        const latLngs = layer.getLatLngs()[0] as L.LatLng[]
        const coordinates = latLngs.map((latLng: L.LatLng) => [latLng.lng, latLng.lat])
        coordinates.push(coordinates[0]) // Close the polygon

        const polygon: GeoJSONPolygon = {
          type: 'Polygon',
          coordinates: [coordinates]
        }

        onPolygonCreated?.(polygon)
      }
    }

    const onDrawEdited = (e: any) => {
      const { layers } = e
      layers.eachLayer((layer: L.Layer) => {
        if (layer instanceof L.Polygon) {
          const latLngs = layer.getLatLngs()[0] as L.LatLng[]
          const coordinates = latLngs.map((latLng: L.LatLng) => [latLng.lng, latLng.lat])
          coordinates.push(coordinates[0])

          const polygon: GeoJSONPolygon = {
            type: 'Polygon',
            coordinates: [coordinates]
          }

          onPolygonEdited?.(polygon)
        }
      })
    }

    const onDrawDeleted = (e: any) => {
      // Handle polygon deletion if needed
      console.log('Polygon deleted:', e)
    }

    // Add event listeners
    map.on(L.Draw.Event.CREATED, onDrawCreated)
    map.on(L.Draw.Event.EDITED, onDrawEdited)
    map.on(L.Draw.Event.DELETED, onDrawDeleted)

    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated)
      map.off(L.Draw.Event.EDITED, onDrawEdited)
      map.off(L.Draw.Event.DELETED, onDrawDeleted)
      map.removeControl(drawControl)
      map.removeLayer(featureGroup)
    }
  }, [map, drawingEnabled, onPolygonCreated, onPolygonEdited])

  return null
}

// AOI Polygons Component
interface AOIPolygonsProps {
  aois: AOI[]
  selectedAOI?: AOI | null
  onAOISelect?: (aoi: AOI) => void
}

function AOIPolygons({ aois, selectedAOI, onAOISelect }: AOIPolygonsProps) {
  const map = useMap()
  const layersRef = useRef<Record<string, L.Polygon>>({})

  useEffect(() => {
    if (!map) return

    // Clear existing layers
    Object.values(layersRef.current).forEach((layer) => {
      map.removeLayer(layer)
    })
    layersRef.current = {}

    // Add AOI polygons
    aois.forEach((aoi) => {
      if (aoi.geojson && aoi.geojson.coordinates) {
        const coordinates = aoi.geojson.coordinates[0].map((coord: number[]) => [coord[1], coord[0]] as [number, number])
        
        const isSelected = selectedAOI?.id === aoi.id
        const polygon = L.polygon(coordinates, {
          color: isSelected ? '#ef4444' : '#2d5a27',
          weight: isSelected ? 3 : 2,
          opacity: 0.8,
          fillColor: isSelected ? '#ef4444' : '#2d5a27',
          fillOpacity: isSelected ? 0.3 : 0.2,
        })

        // Add popup with AOI info
        polygon.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${aoi.name}</h3>
            ${aoi.description ? `<p class="text-xs text-gray-600 mt-1">${aoi.description}</p>` : ''}
            <div class="mt-2 text-xs text-gray-500">
              <div>Created: ${new Date(aoi.created_at).toLocaleDateString()}</div>
              ${aoi.analysis_count ? `<div>Analyses: ${aoi.analysis_count}</div>` : ''}
            </div>
          </div>
        `)

        // Click handler
        polygon.on('click', () => {
          onAOISelect?.(aoi)
        })

        map.addLayer(polygon)
        layersRef.current[aoi.id] = polygon
      }
    })

    return () => {
      Object.values(layersRef.current).forEach((layer) => {
        map.removeLayer(layer)
      })
      layersRef.current = {}
    }
  }, [map, aois, selectedAOI, onAOISelect])

  return null
}

// Map Event Handlers Component
interface MapEventHandlersProps {
  onMapClick?: (latlng: LatLng) => void
}

function MapEventHandlers({ onMapClick }: MapEventHandlersProps) {
  const map = useMap()

  useEffect(() => {
    if (!map || !onMapClick) return

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    }

    map.on('click', handleMapClick)

    return () => {
      map.off('click', handleMapClick)
    }
  }, [map, onMapClick])

  return null
}

// Main Map Component
export default function Map({
  center = MAP_CONFIG.DEFAULT_CENTER,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
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
      <LeafletMapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Base tile layer */}
        <TileLayer
          url={MAP_CONFIG.TILE_LAYERS.OPENSTREETMAP.url}
          attribution={MAP_CONFIG.TILE_LAYERS.OPENSTREETMAP.attribution}
        />

        {/* Satellite tile layer toggle could be added here */}
        
        {/* AOI Polygons */}
        <AOIPolygons 
          aois={aois}
          selectedAOI={selectedAOI}
          onAOISelect={onAOISelect}
        />

        {/* Drawing Controls */}
        <DrawingControls
          drawingEnabled={drawingMode}
          onPolygonCreated={onPolygonCreated}
          onPolygonEdited={(polygon) => {
            // For now, we'll just pass the polygon without AOI context
            // In a real implementation, you'd determine which AOI was edited
            if (onPolygonEdited && selectedAOI) {
              onPolygonEdited(selectedAOI, polygon)
            }
          }}
        />

        {/* Map Event Handlers */}
        <MapEventHandlers onMapClick={onMapClick} />
      </LeafletMapContainer>

      {/* Drawing mode indicator */}
      {drawingMode && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm z-[1000]">
          Drawing Mode Active
        </div>
      )}
    </div>
  )
}