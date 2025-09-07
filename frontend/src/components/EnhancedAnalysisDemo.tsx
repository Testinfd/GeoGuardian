'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnalysisSelector from './AnalysisSelector'
import { analysisAPI } from '@/services/api'

interface DemoAnalysisResult {
  success: boolean
  analysis_type: string
  overall_confidence: number
  priority_level: 'high' | 'medium' | 'low' | 'info'
  processing_time_seconds: number
  algorithms_used: string[]
  detections: Array<{
    type: string
    algorithm: string
    change_detected: boolean
    confidence: number
    severity?: string
    spectral_indices?: Record<string, number>
  }>
  spectral_indices?: Record<string, number>
}

const mockDemoResults: Record<string, DemoAnalysisResult> = {
  comprehensive: {
    success: true,
    analysis_type: 'comprehensive',
    overall_confidence: 0.87,
    priority_level: 'high',
    processing_time_seconds: 23.4,
    algorithms_used: ['EWMA', 'CUSUM', 'VedgeSat', 'Spectral Analysis'],
    detections: [
      {
        type: 'construction_analysis',
        algorithm: 'cusum_construction',
        change_detected: true,
        confidence: 0.91,
        severity: 'high',
        spectral_indices: { bsi: 0.24, ndvi: -0.15 }
      },
      {
        type: 'vegetation_analysis', 
        algorithm: 'ewma_vegetation',
        change_detected: true,
        confidence: 0.82,
        severity: 'moderate',
        spectral_indices: { ndvi: -0.22, evi: -0.18 }
      },
      {
        type: 'water_quality_analysis',
        algorithm: 'spectral_water_quality',
        change_detected: false,
        confidence: 0.34
      }
    ],
    spectral_indices: {
      ndvi: 0.45, evi: 0.38, ndwi: 0.12, mndwi: 0.08, bsi: 0.24,
      algae_index: 0.15, turbidity_index: 0.22, savi: 0.41
    }
  },
  vegetation: {
    success: true,
    analysis_type: 'vegetation',
    overall_confidence: 0.93,
    priority_level: 'high',
    processing_time_seconds: 18.7,
    algorithms_used: ['EWMA Vegetation', 'CUSUM Deforestation', 'Enhanced Vegetation Index'],
    detections: [
      {
        type: 'deforestation_analysis',
        algorithm: 'cusum_deforestation',
        change_detected: true,
        confidence: 0.94,
        severity: 'high',
        spectral_indices: { ndvi: -0.35, evi: -0.28, savi: -0.31 }
      },
      {
        type: 'vegetation_analysis',
        algorithm: 'ewma_vegetation',
        change_detected: true,
        confidence: 0.91,
        severity: 'high'
      }
    ],
    spectral_indices: {
      ndvi: 0.28, evi: 0.21, savi: 0.25, arvi: 0.19, gndvi: 0.22
    }
  },
  water: {
    success: true,
    analysis_type: 'water',
    overall_confidence: 0.78,
    priority_level: 'medium',
    processing_time_seconds: 12.3,
    algorithms_used: ['Spectral Water Analysis', 'EWMA Water Quality', 'Algae Detection Engine'],
    detections: [
      {
        type: 'water_quality_analysis',
        algorithm: 'spectral_water_quality',
        change_detected: true,
        confidence: 0.81,
        severity: 'moderate',
        spectral_indices: { algae_index: 0.34, turbidity_index: 0.28 }
      },
      {
        type: 'algal_bloom_analysis',
        algorithm: 'ewma_water_quality', 
        change_detected: true,
        confidence: 0.75,
        severity: 'moderate'
      }
    ],
    spectral_indices: {
      ndwi: 0.45, mndwi: 0.38, algae_index: 0.34, turbidity_index: 0.28,
      chl_red_edge: 0.22, water_clarity: 0.15
    }
  },
  coastal: {
    success: true,
    analysis_type: 'coastal',
    overall_confidence: 0.85,
    priority_level: 'medium',
    processing_time_seconds: 31.2,
    algorithms_used: ['VedgeSat Edge Detection', 'Coastal Change Analysis', 'Subpixel Accuracy Processing'],
    detections: [
      {
        type: 'coastal_analysis',
        algorithm: 'vedgesat_coastal',
        change_detected: true,
        confidence: 0.87,
        severity: 'moderate'
      },
      {
        type: 'coastal_erosion_analysis',
        algorithm: 'edge_detection',
        change_detected: true,
        confidence: 0.83,
        severity: 'moderate'
      }
    ],
    spectral_indices: {
      ndwi: 0.52, mndwi: 0.47, coastal_index: 0.29, edge_strength: 0.78
    }
  },
  construction: {
    success: true,
    analysis_type: 'construction',
    overall_confidence: 0.89,
    priority_level: 'high',
    processing_time_seconds: 19.8,
    algorithms_used: ['CUSUM Construction Detector', 'BSI Change Analysis', 'Urban Development Tracker'],
    detections: [
      {
        type: 'construction_analysis',
        algorithm: 'cusum_construction',
        change_detected: true,
        confidence: 0.92,
        severity: 'high',
        spectral_indices: { bsi: 0.41, ndvi: -0.25 }
      },
      {
        type: 'urban_expansion_analysis',
        algorithm: 'urban_development_tracker',
        change_detected: true,
        confidence: 0.86,
        severity: 'high'
      }
    ],
    spectral_indices: {
      bsi: 0.41, ndvi: 0.18, evi: 0.15, urban_index: 0.67, construction_index: 0.73
    }
  }
}

export default function EnhancedAnalysisDemo() {
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('comprehensive')
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DemoAnalysisResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleRunAnalysis = async (analysisType: string) => {
    setIsRunning(true)
    setResults(null)
    setShowResults(false)

    // Simulate realistic processing time
    const mockResult = mockDemoResults[analysisType]
    
    // Show processing steps
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate the actual processing time from the mock result
    const processingTime = mockResult.processing_time_seconds * 100 // Speed up for demo
    await new Promise(resolve => setTimeout(resolve, processingTime))
    
    setResults(mockResult)
    setShowResults(true)
    setIsRunning(false)
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-700 bg-red-100',
      medium: 'text-yellow-700 bg-yellow-100', 
      low: 'text-blue-700 bg-blue-100',
      info: 'text-gray-700 bg-gray-100'
    }
    return colors[priority as keyof typeof colors] || colors.info
  }

  const getSeverityColor = (severity?: string) => {
    const colors = {
      high: 'text-red-600',
      moderate: 'text-yellow-600',
      low: 'text-green-600',
      negligible: 'text-gray-500'
    }
    return colors[severity as keyof typeof colors] || 'text-gray-500'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">🔬 Interactive Analysis Demo</h3>
        <p className="text-sm text-gray-600 mt-1">
          Test our research-grade algorithms with real processing simulation
        </p>
      </div>

      {/* Analysis Selector */}
      <div className="p-4">
        <AnalysisSelector
          selectedType={selectedAnalysisType}
          onTypeChange={setSelectedAnalysisType}
          onRunAnalysis={handleRunAnalysis}
          showAlgorithmDetails={false}
        />
      </div>

      {/* Processing Status */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 bg-blue-50 px-4 py-4"
          >
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <div>
                <div className="text-sm font-medium text-blue-900">Processing Analysis...</div>
                <div className="text-xs text-blue-600 mt-1">
                  Running {mockDemoResults[selectedAnalysisType]?.algorithms_used.length} algorithms • 
                  Analyzing satellite imagery • Calculating confidence scores
                </div>
              </div>
            </div>
            
            <div className="mt-3 bg-white rounded p-3 border border-blue-200">
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Fetching Sentinel-2 satellite imagery...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Calculating spectral indices (NDVI, EVI, BSI, etc.)...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Running {mockDemoResults[selectedAnalysisType]?.algorithms_used.join(', ')}...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Generating confidence scores and visualizations...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {showResults && results && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 bg-gray-50"
          >
            <div className="p-4 space-y-4">
              {/* Overall Results */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Analysis Results</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(results.priority_level)}`}>
                    {results.priority_level.toUpperCase()} PRIORITY
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{Math.round(results.overall_confidence * 100)}%</div>
                    <div className="text-sm text-gray-500">Overall Confidence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{results.processing_time_seconds}s</div>
                    <div className="text-sm text-gray-500">Processing Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{results.algorithms_used.length}</div>
                    <div className="text-sm text-gray-500">Algorithms Used</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <div className="text-sm text-gray-600 mb-2">Algorithms:</div>
                  <div className="flex flex-wrap gap-2">
                    {results.algorithms_used.map((algorithm, idx) => (
                      <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {algorithm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detection Results */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-md font-semibold text-gray-900 mb-3">🎯 Detection Results</h4>
                <div className="space-y-3">
                  {results.detections.map((detection, idx) => (
                    <div key={idx} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${detection.change_detected ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                          <span className="font-medium text-sm capitalize">{detection.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {detection.severity && (
                            <span className={`text-xs font-medium ${getSeverityColor(detection.severity)}`}>
                              {detection.severity.toUpperCase()}
                            </span>
                          )}
                          <span className="text-sm font-bold">{Math.round(detection.confidence * 100)}%</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">Algorithm: {detection.algorithm}</div>
                      
                      {detection.spectral_indices && (
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-xs text-gray-600 mb-1">Spectral Evidence:</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(detection.spectral_indices).map(([key, value]) => (
                              <span key={key} className="inline-block bg-white text-gray-700 text-xs px-2 py-1 rounded border">
                                {key.toUpperCase()}: {value.toFixed(3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-600 mt-2">
                        Status: {detection.change_detected ? 
                          <span className="text-red-600 font-medium">⚠️ Change Detected</span> : 
                          <span className="text-green-600">✅ No Significant Changes</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spectral Analysis */}
              {results.spectral_indices && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">🌈 Spectral Analysis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(results.spectral_indices).map(([index, value]) => (
                      <div key={index} className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-xs text-gray-500 uppercase">{index}</div>
                        <div className="text-sm font-bold text-gray-900">{value.toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Comprehensive 13-band Sentinel-2 spectral analysis completed
                  </div>
                </div>
              )}

              {/* Demo Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>📋 Demo Note:</strong> This demonstrates the enhanced analysis capabilities with realistic processing simulation. 
                  In production, this would analyze real satellite imagery from your AOI with the same algorithmic rigor.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}