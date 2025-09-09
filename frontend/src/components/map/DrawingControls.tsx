/**
 * Drawing Controls Component
 * Interactive map drawing tools for creating and editing AOI polygons
 */

'use client'

import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import { Shapes, Trash2, Edit3, Square, MousePointer } from 'lucide-react'
import type { GeoJSONPolygon } from '@/types'

interface DrawingControlsProps {
  onPolygonCreated?: (polygon: GeoJSONPolygon) => void
  onPolygonEdited?: (polygon: GeoJSONPolygon) => void
  onPolygonDeleted?: () => void
  editMode?: boolean
  showControls?: boolean
  existingPolygon?: GeoJSONPolygon | null
  className?: string
}

const DrawingControls: React.FC<DrawingControlsProps> = ({
  onPolygonCreated,
  onPolygonEdited,
  onPolygonDeleted,
  editMode = false,
  showControls = true,
  existingPolygon,
  className = ''
}) => {
  const map = useMap()
  const drawControlRef = useRef<L.Control.Draw | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup())
  const currentPolygonRef = useRef<L.Polygon | null>(null)

  useEffect(() => {
    if (!map || !showControls) return

    // Add drawn items layer to map
    const drawnItems = drawnItemsRef.current
    map.addLayer(drawnItems)

    // Configure draw control options
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Polygon edges cannot cross!'
          },
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.2,
            fillColor: '#3b82f6'
          },
          showArea: true,
          metric: true,
          feet: false,
          icon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon'
          })
        },
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.2,
            fillColor: '#3b82f6'
          },
          showArea: true,
          metric: true
        },
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    })

    // Add control to map
    map.addControl(drawControl)
    drawControlRef.current = drawControl

    // Event handlers
    const onDrawCreated = (e: any) => {
      const layer = e.layer
      const layerType = e.layerType

      // Remove existing polygon if any
      if (currentPolygonRef.current) {
        drawnItems.removeLayer(currentPolygonRef.current)
      }

      // Add new layer
      drawnItems.addLayer(layer)
      currentPolygonRef.current = layer

      // Convert to GeoJSON
      if (layerType === 'polygon' || layerType === 'rectangle') {
        const geoJson = layer.toGeoJSON()
        const polygon: GeoJSONPolygon = {
          type: 'Polygon',
          coordinates: geoJson.geometry.coordinates
        }

        // Calculate area
        const area = L.GeometryUtil?.geodesicArea?.(layer.getLatLngs()[0] as any) || 0
        
        // Add area info to polygon properties
        layer.bindPopup(`
          <div class="p-2">
            <strong>Area:</strong> ${(area / 1000000).toFixed(2)} km²<br>
            <strong>Perimeter:</strong> ${((layer.getLatLngs()[0] as any[]).length * 0.1).toFixed(2)} km
          </div>
        `)

        onPolygonCreated?.(polygon)
      }
    }

    const onDrawEdited = (e: any) => {
      const layers = e.layers
      layers.eachLayer((layer: any) => {
        if (layer === currentPolygonRef.current) {
          const geoJson = layer.toGeoJSON()
          const polygon: GeoJSONPolygon = {
            type: 'Polygon',
            coordinates: geoJson.geometry.coordinates
          }

          // Update area info
          const area = L.GeometryUtil?.geodesicArea?.(layer.getLatLngs()[0] as any) || 0
          layer.bindPopup(`
            <div class="p-2">
              <strong>Area:</strong> ${(area / 1000000).toFixed(2)} km²<br>
              <strong>Perimeter:</strong> ${((layer.getLatLngs()[0] as any[]).length * 0.1).toFixed(2)} km
            </div>
          `)

          onPolygonEdited?.(polygon)
        }
      })
    }

    const onDrawDeleted = (e: any) => {
      const layers = e.layers
      layers.eachLayer((layer: any) => {
        if (layer === currentPolygonRef.current) {
          currentPolygonRef.current = null
          onPolygonDeleted?.()
        }
      })
    }

    // Add event listeners
    map.on(L.Draw.Event.CREATED, onDrawCreated)
    map.on(L.Draw.Event.EDITED, onDrawEdited)
    map.on(L.Draw.Event.DELETED, onDrawDeleted)

    // Load existing polygon if provided
    if (existingPolygon) {
      loadExistingPolygon(existingPolygon)
    }

    // Cleanup function
    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated)
      map.off(L.Draw.Event.EDITED, onDrawEdited)
      map.off(L.Draw.Event.DELETED, onDrawDeleted)
      
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current)
      }
      map.removeLayer(drawnItems)
    }
  }, [map, showControls, onPolygonCreated, onPolygonEdited, onPolygonDeleted])

  // Load existing polygon into the map
  const loadExistingPolygon = (polygon: GeoJSONPolygon) => {
    const drawnItems = drawnItemsRef.current
    
    // Remove existing polygon
    if (currentPolygonRef.current) {
      drawnItems.removeLayer(currentPolygonRef.current)
    }

    try {
      // Convert coordinates to LatLng format
      const coordinates = polygon.coordinates[0].map(coord => [coord[1], coord[0]] as [number, number])
      
      // Create Leaflet polygon
      const leafletPolygon = L.polygon(coordinates, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.2,
        fillColor: '#3b82f6'
      })

      // Add to drawn items
      drawnItems.addLayer(leafletPolygon)
      currentPolygonRef.current = leafletPolygon

      // Calculate and show area info
      const area = L.GeometryUtil?.geodesicArea?.(leafletPolygon.getLatLngs()[0] as any) || 0
      leafletPolygon.bindPopup(`
        <div class="p-2">
          <strong>Area:</strong> ${(area / 1000000).toFixed(2)} km²<br>
          <strong>Perimeter:</strong> ${((leafletPolygon.getLatLngs()[0] as any[]).length * 0.1).toFixed(2)} km
        </div>
      `)

      // Fit map to polygon bounds
      map.fitBounds(leafletPolygon.getBounds(), { padding: [20, 20] })
    } catch (error) {
      console.error('Error loading existing polygon:', error)
    }
  }

  // Update existing polygon when prop changes
  useEffect(() => {
    if (existingPolygon) {
      loadExistingPolygon(existingPolygon)
    } else {
      // Clear existing polygon
      const drawnItems = drawnItemsRef.current
      if (currentPolygonRef.current) {
        drawnItems.removeLayer(currentPolygonRef.current)
        currentPolygonRef.current = null
      }
    }
  }, [existingPolygon])

  // Manual control functions
  const startDrawing = () => {
    const drawControl = drawControlRef.current
    if (drawControl && (drawControl as any)._toolbars?.draw) {
      const polygonButton = (drawControl as any)._toolbars.draw._modes.polygon
      if (polygonButton && !polygonButton.enabled()) {
        polygonButton.handler.enable()
      }
    }
  }

  const startRectangleDrawing = () => {
    const drawControl = drawControlRef.current
    if (drawControl && (drawControl as any)._toolbars?.draw) {
      const rectangleButton = (drawControl as any)._toolbars.draw._modes.rectangle
      if (rectangleButton && !rectangleButton.enabled()) {
        rectangleButton.handler.enable()
      }
    }
  }

  const enableEditMode = () => {
    const drawControl = drawControlRef.current
    if (drawControl && (drawControl as any)._toolbars?.edit && currentPolygonRef.current) {
      const editButton = (drawControl as any)._toolbars.edit._modes.edit
      if (editButton && !editButton.enabled()) {
        editButton.handler.enable()
      }
    }
  }

  const deletePolygon = () => {
    const drawnItems = drawnItemsRef.current
    if (currentPolygonRef.current) {
      drawnItems.removeLayer(currentPolygonRef.current)
      currentPolygonRef.current = null
      onPolygonDeleted?.()
    }
  }

  const clearAll = () => {
    const drawnItems = drawnItemsRef.current
    drawnItems.clearLayers()
    currentPolygonRef.current = null
    onPolygonDeleted?.()
  }

  // Custom control buttons (rendered outside the map)
  if (!showControls) {
    return null
  }

  return (
    <div className={`absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      <div className="p-2 space-y-1">
        <div className="text-xs font-medium text-gray-700 px-2 py-1">Drawing Tools</div>
        
        <button
          onClick={startDrawing}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Draw Polygon"
        >
          <Shapes className="w-4 h-4" />
          <span>Draw Polygon</span>
        </button>
        
        <button
          onClick={startRectangleDrawing}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Draw Rectangle"
        >
          <Square className="w-4 h-4" />
          <span>Draw Rectangle</span>
        </button>
        
        {currentPolygonRef.current && (
          <>
            <div className="border-t border-gray-200 my-1"></div>
            
            <button
              onClick={enableEditMode}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Edit Polygon"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            
            <button
              onClick={deletePolygon}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Polygon"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </>
        )}
        
        <div className="border-t border-gray-200 my-1"></div>
        
        <button
          onClick={clearAll}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded transition-colors"
          title="Clear All"
        >
          <MousePointer className="w-4 h-4" />
          <span>Clear All</span>
        </button>
      </div>
      
      {currentPolygonRef.current && (
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-xs text-gray-600">
            <div className="font-medium">Polygon Info:</div>
            <div>Click polygon for details</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DrawingControls