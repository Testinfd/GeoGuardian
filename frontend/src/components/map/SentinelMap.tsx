/**
 * SentinelMap - Advanced satellite imagery map component using Sentinel Hub
 * Provides real satellite imagery visualization for environmental monitoring
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Satellite, ZoomIn, ZoomOut, Download, Layers, Calendar, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUser } from '@/stores/auth-store'
import { analysisApi } from '@/lib/api'
import type { AOI } from '@/types'

interface SentinelMapProps {
  height?: string
  width?: string
  aois?: AOI[]
  selectedAOI?: AOI | null
  center?: { lat: number; lng: number }
  zoom?: number
  showControls?: boolean
  drawingMode?: boolean
  onAOISelect?: (aoi: AOI) => void
  onPolygonCreated?: (polygon: any) => void
  className?: string
}

interface SatelliteImagery {
  imageUrl: string
  timestamp: string
  cloudCoverage: number
  quality: number
}

interface TimelineImage {
  url: string
  date: string
  cloudCoverage: number
  quality: number
  isLoading?: boolean
}

export default function SentinelMap({
  height = "400px",
  width = "100%",
  aois = [],
  selectedAOI,
  center = { lat: 20.5937, lng: 78.9629 }, // Default to India geographic center
  zoom = 5,
  showControls = true,
  drawingMode = false,
  onAOISelect,
  onPolygonCreated,
  className = ""
}: SentinelMapProps) {
  const user = useUser()
  const [imagery, setImagery] = useState<SatelliteImagery | null>(null)
  const [timelineImages, setTimelineImages] = useState<TimelineImage[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Fetch satellite imagery from backend with timeline support (30-90 days)
  const fetchSatelliteImagery = async (aoiGeojson?: any) => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    setTimelineImages([])
    setLoadingProgress({ current: 0, total: 0 })
    
    try {
      // Use the selected AOI's geojson or create a default one around the center point
      const geojson = aoiGeojson || {
        type: 'Polygon',
        coordinates: [[
          [center.lng - 0.01, center.lat - 0.01],
          [center.lng + 0.01, center.lat - 0.01],
          [center.lng + 0.01, center.lat + 0.01],
          [center.lng - 0.01, center.lat + 0.01],
          [center.lng - 0.01, center.lat - 0.01]
        ]]
      }

      // Try to load images from multiple time periods (within 30-90 days)
      const endDate = new Date()
      const dates: Date[] = []
      
      // Generate dates at 10-day intervals going back 90 days
      for (let i = 0; i <= 90; i += 10) {
        const date = new Date(endDate)
        date.setDate(date.getDate() - i)
        dates.push(date)
      }

      setLoadingProgress({ current: 0, total: dates.length })
      const foundImages: TimelineImage[] = []

      // Try to fetch images for each date progressively
      for (let i = 0; i < dates.length; i++) {
        try {
          const dateStr = dates[i].toISOString().split('T')[0]
          
          // Add a placeholder to show loading
          const loadingImage: TimelineImage = {
            url: '',
            date: dateStr,
            cloudCoverage: 0,
            quality: 0,
            isLoading: true
          }
          setTimelineImages(prev => [...prev, loadingImage])
          
          const data = await analysisApi.getSatelliteImageryPreview(geojson)
          
          if (data.success && data.preview_image) {
            const imageData: TimelineImage = {
              url: data.preview_image,
              date: data.timestamp || dateStr,
              cloudCoverage: data.cloud_coverage || 0,
              quality: data.quality_score || 1,
              isLoading: false
            }
            
            foundImages.push(imageData)
            
            // Update the timeline with the actual image
            setTimelineImages(prev => 
              prev.map((img, idx) => idx === foundImages.length - 1 ? imageData : img)
            )
            
            // Set the first found image as the main imagery
            if (foundImages.length === 1) {
              setImagery({
                imageUrl: data.preview_image,
                timestamp: data.timestamp || dateStr,
                cloudCoverage: data.cloud_coverage || 0,
                quality: data.quality_score || 1
              })
            }
            
            setLoadingProgress({ current: i + 1, total: dates.length })
            
            // If we found at least 3 images, that's good enough
            if (foundImages.length >= 3) {
              break
            }
          }
        } catch (err) {
          console.warn(`No imagery for ${dates[i].toISOString().split('T')[0]}`)
          // Continue trying other dates
        }
      }

      // After all attempts
      if (foundImages.length === 0) {
        console.warn('No satellite imagery available in the 30-90 day timeframe')
        setError('Satellite imagery temporarily unavailable for this area. Please try again later.')
      } else {
        setError(null)
      }
      
    } catch (err: any) {
      console.error('Error fetching satellite imagery:', err)
      setError(err.message || 'Failed to load satellite imagery')
    } finally {
      setIsLoading(false)
    }
  }

  // Load imagery when component mounts or AOI changes
  useEffect(() => {
    if (!user) return
    
    if (selectedAOI) {
      fetchSatelliteImagery(selectedAOI.geojson)
    } else if (aois.length === 0) {
      fetchSatelliteImagery()
    }
    // Only re-fetch when selectedAOI id changes, not the entire object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAOI?.id, user?.id])

  // Handle zoom controls
  const handleZoomIn = () => {
    setCurrentZoom(prev => Math.min(prev + 1, 18))
  }

  const handleZoomOut = () => {
    setCurrentZoom(prev => Math.max(prev - 1, 1))
  }

  // Handle AOI selection
  const handleAOIClick = (aoi: AOI) => {
    if (onAOISelect) {
      onAOISelect(aoi)
    }
  }

  // Get coordinates for selected AOI
  const getAOIBounds = (aoi: AOI) => {
    const coords = aoi.geojson.coordinates[0]
    const lats = coords.map(c => c[1])
    const lngs = coords.map(c => c[0])
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`} style={{ height, width }}>
      {/* Satellite Imagery Display */}
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
              <p className="text-sm">Loading Sentinel-2 imagery...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="font-medium text-white mb-2">Satellite Data Unavailable</h3>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => fetchSatelliteImagery(selectedAOI?.geojson)}
                className="text-white border-gray-400 hover:bg-gray-800"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {imagery && !isLoading && (
          <>
            <img 
              src={timelineImages.length > 0 && timelineImages[selectedImageIndex]?.url 
                ? timelineImages[selectedImageIndex].url 
                : imagery.imageUrl}
              alt="Sentinel-2 Satellite Imagery"
              className="w-full h-full object-cover"
              onError={() => setError('Failed to load satellite image')}
            />
            
            {/* Imagery Info Overlay */}
            <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-xs">
              <div className="flex items-center gap-2 mb-1">
                <Satellite className="w-4 h-4" />
                <span className="font-medium">Sentinel-2</span>
              </div>
              <div>Acquired: {timelineImages.length > 0 && timelineImages[selectedImageIndex]?.date 
                ? new Date(timelineImages[selectedImageIndex].date).toLocaleDateString() 
                : new Date(imagery.timestamp).toLocaleDateString()}</div>
              <div>Cloud Coverage: {timelineImages.length > 0 && timelineImages[selectedImageIndex]
                ? Math.round(timelineImages[selectedImageIndex].cloudCoverage * 100)
                : Math.round(imagery.cloudCoverage * 100)}%</div>
              <div>Quality: {timelineImages.length > 0 && timelineImages[selectedImageIndex]
                ? Math.round(timelineImages[selectedImageIndex].quality * 100)
                : Math.round(imagery.quality * 100)}%</div>
            </div>

            {/* Timeline Navigation */}
            {timelineImages.length > 1 && (
              <div className="absolute bottom-16 left-3 right-3 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Timeline ({timelineImages.length} images found)</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {timelineImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      disabled={img.isLoading || !img.url}
                      className={`flex-shrink-0 px-3 py-1 text-xs rounded transition-colors ${
                        selectedImageIndex === idx
                          ? 'bg-blue-500 text-white'
                          : img.isLoading || !img.url
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {img.isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        new Date(img.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading progress indicator */}
        {isLoading && loadingProgress.total > 0 && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-xs">
            Searching for imagery... {loadingProgress.current} / {loadingProgress.total}
          </div>
        )}

        {/* No imagery fallback */}
        {!imagery && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-green-900 text-white">
            <div className="text-center p-6">
              <Satellite className="w-16 h-16 mx-auto mb-4 text-blue-300" />
              <h3 className="font-medium text-white mb-2">Sentinel Hub Satellite Map</h3>
              <p className="text-sm text-gray-300 mb-4">
                Real satellite imagery from European Space Agency
              </p>
              {user ? (
                <Button onClick={() => fetchSatelliteImagery()}>
                  Load Imagery
                </Button>
              ) : (
                <p className="text-xs text-gray-400">Login required to view satellite data</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AOI Overlays */}
      {aois.length > 0 && imagery && (
        <div className="absolute inset-0 pointer-events-none">
          {aois.map(aoi => {
            const bounds = getAOIBounds(aoi)
            const isSelected = selectedAOI?.id === aoi.id
            
            return (
              <div
                key={aoi.id}
                className={`absolute border-2 pointer-events-auto cursor-pointer ${
                  isSelected 
                    ? 'border-blue-400 bg-blue-400 bg-opacity-10' 
                    : 'border-yellow-400 bg-yellow-400 bg-opacity-10 hover:bg-opacity-20'
                }`}
                style={{
                  left: '10%',
                  top: '10%',
                  right: '10%',
                  bottom: '10%',
                }}
                onClick={() => handleAOIClick(aoi)}
                title={aoi.name}
              >
                <div className={`absolute -top-6 left-0 px-2 py-1 text-xs rounded ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-yellow-600 text-white'
                }`}>
                  {aoi.name}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-black bg-opacity-50 text-white border-gray-600 hover:bg-gray-800"
            onClick={handleZoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="bg-black bg-opacity-50 text-white border-gray-600 hover:bg-gray-800"
            onClick={handleZoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="bg-black bg-opacity-50 text-white border-gray-600 hover:bg-gray-800"
            onClick={() => fetchSatelliteImagery(selectedAOI?.geojson)}
          >
            <Satellite className="w-4 h-4" />
          </Button>
          
          {imagery && (
            <Button
              size="sm"
              variant="outline"
              className="bg-black bg-opacity-50 text-white border-gray-600 hover:bg-gray-800"
              onClick={() => {
                const link = document.createElement('a')
                link.href = imagery.imageUrl
                link.download = `sentinel-imagery-${new Date().getTime()}.png`
                link.click()
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs text-white">
        <div className="bg-black bg-opacity-50 px-2 py-1 rounded">
          Zoom: {currentZoom}x | Center: {center.lat.toFixed(4)}°, {center.lng.toFixed(4)}°
        </div>
        
        {aois.length > 0 && (
          <div className="bg-black bg-opacity-50 px-2 py-1 rounded">
            {aois.length} AOI{aois.length !== 1 ? 's' : ''} | {selectedAOI ? `Selected: ${selectedAOI.name}` : 'None selected'}
          </div>
        )}
      </div>
    </div>
  )
}