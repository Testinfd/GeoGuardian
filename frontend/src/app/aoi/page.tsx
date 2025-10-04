/**
 * AOI List Page
 * Displays all Areas of Interest with filtering and search capabilities
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/AuthProvider'
import { 
  Map, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  MapPin,
  Calendar,
  Activity,
  Eye,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { Button, Card, Input, Loading, Badge, Modal } from '@/components/ui'
import { SentinelMap } from '@/components/map'
import { useAOIStore } from '@/stores/aoi'
import type { AOI } from '@/types'

interface AOICardProps {
  aoi: AOI
  onSelect: (aoi: AOI) => void
  onEdit: (aoi: AOI) => void
  onDelete: (aoi: AOI) => void
  onView: (aoi: AOI) => void
}

function AOICard({ aoi, onSelect, onEdit, onDelete, onView }: AOICardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1" onClick={() => onSelect(aoi)}>
          <h3 className="font-semibold text-gray-900 mb-1">{aoi.name}</h3>
          {aoi.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{aoi.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <Button variant="ghost" size="sm" onClick={() => onView(aoi)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(aoi)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(aoi)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(aoi.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <Activity className="w-4 h-4 mr-1" />
          {aoi.analysis_count || 0} analyses
        </div>
      </div>

      {aoi.tags && aoi.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {aoi.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
          {aoi.tags.length > 3 && (
            <Badge variant="default" size="sm">
              +{aoi.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-1" />
          AOI Area
        </div>
        <Badge 
          variant={aoi.is_public ? "success" : "default"} 
          size="sm"
        >
          {aoi.is_public ? 'Public' : 'Private'}
        </Badge>
      </div>
    </Card>
  )
}

interface AOIListViewProps {
  aois: AOI[]
  selectedAOI: AOI | null
  onAOISelect: (aoi: AOI) => void
  onEdit: (aoi: AOI) => void
  onDelete: (aoi: AOI) => void
  onView: (aoi: AOI) => void
}

function AOIListView({ aois, selectedAOI, onAOISelect, onEdit, onDelete, onView }: AOIListViewProps) {
  return (
    <div className="space-y-4">
      {aois.map((aoi) => (
        <AOICard
          key={aoi.id}
          aoi={aoi}
          onSelect={onAOISelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  )
}

interface AOIGridViewProps {
  aois: AOI[]
  selectedAOI: AOI | null
  onAOISelect: (aoi: AOI) => void
  onEdit: (aoi: AOI) => void
  onDelete: (aoi: AOI) => void
  onView: (aoi: AOI) => void
}

function AOIGridView({ aois, selectedAOI, onAOISelect, onEdit, onDelete, onView }: AOIGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {aois.map((aoi) => (
        <AOICard
          key={aoi.id}
          aoi={aoi}
          onSelect={onAOISelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  )
}

export default function AOIListPage() {
  const router = useRouter()
  const isAuthenticated = !!useUser()
  const [isClient, setIsClient] = useState(false)

  // Mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Store state
  const { 
    aois, 
    selectedAOI, 
    isLoading, 
    error,
    fetchAOIs, 
    selectAOI, 
    deleteAOI,
    searchAOIs,
    filterAOIs,
    getAOIStats
  } = useAOIStore()

  // Local state
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmAOI, setDeleteConfirmAOI] = useState<AOI | null>(null)
  const [filters, setFilters] = useState({
    tags: [] as string[],
    isPublic: undefined as boolean | undefined,
    hasAnalysis: undefined as boolean | undefined,
  })

  // Derived state
  const filteredAOIs = React.useMemo(() => {
    let result = aois

    // Apply search
    if (searchQuery.trim()) {
      result = searchAOIs(searchQuery.trim())
    }

    // Apply filters
    if (filters.tags.length > 0 || filters.isPublic !== undefined || filters.hasAnalysis !== undefined) {
      result = filterAOIs(filters)
    }

    return result
  }, [aois, searchQuery, filters, searchAOIs, filterAOIs])

  const stats = getAOIStats()

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchAOIs()
    }
  }, [isAuthenticated, fetchAOIs])

  // Handlers
  const handleCreateAOI = () => {
    router.push('/aoi/create')
  }

  const handleViewAOI = (aoi: AOI) => {
    router.push(`/aoi/${aoi.id}`)
  }

  const handleEditAOI = (aoi: AOI) => {
    router.push(`/aoi/${aoi.id}/edit`)
  }

  const handleDeleteAOI = (aoi: AOI) => {
    setDeleteConfirmAOI(aoi)
  }

  const confirmDelete = async () => {
    if (deleteConfirmAOI) {
      try {
        await deleteAOI(deleteConfirmAOI.id)
        setDeleteConfirmAOI(null)
      } catch (error) {
        console.error('Failed to delete AOI:', error)
      }
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

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Areas of Interest</h1>
              <p className="mt-2 text-gray-600">
                Manage your monitored areas and view environmental analysis results
              </p>
            </div>
            <Button onClick={handleCreateAOI} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create AOI</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total AOIs</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">With Analysis</p>
                <p className="text-xl font-bold text-gray-900">{stats.withAnalysis}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Public</p>
                <p className="text-xl font-bold text-gray-900">{stats.public}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalAnalyses}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search AOIs..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>

            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="rounded-l-none"
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : error ? (
          <Card className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading AOIs</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchAOIs()}>Try Again</Button>
          </Card>
        ) : filteredAOIs.length === 0 ? (
          <Card className="p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {aois.length === 0 ? 'No AOIs Yet' : 'No AOIs Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {aois.length === 0 
                ? 'Create your first Area of Interest to start monitoring environmental changes.'
                : 'Try adjusting your search or filters to find what you\'re looking for.'
              }
            </p>
            {aois.length === 0 && (
              <Button onClick={handleCreateAOI}>Create Your First AOI</Button>
            )}
          </Card>
        ) : (
          <>
            {viewMode === 'grid' && (
              <AOIGridView
                aois={filteredAOIs}
                selectedAOI={selectedAOI}
                onAOISelect={handleAOISelect}
                onEdit={handleEditAOI}
                onDelete={handleDeleteAOI}
                onView={handleViewAOI}
              />
            )}

            {viewMode === 'list' && (
              <AOIListView
                aois={filteredAOIs}
                selectedAOI={selectedAOI}
                onAOISelect={handleAOISelect}
                onEdit={handleEditAOI}
                onDelete={handleDeleteAOI}
                onView={handleViewAOI}
              />
            )}

            {viewMode === 'map' && (
              <Card className="p-4">
                <SentinelMap
                  height="600px"
                  aois={filteredAOIs}
                  selectedAOI={selectedAOI}
                  onAOISelect={handleAOISelect}
                />
              </Card>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmAOI}
        onClose={() => setDeleteConfirmAOI(null)}
        title="Delete AOI"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete "{deleteConfirmAOI?.name}"?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All associated analyses and alerts will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setDeleteConfirmAOI(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete AOI
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </ProtectedRoute>
  )
}