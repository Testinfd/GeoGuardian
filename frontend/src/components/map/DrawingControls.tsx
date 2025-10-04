/**
 * Drawing Controls Component
 * Interactive drawing tools for creating and editing AOI polygons on Sentinel satellite imagery
 */

'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Shapes, Trash2, Edit3, Square, MousePointer, Save, RotateCcw } from 'lucide-react'
import type { GeoJSONPolygon } from '@/types'

interface DrawingControlsProps {
  onPolygonCreated?: (polygon: GeoJSONPolygon) => void
  onPolygonEdited?: (polygon: GeoJSONPolygon) => void
  onPolygonDeleted?: () => void
  editMode?: boolean
  showControls?: boolean
  existingPolygon?: GeoJSONPolygon | null
  className?: string
  // Sentinel-specific props
  mapBounds?: { north: number; south: number; east: number; west: number }
  mapWidth?: number
  mapHeight?: number
  containerRef?: React.RefObject<HTMLDivElement>
}

const DrawingControls: React.FC<DrawingControlsProps> = ({
  onPolygonCreated,
  onPolygonEdited,
  onPolygonDeleted,
  editMode = false,
  showControls = true,
  existingPolygon,
  className = '',
  mapBounds,
  mapWidth = 800,
  mapHeight = 600,
  containerRef
}) => {
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'rectangle' | null>(null)
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const polygonRef = useRef<SVGPathElement>(null)

  // Convert screen coordinates to geographic coordinates
  const screenToGeo = useCallback((screenX: number, screenY: number): [number, number] => {
    if (!mapBounds) return [0, 0]

    const bounds = mapBounds
    const lng = bounds.west + (screenX / mapWidth) * (bounds.east - bounds.west)
    const lat = bounds.north - (screenY / mapHeight) * (bounds.north - bounds.south)

    return [lng, lat]
  }, [mapBounds, mapWidth, mapHeight])

  // Convert geographic coordinates to screen coordinates
  const geoToScreen = useCallback((lng: number, lat: number): [number, number] => {
    if (!mapBounds) return [0, 0]

    const bounds = mapBounds
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * mapWidth
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * mapHeight

    return [x, y]
  }, [mapBounds, mapWidth, mapHeight])

  // Calculate polygon area from screen coordinates
  const calculateArea = useCallback((points: [number, number][]): number => {
    if (points.length < 3) return 0

    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i][0] * points[j][1]
      area -= points[j][0] * points[i][1]
    }
    area = Math.abs(area) / 2

    // Convert to square meters (rough approximation)
    if (mapBounds) {
      const latRange = Math.abs(mapBounds.north - mapBounds.south) || 1
      const lngRange = Math.abs(mapBounds.east - mapBounds.west) || 1

      const metersPerPixelLat = (latRange * 111000) / mapHeight
      const metersPerPixelLng = (lngRange * 111000 * Math.cos(mapBounds.north * Math.PI / 180)) / mapWidth

      const avgMetersPerPixel = (metersPerPixelLat + metersPerPixelLng) / 2
      return area * avgMetersPerPixel * avgMetersPerPixel
    }

    return area
  }, [mapBounds, mapWidth, mapHeight])

  // Handle mouse down for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!drawingMode || isEditing) return

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (drawingMode === 'polygon') {
      if (currentPolygon.length === 0) {
        // Start new polygon
        setCurrentPolygon([[x, y]])
        setIsDrawing(true)
      } else {
        // Add point to polygon
        setCurrentPolygon(prev => [...prev, [x, y]])
      }
    } else if (drawingMode === 'rectangle') {
      // For rectangle, we need two points (start and end)
      setCurrentPolygon([[x, y]])
      setIsDrawing(true)
    }
  }, [drawingMode, currentPolygon, isEditing])

  // Handle mouse move for drawing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || drawingMode !== 'rectangle') return

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update rectangle end point
    if (currentPolygon.length === 1) {
      const [startX, startY] = currentPolygon[0]
      setCurrentPolygon([[startX, startY], [x, startY], [x, y], [startX, y]])
    }
  }, [isDrawing, drawingMode, currentPolygon])

  // Complete the polygon and convert to GeoJSON
  const completePolygon = useCallback(() => {
    if (currentPolygon.length < 3) return

    // Convert screen coordinates to geographic coordinates
    const geoCoords = currentPolygon.map(([x, y]) => screenToGeo(x, y))

    const geoJsonPolygon: GeoJSONPolygon = {
      type: 'Polygon',
      coordinates: [geoCoords]
    }

    onPolygonCreated?.(geoJsonPolygon)
    setIsDrawing(false)
    setDrawingMode(null)
  }, [currentPolygon, screenToGeo, onPolygonCreated])

  // Handle mouse up for completing drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return

    if (drawingMode === 'polygon') {
      // For polygon, double-click or right-click to finish
      // For now, we'll complete on second click of first point (close polygon)
      if (currentPolygon.length > 2) {
        const [firstX, firstY] = currentPolygon[0]
        const [lastX, lastY] = currentPolygon[currentPolygon.length - 1]

        // If close to first point, close the polygon
        if (Math.abs(lastX - firstX) < 10 && Math.abs(lastY - firstY) < 10) {
          setCurrentPolygon(prev => prev.slice(0, -1)) // Remove the closing point
          completePolygon()
        }
      }
    } else if (drawingMode === 'rectangle') {
      completePolygon()
    }
  }, [isDrawing, drawingMode, currentPolygon, completePolygon])

  // Load existing polygon
  useEffect(() => {
    if (existingPolygon && mapBounds) {
      const coords = existingPolygon.coordinates[0]
      const screenCoords = coords.map(([lng, lat]) => geoToScreen(lng, lat))
      setCurrentPolygon(screenCoords)
    }
  }, [existingPolygon, mapBounds, geoToScreen])

  // Control functions
  const startPolygonDrawing = useCallback(() => {
    setDrawingMode('polygon')
    setCurrentPolygon([])
    setIsDrawing(false)
  }, [])

  const startRectangleDrawing = useCallback(() => {
    setDrawingMode('rectangle')
    setCurrentPolygon([])
    setIsDrawing(false)
  }, [])

  const savePolygon = useCallback(() => {
    if (currentPolygon.length >= 3) {
      completePolygon()
    }
  }, [currentPolygon, completePolygon])

  const deletePolygon = useCallback(() => {
    setCurrentPolygon([])
    setIsDrawing(false)
    setDrawingMode(null)
    onPolygonDeleted?.()
  }, [onPolygonDeleted])

  const clearAll = useCallback(() => {
    setCurrentPolygon([])
    setIsDrawing(false)
    setDrawingMode(null)
    onPolygonDeleted?.()
  }, [onPolygonDeleted])

  const undoLastPoint = useCallback(() => {
    if (currentPolygon.length > 0) {
      setCurrentPolygon(prev => prev.slice(0, -1))
    }
  }, [currentPolygon])

  // Create SVG path data from polygon points
  const createPathData = useCallback((points: [number, number][]): string => {
    if (points.length === 0) return ''

    let path = `M ${points[0][0]} ${points[0][1]}`
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`
    }
    if (points.length > 2) {
      path += ' Z' // Close the path
    }
    return path
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawingMode(null)
        setIsDrawing(false)
      } else if (e.key === 'Enter' && isDrawing) {
        savePolygon()
      } else if (e.key === 'Delete' && currentPolygon.length > 0) {
        undoLastPoint()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawing, savePolygon, undoLastPoint, currentPolygon.length])

  // Custom control buttons (rendered outside the map)
  if (!showControls) {
    return null
  }

  return (
    <>
      {/* SVG Drawing Overlay */}
      {drawingMode && (
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-auto"
          style={{ width: mapWidth, height: mapHeight }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Current drawing polygon */}
          {currentPolygon.length > 0 && (
            <path
              d={createPathData(currentPolygon)}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="rgba(59, 130, 246, 0.2)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Drawing points */}
          {currentPolygon.map(([x, y], index) => (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* Helper text */}
          {drawingMode && (
            <g>
              {/* Text shadow/background */}
              <text
                x="21"
                y="31"
                fill="black"
                fontSize="14"
                fontWeight="bold"
                opacity="0.8"
              >
                {drawingMode === 'polygon'
                  ? currentPolygon.length === 0
                    ? 'Click to start drawing polygon'
                    : `Click to add points. Press Enter to finish.`
                  : 'Click and drag to draw rectangle'
                }
              </text>
              {/* Main text */}
              <text
                x="20"
                y="30"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                {drawingMode === 'polygon'
                  ? currentPolygon.length === 0
                    ? 'Click to start drawing polygon'
                    : `Click to add points. Press Enter to finish.`
                  : 'Click and drag to draw rectangle'
                }
              </text>
            </g>
          )}
        </svg>
      )}

      {/* Control Panel */}
      <div className={`absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
        <div className="p-3 space-y-2">
          <div className="text-sm font-semibold text-gray-800 px-2">Drawing Tools</div>

          {/* Drawing Mode Buttons */}
          <div className="space-y-1">
            <button
              onClick={startPolygonDrawing}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded transition-colors ${
                drawingMode === 'polygon'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Draw Polygon"
            >
              <Shapes className="w-4 h-4" />
              <span>Draw Polygon</span>
            </button>

            <button
              onClick={startRectangleDrawing}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded transition-colors ${
                drawingMode === 'rectangle'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Draw Rectangle"
            >
              <Square className="w-4 h-4" />
              <span>Draw Rectangle</span>
            </button>
          </div>

          {/* Action Buttons */}
          {currentPolygon.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-2"></div>

              <div className="space-y-1">
                <button
                  onClick={savePolygon}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Save Polygon"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>

                {drawingMode === 'polygon' && currentPolygon.length > 0 && (
                  <button
                    onClick={undoLastPoint}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded transition-colors"
                    title="Undo Last Point"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Undo Point</span>
                  </button>
                )}

                <button
                  onClick={deletePolygon}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete Polygon"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}

          <div className="border-t border-gray-200 my-2"></div>

          <button
            onClick={clearAll}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded transition-colors"
            title="Clear All"
          >
            <MousePointer className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>

        {/* Status Info */}
        {(drawingMode || currentPolygon.length > 0) && (
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">Drawing Status:</div>
              <div className="space-y-1">
                {drawingMode && (
                  <div>Mode: <span className="font-medium capitalize">{drawingMode}</span></div>
                )}
                {currentPolygon.length > 0 && (
                  <div>Points: <span className="font-medium">{currentPolygon.length}</span></div>
                )}
                {currentPolygon.length > 2 && (
                  <div>Area: <span className="font-medium">
                    {(calculateArea(currentPolygon) / 1000000).toFixed(2)} km²
                  </span></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="px-3 py-2 border-t border-gray-200 bg-blue-50 rounded-b-lg">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">Keyboard Shortcuts:</div>
            <div className="space-y-1">
              <div><kbd className="px-1 py-0.5 bg-white rounded text-xs">Enter</kbd> Save polygon</div>
              <div><kbd className="px-1 py-0.5 bg-white rounded text-xs">Del</kbd> Undo point</div>
              <div><kbd className="px-1 py-0.5 bg-white rounded text-xs">Esc</kbd> Cancel</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DrawingControls