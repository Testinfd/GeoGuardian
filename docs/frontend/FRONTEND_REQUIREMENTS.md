# GeoGuardian Frontend Requirements Documentation

## 🌍 Overview

GeoGuardian is a cutting-edge environmental monitoring platform that provides real-time satellite imagery analysis for environmental change detection. This document outlines the complete frontend requirements to integrate with the existing, **fully operational FastAPI backend**.

## 🎯 Deployment Architecture

- **Frontend**: Vercel/Netlify/GitHub Pages (React/Next.js)
- **Backend**: Render/Railway/Heroku (FastAPI + Supabase)
- **Database**: Supabase (PostgreSQL)
- **Assets**: Supabase Storage
- **Real-time**: WebSocket support ready

## 🚀 Currently Working Backend Features

### ✅ Authentication System (OAuth + Email/Password)
- Google OAuth integration
- Email/password registration/login
- JWT token management
- User profile management
- Anonymous user support

### ✅ Advanced Satellite Analysis API v2
- **Real Sentinel-2 satellite data processing**
- Multi-algorithm environmental change detection
- Research-grade analysis capabilities
- Real-time visualization generation
- Comprehensive quality assessment

### ✅ Area of Interest (AOI) Management
- Create/Read/Update/Delete AOIs
- GeoJSON polygon support
- Background analysis processing
- User-specific and anonymous AOIs

### ✅ Alert System
- Real-time environmental alerts
- Alert verification via voting
- GIF visualization generation
- Priority-based alert levels

### ✅ Real-time System Monitoring
- Live system status endpoints
- Algorithm performance metrics
- Data availability checking

## 🏗️ Backend API Architecture

### Base URL Configuration
```javascript
// For development
const API_BASE_URL = 'http://localhost:8000'

// For production (when deployed to Render)
const API_BASE_URL = 'https://your-backend-name.onrender.com'
```

### 📡 Available API Endpoints

#### 1. Authentication Endpoints
```
POST /api/v1/auth/register     - Register new user
POST /api/v1/auth/login        - Login with email/password
POST /api/v1/auth/google       - Google OAuth login
POST /api/v1/auth/oauth        - Generic OAuth handler
GET  /api/v1/auth/me          - Get current user info
```

#### 2. Enhanced Analysis API v2 (Primary Features)
```
POST /api/v2/analyze/comprehensive  - Main analysis endpoint
GET  /api/v2/data-availability/{aoi_id}  - Check data availability
POST /api/v2/analyze/historical    - Historical trend analysis
GET  /api/v2/status                - Real-time system status
GET  /api/v2/capabilities          - System capabilities info
```

#### 3. AOI Management
```
POST /api/v1/aoi              - Create AOI
GET  /api/v1/aoi              - Get user AOIs
GET  /api/v1/aoi/{aoi_id}     - Get specific AOI
DELETE /api/v1/aoi/{aoi_id}   - Delete AOI
```

#### 4. Alert System
```
GET /api/v1/alerts            - Get user alerts
GET /api/v1/alerts/{alert_id} - Get specific alert
GET /api/v1/alerts/aoi/{aoi_id} - Get latest alert for AOI
POST /api/v1/alerts/verify   - Vote on alert verification
```

#### 5. System Health
```
GET /                         - Root endpoint
GET /health                   - Health check
GET /docs                     - Interactive API docs
```

## 🛠️ Frontend Technical Requirements

### Core Technologies
- **Framework**: Next.js 14+ or React 18+ with Vite
- **Styling**: Tailwind CSS or Material-UI
- **State Management**: Zustand or Redux Toolkit
- **HTTP Client**: Axios or Fetch API
- **Maps**: Leaflet.js or Mapbox GL JS
- **Authentication**: NextAuth.js or custom JWT handling
- **TypeScript**: Strongly recommended

### Environment Variables Required
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://exhuqtrrklcichdteauv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 📋 Page/Component Requirements

### 1. Landing Page (`/`)
**Components needed:**
- Hero section with real-time system status
- Feature showcase (use `/api/v2/capabilities`)
- Demo analysis section
- Authentication CTAs

**API Integration:**
```javascript
// Show live system capabilities
const capabilities = await fetch('/api/v2/capabilities')
const systemStatus = await fetch('/api/v2/status')
```

### 2. Authentication Pages (`/auth/login`, `/auth/register`)
**Components needed:**
- Email/password forms
- Google OAuth button
- Registration form with validation
- Password reset flow

**API Integration:**
```javascript
// Login
POST /api/v1/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}

// Google OAuth
POST /api/v1/auth/google
Content-Type: application/json
{
  "token": "google_id_token"
}
```

### 3. Dashboard (`/dashboard`)
**Components needed:**
- AOI list with status indicators
- Quick analysis buttons
- Recent alerts feed
- System status widget

**API Integration:**
```javascript
// Get user AOIs
const aois = await fetch('/api/v1/aoi', {
  headers: { Authorization: `Bearer ${token}` }
})

// Get user alerts
const alerts = await fetch('/api/v1/alerts', {
  headers: { Authorization: `Bearer ${token}` }
})
```

### 4. AOI Management (`/aoi/create`, `/aoi/[id]`)
**Components needed:**
- Interactive map for AOI creation (Leaflet/Mapbox)
- GeoJSON polygon drawing tools
- AOI details form
- Analysis history

**API Integration:**
```javascript
// Create AOI
POST /api/v1/aoi
Content-Type: application/json
{
  "name": "Forest Area 1",
  "geojson": {
    "type": "Polygon",
    "coordinates": [[[lat, lng], [lat, lng], ...]]
  }
}
```

### 5. Analysis Results (`/analysis/[aoi_id]`)
**Components needed:**
- Real-time analysis progress
- Results visualization (images, charts)
- Algorithm performance metrics
- Alert generation interface

**API Integration:**
```javascript
// Perform comprehensive analysis
POST /api/v2/analyze/comprehensive
Content-Type: application/json
{
  "aoi_id": "uuid",
  "geojson": {...},
  "analysis_type": "comprehensive",
  "date_range_days": 30,
  "max_cloud_coverage": 0.3,
  "include_spectral_analysis": true,
  "include_visualizations": true
}

// Check data availability first
GET /api/v2/data-availability/{aoi_id}?geojson={...}&days_back=30
```

### 6. Alert Management (`/alerts`)
**Components needed:**
- Alert list with filtering
- Alert detail modals
- Voting/verification interface
- Alert sharing functionality

**API Integration:**
```javascript
// Vote on alert
POST /api/v1/alerts/verify
Content-Type: application/json
{
  "alert_id": "uuid",
  "vote": "agree" // or "disagree"
}
```

### 7. Historical Analysis (`/analysis/historical/[aoi_id]`)
**Components needed:**
- Timeline visualization
- Trend analysis charts
- Comparative analysis tools
- Export functionality

**API Integration:**
```javascript
// Historical analysis
POST /api/v2/analyze/historical
Content-Type: application/json
{
  "aoi_id": "uuid",
  "analysis_type": "comprehensive",
  "months_back": 12,
  "interval_days": 30
}
```

## 🎨 UI/UX Requirements

### Design System
- **Color Palette**: Earth tones (greens, blues, browns) for environmental theme
- **Typography**: Clean, readable fonts (Inter, Roboto, or similar)
- **Icons**: Feather Icons or Heroicons for consistency
- **Responsive**: Mobile-first design approach

### Key UI Components
1. **Interactive Map Component**
   - Polygon drawing tools
   - Layer controls for satellite imagery
   - AOI visualization
   - Real-time status indicators

2. **Analysis Progress Component**
   - Real-time progress tracking
   - Algorithm status indicators
   - ETA calculations
   - Error handling

3. **Results Visualization Component**
   - Image before/after sliders
   - Statistical charts (Chart.js/Recharts)
   - Confidence indicators
   - Download options

4. **Alert Card Component**
   - Priority level indicators
   - Verification status
   - Social verification features
   - Sharing capabilities

## 🔧 State Management Architecture

### Recommended Store Structure (Zustand)
```javascript
const useAppStore = create((set) => ({
  // Authentication
  user: null,
  token: null,
  isAuthenticated: false,
  
  // AOIs
  aois: [],
  selectedAoi: null,
  
  // Analysis
  analysisResults: {},
  analysisProgress: {},
  
  // Alerts
  alerts: [],
  unreadAlerts: 0,
  
  // System
  systemStatus: null,
  capabilities: null,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  // ... other actions
}))
```

## 🔒 Security Considerations

### Authentication Flow
1. **JWT Storage**: Use httpOnly cookies or secure localStorage
2. **Token Refresh**: Implement automatic token refresh
3. **Route Protection**: Protect authenticated routes
4. **API Error Handling**: Handle 401/403 responses gracefully

### Data Validation
- Validate all GeoJSON inputs
- Sanitize user inputs
- Implement client-side validation matching backend validation

## 📊 Real-time Features

### WebSocket Integration (Future)
The backend is prepared for WebSocket connections for:
- Real-time analysis progress
- Live alert notifications
- System status updates

### Polling Strategy (Current)
For immediate implementation, use polling for:
```javascript
// Poll analysis progress
const pollAnalysisProgress = async (aoi_id) => {
  const interval = setInterval(async () => {
    const status = await fetch(`/api/v2/data-availability/${aoi_id}`)
    // Update UI based on status
  }, 2000)
}
```

## 🧪 Testing Requirements

### Unit Tests
- Component testing with Jest/React Testing Library
- API integration testing
- Authentication flow testing

### E2E Tests
- Cypress or Playwright for full user flows
- Critical path testing (AOI creation → Analysis → Results)

## 🚀 Deployment Configuration

### Environment-Specific Settings
```javascript
// config/api.js
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8000',
    timeout: 30000
  },
  production: {
    baseURL: 'https://your-backend.onrender.com',
    timeout: 60000
  }
}
```

### Vercel/Netlify Configuration
```json
// vercel.json or netlify.toml
{
  "build": {
    "env": {
      "NEXT_PUBLIC_API_BASE_URL": "@api-base-url"
    }
  },
  "functions": {
    "app/api/**/*": {
      "maxDuration": 30
    }
  }
}
```

## 📈 Performance Optimization

### Code Splitting
- Route-based code splitting
- Component lazy loading
- API response caching

### Image Optimization
- Next.js Image component for satellite imagery
- Progressive loading for analysis results
- WebP format support

## 🔄 Integration Checklist

### Phase 1: Core Setup ✅
- [ ] Set up Next.js project
- [ ] Configure API client
- [ ] Implement authentication
- [ ] Create basic routing

### Phase 2: Main Features ✅
- [ ] AOI management interface
- [ ] Analysis submission flow
- [ ] Results visualization
- [ ] Alert system

### Phase 3: Advanced Features ✅
- [ ] Historical analysis
- [ ] Real-time updates
- [ ] Social verification
- [ ] Export functionality

### Phase 4: Polish & Deploy ✅
- [ ] Performance optimization
- [ ] Testing suite
- [ ] Production deployment
- [ ] Monitoring setup

## 🛡️ Error Handling

### API Error Responses
```javascript
const handleApiError = (error) => {
  if (error.status === 401) {
    // Redirect to login
  } else if (error.status === 403) {
    // Show access denied
  } else if (error.status === 429) {
    // Show rate limit message
  } else {
    // Show generic error
  }
}
```

## 📚 Documentation Links

- **Backend API Docs**: `http://localhost:8000/docs` (when running)
- **Supabase Dashboard**: `https://app.supabase.com/project/exhuqtrrklcichdteauv`
- **Current API Schema**: Available at `/openapi.json`

## 🎯 Success Metrics

### Technical KPIs
- Page load time < 3 seconds
- API response time < 2 seconds for simple requests
- Analysis completion time < 60 seconds
- 99.9% uptime for frontend

### User Experience KPIs
- AOI creation flow completion rate > 90%
- Analysis result satisfaction rate
- Alert verification participation rate
- User retention after first analysis

---

## 🚨 Important Notes

1. **Backend is Production Ready**: All API endpoints are fully functional
2. **Real Data Processing**: The backend processes actual Sentinel-2 satellite imagery
3. **No Backend Changes Needed**: Frontend can be developed independently
4. **Database Schema**: Complete and optimized for performance
5. **Authentication**: Fully implemented with Google OAuth and email/password
6. **Analysis Algorithms**: Research-grade EWMA, CUSUM, VedgeSat, and Spectral Analysis

## 🤝 Development Workflow

1. **Frontend Development**: Independent development using mock data initially
2. **API Integration**: Connect to local backend (localhost:8000)
3. **Testing**: Use real backend for testing satellite analysis
4. **Production**: Deploy frontend and backend to separate platforms
5. **Monitoring**: Use backend `/health` and `/api/v2/status` for monitoring

This documentation provides everything needed to build a complete frontend that seamlessly integrates with the existing, fully operational GeoGuardian backend. The backend requires no modifications and is ready for production deployment.