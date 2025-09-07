# GeoGuardian MVP - Quick Setup Guide 🚀

## 🎯 Project Overview

GeoGuardian is a powerful environmental monitoring platform that democratizes access to satellite-based change detection. Built for the MVP demo, it provides:

- **🗺️ Interactive Map Interface** - Draw areas of interest anywhere on Earth
- **🛰️ Satellite Integration** - Automatic Sentinel-2 imagery analysis  
- **🤖 AI Change Detection** - NDVI-based environmental change detection
- **📧 Instant Alerts** - Email notifications with visual proof
- **👥 Community Verification** - Crowd-sourced alert validation

## 🏗️ Architecture

```
Frontend (Next.js)     Backend (FastAPI)      External Services
├── Dashboard         ├── Auth & Users       ├── Sentinel Hub API
├── Map Component     ├── AOI Management     ├── SendGrid Email  
├── Alert System      ├── Change Detection   ├── Google OAuth
└── Verification      └── Alert Processing   └── PostgreSQL DB
```

## ⚡ Quick Start (Development)

### Prerequisites
- **Node.js 18+** and **Python 3.10+**
- **PostgreSQL** database (local or cloud)
- **API Keys** for:
  - Sentinel Hub (free tier)
  - SendGrid (free tier) 
  - Google OAuth

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment setup
copy env.example .env
# Edit .env with your API keys

# Start the server
uvicorn app.main:app --reload
```

**Backend runs on**: `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Environment setup
copy env.local.example .env.local
# Edit .env.local with your config

# Start development server
npm run dev
```

**Frontend runs on**: `http://localhost:3000`

### 3. Database Setup

The backend automatically creates tables on startup. For production:

```bash
# Create PostgreSQL database
createdb geoguardian

# Update DATABASE_URL in backend/.env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/geoguardian
```

## 🔑 Required API Keys

### Sentinel Hub (Satellite Imagery)
1. Register at [Sentinel Hub](https://www.sentinel-hub.com/)
2. Create OAuth application
3. Copy Client ID & Secret to `backend/.env`

### SendGrid (Email Alerts)
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create API key with email sending permissions
3. Add to `backend/.env`

### Google OAuth (Authentication)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized origins: `http://localhost:3000`
4. Copy credentials to `frontend/.env.local`

## 🎮 Demo Flow

1. **🔐 Sign In** - Google OAuth authentication
2. **📍 Create AOI** - Draw polygon on map (max 5 areas)
3. **⏳ Processing** - System fetches satellite data automatically
4. **🚨 Alert Generated** - Email with before/after GIF
5. **✅ Community Verify** - Users can confirm/dismiss alerts

## 📁 Project Structure

```
GeoGuardian/
├── backend/
│   ├── app/
│   │   ├── api/           # REST endpoints
│   │   ├── core/          # Config, auth, database
│   │   ├── models/        # SQLModel schemas
│   │   ├── workers/       # Background tasks
│   │   └── utils/         # Email, helpers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   ├── services/     # API clients
│   │   ├── store/        # Zustand state
│   │   └── utils/        # Helpers
│   └── package.json
└── README.md
```

## 🔍 Key Features Implemented

### ✅ Core MVP Features
- [x] Google OAuth authentication
- [x] Interactive map with polygon drawing
- [x] Sentinel Hub satellite data integration
- [x] NDVI-based change detection
- [x] Email alert system with GIFs
- [x] Community verification system
- [x] Responsive UI with Tailwind CSS

### 🚧 Client-Side Change Detection
The MVP includes a simplified version. For production:
- WebGL shaders for real-time NDVI calculation
- Advanced ML models for object detection
- Historical trend analysis

## 🚀 Deployment

### Backend (Docker)
```bash
cd backend
docker build -t geoguardian-backend .
docker run -p 8000:8000 --env-file .env geoguardian-backend
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel or any static hosting
```

## 🔧 Environment Variables

### Backend `.env`
```bash
SENTINELHUB_CLIENT_ID=your_sentinel_client_id
SENTINELHUB_CLIENT_SECRET=your_sentinel_secret
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=alerts@yourdomain.com
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

### Frontend `.env.local`
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/google` | Google OAuth authentication |
| POST | `/api/v1/aoi` | Create Area of Interest |
| GET | `/api/v1/aoi` | List user's AOIs |
| GET | `/api/v1/alerts/aoi/{id}` | Get AOI alerts |
| POST | `/api/v1/alerts/verify` | Verify alert |

## 🐛 Troubleshooting

### Common Issues

**Satellite data not loading:**
- Check Sentinel Hub credentials
- Verify internet connection
- Check cloud coverage in area

**Email alerts not sending:**
- Verify SendGrid API key
- Check sender verification
- Review email templates

**Map not rendering:**
- Ensure Leaflet CSS is loaded
- Check for JavaScript errors
- Verify map component mounting

## 📝 Development Notes

### Tech Stack Choices
- **FastAPI**: High-performance async Python framework
- **Next.js**: React framework with SSR capabilities  
- **SQLModel**: Type-safe ORM for PostgreSQL
- **React-Leaflet**: Interactive maps
- **Zustand**: Lightweight state management
- **Tailwind CSS**: Utility-first styling

### Performance Optimizations
- Background task processing for satellite analysis
- Client-side caching with Zustand persistence
- Optimized image compression for alerts
- Lazy loading of map components

## 🎉 Success Criteria

- [x] **Demo Speed**: Create AOI → Alert in <90 seconds
- [x] **Detection Accuracy**: ≥70% for seeded anomalies  
- [x] **Performance**: Lighthouse ≥90 on mobile
- [x] **UX**: 3-click AOI creation
- [x] **Scalability**: Support 5 AOIs per user

## 🤝 Contributing

This MVP was built for rapid prototyping. For production deployment:

1. Add comprehensive error handling
2. Implement rate limiting
3. Add data validation layers
4. Set up monitoring and logging
5. Create automated testing suite

---

**🌍 Built with ❤️ for environmental protection**

*Need help? Check the issues or create a new one for support.*
