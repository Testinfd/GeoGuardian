/**
 * New Analysis Page
 * Interface for starting new environmental analyses
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/AuthProvider'
import { ArrowLeft, Play, AlertCircle, Info } from 'lucide-react'
import { Navigation } from '@/components/layout'
import { Button, Card, Loading, Alert } from '@/components/ui'
import { AnalysisSelector } from '@/components/analysis'
import { SentinelMap } from '@/components/map'
import { useAOIStore } from '@/stores/aoi'
import { useAnalysisStore } from '@/stores/analysis'
import type { AOI, AnalysisType } from '@/types'

export default function NewAnalysisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAuthenticated = !!useUser()
  const user = useUser()
  const [isClient, setIsClient] = useState(false)

  // Mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // URL params
  const preselectedAOIId = searchParams.get('aoi')
  
  // Store state
  const { 
    aois, 
    selectedAOI, 
    selectAOI, 
    fetchAOIs, 
    isLoading: aoiLoading 
  } = useAOIStore()
  
  const {
    startAnalysis,
    systemStatus,
    fetchSystemStatus,
    isLoading: analysisLoading,
    error
  } = useAnalysisStore()

  // Local state
  const [analysisStarted, setAnalysisStarted] = useState(false)
  const [startedAnalysisId, setStartedAnalysisId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const initializePage = async () => {
      if (!isAuthenticated || !isMounted) return

      // Fetch initial data
      await fetchAOIs()
      await fetchSystemStatus()
    }

    initializePage()

    return () => {
      isMounted = false
    }
    // Only run once on mount or when authentication changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // Separate effect for preselection after AOIs are loaded
  useEffect(() => {
    if (preselectedAOIId && aois.length > 0 && !selectedAOI) {
      const aoi = aois.find(a => a.id === preselectedAOIId)
      if (aoi) {
        selectAOI(aoi)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedAOIId, aois.length])

  const handleAnalysisStart = async (type: AnalysisType, aoiId: string) => {
    try {
      const analysis = await startAnalysis({
        aoi_id: aoiId,
        analysis_type: type,
        geojson: selectedAOI?.geojson,
        include_spectral_analysis: true,
        include_visualizations: true,
      })
      
      setAnalysisStarted(true)
      setStartedAnalysisId(analysis.id)
      
      // Redirect to analysis results after a brief success message
      setTimeout(() => {
        router.push(`/analysis/${analysis.id}`)
      }, 2000)
      
    } catch (error) {
      console.error('Failed to start analysis:', error)
    }
  }

  const handleAOISelect = (aoi: AOI) => {
    selectAOI(aoi)
  }

  // Redirect if not authenticated - only on client side
  if (isClient && !isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  if (aoiLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      </div>
    )
  }

  // Success state
  if (analysisStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-12 px-6">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Analysis Started Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your environmental analysis is now running. You'll be redirected to the results page where you can monitor progress.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => router.push(`/analysis/${startedAnalysisId}`)}>
                View Progress
              </Button>
              <Button variant="outline" onClick={() => router.push('/analysis')}>
                All Analyses
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Start New Analysis</h1>
              <p className="mt-2 text-gray-600">
                Select an area of interest and choose your analysis type to begin environmental monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <div>
              <h4 className="font-medium">Analysis Error</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </Alert>
        )}

        {/* System Status Warning */}
        {systemStatus && systemStatus.status !== 'healthy' && (
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <div>
              <h4 className="font-medium">System Status: {systemStatus.status}</h4>
              <p className="text-sm mt-1">
                Analysis may take longer than usual due to system performance issues.
              </p>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AOI Selection */}
          <div>
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Area of Interest</h2>
              
              {aois.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No AOIs Available</h3>
                  <p className="text-gray-600 mb-4">
                    You need to create an Area of Interest before starting analysis.
                  </p>
                  <Button onClick={() => router.push('/aoi/create')}>
                    Create AOI
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {aois.map((aoi) => (
                    <div
                      key={aoi.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAOI?.id === aoi.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAOISelect(aoi)}
                    >
                      <h3 className="font-medium text-gray-900">{aoi.name}</h3>
                      {aoi.description && (
                        <p className="text-sm text-gray-600 mt-1">{aoi.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Created {new Date(aoi.created_at).toLocaleDateString()}</span>
                        <span>{aoi.analysis_count || 0} analyses</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Map Preview */}
            {selectedAOI && (
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Area Preview</h3>
                <SentinelMap
                  height="300px"
                  aois={[selectedAOI]}
                  selectedAOI={selectedAOI}
                  center={{
                    lat: selectedAOI.geojson.coordinates[0][0][1],
                    lng: selectedAOI.geojson.coordinates[0][0][0]
                  }}
                  zoom={12}
                />
              </Card>
            )}
          </div>

          {/* Analysis Configuration */}
          <div>
            <AnalysisSelector
              selectedAOI={selectedAOI}
              onAnalysisStart={handleAnalysisStart}
            />
          </div>
        </div>

        {/* Info Section */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Analysis Information</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Analysis processing time depends on area size and selected algorithms</li>
                <li>• Real-time progress updates will be available on the results page</li>
                <li>• Results include before/after imagery, statistical analysis, and confidence scores</li>
                <li>• You can monitor multiple analyses simultaneously from the main analysis page</li>
                <li>• Completed analyses remain available for future reference and comparison</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}