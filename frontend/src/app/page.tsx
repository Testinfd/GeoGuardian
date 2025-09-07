'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Remove automatic redirect to dashboard when logged in
  // Users can access the app with or without authentication

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Remove loading state redirect when logged in - allow access to home page

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🌍</div>
              <h1 className="text-2xl font-bold text-gray-900">GeoGuardian</h1>
            </div>
            <div className="text-sm text-gray-600">
              Environmental Monitoring Made Simple
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Monitor Environmental Changes
            <br />
            <span className="text-blue-600">Anywhere on Earth</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Turn any lake, river, or coastal area into a 10-meter resolution early-warning system 
            for trash, algal blooms, and illegal construction. No hardware, no expertise required.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto"
          >
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Get Started</h3>
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-200 text-center block focus-ring"
              >
                Start Monitoring (No Account Required)
              </Link>
              <div className="text-center text-sm text-gray-500 my-3">or</div>
              <Link
                href="/register"
                className="w-full bg-white border-2 border-primary-200 text-primary-700 py-3 px-6 rounded-lg font-medium hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 text-center block focus-ring"
              >
                Create Account (Save Your Data)
              </Link>
              <Link
                href="/login"
                className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-center block focus-ring"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">📍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Drop a Pin, Start Monitoring
            </h3>
            <p className="text-gray-600">
              Simply click on any location to create an Area of Interest. 
              Our system will automatically start monitoring for changes.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">🛰️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              AI-Powered Detection
            </h3>
            <p className="text-gray-600">
              Advanced satellite imagery analysis detects environmental changes 
              like pollution, construction, and algal blooms automatically.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Instant Alerts
            </h3>
            <p className="text-gray-600">
              Get immediate email notifications with visual proof when 
              significant environmental changes are detected.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">See It In Action</h3>
          <p className="text-lg mb-6 opacity-90">
            From detection to alert in under 60 seconds. Watch how GeoGuardian 
            democratizes environmental monitoring for everyone.
          </p>
          <div className="bg-white/20 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm opacity-80">
              🎯 Demo: Create AOI → 🛰️ Fetch Satellite Data → 🔍 Analyze Changes → 📧 Send Alert → ✅ Community Verify
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">10m</div>
            <div className="text-sm text-gray-600">Resolution</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">24/7</div>
            <div className="text-sm text-gray-600">Monitoring</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-600">Areas per User</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">Free</div>
            <div className="text-sm text-gray-600">Open Source</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 GeoGuardian. Open source environmental monitoring for everyone.</p>
            <p className="mt-2 text-sm">
              Built with ❤️ for a sustainable future. Powered by Sentinel-2 satellite imagery.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}