'use client'

import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { aoiAPI, alertsAPI } from '@/services/api'
import AOICard from '@/components/AOICard'
import { useAOIStore } from '@/store/aoiStore'

interface AOI {
  id: string
  name: string
  geojson: any
  created_at: string
}

interface AOIListProps {
  onAOISelect: (aoi: AOI) => void
}

export default function AOIList({ onAOISelect }: AOIListProps) {
  const queryClient = useQueryClient()
  const { removeAOI } = useAOIStore()

  const { data: aois = [], isLoading, error, refetch } = useQuery({
    queryKey: ['aois'],
    queryFn: async () => {
      const response = await aoiAPI.getAll()
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const handleAOIDelete = async (aoiId: string) => {
    try {
      // The AOI is already removed from the store by AOICard
      // Just ensure our local state is consistent
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['aois'] })
    } catch (error) {
      console.error('Failed to refresh AOI list after deletion:', error)
      // Try to refetch to restore data if there was an issue
      await refetch()
    }
  }

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Monitoring Areas</h2>
        <p className="text-sm text-gray-600">
          {aois.length}/5 areas active
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-shimmer h-4 bg-gray-200 rounded mb-2"></div>
              <div className="animate-shimmer h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            <p>Failed to load monitoring areas</p>
          </div>
        ) : aois.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No monitoring areas</h3>
            <p className="text-sm text-gray-500 mb-4">
              Draw a polygon on the map to start monitoring an area for environmental changes.
            </p>
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="text-sm text-primary-700">
                <strong>💡 Tip:</strong> Use the polygon tool in the top-right corner of the map to create your first monitoring area.
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {aois.map((aoi: AOI, index: number) => (
              <motion.div
                key={aoi.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AOICard
                  aoi={aoi}
                  onView={() => onAOISelect(aoi)}
                  onDelete={handleAOIDelete}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Monitor up to 5 areas with 10m resolution
          </p>
          <p className="text-xs text-gray-400">
            Powered by Sentinel-2 satellite imagery
          </p>
        </div>
      </div>
    </div>
  )
}
