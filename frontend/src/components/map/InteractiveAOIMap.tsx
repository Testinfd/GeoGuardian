/**
 * InteractiveAOIMap - Advanced map component for AOI selection and drawing
 * Uses Leaflet with drawing tools for creating and editing Areas of Interest
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Plus, Edit, Trash2, Save, X, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import type { AOI, GeoJSONPolygon } from '@/types'

// Fix Leaflet's default icon path issues with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface InteractiveAOIMapProps {
  center?: [number, number] // [lat, lng]
  zoom?: number
  height?: string
  aois?: AOI[]
  selectedAOI?: AOI | null
  onPolygonCreated?: (polygon: GeoJSONPolygon) => void
  onAOISelect?: (aoi: AOI) => void
  onAOIEdit?: (aoi: AOI, newGeometry: GeoJSONPolygon) => void
  onAOIDelete?: (aoi: AOI) => void
  className?: string
}

export default function InteractiveAOIMap({
  center = [20.5937, 78.9629], // India geographic center
  zoom = 5,
  height = '600px',
  aois = [],
  selectedAOI,
  onPolygonCreated,
  onAOISelect,
  onAOIEdit,
  onAOIDelete,
  className = ''
}: InteractiveAOIMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drawnLayersRef = useRef<L.FeatureGroup | null>(null)
  const currentPolygonRef = useRef<L.Polygon | null>(null)
  
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([])
  const [currentLayer, setCurrentLayer] = useState<'satellite' | 'street' | 'terrain'>('satellite')
  const [instructions, setInstructions] = useState('')

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Create map
    const map = L.map(containerRef.current).setView(center, zoom)

    // Add base layers
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
      }
    )

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }
    )

    const terrainLayer = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenTopoMap contributors',
        maxZoom: 17
      }
    )

    // Set default layer
    satelliteLayer.addTo(map)

    // Create feature group for drawn layers
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnLayersRef.current = drawnItems

    // Store references
    mapRef.current = map

    // Add scale control
    L.control.scale({ position: 'bottomleft' }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [center, zoom])

  // Switch base layer
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    let newLayer: L.TileLayer
    switch (currentLayer) {
      case 'satellite':
        newLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
        )
        break
      case 'street':
        newLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
        )
        break
      case 'terrain':
        newLayer = L.tileLayer(
          'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          { attribution: '&copy; OpenTopoMap contributors', maxZoom: 17 }
        )
        break
    }
    newLayer.addTo(map)

    // Re-add drawn layers
    if (drawnLayersRef.current) {
      map.addLayer(drawnLayersRef.current)
    }
  }, [currentLayer])

  // Draw existing AOIs
  useEffect(() => {
    if (!mapRef.current || !drawnLayersRef.current) return

    const drawnItems = drawnLayersRef.current
    drawnItems.clearLayers()

    aois.forEach((aoi) => {
      if (aoi.geojson && aoi.geojson.coordinates) {
        const coords = aoi.geojson.coordinates[0].map(
          (coord: number[]) => [coord[1], coord[0]] as [number, number]
        )

        const polygon = L.polygon(coords, {
          color: selectedAOI?.id === aoi.id ? '#3B82F6' : '#EAB308',
          fillColor: selectedAOI?.id === aoi.id ? '#3B82F6' : '#EAB308',
          fillOpacity: 0.2,
          weight: 2
        })

        polygon.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${aoi.name}</h3>
            <p class="text-xs text-gray-600">${aoi.description || 'No description'}</p>
            <p class="text-xs mt-1">Area: ${aoi.area_km2 ? aoi.area_km2.toFixed(2) + ' km²' : 'N/A'}</p>
          </div>
        `)

        polygon.on('click', () => {
          if (onAOISelect) {
            onAOISelect(aoi)
          }
        })

        polygon.addTo(drawnItems)
      }
    })

    // Fit bounds if there are AOIs
    if (aois.length > 0 && drawnItems.getLayers().length > 0) {
      mapRef.current.fitBounds(drawnItems.getBounds(), { padding: [50, 50] })
    }
  }, [aois, selectedAOI, onAOISelect])

  // Start drawing
  const startDrawing = () => {
    if (!mapRef.current) return

    setIsDrawing(true)
    setDrawingPoints([])
    setInstructions('Click on the map to add points to your polygon. Click the first point again to close.')

    const map = mapRef.current
    map.getContainer().style.cursor = 'crosshair'

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng]
      
      setDrawingPoints((prev) => {
        const updated = [...prev, newPoint]

        // Remove existing drawing polygon
        if (currentPolygonRef.current) {
          map.removeLayer(currentPolygonRef.current)
        }

        // Draw temporary polygon if we have at least 2 points
        if (updated.length >= 2) {
          const tempPolygon = L.polygon(updated, {
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '5, 5'
          })
          tempPolygon.addTo(map)
          currentPolygonRef.current = tempPolygon
        }

        // Add marker for the point
        L.circleMarker(newPoint, {
          radius: 5,
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 1
        }).addTo(map)

        // Check if user clicked near the first point to close polygon
        if (updated.length >= 3) {
          const firstPoint = updated[0]
          const distance = map.distance(firstPoint, newPoint)
          
          if (distance < 50) { // Within 50 meters
            completeDrawing(updated)
            return []
          }
        }

        return updated
      })
    }

    map.on('click', handleMapClick)
  }

  // Complete drawing
  const completeDrawing = (points: [number, number][]) => {
    if (!mapRef.current || points.length < 3) return

    const map = mapRef.current

    // Remove temporary polygon
    if (currentPolygonRef.current) {
      map.removeLayer(currentPolygonRef.current)
      currentPolygonRef.current = null
    }

    // Convert to GeoJSON format (lng, lat order)
    const coordinates = points.map((point) => [point[1], point[0]])
    coordinates.push(coordinates[0]) // Close the polygon

    const geojson: GeoJSONPolygon = {
      type: 'Polygon',
      coordinates: [coordinates]
    }

    // Trigger callback
    if (onPolygonCreated) {
      onPolygonCreated(geojson)
    }

    // Reset drawing state
    cancelDrawing()
  }

  // Cancel drawing
  const cancelDrawing = () => {
    if (!mapRef.current) return

    const map = mapRef.current
    map.off('click')
    map.getContainer().style.cursor = ''

    // Remove temporary polygon and markers
    if (currentPolygonRef.current) {
      map.removeLayer(currentPolygonRef.current)
      currentPolygonRef.current = null
    }

    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    setIsDrawing(false)
    setDrawingPoints([])
    setInstructions('')
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Container */}
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden border border-gray-300" />

      {/* Drawing Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        {!isDrawing ? (
          <>
            <Button
              onClick={startDrawing}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Draw AOI
            </Button>

            {selectedAOI && (
              <>
                {onAOIEdit && (
                  <Button
                    onClick={() => {
                      // TODO: Implement edit mode
                      alert('Edit mode coming soon')
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-white shadow-lg"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                
                {onAOIDelete && (
                  <Button
                    onClick={() => onAOIDelete(selectedAOI)}
                    variant="outline"
                    size="sm"
                    className="bg-white text-red-600 hover:bg-red-50 shadow-lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={() => completeDrawing(drawingPoints)}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              size="sm"
              disabled={drawingPoints.length < 3}
            >
              <Save className="w-4 h-4 mr-2" />
              Complete ({drawingPoints.length} points)
            </Button>

            <Button
              onClick={cancelDrawing}
              variant="outline"
              size="sm"
              className="bg-white shadow-lg"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Layer Switcher */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <Button
          onClick={() => setCurrentLayer(currentLayer === 'satellite' ? 'street' : currentLayer === 'street' ? 'terrain' : 'satellite')}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Layers className="w-4 h-4 mr-2" />
          {currentLayer === 'satellite' ? 'Satellite' : currentLayer === 'street' ? 'Street' : 'Terrain'}
        </Button>
      </div>

      {/* Instructions */}
      {instructions && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-[1000] text-sm">
          {instructions}
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg z-[1000] text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{aois.length} AOI{aois.length !== 1 ? 's' : ''}</span>
        </div>
        {selectedAOI && (
          <div className="mt-1 text-gray-600">
            Selected: {selectedAOI.name}
          </div>
        )}
      </div>
    </div>
  )
}

