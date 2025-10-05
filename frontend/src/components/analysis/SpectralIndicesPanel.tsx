/**
 * Spectral Indices Panel
 * Displays all spectral indices with statistics (mean, min, max, std)
 */

'use client'

import React, { useState } from 'react'
import { Card, Badge } from '@/components/ui'
import { Leaf, Droplets, Building, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import type { SpectralIndex } from '@/types'

interface SpectralIndicesPanelProps {
  indices: Record<string, SpectralIndex>
  className?: string
}

// Index metadata for display
const INDEX_METADATA: Record<string, {
  name: string
  description: string
  icon: React.ReactNode
  color: string
  interpretation: {
    high: string
    low: string
  }
}> = {
  ndvi: {
    name: 'NDVI',
    description: 'Normalized Difference Vegetation Index',
    icon: <Leaf className="w-4 h-4" />,
    color: 'text-green-600',
    interpretation: {
      high: 'Healthy vegetation',
      low: 'Sparse/stressed vegetation'
    }
  },
  evi: {
    name: 'EVI',
    description: 'Enhanced Vegetation Index',
    icon: <Leaf className="w-4 h-4" />,
    color: 'text-green-600',
    interpretation: {
      high: 'Dense vegetation',
      low: 'Low vegetation'
    }
  },
  ndwi: {
    name: 'NDWI',
    description: 'Normalized Difference Water Index',
    icon: <Droplets className="w-4 h-4" />,
    color: 'text-blue-600',
    interpretation: {
      high: 'Water present',
      low: 'Dry/no water'
    }
  },
  mndwi: {
    name: 'MNDWI',
    description: 'Modified NDWI',
    icon: <Droplets className="w-4 h-4" />,
    color: 'text-blue-600',
    interpretation: {
      high: 'Water bodies',
      low: 'Land surface'
    }
  },
  ndbi: {
    name: 'NDBI',
    description: 'Normalized Difference Built-up Index',
    icon: <Building className="w-4 h-4" />,
    color: 'text-orange-600',
    interpretation: {
      high: 'Urban/built-up areas',
      low: 'Natural surfaces'
    }
  },
  bsi: {
    name: 'BSI',
    description: 'Bare Soil Index',
    icon: <Minus className="w-4 h-4" />,
    color: 'text-yellow-600',
    interpretation: {
      high: 'Exposed soil',
      low: 'Vegetated soil'
    }
  },
  savi: {
    name: 'SAVI',
    description: 'Soil Adjusted Vegetation Index',
    icon: <Leaf className="w-4 h-4" />,
    color: 'text-green-600',
    interpretation: {
      high: 'Healthy vegetation',
      low: 'Sparse vegetation/soil'
    }
  },
  algae_index: {
    name: 'Algae Index',
    description: 'Algal Bloom Detection',
    icon: <Droplets className="w-4 h-4" />,
    color: 'text-cyan-600',
    interpretation: {
      high: 'Potential algal blooms',
      low: 'Clear water'
    }
  },
  turbidity_index: {
    name: 'Turbidity',
    description: 'Water Turbidity Index',
    icon: <Droplets className="w-4 h-4" />,
    color: 'text-blue-600',
    interpretation: {
      high: 'High turbidity/sediment',
      low: 'Clear water'
    }
  },
  bai: {
    name: 'BAI',
    description: 'Built-up Area Index',
    icon: <Building className="w-4 h-4" />,
    color: 'text-orange-600',
    interpretation: {
      high: 'Urban development',
      low: 'Natural areas'
    }
  },
  nbri: {
    name: 'NBRI',
    description: 'Normalized Burn Ratio Index',
    icon: <TrendingDown className="w-4 h-4" />,
    color: 'text-red-600',
    interpretation: {
      high: 'Healthy vegetation',
      low: 'Burned/stressed areas'
    }
  },
  thermal_proxy: {
    name: 'Thermal Proxy',
    description: 'Surface Temperature Indicator',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-red-600',
    interpretation: {
      high: 'Higher temperature',
      low: 'Lower temperature'
    }
  }
}

function IndexCard({ indexKey, index }: { indexKey: string, index: SpectralIndex }) {
  const [showDetails, setShowDetails] = useState(false)
  const metadata = INDEX_METADATA[indexKey] || {
    name: indexKey.toUpperCase(),
    description: 'Spectral Index',
    icon: <Info className="w-4 h-4" />,
    color: 'text-gray-600',
    interpretation: { high: 'High value', low: 'Low value' }
  }

  // Determine trend based on mean value (simplified)
  const getTrend = () => {
    if (index.mean > 0.5) return { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600', label: 'High' }
    if (index.mean < -0.5) return { icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-600', label: 'Low' }
    return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-600', label: 'Moderate' }
  }

  const trend = getTrend()

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div 
        className="cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg bg-gray-100 ${metadata.color} mr-3`}>
              {metadata.icon}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{metadata.name}</h4>
              <p className="text-xs text-gray-500">{metadata.description}</p>
            </div>
          </div>
          <div className={`flex items-center ${trend.color}`}>
            {trend.icon}
            <span className="text-xs font-medium ml-1">{trend.label}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Mean</span>
            <span className="text-lg font-bold text-gray-900">{index.mean.toFixed(3)}</span>
          </div>
          
          {showDetails && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Min</span>
                <span className="font-medium">{index.min.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Max</span>
                <span className="font-medium">{index.max.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Std Dev</span>
                <span className="font-medium">{index.std.toFixed(3)}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-1">
                  <strong>High:</strong> {metadata.interpretation.high}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Low:</strong> {metadata.interpretation.low}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function SpectralIndicesPanel({ indices, className = '' }: SpectralIndicesPanelProps) {
  if (!indices || Object.keys(indices).length === 0) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">No Spectral Indices Available</h3>
        <p className="text-gray-600">Spectral analysis data is not available for this result.</p>
      </Card>
    )
  }

  // Group indices by category
  const vegetationIndices = ['ndvi', 'evi', 'savi', 'nbri']
  const waterIndices = ['ndwi', 'mndwi', 'algae_index', 'turbidity_index']
  const urbanIndices = ['ndbi', 'bsi', 'bai']
  const otherIndices = Object.keys(indices).filter(
    key => ![...vegetationIndices, ...waterIndices, ...urbanIndices].includes(key)
  )

  const categories = [
    { title: 'Vegetation Indices', keys: vegetationIndices, color: 'border-green-200 bg-green-50' },
    { title: 'Water Indices', keys: waterIndices, color: 'border-blue-200 bg-blue-50' },
    { title: 'Urban & Soil Indices', keys: urbanIndices, color: 'border-orange-200 bg-orange-50' },
    { title: 'Other Indices', keys: otherIndices, color: 'border-gray-200 bg-gray-50' }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Spectral Indices Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">
            {Object.keys(indices).length} indices calculated • Click cards for details
          </p>
        </div>
        <Badge variant="default">
          {Object.keys(indices).length} Indices
        </Badge>
      </div>

      {categories.map((category) => {
        const availableIndices = category.keys.filter(key => indices[key])
        if (availableIndices.length === 0) return null

        return (
          <div key={category.title}>
            <div className={`px-3 py-2 rounded-md mb-3 ${category.color} border`}>
              <h3 className="font-medium text-gray-900">{category.title}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableIndices.map(key => (
                <IndexCard key={key} indexKey={key} index={indices[key]} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

