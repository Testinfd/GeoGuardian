'use client';

import { useState } from 'react';
import { CheckIcon, XMarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import { alertsAPI } from '@/services/api';

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

interface AlertCardProps {
  alert: Alert;
  aoiName?: string;
  showVerificationButtons?: boolean;
  onVerificationUpdate?: (alertId: string, confirmed: boolean) => void;
}

const alertTypeLabels = {
  trash: '🗑️ Trash/Pollution Detected',
  algal_bloom: '🌊 Algal Bloom Detected',
  construction: '🏗️ Construction Activity Detected'
};

const alertTypeDescriptions = {
  trash: 'Potential waste dumping or pollution has been detected in this area.',
  algal_bloom: 'Unusual algal growth patterns have been identified, possibly indicating water quality issues.',
  construction: 'New construction or land clearing activity has been detected.'
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

        {/* Confidence */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Detection Confidence</span>
            <span className="text-sm text-gray-900 font-semibold">
              {(alert.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                alert.confidence > 0.7 ? 'bg-red-500' : 
                alert.confidence > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${alert.confidence * 100}%` }}
            ></div>
          </div>
        </div>

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
