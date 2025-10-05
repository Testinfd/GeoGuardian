/**
 * Global TypeScript type definitions for GeoGuardian
 * Defines interfaces for API responses, state management, and component props
 */

// =============================================================================
// API Response Types
// =============================================================================

// Authentication Types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  provider?: 'email' | 'google'
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  id: string
  email: string
  name: string
  access_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface GoogleOAuthRequest {
  token: string
}

// Auth session interface
export interface AuthSession {
  user: User
  access_token: string
  expires_at: number
  refresh_token: string
}

// Geospatial Types
export type GeoJSONPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

export type GeoJSONFeature = {
  type: 'Feature'
  geometry: GeoJSONPolygon
  properties?: Record<string, any>
}

export type LatLng = {
  lat: number
  lng: number
}

export type BoundingBox = {
  north: number
  south: number
  east: number
  west: number
}

// AOI (Area of Interest) Types
export type AOI = {
  id: string
  name: string
  description?: string
  geojson: GeoJSONPolygon
  user_id?: string
  created_at: string
  updated_at: string
  analysis_count?: number
  last_analysis?: string
  tags?: string[]
  is_public?: boolean
  area_km2?: number
}

export type CreateAOIRequest = {
  name: string
  description?: string
  geojson: GeoJSONPolygon
  tags?: string[]
  is_public?: boolean
}

export type UpdateAOIRequest = {
  name?: string
  description?: string
  tags?: string[]
  is_public?: boolean
}

// Analysis Types
export type AnalysisType = 'comprehensive' | 'vegetation' | 'water' | 'urban' | 'change_detection'
export type AnalysisStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'insufficient_data'
export type AlgorithmType = 'ewma' | 'cusum' | 'vedgesat' | 'spectral'

export type AnalysisRequest = {
  aoi_id: string
  geojson?: GeoJSONPolygon
  analysis_type: AnalysisType
  date_range_days?: number
  max_cloud_coverage?: number
  include_spectral_analysis?: boolean
  include_visualizations?: boolean
  algorithms?: AlgorithmType[]
}

export type HistoricalAnalysisRequest = {
  aoi_id: string
  analysis_type: AnalysisType
  months_back?: number
  interval_days?: number
}

// Detection interface for detections array - aligned with backend
export type Detection = {
  id?: string
  type: string
  algorithm: string
  change_detected: boolean
  detected: boolean // Alias for change_detected
  change_type?: string
  severity?: 'low' | 'moderate' | 'medium' | 'high' | 'critical'
  change_percentage?: number
  confidence: number
  spatial_metrics?: {
    total_pixels: number
    changed_pixels: number
    vegetation_loss_pixels?: number
    vegetation_gain_pixels?: number
    mean_ndvi_change?: number
    max_ndvi_change?: number
    [key: string]: any
  }
  change_mask?: number[]
  confidence_map?: number[]
  location?: LatLng
  area_affected?: number
  description?: string
  details?: string
  metadata?: Record<string, any>
}

// Spectral indices with full statistics
export type SpectralIndex = {
  mean: number
  min: number
  max: number
  std: number
}

// Environmental health scoring (0-100 scale)
export type EnvironmentalHealthScore = {
  overall_score: number
  vegetation_health: number
  water_health: number
  urbanization_impact: number
  dominant_feature: string
}

// Satellite metadata
export type SatelliteImageMetadata = {
  timestamp: string
  quality_score: number
  cloud_coverage: number
  resolution: number
  bands: string[]
}

// Multi-sensor fusion results
export type FusionAnalysis = {
  composite_risk_score: number
  risk_level: 'low' | 'moderate' | 'medium' | 'high' | 'critical'
  category: string
  confidence: number
  primary_indicators: string[]
  supporting_evidence: string[]
  seasonal_likelihood: number
  recommendation: string
  change_detected: boolean
  details: {
    risk_factors?: string[]
    temporal_trends?: string
    spatial_patterns?: string
    [key: string]: any
  }
}

export type AnalysisResult = {
  id: string
  aoi_id: string
  analysis_type: AnalysisType
  status: AnalysisStatus
  progress?: number
  results?: {
    change_detected: boolean
    confidence_score: number
    overall_confidence?: number
    algorithm_results: Record<AlgorithmType, any>
    // Rich spectral indices data (12+ indices with statistics)
    spectral_indices?: Record<string, SpectralIndex>
    indices?: Record<string, SpectralIndex> // Backend uses 'indices'
    // Environmental health scoring
    environmental_health?: EnvironmentalHealthScore
    // Satellite metadata
    satellite_metadata?: {
      recent_image?: SatelliteImageMetadata
      baseline_image?: SatelliteImageMetadata
      time_separation_days?: number
    }
    // Multi-sensor fusion
    fusion_analysis?: FusionAnalysis
    // Spatial metrics
    spatial_metrics?: {
      total_pixels: number
      changed_pixels: number
      change_percentage: number
      [key: string]: any
    }
    visualizations?: {
      before_image?: string
      after_image?: string
      change_map?: string
      gif_visualization?: string
      // Advanced visualizations
      change_overlay?: string
      ndvi_comparison?: string
      ndwi_comparison?: string
      ndbi_comparison?: string
      multi_spectral?: string
      rgb?: string
      ndvi?: string
      ndwi?: string
      ndbi?: string
      [key: string]: any
    }
    visualization_urls?: Record<string, string>
    detections?: Detection[]
    visual_evidence?: any[]
    summary: string
    statistics: Record<string, number>
    processing_metadata?: {
      image_shapes?: {
        before?: number[]
        after?: number[]
      }
      geojson_bounds?: number[]
      processing_time?: number
      algorithms_used?: string[]
      error?: string
      data_quality_score?: number
      [key: string]: any
    }
  }
  processing_time?: number
  error_message?: string
  processing_metadata?: {
    error?: string
    data_availability?: {
      total_images?: number
      high_quality_images?: number
      average_cloud_coverage?: number
      recommendation?: string
      sufficient_for_analysis?: boolean
    }
    helpful_tips?: string[]
    [key: string]: any
  }
  created_at: string
  updated_at: string
  completed_at?: string
}

export type DataAvailability = {
  available: boolean
  sufficient_for_analysis: boolean
  total_images: number
  high_quality_images: number
  average_cloud_coverage: number
  date_range: {
    start: string
    end: string
  }
  cloud_coverage_stats?: {
    min: number
    max: number
    avg: number
  }
  recommendation?: string
  message?: string
  helpful_tips?: string[]
}

export type DataAvailabilityResponse = {
  aoi_id: string
  availability: DataAvailability
  recommendations?: string[]
  optimal_date_range?: {
    start: string
    end: string
  }
}

export type SystemCapabilities = {
  algorithms: AlgorithmType[]
  analysis_types: AnalysisType[]
  max_aoi_size_km2: number
  max_date_range_days: number
  supported_satellites: string[]
  spectral_indices: string[]
}

export type SystemStatus = {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    database: 'up' | 'down'
    sentinel_hub: 'up' | 'down'
    analysis_engine: 'up' | 'down'
    email_service: 'up' | 'down'
  }
  queue_size: number
  active_analyses: number
  last_check: string
  version: string
  uptime: number
}

// Alert Types
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed'
export type VoteType = 'agree' | 'disagree'

export type Alert = {
  id: string
  aoi_id: string
  analysis_id: string
  title: string
  description: string
  priority: AlertPriority
  status: AlertStatus
  change_type: string
  confidence_score: number
  location: LatLng
  affected_area_km2: number
  detection_date: string
  verification_votes?: {
    agree: number
    disagree: number
    user_vote?: VoteType
  }
  visualizations?: {
    thumbnail?: string
    before_image?: string
    after_image?: string
    change_map?: string
    gif?: string
  }
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  resolved_at?: string
  // Multi-Sensor Fusion Analysis
  fusion_analysis?: {
    composite_risk_score: number      // 0.0 to 1.0
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    category: string                  // e.g., 'illegal_construction', 'deforestation'
    confidence: number                // 0.0 to 1.0
    primary_indicators: string[]      // ['ndvi', 'ndbi', ...]
    supporting_evidence: string[]     // Detailed change descriptions
    seasonal_likelihood: number       // 0.0 to 1.0
    recommendation: string            // Action recommendation
    change_detected: boolean
    details: {
      index_changes: Record<string, number>
      significant_changes: string[]
      total_indicators: number
    }
  }
}

export type AlertVerificationRequest = {
  alert_id: string
  vote: VoteType
  comment?: string
}

// =============================================================================
// State Management Types
// =============================================================================

// Authentication Store
export type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export type AuthActions = {
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  loginWithGoogle: (callbackUrl?: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearError: () => void
  initializeAuth: () => Promise<void>
  refreshToken: () => Promise<string>
  isTokenExpired: () => Promise<boolean>
}

// AOI Store
export type AOIState = {
  aois: AOI[]
  selectedAOI: AOI | null
  isLoading: boolean
  error: string | null
}

export type AOIActions = {
  fetchAOIs: () => Promise<void>
  createAOI: (aoiData: CreateAOIRequest) => Promise<AOI>
  updateAOI: (id: string, updates: UpdateAOIRequest) => Promise<AOI>
  deleteAOI: (id: string) => Promise<void>
  selectAOI: (aoi: AOI | null) => void
  clearError: () => void
}

// Analysis Store
export type AnalysisState = {
  results: Record<string, AnalysisResult>
  activeAnalyses: Record<string, AnalysisResult>
  systemStatus: SystemStatus | null
  capabilities: SystemCapabilities | null
  isLoading: boolean
  error: string | null
}

export type AnalysisActions = {
  startAnalysis: (request: AnalysisRequest) => Promise<AnalysisResult>
  startHistoricalAnalysis: (request: HistoricalAnalysisRequest) => Promise<AnalysisResult>
  fetchAnalysisResult: (id: string) => Promise<AnalysisResult>
  checkDataAvailability: (aoiId: string, geojson?: GeoJSONPolygon) => Promise<DataAvailability>
  fetchSystemStatus: () => Promise<void>
  fetchCapabilities: () => Promise<void>
  pollAnalysisProgress: (id: string) => void
  stopPolling: (id: string) => void
  clearError: () => void
}

// Alert Store
export type AlertState = {
  alerts: Alert[]
  unreadCount: number
  selectedAlert: Alert | null
  filters: {
    priority?: AlertPriority[]
    status?: AlertStatus[]
    dateRange?: { start: string; end: string }
  }
  isLoading: boolean
  error: string | null
}

export type AlertActions = {
  fetchAlerts: (aoiId?: string) => Promise<void>
  fetchAlert: (id: string) => Promise<Alert>
  verifyAlert: (request: AlertVerificationRequest) => Promise<void>
  acknowledgeAlert: (id: string) => Promise<void>
  resolveAlert: (id: string) => Promise<void>
  dismissAlert: (id: string) => Promise<void>
  setFilters: (filters: Partial<AlertState['filters']>) => void
  selectAlert: (alert: Alert | null) => void
  markAsRead: (id: string) => void
  clearError: () => void
}

// =============================================================================
// Component Prop Types
// =============================================================================

// Common component props
export type BaseComponentProps = {
  className?: string
  children?: React.ReactNode
}

// Button props
export type ButtonProps = BaseComponentProps & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  asChild?: boolean
}

// Input props
export type InputProps = BaseComponentProps & {
  id?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'search'
  placeholder?: string
  value?: string
  onChange?: ((e: React.ChangeEvent<HTMLInputElement>) => void) | ((value: string) => void) | any
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  error?: string
  disabled?: boolean
  required?: boolean
  name?: string
  min?: string | number
  max?: string | number
  ref?: React.Ref<HTMLInputElement>
}

// Modal props
export type ModalProps = BaseComponentProps & {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Map props
export type MapProps = BaseComponentProps & {
  center?: LatLng
  zoom?: number
  height?: string
  aois?: AOI[]
  selectedAOI?: AOI | null
  onAOISelect?: (aoi: AOI) => void
  onMapClick?: (latlng: LatLng) => void
  drawingMode?: boolean
  onPolygonCreated?: (polygon: GeoJSONPolygon) => void
  onPolygonEdited?: (aoi: AOI, newGeometry: GeoJSONPolygon) => void
}

// Card props
export type CardProps = BaseComponentProps & {
  title?: string
  description?: string
  variant?: 'default' | 'hover' | 'glass'
  onClick?: () => void
}

// Badge props
export type BadgeProps = BaseComponentProps & {
  variant?: 'success' | 'warning' | 'danger' | 'default' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

// =============================================================================
// Utility Types
// =============================================================================

// API Response wrapper
export type ApiResponse<T = any> = {
  data: T
  message?: string
  success: boolean
}

// API Error response
export type ApiError = {
  error: string
  message: string
  status_code: number
  details?: Record<string, any>
}

// Pagination
export type PaginationMeta = {
  page: number
  per_page: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: PaginationMeta
}

// Form validation
export type FormErrors = {
  [key: string]: string | undefined
}

// Loading states
export type LoadingState = {
  [key: string]: boolean
}

// Notification
export type Notification = {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  timestamp: string
  read?: boolean
}

// Theme
export type Theme = {
  mode: 'light' | 'dark'
  colors: Record<string, string>
  fonts: Record<string, string>
}

// =============================================================================
// Global Application State
// =============================================================================

export type AppState = {
  auth: AuthState
  aoi: AOIState
  analysis: AnalysisState
  alerts: AlertState
  theme: Theme
  notifications: Notification[]
  loading: LoadingState
}

// =============================================================================
// Event Types
// =============================================================================

export type MapClickEvent = {
  latlng: LatLng
  originalEvent: MouseEvent
}

export type DrawingEvent = {
  polygon: GeoJSONPolygon
  area: number
}

export type AnalysisProgressEvent = {
  analysisId: string
  progress: number
  status: AnalysisStatus
  message?: string
}

// =============================================================================
// Hooks Return Types
// =============================================================================

export type UseApiReturn<T> = {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export type UseFormReturn<T> = {
  values: T
  errors: FormErrors
  isValid: boolean
  isSubmitting: boolean
  handleChange: (field: keyof T, value: any) => void
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => Promise<void>
  reset: () => void
  setFieldError: (field: keyof T, error: string) => void
  clearErrors: () => void
}

// =============================================================================
// Advanced Features Types (October 2025)
// =============================================================================

// Temporal Analysis Types
export type TemporalAnalysisRequest = {
  aoi_id: string
  index_name: string
  lookback_days?: number
  critical_threshold?: number
}

export type TrendAnalysis = {
  direction: 'increasing' | 'decreasing' | 'stable'
  slope: number
  r_squared: number
  p_value: number
  confidence: number
}

export type VelocityAnalysis = {
  average_velocity: number
  current_velocity: number
  acceleration: number
  is_accelerating: boolean
  days_to_critical?: number
  severity: 'stable' | 'slow_improvement' | 'slow_degradation' | 'moderate_improvement' | 'moderate_degradation' | 'rapid_improvement' | 'rapid_degradation'
}

export type Anomaly = {
  index: number
  date: string
  value: number
  z_score: number
  type: 'spike' | 'drop'
  severity: 'moderate' | 'high'
}

export type SeasonalPattern = {
  seasonal: boolean
  confidence: number
  period_days?: number
  amplitude: number
  coefficient_of_variation?: number
}

export type TimeSeriesPoint = {
  date: string
  value: number
  quality_score: number
}

export type TemporalAnalysisResponse = {
  aoi_id: string
  index_name: string
  periods_analyzed: number
  trend: TrendAnalysis
  velocity: VelocityAnalysis
  anomalies: Anomaly[]
  seasonal_pattern: SeasonalPattern
  next_period_forecast: number
  time_series: TimeSeriesPoint[]
  interpretation: string
  visualization_url?: string
}

// Hotspot Analysis Types
export type HotspotAnalysisRequest = {
  aoi_id: string
  geojson: GeoJSONPolygon
  date_range_days?: number
  grid_size?: number
  threshold_percentile?: number
}

export type Hotspot = {
  grid_position: { row: number; col: number }
  intensity: number
  max_intensity: number
  pixels_affected: number
  severity: 'low' | 'moderate' | 'high' | 'critical'
}

export type HotspotAnalysisResponse = {
  aoi_id: string
  total_hotspots: number
  hotspots: Hotspot[]
  distribution: 'none' | 'isolated' | 'clustered' | 'scattered' | 'dispersed'
  largest_hotspot?: Hotspot
  coverage_percent: number
  visualization_url?: string
}

// Alert Prioritization Types
export type AlertPrioritizationRequest = {
  alert_ids?: string[]
  limit?: number
  min_priority_score?: number
}

export type PriorityFactors = {
  magnitude: number
  confidence: number
  importance: number
  velocity: number
  novelty: number
}

export type PrioritizedAlert = {
  alert_id: string
  aoi_id: string
  priority_score: number
  priority_level: 'low' | 'medium' | 'high' | 'critical'
  urgency_level: 'routine' | 'moderate' | 'urgent' | 'immediate'
  factors: PriorityFactors
  recommended_action: string
}

export type AlertPrioritizationResponse = {
  total_alerts: number
  prioritized_alerts: PrioritizedAlert[]
}

// Visualization Types
export type VisualizationRequest = {
  aoi_id: string
  geojson: GeoJSONPolygon
  visualization_type: 'heatmap' | 'comparison' | 'multi_index'
  date_range_days?: number
  indices?: string[]
}

export type VisualizationResponse = {
  aoi_id: string
  visualization_type: string
  visualization_url: string
  metadata: Record<string, any>
}