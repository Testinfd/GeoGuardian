'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { alertsAPI } from '@/services/api';
import AlertCard from '@/components/AlertCard';

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

export default function AlertPage() {
  const params = useParams();
  const router = useRouter();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadAlert(params.id as string);
    }
  }, [params.id]);

  const loadAlert = async (alertId: string) => {
    try {
      setLoading(true);
      const alertData = await alertsAPI.getAlert(alertId);
      setAlert(alertData);
    } catch (error) {
      console.error('Failed to load alert:', error);
      setError('Alert not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationUpdate = (alertId: string, confirmed: boolean) => {
    if (alert && alert.id === alertId) {
      setAlert({ ...alert, confirmed });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Alert Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested alert could not be found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                ← Back
              </button>
              <div className="text-2xl">🌍</div>
              <h1 className="text-2xl font-bold text-gray-900">GeoGuardian Alert</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AlertCard
          alert={alert}
          showVerificationButtons={true}
          onVerificationUpdate={handleVerificationUpdate}
        />

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Alert</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Detection Method</h4>
              <p className="text-gray-600">
                This alert was generated using Sentinel-2 satellite imagery analysis. 
                Our system compares recent imagery with historical data to detect 
                significant environmental changes.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">What You Can Do</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Verify the accuracy of this alert</li>
                <li>• Share with local authorities if confirmed</li>
                <li>• Monitor the area for further changes</li>
                <li>• Report to environmental agencies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Share This Alert</h3>
          <p className="text-blue-700 mb-4">
            Help spread awareness about environmental changes in your community.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                window.alert('Link copied to clipboard!');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Copy Link
            </button>
            <button
              onClick={() => {
                const text = `Environmental alert detected by GeoGuardian: ${window.location.href}`;
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                window.open(twitterUrl, '_blank');
              }}
              className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Share on Twitter
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
