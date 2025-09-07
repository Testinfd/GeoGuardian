'use client';

import { useState } from 'react';
import { CheckIcon, XMarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import { alertsAPI } from '@/services/api';

interface Alert {
  id: string;
  aoi_id: string;
  gif_url?: string;
  type: 'trash' | 'algal_bloom' | 'construction' | 'vegetation_loss' | 'vegetation_gain' | 
        'deforestation' | 'coastal_erosion' | 'coastal_accretion' | 'water_quality_change' | 
        'potential_pollution' | 'urban_expansion' | 'other';
  confidence: number;
  confirmed: boolean;
  processing: boolean;
  created_at: string;
  
  // Enhanced fields
  overall_confidence?: number;
  priority_level?: 'high' | 'medium' | 'low' | 'info';
  algorithm_results?: Array<{
    algorithm_name: string;
    change_detected: boolean;
    confidence: number;
    change_type?: string;
    severity?: string;
  }>;
  spectral_indices?: {
    ndvi?: number;
    evi?: number;
    ndwi?: number;
    mndwi?: number;
    bsi?: number;
    algae_index?: number;
    turbidity_index?: number;
  };
  algorithms_used?: string[];
  analysis_type?: string;
}

interface AlertCardProps {
  alert: Alert;
  aoiName?: string;
  showVerificationButtons?: boolean;
  onVerificationUpdate?: (alertId: string, confirmed: boolean) => void;
}

const alertTypeLabels = {
  // Original MVP types
  trash: '🗑️ Trash/Pollution Detected',
  algal_bloom: '🌊 Algal Bloom Detected',
  construction: '🏗️ Construction Activity Detected',
  
  // Enhanced environmental types
  vegetation_loss: '🌿 Vegetation Loss Detected',
  vegetation_gain: '🌱 Vegetation Growth Detected',
  deforestation: '🌳 Deforestation Event',
  coastal_erosion: '🏖️ Coastal Erosion Detected',
  coastal_accretion: '🏝️ Coastal Accretion Detected',
  water_quality_change: '💧 Water Quality Change',
  potential_pollution: '☢️ Potential Pollution',
  urban_expansion: '🏙️ Urban Expansion Detected',
  other: '🔍 Environmental Change Detected'
};

const alertTypeDescriptions = {
  // Original MVP descriptions
  trash: 'Potential waste dumping or pollution has been detected using spectral analysis.',
  algal_bloom: 'Unusual algal growth patterns identified using advanced water quality indices.',
  construction: 'New construction activity detected using Bare Soil Index and CUSUM algorithms.',
  
  // Enhanced environmental descriptions
  vegetation_loss: 'Significant vegetation decline detected using EWMA statistical monitoring.',
  vegetation_gain: 'Positive vegetation growth patterns identified through spectral analysis.',
  deforestation: 'Rapid forest loss detected using CUSUM change detection algorithms.',
  coastal_erosion: 'Coastal vegetation edge retreat detected using VedgeSat analysis.',
  coastal_accretion: 'Coastal expansion detected through advanced edge detection methods.',
  water_quality_change: 'Water quality parameters show significant changes from baseline.',
  potential_pollution: 'Spectral signatures indicate possible contamination or pollution.',
  urban_expansion: 'Urban development patterns detected using multi-spectral analysis.',
  other: 'Environmental change detected using research-grade algorithms.'
};

export default function AlertCard({ 
  alert, 
  aoiName, 
  showVerificationButtons = true,
  onVerificationUpdate 
}: AlertCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [userVote, setUserVote] = useState<'agree' | 'dismiss' | null>(null);

  const handleVerification = async (vote: 'agree' | 'dismiss') => {
    if (isVerifying) return;

    setIsVerifying(true);
    try {
      const result = await alertsAPI.verifyAlert(alert.id, vote);
      setUserVote(vote);
      onVerificationUpdate?.(alert.id, result.status === 'confirmed');
    } catch (error) {
      console.error('Failed to verify alert:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const shareAlert = async () => {
    const shareUrl = `${window.location.origin}/alerts/${alert.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Environmental Alert: ${alertTypeLabels[alert.type]}`,
          text: `Check out this environmental alert detected by GeoGuardian`,
          url: shareUrl,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        window.alert('Alert link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      window.alert('Alert link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {alertTypeLabels[alert.type]}
            </h3>
            {aoiName && (
              <p className="text-sm text-gray-600 mt-1">📍 {aoiName}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Detected {formatDate(alert.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={shareAlert}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              title="Share alert"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              alert.confirmed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {alert.confirmed ? '✅ Verified' : '⏳ Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Description */}
        <p className="text-gray-700 mb-4">
          {alertTypeDescriptions[alert.type]}
        </p>

        {/* Enhanced Confidence & Algorithm Breakdown */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Detection Confidence
              {alert.algorithms_used && alert.algorithms_used.length > 1 && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {alert.algorithms_used.length} algorithms
                </span>
              )}
            </span>
            <span className="text-sm text-gray-900 font-semibold">
              {((alert.overall_confidence || alert.confidence) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                (alert.overall_confidence || alert.confidence) > 0.8 ? 'bg-red-500' : 
                (alert.overall_confidence || alert.confidence) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${((alert.overall_confidence || alert.confidence) * 100)}%` }}
            ></div>
          </div>
          
          {/* Priority Level */}
          {alert.priority_level && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                alert.priority_level === 'high' ? 'bg-red-100 text-red-800' :
                alert.priority_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                alert.priority_level === 'low' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {alert.priority_level.toUpperCase()} PRIORITY
              </span>
            </div>
          )}
        </div>

        {/* Algorithm Breakdown */}
        {alert.algorithm_results && alert.algorithm_results.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              🧪 Algorithm Analysis Breakdown
            </h4>
            <div className="space-y-2">
              {alert.algorithm_results.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {result.algorithm_name.toUpperCase()}
                      {result.change_type && (
                        <span className="ml-2 text-xs text-gray-600">({result.change_type})</span>
                      )}
                    </span>
                    {result.severity && (
                      <div className="text-xs text-gray-500 mt-1">
                        Severity: <span className="capitalize">{result.severity}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      result.change_detected ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {result.change_detected ? 'DETECTED' : 'STABLE'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(result.confidence * 100).toFixed(1)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spectral Indices */}
        {alert.spectral_indices && Object.keys(alert.spectral_indices).length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              🔍 Spectral Analysis (13 Sentinel-2 Bands)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(alert.spectral_indices).map(([index, value]) => {
                if (value === null || value === undefined) return null;
                return (
                  <div key={index} className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-blue-800 uppercase">
                      {index.replace('_', ' ')}
                    </div>
                    <div className="text-sm font-semibold text-blue-900">
                      {typeof value === 'number' ? value.toFixed(3) : value}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Enhanced from 4 to 13 spectral bands • Research-grade accuracy
            </div>
          </div>
        )}

        {/* Analysis Method */}
        {alert.analysis_type && alert.analysis_type !== 'basic' && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                ✨ <strong>Enhanced Analysis:</strong> This alert was generated using advanced {alert.analysis_type} analysis
                {alert.algorithms_used && alert.algorithms_used.length > 0 && (
                  <span> with {alert.algorithms_used.join(', ')} algorithms</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Before/After Image */}
        {alert.gif_url && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Before/After Satellite Comparison
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <img 
                src={alert.gif_url} 
                alt="Before and after satellite comparison"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Verification Buttons */}
        {showVerificationButtons && !userVote && (
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Help verify this alert
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Your verification helps improve our detection accuracy and builds community trust.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleVerification('agree')}
                disabled={isVerifying}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Agree (Accurate)
              </button>
              <button
                onClick={() => handleVerification('dismiss')}
                disabled={isVerifying}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Dismiss (False Alert)
              </button>
            </div>
          </div>
        )}

        {/* User Vote Confirmation */}
        {userVote && (
          <div className="border-t border-gray-100 pt-6">
            <div className={`p-3 rounded-lg ${
              userVote === 'agree' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="text-sm">
                Thank you for your verification! You marked this alert as{' '}
                <strong>{userVote === 'agree' ? 'accurate' : 'false'}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
