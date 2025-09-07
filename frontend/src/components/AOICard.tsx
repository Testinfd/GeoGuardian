'use client';

import { useState } from 'react';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { aoiAPI, alertsAPI } from '@/services/api';
import { useAOIStore } from '@/store/aoiStore';

interface AOI {
  id: string;
  name: string;
  geojson: any;
  created_at: string;
}

interface Alert {
  id: string;
  aoi_id: string;
  gif_url?: string;
  type: 'trash' | 'algal_bloom' | 'construction';
  confidence: number;
  confirmed: boolean;
  processing: boolean;
  created_at: string;
}

interface AOICardProps {
  aoi: AOI;
  alert?: Alert;
  onView: () => void;
  onDelete?: (aoiId: string) => void;
}

const alertTypeLabels = {
  trash: '🗑️ Trash/Pollution',
  algal_bloom: '🌊 Algal Bloom',
  construction: '🏗️ Construction'
};

const alertTypeColors = {
  trash: 'bg-orange-100 text-orange-800',
  algal_bloom: 'bg-blue-100 text-blue-800',
  construction: 'bg-red-100 text-red-800'
};

export default function AOICard({ aoi, alert, onView, onDelete }: AOICardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingAlert, setIsCheckingAlert] = useState(false);
  const { removeAOI, addAlert } = useAOIStore();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this area of interest?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await aoiAPI.deleteAOI(aoi.id);
      removeAOI(aoi.id);
      // Notify parent component of successful deletion
      onDelete?.(aoi.id);
    } catch (error: any) {
      console.error('Failed to delete AOI:', error);
      const errorMessage = error?.response?.data?.detail ||
                          error?.message ||
                          'Failed to delete area of interest. Please try again.';
      // Use a more modern approach - we could integrate with a toast notification system
      // For now, using a styled alert
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = errorMessage;
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const checkForAlerts = async () => {
    setIsCheckingAlert(true);
    try {
      const alertData = await alertsAPI.getAOIAlert(aoi.id);
      if (alertData) {
        addAlert(alertData);
      }
    } catch (error) {
      console.error('Failed to check for alerts:', error);
    } finally {
      setIsCheckingAlert(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{aoi.name}</h3>
          <p className="text-sm text-gray-500">Created {formatDate(aoi.created_at)}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onView}
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            title="View on map"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Delete AOI"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Alert Status */}
      <div className="mb-4">
        {alert ? (
          <div className="space-y-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${alertTypeColors[alert.type]}`}>
              {alertTypeLabels[alert.type]}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Confidence</span>
                <span className="text-sm text-gray-900">{(alert.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${alert.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {alert.gif_url && (
              <div className="mt-3">
                <img 
                  src={alert.gif_url} 
                  alt="Before/After comparison"
                  className="w-full rounded-lg border border-gray-200"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className={`px-2 py-1 rounded ${alert.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {alert.confirmed ? '✅ Verified' : '⏳ Pending Verification'}
              </span>
              <span className="text-gray-500">
                {formatDate(alert.created_at)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-3">No alerts detected</p>
            <button
              onClick={checkForAlerts}
              disabled={isCheckingAlert}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingAlert ? 'Checking...' : 'Check for Alerts'}
            </button>
          </div>
        )}
      </div>

      {/* Area Info */}
      <div className="border-t border-gray-100 pt-4">
        <div className="text-sm text-gray-500">
          <p>Area: {aoi.geojson?.coordinates?.[0]?.length || 0} points</p>
          <p>Monitoring: Active 🟢</p>
        </div>
      </div>
    </div>
  );
}
