/**
 * Environmental Health Score Component
 * Displays 0-100 environmental health scoring with breakdowns
 */

'use client'

import React from 'react'
import { Card, Badge, Progress } from '@/components/ui'
import { Leaf, Droplets, Building, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import type { EnvironmentalHealthScore as HealthScoreType, SpectralIndex } from '@/types'

interface EnvironmentalHealthScoreProps {
  healthScore?: HealthScoreType
  indices?: Record<string, SpectralIndex> // Fallback to calculate if health_score not provided
  className?: string
}

// Calculate health score from indices if not provided by backend
function calculateHealthScore(indices: Record<string, SpectralIndex>): HealthScoreType {
  let overallScore = 50

  // Vegetation health (25 points max)
  if (indices.ndvi) {
    overallScore += Math.min(indices.ndvi.mean * 25, 25)
  }

  // Water presence (15 points max)
  if (indices.ndwi) {
    const ndwi = indices.ndwi.mean
    if (ndwi > 0) {
      overallScore += Math.min(ndwi * 15, 15)
    }
  }

  // Urbanization penalty (20 points max deduction)
  if (indices.ndbi) {
    if (indices.ndbi.mean > 0.1) {
      overallScore -= Math.min(indices.ndbi.mean * 20, 20)
    }
  }

  overallScore = Math.max(0, Math.min(100, overallScore))

  // Calculate component scores
  const vegetationHealth = indices.ndvi ? Math.min(Math.max((indices.ndvi.mean + 1) * 50, 0), 100) : 50
  const waterHealth = indices.ndwi ? Math.min(Math.max((indices.ndwi.mean + 1) * 50, 0), 100) : 50
  const urbanizationImpact = indices.ndbi ? Math.min(indices.ndbi.mean * 100, 100) : 0

  // Determine dominant feature
  let dominantFeature = 'Mixed'
  if (indices.ndvi && indices.ndvi.mean > 0.4) dominantFeature = 'Vegetation'
  else if (indices.ndwi && indices.ndwi.mean > 0.3) dominantFeature = 'Water Body'
  else if (indices.ndbi && indices.ndbi.mean > 0.2) dominantFeature = 'Urban Area'

  return {
    overall_score: overallScore,
    vegetation_health: vegetationHealth,
    water_health: waterHealth,
    urbanization_impact: urbanizationImpact,
    dominant_feature: dominantFeature
  }
}

export default function EnvironmentalHealthScore({ 
  healthScore, 
  indices, 
  className = '' 
}: EnvironmentalHealthScoreProps) {
  // Calculate health score if not provided
  const score = healthScore || (indices ? calculateHealthScore(indices) : null)

  if (!score) {
    return null
  }

  // Determine overall health level and styling
  const getHealthLevel = (score: number): { 
    label: string
    color: string
    bgColor: string
    icon: React.ReactNode
    description: string
  } => {
    if (score >= 80) return {
      label: 'Excellent',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="w-6 h-6" />,
      description: 'Ecosystem shows strong environmental health indicators'
    }
    if (score >= 60) return {
      label: 'Good',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      icon: <TrendingUp className="w-6 h-6" />,
      description: 'Environmental conditions are generally favorable'
    }
    if (score >= 40) return {
      label: 'Fair',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: <AlertTriangle className="w-6 h-6" />,
      description: 'Some environmental concerns detected, monitoring recommended'
    }
    return {
      label: 'Poor',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      icon: <TrendingDown className="w-6 h-6" />,
      description: 'Significant environmental degradation or stress indicators'
    }
  }

  const healthLevel = getHealthLevel(score.overall_score)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Score Card */}
      <Card className={`p-6 border-2 ${healthLevel.bgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`${healthLevel.color} mr-4`}>
              {healthLevel.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Environmental Health Score</h2>
              <p className="text-sm text-gray-600 mt-1">{healthLevel.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-gray-900">{Math.round(score.overall_score)}</div>
            <div className="text-sm text-gray-500 mt-1">out of 100</div>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Overall Health</span>
            <span className={`font-semibold ${healthLevel.color}`}>{healthLevel.label}</span>
          </div>
          <Progress value={score.overall_score} className="h-3" />
        </div>

        {score.dominant_feature && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dominant Feature</span>
              <Badge variant="default">{score.dominant_feature}</Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Component Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Components</h3>
        
        <div className="space-y-4">
          {/* Vegetation Health */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Leaf className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Vegetation Health</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {Math.round(score.vegetation_health)}/100
              </span>
            </div>
            <Progress value={score.vegetation_health} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {score.vegetation_health >= 70 ? 'Strong vegetation coverage and health' :
               score.vegetation_health >= 40 ? 'Moderate vegetation, some stress indicators' :
               'Low vegetation or significant stress'}
            </p>
          </div>

          {/* Water Health */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Droplets className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Water Quality</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {Math.round(score.water_health)}/100
              </span>
            </div>
            <Progress value={score.water_health} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {score.water_health >= 70 ? 'Clean water bodies detected' :
               score.water_health >= 40 ? 'Moderate water quality' :
               'Limited water presence or quality concerns'}
            </p>
          </div>

          {/* Urbanization Impact */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Building className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Urbanization Impact</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {Math.round(score.urbanization_impact)}/100
              </span>
            </div>
            <Progress value={score.urbanization_impact} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {score.urbanization_impact < 30 ? 'Minimal urban development' :
               score.urbanization_impact < 60 ? 'Moderate urban presence' :
               'Significant urban or built-up areas'}
            </p>
          </div>
        </div>

        {/* Interpretation Guide */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Interpretation Guide</h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div>
              <span className="font-medium text-green-600">80-100:</span> Excellent health
            </div>
            <div>
              <span className="font-medium text-blue-600">60-79:</span> Good health
            </div>
            <div>
              <span className="font-medium text-yellow-600">40-59:</span> Fair health
            </div>
            <div>
              <span className="font-medium text-red-600">0-39:</span> Poor health
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

