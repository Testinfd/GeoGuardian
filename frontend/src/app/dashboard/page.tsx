'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import AOIList from '@/components/AOIList'
import AlertViewer from '@/components/AlertViewer'
import SystemStatus from '@/components/SystemStatus'
import EnhancedAnalysisDemo from '@/components/EnhancedAnalysisDemo'

// Dynamically import MapManager to avoid SSR issues with Leaflet
const MapManager = dynamic(() => import('@/components/MapManager'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

interface AOI {
  id: string
  name: string
  geometry?: any  // Make geometry optional to match AOIList expectations
  status?: 'monitoring' | 'alert' | 'inactive'  // Make status optional
  lastAlert?: Date
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedAOI, setSelectedAOI] = useState<AOI | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEnhancedFeatures, setShowEnhancedFeatures] = useState(true)
  const handleAOISelect = (aoi: AOI | null) => {
    setSelectedAOI(aoi)
  }

  // Remove redirect to login - allow anonymous access
  // Users can use the dashboard without logging in

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow access whether logged in or not

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🌍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GeoGuardian</h1>
              <p className="text-sm text-gray-600">Environmental Monitoring Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {session ? (
              // Logged in user
              <>
                <div className="flex items-center space-x-2">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">{session.user?.name}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              // Anonymous user
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Anonymous Mode</span>
                <div className="flex space-x-2">
                  <Link
                    href="/login"
                    className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm bg-primary-500 text-white px-3 py-1 rounded hover:bg-primary-600 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Anonymous User Banner */}
      {!session && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-b border-blue-200 px-6 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-blue-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Anonymous Mode:</strong> You can explore and create areas to monitor, but they won't be saved. 
                  <Link href="/register" className="underline hover:text-blue-900 ml-1">Create account</Link> to save your work!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-400 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Panel - 70% width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 w-[70%]"
        >
          <MapManager 
            onAOISelect={handleAOISelect} 
            selectedAOI={selectedAOI as any}  // Type assertion to resolve interface mismatch
          />
        </motion.div>
        
        {/* Right Panel - 30% width - Enhanced with new components */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-[30%] min-w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto"
        >
          {selectedAOI ? (
            <AlertViewer 
              selectedAOI={selectedAOI as any}  // Type assertion to resolve interface mismatch
              onBack={() => setSelectedAOI(null)}
            />
          ) : (
            <div className="p-4 space-y-6">
              {/* Enhanced System Status */}
              <SystemStatus />
              
              {/* Interactive Analysis Demo */}
              {showEnhancedFeatures && (
                <EnhancedAnalysisDemo />
              )}
              
              {/* AOI Management */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">📍 Monitoring Areas</h3>
                    <button
                      onClick={() => setShowEnhancedFeatures(!showEnhancedFeatures)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showEnhancedFeatures ? 'Hide Demo' : 'Show Demo'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Create and manage areas for environmental monitoring
                  </p>
                </div>
                <AOIList onAOISelect={handleAOISelect} />
              </div>
              
              {/* Research Grade Notice */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      🔬 Research-Grade Analysis System
                    </h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Our enhanced system uses <strong>4 advanced algorithms</strong> (EWMA, CUSUM, VedgeSat, Spectral Analysis) 
                      with <strong>13-band Sentinel-2 imagery</strong> to achieve <strong>85%+ accuracy</strong> in environmental monitoring.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Multi-Algorithm Detection
                      </span>
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Real-time Processing
                      </span>
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        Spectral Analysis
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}