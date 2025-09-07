import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token (optional)
api.interceptors.request.use(async (config) => {
  try {
    const session = await getSession()
    if (session?.user?.email) {
      // Use email as identifier since id might not be available
      config.headers.Authorization = `Bearer ${session.user.email}`
    }
    // If no session, continue without auth - app works anonymously
  } catch (error) {
    console.error('Error getting session:', error)
    // Continue without auth if session fails
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
  
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },
  
  oauth: async (data: { provider: string; email: string; name: string; image?: string }) => {
    const response = await api.post('/auth/oauth', data)
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// AOI API
export const aoiAPI = {
  getAll: () => api.get('/api/v1/aoi'),
  create: (data: { name: string; geometry: any }) => 
    api.post('/api/v1/aoi', { name: data.name, geojson: data.geometry }),
  delete: (id: string) => api.delete(`/api/v1/aoi/${id}`),
  getAlerts: (aoiId: string) => api.get(`/api/v1/aoi/${aoiId}/alerts`),
  verifyAlert: (alertId: string, verification: 'agree' | 'dismiss') => 
    api.post(`/api/v1/alerts/${alertId}/verify`, { verification }),
}

// Alerts API
export const alertsAPI = {
  getAOIAlert: async (aoiId: string) => {
    const response = await api.get(`/api/v1/alerts/aoi/${aoiId}`)
    return response.data
  },
  
  getAlert: async (id: string) => {
    const response = await api.get(`/api/v1/alerts/${id}`)
    return response.data
  },
  
  getUserAlerts: async () => {
    const response = await api.get('/api/v1/alerts')
    return response.data
  },
  
  verifyAlert: async (alertId: string, vote: 'agree' | 'dismiss') => {
    const response = await api.post('/api/v1/alerts/verify', { alert_id: alertId, vote })
    return response.data
  },
}

// Enhanced Analysis API (v2)
export const analysisAPI = {
  // Get analysis capabilities and system information
  getCapabilities: async () => {
    const response = await api.get('/api/v2/capabilities')
    return response.data
  },
  
  // Check data availability for an AOI
  checkDataAvailability: async (aoi_id: string, geojson: any, days_back: number = 30) => {
    const response = await api.get(`/api/v2/data-availability/${aoi_id}`, {
      params: { geojson: JSON.stringify(geojson), days_back }
    })
    return response.data
  },
  
  // Comprehensive analysis with full configuration
  runComprehensiveAnalysis: async (request: {
    aoi_id: string;
    geojson: any;
    analysis_type?: string;
    date_range_days?: number;
    max_cloud_coverage?: number;
    include_spectral_analysis?: boolean;
    include_visualizations?: boolean;
    algorithms?: string[];
    priority_threshold?: number;
  }) => {
    const response = await api.post('/api/v2/analyze/comprehensive', request)
    return response.data
  },
  
  // Specific analysis types with enhanced parameters
  runVegetationAnalysis: async (aoi_id: string, geojson: any, options?: {
    date_range_days?: number;
    algorithms?: string[];
  }) => {
    const response = await api.post('/api/v2/analyze/comprehensive', {
      aoi_id,
      geojson,
      analysis_type: 'vegetation',
      include_spectral_analysis: true,
      include_visualizations: true,
      ...options
    })
    return response.data
  },
  
  runWaterQualityAnalysis: async (aoi_id: string, geojson: any, options?: {
    date_range_days?: number;
    max_cloud_coverage?: number;
  }) => {
    const response = await api.post('/api/v2/analyze/comprehensive', {
      aoi_id,
      geojson,
      analysis_type: 'water',
      include_spectral_analysis: true,
      max_cloud_coverage: options?.max_cloud_coverage || 0.2,
      date_range_days: options?.date_range_days || 14,
      algorithms: ['ewma_water', 'spectral_analysis']
    })
    return response.data
  },
  
  runCoastalAnalysis: async (aoi_id: string, geojson: any, options?: {
    date_range_days?: number;
    include_vedgesat?: boolean;
  }) => {
    const response = await api.post('/api/v2/analyze/comprehensive', {
      aoi_id,
      geojson,
      analysis_type: 'coastal',
      include_visualizations: true,
      date_range_days: options?.date_range_days || 30,
      algorithms: options?.include_vedgesat !== false ? ['vedgesat_coastal', 'edge_detection'] : ['edge_detection']
    })
    return response.data
  },
  
  runConstructionAnalysis: async (aoi_id: string, geojson: any, options?: {
    date_range_days?: number;
    sensitivity?: 'low' | 'medium' | 'high';
  }) => {
    const sensitivity_thresholds = {
      low: 0.8,
      medium: 0.7,
      high: 0.5
    }
    
    const response = await api.post('/api/v2/analyze/comprehensive', {
      aoi_id,
      geojson,
      analysis_type: 'construction',
      include_spectral_analysis: true,
      include_visualizations: true,
      date_range_days: options?.date_range_days || 20,
      priority_threshold: sensitivity_thresholds[options?.sensitivity || 'medium'],
      algorithms: ['cusum_construction', 'spectral_analysis']
    })
    return response.data
  },
  
  runDeforestationAnalysis: async (aoi_id: string, geojson: any, options?: {
    date_range_days?: number;
    algorithms?: string[];
  }) => {
    const response = await api.post('/api/v2/analyze/comprehensive', {
      aoi_id,
      geojson,
      analysis_type: 'comprehensive',
      include_spectral_analysis: true,
      include_visualizations: true,
      date_range_days: options?.date_range_days || 60,
      algorithms: options?.algorithms || ['cusum_deforestation', 'ewma_vegetation', 'spectral_analysis']
    })
    return response.data
  },
  
  // Real-time analysis status checking
  getAnalysisStatus: async (analysis_id: string) => {
    const response = await api.get(`/api/v2/analysis/status/${analysis_id}`)
    return response.data
  },
  
  // Batch analysis for multiple AOIs
  runBatchAnalysis: async (aois: Array<{aoi_id: string, geojson: any, analysis_type?: string}>) => {
    const response = await api.post('/api/v2/analyze/batch', {
      analyses: aois
    })
    return response.data
  },
  
  // Historical analysis results
  getAnalysisHistory: async (aoi_id: string, limit: number = 10) => {
    const response = await api.get(`/api/v2/analysis/history/${aoi_id}`, {
      params: { limit }
    })
    return response.data
  },
  
  // Analysis comparison between time periods
  compareAnalysis: async (aoi_id: string, geojson: any, period1: string, period2: string) => {
    const response = await api.post('/api/v2/analyze/compare', {
      aoi_id,
      geojson,
      period1,
      period2
    })
    return response.data
  }
}

export default api
