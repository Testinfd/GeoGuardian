/**
 * Application constants for GeoGuardian frontend
 */

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    GOOGLE: '/api/v1/auth/google',
    OAUTH: '/api/v1/auth/oauth',
    ME: '/api/v1/auth/me',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
  },
  AOI: {
    BASE: '/api/v2/aoi',  // Using v2 endpoint with enhanced features
    BY_ID: (id: string) => `/api/v2/aoi/${id}`,
    STATS: (id: string) => `/api/v2/aoi/${id}/stats`,
    ANALYSES: (id: string) => `/api/v2/aoi/${id}/analyses`,
    PUBLIC: '/api/v2/aoi/public',
    TAGS: '/api/v2/aoi/tags',
  },
  ANALYSIS: {
    COMPREHENSIVE: '/api/v2/analysis/analyze/comprehensive',
    HISTORICAL: '/api/v2/analysis/analyze/historical',
    RESULT: (id: string) => `/api/v2/analysis/${id}`,
    RESULTS: '/api/v2/analysis/results',
    DATA_AVAILABILITY: (aoiId: string) => `/api/v2/analysis/data-availability/${aoiId}`,
    STATUS: '/api/v2/analysis/system/status',
    CAPABILITIES: '/api/v2/analysis/capabilities',
    PREVIEW: '/api/v2/analysis/data-availability/preview',
  },
  ALERTS: {
    BASE: '/api/v2/alerts',
    BY_ID: (id: string) => `/api/v2/alerts/${id}`,
    BY_AOI: (aoiId: string) => `/api/v2/alerts/aoi/${aoiId}`,
    VERIFY: '/api/v2/alerts/verify',
    STATS: '/api/v2/alerts/stats',
  },
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  MAP_SETTINGS: 'map_settings',
  RECENT_SEARCHES: 'recent_searches',
  THEME: 'theme',
} as const

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 20.5937, lng: 78.9629 }, // India geographic center
  DEFAULT_ZOOM: 5,
  MIN_ZOOM: 2,
  MAX_ZOOM: 18,
  TILE_LAYERS: {
    OPENSTREETMAP: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
    },
    SATELLITE: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
    },
  },
  DRAWING_OPTIONS: {
    stroke: true,
    color: '#2d5a27',
    weight: 2,
    opacity: 0.8,
    fill: true,
    fillColor: '#2d5a27',
    fillOpacity: 0.2,
  },
} as const

// Analysis Types
export const ANALYSIS_TYPES = {
  COMPREHENSIVE: 'comprehensive',
  VEGETATION: 'vegetation',
  WATER: 'water',
  URBAN: 'urban',
  CHANGE_DETECTION: 'change_detection',
} as const

export const ANALYSIS_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export const ALGORITHM_TYPES = {
  EWMA: 'ewma',
  CUSUM: 'cusum',
  VEDGESAT: 'vedgesat',
  SPECTRAL: 'spectral',
} as const

// Alert Configuration
export const ALERT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export const ALERT_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const

export const VOTE_TYPES = {
  AGREE: 'agree',
  DISAGREE: 'disagree',
} as const

// UI Constants
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  API_CALL: 500,
  INPUT: 200,
} as const

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  AOI_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  AOI_DESCRIPTION: {
    MAX_LENGTH: 500,
  },
} as const

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif'],
    GEOJSON: ['application/json', 'application/geo+json'],
    CSV: ['text/csv', 'application/csv'],
  },
} as const

// Polling Intervals (in milliseconds)
export const POLLING_INTERVALS = {
  ANALYSIS_PROGRESS: 2000,
  SYSTEM_STATUS: 30000,
  ALERTS: 60000,
  REAL_TIME_UPDATES: 5000,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  REGISTER: 'Account created successfully!',
  AOI_CREATED: 'Area of Interest created successfully!',
  AOI_UPDATED: 'Area of Interest updated successfully!',
  AOI_DELETED: 'Area of Interest deleted successfully!',
  ANALYSIS_STARTED: 'Analysis started successfully!',
  ALERT_ACKNOWLEDGED: 'Alert acknowledged successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const

// Time Formats
export const TIME_FORMATS = {
  DATE: 'MMM dd, yyyy',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm:ss',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#2d5a27',
  SECONDARY: '#1e3a5f',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#3b82f6',
  CHART_PALETTE: [
    '#2d5a27', '#1e3a5f', '#8b4513', '#22c55e', '#f59e0b',
    '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  ],
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_GOOGLE_OAUTH: true,
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: false,
  ENABLE_ANALYTICS: true,
  ENABLE_EXPORT: true,
} as const

// Limits
export const LIMITS = {
  MAX_AOIS_PER_USER: 50,
  MAX_ALERTS_PER_PAGE: 20,
  MAX_ANALYSIS_CONCURRENT: 3,
  MAX_POLYGON_POINTS: 100,
  MIN_POLYGON_AREA: 0.01, // km²
  MAX_POLYGON_AREA: 10000, // km²
} as const

// Environmental Constants
export const ENVIRONMENTAL_TYPES = {
  VEGETATION: 'vegetation',
  WATER: 'water',
  URBAN: 'urban',
  FOREST: 'forest',
  AGRICULTURE: 'agriculture',
  BARE_SOIL: 'bare_soil',
  CLOUD: 'cloud',
} as const

export const CHANGE_TYPES = {
  DEFORESTATION: 'deforestation',
  URBANIZATION: 'urbanization',
  WATER_CHANGE: 'water_change',
  VEGETATION_LOSS: 'vegetation_loss',
  COASTAL_EROSION: 'coastal_erosion',
  AGRICULTURAL_EXPANSION: 'agricultural_expansion',
} as const

// Export all constants as a single object for convenience
export const CONSTANTS = {
  API_ENDPOINTS,
  STORAGE_KEYS,
  MAP_CONFIG,
  ANALYSIS_TYPES,
  ANALYSIS_STATUS,
  ALGORITHM_TYPES,
  ALERT_PRIORITY,
  ALERT_STATUS,
  VOTE_TYPES,
  BREAKPOINTS,
  ANIMATION_DURATION,
  DEBOUNCE_DELAY,
  VALIDATION_RULES,
  FILE_UPLOAD,
  POLLING_INTERVALS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TIME_FORMATS,
  CHART_COLORS,
  FEATURE_FLAGS,
  LIMITS,
  ENVIRONMENTAL_TYPES,
  CHANGE_TYPES,
} as const