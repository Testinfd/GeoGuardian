/**
 * Global TypeScript type definitions for GeoGuardian
 * Defines interfaces for API responses, state management, and component props
 */

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    accessToken?: string
    userId?: string
  }

  interface User {
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    userId?: string
  }
}

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
  full_name?: string
}

export interface GoogleOAuthRequest {
  token: string
}

// Geospatial Types
export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONPolygon
  properties?: Record<string, any>
}

export interface LatLng {
  lat: number
  lng: number
}

export interface BoundingBox {
  north: number
  south: number
  east: number
  west: number
}

// AOI (Area of Interest) Types
export interface AOI {
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
}

export interface CreateAOIRequest {
  name: string
  description?: string
  geojson: GeoJSONPolygon
  tags?: string[]
  is_public?: boolean
}

export interface UpdateAOIRequest {
  name?: string
  description?: string
  tags?: string[]
  is_public?: boolean
}

// Analysis Types
export type AnalysisType = 'comprehensive' | 'vegetation' | 'water' | 'urban' | 'change_detection'
export type AnalysisStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type AlgorithmType = 'ewma' | 'cusum' | 'vedgesat' | 'spectral'

export interface AnalysisRequest {
  aoi_id: string
  geojson?: GeoJSONPolygon
  analysis_type: AnalysisType
  date_range_days?: number
  max_cloud_coverage?: number
  include_spectral_analysis?: boolean
  include_visualizations?: boolean
  algorithms?: AlgorithmType[]
}

export interface HistoricalAnalysisRequest {
  aoi_id: string
  analysis_type: AnalysisType
  months_back?: number
  interval_days?: number
}

// Detection interface for detections array
export interface Detection {
  id?: string
  type: string
  confidence: number
  change_detected: boolean
  severity?: 'low' | 'medium' | 'high' | 'critical'
  location?: LatLng
  area_affected?: number
  description?: string
  metadata?: Record<string, any>
  // Additional properties for compatibility
  algorithm?: string
  detected?: boolean
  details?: string
}

export interface AnalysisResult {
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
    spectral_indices?: Record<string, number>
    visualizations?: {
      before_image?: string
      after_image?: string
      change_map?: string
      gif_visualization?: string
    }
    detections?: Detection[]
    visual_evidence?: any[]
    summary: string
    statistics: Record<string, number>
  }
  processing_time?: number
  error_message?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface DataAvailability {
  available: boolean
  image_count: number
  date_range: {
    start: string
    end: string
  }
  cloud_coverage_stats: {
    min: number
    max: number
    avg: number
  }
  message?: string
}

export interface DataAvailabilityResponse {
  aoi_id: string
  availability: DataAvailability
  recommendations?: string[]
  optimal_date_range?: {
    start: string
    end: string
  }
}

export interface SystemCapabilities {
  algorithms: AlgorithmType[]
  analysis_types: AnalysisType[]
  max_aoi_size_km2: number
  max_date_range_days: number
  supported_satellites: string[]
  spectral_indices: string[]
}

export interface SystemStatus {
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

export interface Alert {
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
}

export interface AlertVerificationRequest {
  alert_id: string
  vote: VoteType
  comment?: string
}

// =============================================================================
// State Management Types
// =============================================================================

// Authentication Store
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  loginWithGoogle: (token: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearError: () => void
}

// AOI Store
export interface AOIState {
  aois: AOI[]
  selectedAOI: AOI | null
  isLoading: boolean
  error: string | null
}

export interface AOIActions {
  fetchAOIs: () => Promise<void>
  createAOI: (aoiData: CreateAOIRequest) => Promise<AOI>
  updateAOI: (id: string, updates: UpdateAOIRequest) => Promise<AOI>
  deleteAOI: (id: string) => Promise<void>
  selectAOI: (aoi: AOI | null) => void
  clearError: () => void
}

// Analysis Store
export interface AnalysisState {
  results: Record<string, AnalysisResult>
  activeAnalyses: Record<string, AnalysisResult>
  systemStatus: SystemStatus | null
  capabilities: SystemCapabilities | null
  isLoading: boolean
  error: string | null
}

export interface AnalysisActions {
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
export interface AlertState {
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

export interface AlertActions {
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
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Button props
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  asChild?: boolean
}

// Input props
export interface InputProps extends BaseComponentProps {
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
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Map props
export interface MapProps extends BaseComponentProps {
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
export interface CardProps extends BaseComponentProps {
  title?: string
  description?: string
  variant?: 'default' | 'hover' | 'glass'
  onClick?: () => void
}

// Badge props
export interface BadgeProps extends BaseComponentProps {
  variant?: 'success' | 'warning' | 'danger' | 'default' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

// =============================================================================
// Utility Types
// =============================================================================

// API Response wrapper
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

// API Error response
export interface ApiError {
  error: string
  message: string
  status_code: number
  details?: Record<string, any>
}

// Pagination
export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

// Form validation
export interface FormErrors {
  [key: string]: string | undefined
}

// Loading states
export interface LoadingState {
  [key: string]: boolean
}

// Notification
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  timestamp: string
  read?: boolean
}

// Theme
export interface Theme {
  mode: 'light' | 'dark'
  colors: Record<string, string>
  fonts: Record<string, string>
}

// =============================================================================
// Global Application State
// =============================================================================

export interface AppState {
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

export interface MapClickEvent {
  latlng: LatLng
  originalEvent: MouseEvent
}

export interface DrawingEvent {
  polygon: GeoJSONPolygon
  area: number
}

export interface AnalysisProgressEvent {
  analysisId: string
  progress: number
  status: AnalysisStatus
  message?: string
}

// =============================================================================
// Hooks Return Types
// =============================================================================

export interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseFormReturn<T> {
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