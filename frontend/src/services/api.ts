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
  // Get system status and capabilities
  getStatus: async () => {
    const response = await api.get('/api/v2/analysis/status')
    return response.data
  },
  
  // Comprehensive analysis
  runComprehensiveAnalysis: async (data: {
    aoi_id: string;
    analysis_type?: string;
    algorithms?: string[];
    date_range_days?: number;
    use_baseline?: boolean;
  }) => {
    const response = await api.post('/api/v2/analysis/comprehensive', data)
    return response.data
  },
  
  // Specific analysis types
  runVegetationAnalysis: async (aoi_id: string) => {
    const response = await api.post('/api/v2/analysis/comprehensive', {
      aoi_id,
      analysis_type: 'vegetation'
    })
    return response.data
  },
  
  runWaterQualityAnalysis: async (aoi_id: string) => {
    const response = await api.post('/api/v2/analysis/comprehensive', {
      aoi_id,
      analysis_type: 'water'
    })
    return response.data
  },
  
  runCoastalAnalysis: async (aoi_id: string) => {
    const response = await api.post('/api/v2/analysis/comprehensive', {
      aoi_id,
      analysis_type: 'coastal'
    })
    return response.data
  },
  
  runConstructionAnalysis: async (aoi_id: string) => {
    const response = await api.post('/api/v2/analysis/comprehensive', {
      aoi_id,
      analysis_type: 'construction'
    })
    return response.data
  },
  
  // Install VedgeSat integration
  installVedgeSat: async () => {
    const response = await api.post('/api/v2/analysis/install-vedgesat')
    return response.data
  }
}

export default api
