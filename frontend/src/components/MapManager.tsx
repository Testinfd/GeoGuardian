'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { aoiAPI } from '@/services/api'
import { tileProviders, defaultProvider, TileProvider } from '@/config/mapConfig'
import toast from 'react-hot-toast'

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

interface AOI {
  id: string
  name: string
  geometry?: any
  geojson?: any
  status?: 'monitoring' | 'alert' | 'inactive'
  lastAlert?: Date
  created_at?: string
}

interface NewAOIModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string) => void
  loading: boolean
}

function NewAOIModal({ isOpen, onClose, onSubmit, loading }: NewAOIModalProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
      setName('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Name Your Monitoring Area</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter area name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring"
                autoFocus
                disabled={loading}
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || loading}
                  className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 flex items-center space-x-2 transition-all focus-ring"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>Create AOI</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface MapManagerProps {
  onAOISelect?: (aoi: AOI | null) => void
  selectedAOI?: AOI | null
}

export default function MapManager({ onAOISelect, selectedAOI }: MapManagerProps) {
  const [showModal, setShowModal] = useState(false)
  const [pendingGeometry, setPendingGeometry] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentTileProvider, setCurrentTileProvider] = useState<TileProvider>(defaultProvider)
  const [showLayerSwitcher, setShowLayerSwitcher] = useState(false)
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  const mapRef = useRef<L.Map>(null)

  // Fetch AOIs
  const { data: aois = [], refetch } = useQuery({
    queryKey: ['aois'],
    queryFn: async () => {
      const response = await aoiAPI.getAll()
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Focus on selected AOI
  useEffect(() => {
    if (selectedAOI && mapRef.current) {
      try {
        const geoData = selectedAOI.geometry || selectedAOI.geojson
        if (geoData) {
          const bounds = L.geoJSON(geoData).getBounds()
          mapRef.current.fitBounds(bounds, { padding: [20, 20] })
        }
      } catch (error) {
        console.error('Error focusing on AOI:', error)
      }
    }
  }, [selectedAOI])

  const handleCreated = (e: any) => {
    const layer = e.layer
    const geometry = layer.toGeoJSON().geometry
    
    // Limit to 5 AOIs
    if (aois.length >= 5) {
      toast.error('Maximum 5 monitoring areas allowed')
      return
    }
    
    setPendingGeometry(geometry)
    setShowModal(true)
    
    // Remove the drawn layer temporarily
    if (featureGroupRef.current) {
      featureGroupRef.current.removeLayer(layer)
    }
  }

  const handleCreateAOI = async (name: string) => {
    if (!pendingGeometry) return
    
    setIsCreating(true)
    try {
      const response = await aoiAPI.create({
        name,
        geometry: pendingGeometry,
      })
      
      const result = response.data
      
      // Show appropriate message based on whether AOI was saved
      if (result?.saved) {
        toast.success('Monitoring area created and saved successfully!')
      } else {
        toast.success(result?.message || 'Monitoring area created (login to save permanently)')
      }
      
      refetch() // Refresh the AOI list
      
      setShowModal(false)
      setPendingGeometry(null)
    } catch (error: any) {
      console.error('Error creating AOI:', error)
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to create monitoring area'
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const getAOIColor = (status?: string) => {
    switch (status) {
      case 'alert': return '#ef4444'
      case 'monitoring': return '#0ea5e9'
      case 'inactive': return '#6b7280'
      default: return '#0ea5e9' // Default to monitoring blue
    }
  }

  const handleAOIClick = (aoi: AOI) => {
    onAOISelect?.(aoi)
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={[20.0, 77.0]} // Center of India
        zoom={6}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          key={currentTileProvider.name}
          url={currentTileProvider.url}
          attribution={currentTileProvider.attribution}
          maxZoom={currentTileProvider.maxZoom}
        />
        
        {/* Drawing tools */}
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                showArea: true,
                drawError: {
                  color: '#e1e100',
                  message: '<strong>Area cannot intersect!</strong>',
                },
                shapeOptions: {
                  color: '#0ea5e9',
                  weight: 2,
                  fillOpacity: 0.2,
                },
              },
            }}
            edit={{
              remove: false,
              edit: false,
            }}
          />
        </FeatureGroup>

        {/* Render existing AOIs */}
        {aois.map((aoi: AOI) => (
          <GeoJSON
            key={aoi.id}
            data={aoi.geometry || aoi.geojson}
            style={{
              color: getAOIColor(aoi.status),
              weight: selectedAOI?.id === aoi.id ? 3 : 2,
              fillOpacity: selectedAOI?.id === aoi.id ? 0.3 : 0.1,
              dashArray: aoi.status === 'inactive' ? '5, 5' : undefined,
            }}
            eventHandlers={{
              click: () => handleAOIClick(aoi),
            }}
          />
        ))}
      </MapContainer>

      {/* Instructions overlay */}
      {aois.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-[400]"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 text-sm">✏️</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Create Your First Monitoring Area
              </h3>
              <p className="text-xs text-gray-600">
                Use the polygon tool in the top-right corner to draw an area on the map. 
                You can monitor up to 5 areas for environmental changes.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Layer Switcher */}
      <div className="absolute top-4 right-4 z-[400]">
        <div className="relative">
          <button
            onClick={() => setShowLayerSwitcher(!showLayerSwitcher)}
            className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white transition-colors"
            title="Switch Map Layer"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
          
          <AnimatePresence>
            {showLayerSwitcher && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 right-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] overflow-hidden"
              >
                <div className="p-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Layers</h3>
                  {tileProviders.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => {
                        setCurrentTileProvider(provider)
                        setShowLayerSwitcher(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        currentTileProvider.name === provider.name
                          ? 'bg-primary-100 text-primary-900'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{provider.description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AOI count indicator */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[400]">
        <span className="text-sm font-medium text-gray-700">
          {aois.length}/5 Areas
        </span>
      </div>

      {/* Current layer indicator */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[400]">
        <span className="text-xs text-gray-600">
          Layer: <span className="font-medium">{currentTileProvider.name}</span>
        </span>
      </div>

      <NewAOIModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setPendingGeometry(null)
        }}
        onSubmit={handleCreateAOI}
        loading={isCreating}
      />
    </div>
  )
}
