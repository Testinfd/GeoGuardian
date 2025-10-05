/**
 * Fusion Results Panel
 * Displays multi-sensor fusion analysis with risk scores and recommendations
 */

'use client'

import React from 'react'
import { Card, Badge, Progress } from '@/components/ui'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Lightbulb,
  Target,
  Calendar,
  FileText
} from 'lucide-react'
import type { FusionAnalysis } from '@/types'

interface FusionResultsPanelProps {
  fusion: FusionAnalysis
  className?: string
}

export default function FusionResultsPanel({ fusion, className = '' }: FusionResultsPanelProps) {
  if (!fusion) {
    return null
  }

  // Risk level configuration
  const getRiskConfig = (level: string): {
    label: string
    color: string
    bgColor: string
    badgeVariant: 'success' | 'warning' | 'danger' | 'default'
    icon: React.ReactNode
  } => {
    switch (level) {
      case 'critical':
        return {
          label: 'Critical Risk',
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          badgeVariant: 'danger',
          icon: <AlertTriangle className="w-6 h-6" />
        }
      case 'high':
        return {
          label: 'High Risk',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200',
          badgeVariant: 'warning',
          icon: <AlertTriangle className="w-6 h-6" />
        }
      case 'moderate':
      case 'medium':
        return {
          label: 'Moderate Risk',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          badgeVariant: 'warning',
          icon: <Shield className="w-6 h-6" />
        }
      default:
        return {
          label: 'Low Risk',
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          badgeVariant: 'success',
          icon: <CheckCircle className="w-6 h-6" />
        }
    }
  }

  const riskConfig = getRiskConfig(fusion.risk_level)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Risk Overview Card */}
      <Card className={`p-6 border-2 ${riskConfig.bgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`${riskConfig.color} mr-4`}>
              {riskConfig.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Multi-Sensor Fusion Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">AI-powered risk assessment combining multiple data sources</p>
            </div>
          </div>
          <Badge variant={riskConfig.badgeVariant} className="text-lg px-4 py-2">
            {riskConfig.label}
          </Badge>
        </div>

        {/* Composite Risk Score */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Composite Risk Score</span>
            <span className={`text-3xl font-bold ${riskConfig.color}`}>
              {(fusion.composite_risk_score * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={fusion.composite_risk_score * 100} className="h-3" />
        </div>

        {/* Confidence and Category */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center mb-1">
              <Target className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-xs font-medium text-gray-600">Confidence</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {(fusion.confidence * 100).toFixed(1)}%
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center mb-1">
              <FileText className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-xs font-medium text-gray-600">Category</span>
            </div>
            <div className="text-sm font-medium text-gray-900 capitalize">
              {fusion.category.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Seasonal Likelihood */}
        {fusion.seasonal_likelihood !== undefined && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-xs font-medium text-gray-600">Seasonal Pattern Likelihood</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {(fusion.seasonal_likelihood * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={fusion.seasonal_likelihood * 100} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {fusion.seasonal_likelihood < 0.3 
                ? 'Unlikely to be seasonal - potential real environmental change'
                : fusion.seasonal_likelihood < 0.7
                ? 'Possible seasonal variation - monitor for trends'
                : 'High seasonal pattern - changes may be natural'}
            </p>
          </div>
        )}
      </Card>

      {/* Analysis Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Details</h3>

        {/* Primary Indicators */}
        {fusion.primary_indicators && fusion.primary_indicators.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Primary Indicators
            </h4>
            <div className="flex flex-wrap gap-2">
              {fusion.primary_indicators.map((indicator, idx) => (
                <Badge key={idx} variant="default">
                  {indicator.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Supporting Evidence */}
        {fusion.supporting_evidence && fusion.supporting_evidence.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Supporting Evidence
            </h4>
            <ul className="space-y-2">
              {fusion.supporting_evidence.map((evidence, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>{evidence}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Factors */}
        {fusion.details?.risk_factors && fusion.details.risk_factors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
              Risk Factors
            </h4>
            <div className="flex flex-wrap gap-2">
              {fusion.details.risk_factors.map((factor, idx) => (
                <Badge key={idx} variant="warning" size="sm">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Temporal & Spatial Patterns */}
        {(fusion.details?.temporal_trends || fusion.details?.spatial_patterns) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {fusion.details?.temporal_trends && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Temporal Trend</h4>
                <p className="text-sm text-gray-900 capitalize">{fusion.details.temporal_trends}</p>
              </div>
            )}
            {fusion.details?.spatial_patterns && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Spatial Pattern</h4>
                <p className="text-sm text-gray-900 capitalize">
                  {fusion.details.spatial_patterns.replace(/_/g, ' ')}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Recommendation */}
      {fusion.recommendation && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <Lightbulb className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommended Action</h3>
              <p className="text-gray-700 leading-relaxed">{fusion.recommendation}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

