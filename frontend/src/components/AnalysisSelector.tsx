'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const analysisTypes = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    description: 'Complete environmental monitoring using all 4 algorithms for maximum accuracy',
    algorithms: ['EWMA Detection', 'CUSUM Change Detection', 'VedgeSat Coastal Analysis', 'Spectral Analysis'],
    icon: '🔬',
    color: 'purple',
    detectionTypes: ['Vegetation Loss/Gain', 'Construction Activity', 'Coastal Changes', 'Water Quality', 'Deforestation'],
    processingTime: '15-45 seconds',
    accuracy: '85-95%'
  },
  {
    id: 'vegetation',
    name: 'Vegetation Monitoring',
    description: 'Specialized forest and vegetation health analysis with NDVI/EVI processing',
    algorithms: ['EWMA Vegetation Tracker', 'CUSUM Deforestation Detector', 'Enhanced Vegetation Index'],
    icon: '🌿',
    color: 'green',
    detectionTypes: ['Deforestation', 'Vegetation Stress', 'Reforestation', 'Seasonal Changes'],
    processingTime: '10-25 seconds',
    accuracy: '90-97%'
  },
  {
    id: 'water',
    name: 'Water Quality Analysis',
    description: 'Advanced water monitoring with algal bloom and turbidity detection',
    algorithms: ['Spectral Water Analysis', 'EWMA Water Quality', 'Algae Detection Engine'],
    icon: '💧',
    color: 'blue',
    detectionTypes: ['Algal Blooms', 'Turbidity Changes', 'Water Quality Degradation', 'Pollution Events'],
    processingTime: '8-20 seconds',
    accuracy: '80-92%'
  },
  {
    id: 'coastal',
    name: 'Coastal Monitoring',
    description: 'Shoreline erosion and coastal change detection using VedgeSat algorithms',
    algorithms: ['VedgeSat Edge Detection', 'Coastal Change Analysis', 'Subpixel Accuracy Processing'],
    icon: '🏖️',
    color: 'cyan',
    detectionTypes: ['Coastal Erosion', 'Shore Accretion', 'Beach Changes', 'Flood Impacts'],
    processingTime: '20-40 seconds',
    accuracy: '85-93%'
  },
  {
    id: 'construction',
    name: 'Construction Detection',
    description: 'Urban expansion and construction activity monitoring with BSI analysis',
    algorithms: ['CUSUM Construction Detector', 'BSI Change Analysis', 'Urban Development Tracker'],
    icon: '🏗️',
    color: 'orange',
    detectionTypes: ['New Construction', 'Urban Expansion', 'Infrastructure Development', 'Land Clearing'],
    processingTime: '12-30 seconds',
    accuracy: '87-94%'
  }
]

interface AnalysisSelectorProps {
  selectedType: string
  onTypeChange: (type: string) => void
  showAlgorithmDetails?: boolean
  onRunAnalysis?: (type: string) => void
}

export default function AnalysisSelector({ 
  selectedType, 
  onTypeChange, 
  showAlgorithmDetails = true,
  onRunAnalysis
}: AnalysisSelectorProps) {
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const getColorClasses = (color: string, selected: boolean) => {
    const baseClasses = {
      purple: selected ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-200' : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:shadow-md',
      green: selected ? 'bg-green-100 border-green-500 text-green-900 ring-2 ring-green-200' : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:shadow-md',
      blue: selected ? 'bg-blue-100 border-blue-500 text-blue-900 ring-2 ring-blue-200' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md',
      cyan: selected ? 'bg-cyan-100 border-cyan-500 text-cyan-900 ring-2 ring-cyan-200' : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300 hover:shadow-md',
      orange: selected ? 'bg-orange-100 border-orange-500 text-orange-900 ring-2 ring-orange-200' : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:shadow-md'
    }
    return baseClasses[color as keyof typeof baseClasses] || baseClasses.purple
  }

  const handleRunAnalysis = async (type: string) => {
    if (isRunning || !onRunAnalysis) return
    
    setIsRunning(true)
    try {
      await onRunAnalysis(type)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🧠 Enhanced Analysis Options
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose your monitoring focus. Our enhanced system uses research-grade algorithms for maximum accuracy.
        </p>
      </div>

      <div className="space-y-3">
        {analysisTypes.map((type) => {
          const isSelected = selectedType === type.id
          const isExpanded = expandedType === type.id

          return (
            <motion.div
              key={type.id}
              layout
              className={`relative border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                getColorClasses(type.color, isSelected)
              }`}
              onClick={() => onTypeChange(type.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <h4 className="font-semibold text-sm">{type.name}</h4>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>⚡ {type.processingTime}</span>
                          <span>🎯 {type.accuracy}</span>
                          <span>🔧 {type.algorithms.length} algorithms</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      {type.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {onRunAnalysis && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRunAnalysis(type.id)
                        }}
                        disabled={isRunning}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          isSelected 
                            ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isRunning ? 'Running...' : 'Run Analysis'}
                      </button>
                    )}
                    
                    {showAlgorithmDetails && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedType(isExpanded ? null : type.id)
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Detection Types Preview */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {type.detectionTypes.slice(0, 3).map((detectionType, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                    >
                      {detectionType}
                    </span>
                  ))}
                  {type.detectionTypes.length > 3 && (
                    <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                      +{type.detectionTypes.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Algorithm Details Expansion */}
              <AnimatePresence>
                {isExpanded && showAlgorithmDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 bg-gray-50/50 px-4 py-3"
                  >
                    <div className="space-y-3">
                      {/* Algorithm Details */}
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 mb-2">🔬 Algorithm Stack</h5>
                        <div className="grid grid-cols-1 gap-2">
                          {type.algorithms.map((algorithm, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-gray-700 font-medium">{algorithm}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Detection Types */}
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 mb-2">🎯 Detection Capabilities</h5>
                        <div className="flex flex-wrap gap-1">
                          {type.detectionTypes.map((detectionType, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-white border border-gray-200 text-gray-600 text-xs px-2 py-1 rounded"
                            >
                              {detectionType}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                        <div>
                          <div className="text-xs text-gray-500">Processing Time</div>
                          <div className="text-sm font-medium text-gray-900">{type.processingTime}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Accuracy Range</div>
                          <div className="text-sm font-medium text-gray-900">{type.accuracy}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Algorithms</div>
                          <div className="text-sm font-medium text-gray-900">{type.algorithms.length} active</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Selected Analysis Summary */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <div className="text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Ready to run {analysisTypes.find(t => t.id === selectedType)?.name}
              </h4>
              <p className="text-sm text-blue-700">
                This analysis will use {analysisTypes.find(t => t.id === selectedType)?.algorithms.length} research-grade algorithms 
                to detect environmental changes with {analysisTypes.find(t => t.id === selectedType)?.accuracy} accuracy.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}