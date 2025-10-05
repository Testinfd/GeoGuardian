/**
 * AnalysisSelector Component
 * Allows users to choose and configure different analysis types
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Leaf, 
  Droplets, 
  Building, 
  TreePine, 
  MapPin,
  Clock,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Button, Card, Badge, Loading, Alert } from '@/components/ui'
import { useAnalysisStore } from '@/stores/analysis'
import { useAOIStore } from '@/stores/aoi'
import type { AnalysisType, AOI } from '@/types'

interface AnalysisTypeConfig {
  id: AnalysisType
  name: string
  icon: React.ReactNode
  description: string
  processingTime: string
  accuracy: string
  algorithms: string[]
  detectionTypes: string[]
  color: string
  badge?: string
}

const ANALYSIS_TYPES: AnalysisTypeConfig[] = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Complete environmental monitoring using all available algorithms and spectral indices.',
    processingTime: '5-10 minutes',
    accuracy: '85-95%',
    algorithms: ['EWMA', 'CUSUM', 'VedgeSat', 'Spectral Analysis'],
    detectionTypes: ['Vegetation Changes', 'Water Quality', 'Coastal Changes', 'Construction', 'Deforestation'],
    color: 'bg-blue-500',
    badge: 'Recommended'
  },
  {
    id: 'vegetation',
    name: 'Vegetation Monitoring',
    icon: <Leaf className="w-5 h-5" />,
    description: 'Specialized analysis for vegetation health, growth patterns, and deforestation detection.',
    processingTime: '3-5 minutes',
    accuracy: '90-95%',
    algorithms: ['EWMA', 'NDVI Analysis', 'Spectral Indices'],
    detectionTypes: ['Vegetation Loss', 'Vegetation Gain', 'Forest Health', 'Agricultural Changes'],
    color: 'bg-green-500'
  },
  {
    id: 'water',
    name: 'Water Quality Analysis',
    icon: <Droplets className="w-5 h-5" />,
    description: 'Monitor water bodies for quality changes, algal blooms, and pollution detection.',
    processingTime: '2-4 minutes',
    accuracy: '80-90%',
    algorithms: ['Spectral Analysis', 'Water Indices', 'CUSUM'],
    detectionTypes: ['Algal Blooms', 'Water Quality Changes', 'Pollution Events', 'Turbidity Changes'],
    color: 'bg-cyan-500'
  },
  {
    id: 'urban',
    name: 'Urban Development',
    icon: <Building className="w-5 h-5" />,
    description: 'Track urban expansion, construction activities, and infrastructure development.',
    processingTime: '4-6 minutes',
    accuracy: '85-92%',
    algorithms: ['CUSUM', 'Built-up Index', 'Change Detection'],
    detectionTypes: ['New Construction', 'Urban Expansion', 'Infrastructure Changes', 'Land Use Changes'],
    color: 'bg-orange-500'
  },
  {
    id: 'change_detection',
    name: 'General Change Detection',
    icon: <Target className="w-5 h-5" />,
    description: 'Broad change detection across all environmental parameters with high sensitivity.',
    processingTime: '6-8 minutes',
    accuracy: '75-85%',
    algorithms: ['EWMA', 'CUSUM', 'Multi-spectral Analysis'],
    detectionTypes: ['Any Environmental Changes', 'Anomaly Detection', 'Pattern Changes'],
    color: 'bg-purple-500'
  }
]

interface AnalysisTypeSelectorProps {
  selectedType: AnalysisType | null
  onTypeSelect: (type: AnalysisType) => void
  disabled?: boolean
}

function AnalysisTypeSelector({ selectedType, onTypeSelect, disabled }: AnalysisTypeSelectorProps) {
  const [expandedType, setExpandedType] = useState<AnalysisType | null>(null)

  const toggleExpanded = (type: AnalysisType) => {
    setExpandedType(expandedType === type ? null : type)
  }

  return (
    <div className="space-y-3">
      {ANALYSIS_TYPES.map((type) => {
        const isSelected = selectedType === type.id
        const isExpanded = expandedType === type.id

        return (
          <Card 
            key={type.id}
            className={`transition-all duration-200 ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="p-4">
              <div 
                className="flex items-center justify-between"
                onClick={() => !disabled && onTypeSelect(type.id)}
              >
                <div className="flex items-center flex-1">
                  <div className={`p-2 rounded-lg text-white mr-3 ${type.color}`}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                      {type.badge && (
                        <Badge variant="success" size="sm" className="ml-2">
                          {type.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {type.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm text-gray-500 mr-2">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {type.processingTime}
                    </div>
                    <div className="flex items-center mt-1">
                      <Target className="w-3 h-3 mr-1" />
                      {type.accuracy}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e?.stopPropagation()
                      toggleExpanded(type.id)
                    }}
                    disabled={disabled}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Algorithms Used</h4>
                      <div className="flex flex-wrap gap-1">
                        {type.algorithms.map((algorithm) => (
                          <Badge key={algorithm} variant="default" size="sm">
                            {algorithm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Detection Types</h4>
                      <div className="flex flex-wrap gap-1">
                        {type.detectionTypes.map((detection) => (
                          <Badge key={detection} variant="outline" size="sm">
                            {detection}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

interface AnalysisSelectorProps {
  selectedAOI?: AOI | null
  onAnalysisStart?: (type: AnalysisType, aoiId: string) => void
  className?: string
}

export default function AnalysisSelector({ 
  selectedAOI, 
  onAnalysisStart,
  className = '' 
}: AnalysisSelectorProps) {
  const [selectedType, setSelectedType] = useState<AnalysisType | null>('comprehensive')
  const [dateRangeDays, setDateRangeDays] = useState<number>(30)
  const [isRunning, setIsRunning] = useState(false)
  
  const { 
    startAnalysis, 
    capabilities, 
    systemStatus,
    fetchCapabilities,
    fetchSystemStatus,
    isLoading: analysisLoading,
    error 
  } = useAnalysisStore()
  
  const { selectedAOI: storeSelectedAOI } = useAOIStore()

  // Use selectedAOI prop or fall back to store
  const aoi = selectedAOI || storeSelectedAOI

  useEffect(() => {
    // Fetch system capabilities and status on mount
    fetchCapabilities()
    fetchSystemStatus()
  }, [fetchCapabilities, fetchSystemStatus])

  const handleRunAnalysis = async () => {
    if (!selectedType || !aoi) return

    setIsRunning(true)
    
    try {
      await startAnalysis({
        aoi_id: aoi.id,
        analysis_type: selectedType,
        geojson: aoi.geojson,
        date_range_days: dateRangeDays,
        include_spectral_analysis: true,
        include_visualizations: true,
      })

      onAnalysisStart?.(selectedType, aoi.id)
    } catch (error) {
      console.error('Failed to start analysis:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const canRunAnalysis = selectedType && aoi && systemStatus?.status === 'healthy' && !isRunning && !analysisLoading

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Selector</h2>
        <p className="text-gray-600">
          Choose an analysis type to monitor environmental changes in your selected area.
        </p>
      </div>

      {/* AOI Info */}
      {aoi ? (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-green-900">Selected AOI</h3>
              <p className="text-sm text-green-700">{aoi.name}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Alert variant="warning">
          <AlertCircle className="w-4 h-4" />
          <div>
            <h4 className="font-medium">No AOI Selected</h4>
            <p className="text-sm mt-1">
              Please select an Area of Interest from the map or AOI list to run analysis.
            </p>
          </div>
        </Alert>
      )}

      {/* System Status Check */}
      {systemStatus && systemStatus.status !== 'healthy' && (
        <Alert variant="danger">
          <AlertCircle className="w-4 h-4" />
          <div>
            <h4 className="font-medium">System Status: {systemStatus.status}</h4>
            <p className="text-sm mt-1">
              Some services may be unavailable. Please try again later.
            </p>
          </div>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="danger">
          <AlertCircle className="w-4 h-4" />
          <div>
            <h4 className="font-medium">Analysis Error</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </Alert>
      )}

      {/* Date Range Selector */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Historical Data Range</h3>
        <Card className="p-4">
          <div className="flex items-start mb-3">
            <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">How far back to search for satellite imagery?</h4>
              <p className="text-sm text-gray-600">
                Longer date ranges increase chances of finding sufficient data but may reduce change detection accuracy.
                Sentinel-2 revisits every 2-5 days.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { days: 7, label: '7 Days', description: 'Very Recent', recommended: false },
              { days: 30, label: '30 Days', description: 'Recent (Default)', recommended: true },
              { days: 60, label: '60 Days', description: 'Extended', recommended: false },
              { days: 90, label: '90 Days', description: 'Historical', recommended: false },
            ].map((option) => (
              <button
                key={option.days}
                onClick={() => setDateRangeDays(option.days)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  dateRangeDays === option.days
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                {option.recommended && dateRangeDays === option.days && (
                  <Badge variant="success" size="sm" className="mt-2">Recommended</Badge>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                <strong>Tip:</strong> If you get "insufficient data" errors, try increasing the date range to 60-90 days.
                This gives the system more historical images to work with, especially in areas with cloud cover.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Analysis Type Selector */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Choose Analysis Type</h3>
        <AnalysisTypeSelector
          selectedType={selectedType}
          onTypeSelect={setSelectedType}
          disabled={!aoi || isRunning || analysisLoading}
        />
      </div>

      {/* Run Analysis Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleRunAnalysis}
          disabled={!canRunAnalysis}
          size="lg"
          className="px-8"
        >
          {isRunning || analysisLoading ? (
            <>
              <Loading className="mr-2" />
              Starting Analysis...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Run {selectedType ? ANALYSIS_TYPES.find(t => t.id === selectedType)?.name : 'Analysis'}
            </>
          )}
        </Button>
      </div>

      {/* Additional Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Analysis Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• System will search for Sentinel-2 imagery within your selected date range</li>
              <li>• Minimum 2 cloud-free images required for change detection analysis</li>
              <li>• Processing time varies based on area size and analysis complexity (2-10 mins)</li>
              <li>• Results include before/after imagery, statistical analysis, and confidence scores</li>
              <li>• If insufficient data found, try increasing date range or different location</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}