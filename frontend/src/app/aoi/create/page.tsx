/**
 * AOI Creation Page
 * Interface for creating new Areas of Interest with map drawing tools
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/AuthProvider'
import { 
  ArrowLeft, 
  Save, 
  MapPin, 
  Info, 
  Tag,
  Globe,
  Lock,
  AlertCircle
} from 'lucide-react'
import { Button, Card, Input, Loading, Badge, Alert } from '@/components/ui'
import { InteractiveAOIMap } from '@/components/map'
import { useAOIStore } from '@/stores/aoi'
import type { GeoJSONPolygon, CreateAOIRequest } from '@/types'
import { MAP_CONFIG } from '@/utils/constants'

interface AOIFormData {
  name: string
  description: string
  tags: string[]
  is_public: boolean
}

interface AOICreationStepProps {
  step: number
  title: string
  description: string
  isActive: boolean
  isCompleted: boolean
}

function AOICreationStep({ step, title, description, isActive, isCompleted }: AOICreationStepProps) {
  return (
    <div className={`flex items-start ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mr-3 ${
        isActive ? 'border-blue-600 bg-blue-50' : 
        isCompleted ? 'border-green-600 bg-green-50' : 
        'border-gray-300 bg-gray-50'
      }`}>
        <span className="text-sm font-semibold">{step}</span>
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}

export default function CreateAOIPage() {
  const router = useRouter()
  const isAuthenticated = !!useUser()
  const [isClient, setIsClient] = useState(false)

  // Mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Store state
  const { createAOI, isLoading, error } = useAOIStore()

  // Local state
  const [currentStep, setCurrentStep] = useState(1)
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSONPolygon | null>(null)
  const [formData, setFormData] = useState<AOIFormData>({
    name: '',
    description: '',
    tags: [],
    is_public: false,
  })
  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Calculate polygon area (approximate)
  const calculatePolygonArea = (polygon: GeoJSONPolygon): number => {
    if (!polygon.coordinates || !polygon.coordinates[0]) return 0
    
    // Simple area calculation (not precise, just for display)
    const coords = polygon.coordinates[0]
    let area = 0
    for (let i = 0; i < coords.length - 1; i++) {
      area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1])
    }
    return Math.abs(area) / 2
  }

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'AOI name is required'
    } else if (formData.name.length < 3) {
      errors.name = 'AOI name must be at least 3 characters'
    }

    if (!drawnPolygon) {
      errors.polygon = 'Please draw an area on the map'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handlers
  const handlePolygonCreated = (polygon: GeoJSONPolygon) => {
    setDrawnPolygon(polygon)
    setCurrentStep(2)
  }

  const handleFormChange = (field: keyof AOIFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleFormChange('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    handleFormChange('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleRedrawPolygon = () => {
    setDrawnPolygon(null)
    setCurrentStep(1)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      const aoiData: CreateAOIRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        geojson: drawnPolygon!,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        is_public: formData.is_public,
      }

      await createAOI(aoiData)
      router.push('/aoi')
    } catch (error) {
      console.error('Failed to create AOI:', error)
    }
  }

  // Redirect if not authenticated - only on client side
  if (isClient && !isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  const polygonArea = drawnPolygon ? calculatePolygonArea(drawnPolygon) : 0

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h1 className="text-3xl font-bold text-gray-900">Create Area of Interest</h1>
              <p className="mt-2 text-gray-600">
                Define an area to monitor for environmental changes using satellite imagery
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AOICreationStep
                step={1}
                title="Draw Area"
                description="Define your area of interest on the map"
                isActive={currentStep === 1}
                isCompleted={currentStep > 1}
              />
              <AOICreationStep
                step={2}
                title="Add Details"
                description="Provide name, description, and tags"
                isActive={currentStep === 2}
                isCompleted={currentStep > 2}
              />
              <AOICreationStep
                step={3}
                title="Review & Save"
                description="Review your AOI and save it"
                isActive={currentStep === 3}
                isCompleted={false}
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Map Drawing Tool</h2>
                {drawnPolygon && (
                  <Button variant="outline" onClick={handleRedrawPolygon}>
                    Redraw Area
                  </Button>
                )}
              </div>

              <InteractiveAOIMap
                height="500px"
                center={[MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng]}
                zoom={MAP_CONFIG.DEFAULT_ZOOM}
                onPolygonCreated={handlePolygonCreated}
                aois={drawnPolygon ? [{
                  id: 'preview',
                  name: 'New AOI',
                  geojson: drawnPolygon,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }] : []}
              />

              {!drawnPolygon && (
                <Alert className="mt-4">
                  <Info className="w-4 h-4" />
                  <div>
                    <h4 className="font-medium">Drawing Instructions</h4>
                    <p className="text-sm mt-1">
                      Click the "Draw AOI" button on the map, then click to add points to your polygon. 
                      Click near the first point to close the polygon, or use the "Complete" button when done.
                    </p>
                  </div>
                </Alert>
              )}

              {drawnPolygon && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-green-900">Area Defined Successfully</h4>
                      <p className="text-sm text-green-700">
                        Polygon area: ~{polygonArea.toFixed(4)} sq degrees
                        {polygonArea > 1 && (
                          <span className="ml-2 text-yellow-600">(Large area - analysis may take longer)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {validationErrors.polygon && (
                <Alert variant="danger" className="mt-4">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.polygon}
                </Alert>
              )}
            </Card>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AOI Details</h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    placeholder="e.g., Mumbai Coastal Zone"
                    value={formData.name}
                    onChange={(value: string) => handleFormChange('name', value)}
                    error={validationErrors.name}
                    disabled={currentStep < 2}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Describe what you want to monitor in this area..."
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    disabled={currentStep < 2}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={setTagInput}
                      onKeyPress={handleKeyPress}
                      disabled={currentStep < 2}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || currentStep < 2}
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="default"
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        checked={!formData.is_public}
                        onChange={() => handleFormChange('is_public', false)}
                        disabled={currentStep < 2}
                        className="mr-2"
                      />
                      <Lock className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm">Private (only you can see this AOI)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        checked={formData.is_public}
                        onChange={() => handleFormChange('is_public', true)}
                        disabled={currentStep < 2}
                        className="mr-2"
                      />
                      <Globe className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm">Public (visible to other users)</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!drawnPolygon || !formData.name.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loading />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create AOI
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <Alert variant="danger">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </Alert>
                )}
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-4 mt-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tips for Creating AOIs</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Keep areas reasonably sized for faster analysis</li>
                    <li>• Use descriptive names and tags for easy identification</li>
                    <li>• Public AOIs help build community knowledge</li>
                    <li>• You can edit details later, but not the boundaries</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}