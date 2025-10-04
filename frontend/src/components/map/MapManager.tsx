/**
 * MapManager - Simplified map component wrapper
 * Handles dynamic import and SSR issues with Leaflet
 */

'use client'

import dynamic from 'next/dynamic'
import { Loading } from '@/components/ui'

// Dynamically import MapContainer to avoid SSR issues
const MapContainer = dynamic(() => import('./MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100">
      <Loading />
    </div>
  ),
})

export default MapContainer