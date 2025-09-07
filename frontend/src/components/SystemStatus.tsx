'use client';

import { useEffect, useState } from 'react';
import { analysisAPI } from '@/services/api';

interface SystemStatus {
  advanced_analysis_available: boolean;
  algorithms_available: string[];
  vedgesat_status: string;
  spectral_bands_supported?: number;
  max_concurrent_analyses?: number;
}

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      const statusData = await analysisAPI.getStatus();
      setStatus(statusData);
      setError(null);
    } catch (err) {
      setError('Unable to fetch system status');
      // Fallback status for MVP compatibility
      setStatus({
        advanced_analysis_available: false,
        algorithms_available: ['basic_ndvi'],
        vedgesat_status: 'not_configured',
        spectral_bands_supported: 4,
        max_concurrent_analyses: 1
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 text-sm">
          ⚠️ System status unavailable
        </div>
      </div>
    );
  }

  const getStatusColor = (available: boolean) => 
    available ? 'text-green-600' : 'text-yellow-600';

  const getVedgeSatStatusInfo = (vedgesat_status: string) => {
    switch (vedgesat_status) {
      case 'available':
        return { color: 'text-green-600', text: 'Full VedgeSat capabilities', icon: '✅' };
      case 'fallback':
        return { color: 'text-yellow-600', text: 'Fallback edge detection', icon: '⚠️' };
      default:
        return { color: 'text-gray-600', text: 'Not configured', icon: '❌' };
    }
  };

  const vedgeSatInfo = getVedgeSatStatusInfo(status.vedgesat_status);
  const isEnhanced = status.advanced_analysis_available;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEnhanced ? '🚀' : '📊'} System Status
        </h3>
        <button
          onClick={fetchSystemStatus}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      {/* Enhanced capabilities banner */}
      {isEnhanced && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="text-green-800 text-sm font-medium">
            ✨ Enhanced Analysis System Active
          </div>
          <div className="text-green-700 text-xs mt-1">
            Research-grade environmental monitoring with 85%+ accuracy
          </div>
        </div>
      )}

      {/* System capabilities */}
      <div className="space-y-3">
        {/* Analysis Engine */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Analysis Engine</span>
          <span className={`text-sm font-medium ${getStatusColor(isEnhanced)}`}>
            {isEnhanced ? 'Enhanced' : 'Basic'}
          </span>
        </div>

        {/* Algorithms */}
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-700">Algorithms</span>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {status.algorithms_available.length}
            </div>
            <div className="text-xs text-gray-500">
              {isEnhanced ? 'Multi-algorithm' : 'Single algorithm'}
            </div>
          </div>
        </div>

        {/* Spectral Bands */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Spectral Bands</span>
          <span className="text-sm font-medium text-gray-900">
            {status.spectral_bands_supported || 4}
            <span className="text-xs text-gray-500 ml-1">
              {(status.spectral_bands_supported || 4) >= 13 ? '(Full Sentinel-2)' : '(Basic)'}
            </span>
          </span>
        </div>

        {/* VedgeSat Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Coastal Monitoring</span>
          <div className="text-right">
            <span className={`text-sm font-medium ${vedgeSatInfo.color}`}>
              {vedgeSatInfo.icon} {vedgeSatInfo.text}
            </span>
          </div>
        </div>

        {/* Detection Accuracy */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Detection Accuracy</span>
          <span className="text-sm font-medium text-gray-900">
            {isEnhanced ? '85%+' : '~70%'}
            <span className="text-xs text-gray-500 ml-1">
              ({isEnhanced ? 'Research-grade' : 'MVP level'})
            </span>
          </span>
        </div>
      </div>

      {/* Algorithm details for enhanced system */}
      {isEnhanced && status.algorithms_available.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Available Algorithms</h4>
          <div className="grid grid-cols-2 gap-2">
            {status.algorithms_available.map((algorithm, index) => (
              <div key={index} className="bg-gray-50 rounded px-2 py-1">
                <div className="text-xs font-medium text-gray-800">
                  {algorithm.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-800 text-sm">
            ⚠️ {error}
            <div className="text-xs text-yellow-700 mt-1">
              System running in compatibility mode
            </div>
          </div>
        </div>
      )}

      {/* Enhancement available notice */}
      {!isEnhanced && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-800 text-sm">
            💡 <strong>Enhancement Available:</strong> Upgrade to research-grade algorithms
            <div className="text-xs text-blue-700 mt-1">
              Contact admin to enable enhanced analysis capabilities
            </div>
          </div>
        </div>
      )}
    </div>
  );
}