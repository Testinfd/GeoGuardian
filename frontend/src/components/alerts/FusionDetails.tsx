/**
 * FusionDetails - Comprehensive display of fusion analysis results
 */

import React from 'react';
import { Card } from '@/components/ui';
import { FusionBadge } from './FusionBadge';
import { CategoryBadge } from './CategoryBadge';
import { Target, TrendingUp, Calendar, Lightbulb, Activity } from 'lucide-react';

interface FusionDetailsProps {
  fusionAnalysis: {
    composite_risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    confidence: number;
    primary_indicators: string[];
    supporting_evidence: string[];
    seasonal_likelihood: number;
    recommendation: string;
    details: {
      index_changes: Record<string, number>;
      significant_changes: string[];
      total_indicators: number;
    };
  };
}

export function FusionDetails({ fusionAnalysis }: FusionDetailsProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Multi-Sensor Fusion Analysis</h3>
      </div>
      
      {/* Risk and Category */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FusionBadge 
          riskLevel={fusionAnalysis.risk_level} 
          riskScore={fusionAnalysis.composite_risk_score}
        />
        <CategoryBadge category={fusionAnalysis.category} />
      </div>

      {/* Confidence */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Analysis Confidence</span>
          <span className="text-sm font-semibold text-gray-900">
            {(fusionAnalysis.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${fusionAnalysis.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Primary Indicators */}
      {fusionAnalysis.primary_indicators.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-gray-900">Primary Indicators</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {fusionAnalysis.primary_indicators.map((indicator) => (
              <span
                key={indicator}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium uppercase"
              >
                {indicator}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Supporting Evidence */}
      {fusionAnalysis.supporting_evidence.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Supporting Evidence</h4>
          </div>
          <ul className="space-y-2">
            {fusionAnalysis.supporting_evidence.map((evidence, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2">•</span>
                <span>{evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seasonal Likelihood */}
      {fusionAnalysis.seasonal_likelihood > 0.3 && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-900">Seasonal Pattern Detected</span>
          </div>
          <p className="text-sm text-amber-700">
            This change has a {(fusionAnalysis.seasonal_likelihood * 100).toFixed(0)}% 
            likelihood of being a seasonal variation.
          </p>
        </div>
      )}

      {/* Recommendation */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Recommendation</h4>
            <p className="text-sm text-blue-700">{fusionAnalysis.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Index Changes Summary */}
      {fusionAnalysis.details && Object.keys(fusionAnalysis.details.index_changes || {}).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Spectral Index Changes</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(fusionAnalysis.details.index_changes).map(([index, change]) => (
              <div key={index} className="text-sm">
                <span className="text-gray-600 uppercase">{index}:</span>{' '}
                <span className={`font-medium ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
