# GeoGuardian Frontend

A modern, professional React/Next.js frontend for GeoGuardian - an environmental monitoring platform that integrates with real Sentinel-2 satellite data analysis.

## 🌍 Overview

GeoGuardian is a cutting-edge environmental monitoring platform that provides real-time satellite imagery analysis for environmental change detection. This frontend provides an intuitive interface to interact with satellite data, create monitoring areas, and visualize environmental changes.

## 🚀 Features

- **Real-time Satellite Analysis**: Process Sentinel-2 satellite imagery with advanced algorithms
- **Interactive Map Interface**: Create and manage Areas of Interest (AOIs) with polygon drawing
- **Environmental Alerts**: Real-time notifications for detected environmental changes
- **Comprehensive Dashboard**: Overview of monitoring activities and analysis results
- **Authentication System**: Secure login with Google OAuth and email/password
- **Responsive Design**: Mobile-first design with professional aesthetics

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom earth-tone design system
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **Maps**: Leaflet.js with React-Leaflet
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables (optional)
# cp .env.example .env.local

# Run development server
npm run dev
```

### 🐛 Troubleshooting: "Module not found: Can't resolve '@/lib/*'"

If you see this error after cloning:

```bash
# Solution 1: Clear cache and restart
rm -rf .next
npm run dev

# Solution 2: Force Webpack mode (disable Turbopack)
npm run dev -- --no-turbo

# Solution 3: Ensure latest code
git pull origin main
npm install
```

**Root cause:** Next.js 15.5.3+ Turbopack needs explicit Webpack aliases.
**Status:** ✅ FIXED in `next.config.js` with Webpack resolver.

See `../SETUP_FIX_MODULE_RESOLUTION.md` for details.

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── layout/      # Layout components
│   │   ├── maps/        # Map-related components
│   │   ├── auth/        # Authentication components
│   │   └── features/    # Feature-specific components
│   ├── lib/             # Utilities and configurations
│   │   ├── api/         # API client modules
│   │   └── utils/       # Helper functions
│   ├── stores/          # Zustand state management
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── public/              # Static assets
└── Configuration files
```

## 🎯 Key Features

### 🗺️ Interactive Mapping
- Create monitoring areas by drawing polygons
- Visualize satellite imagery layers
- Real-time status indicators

### 📊 Analysis Dashboard
- View analysis progress in real-time
- Historical trend visualization
- Statistical analysis results

### 🚨 Alert Management
- Environmental change notifications
- Community verification system
- Priority-based alert levels

### 👤 User Management
- Secure authentication
- User profiles and settings
- OAuth integration

## 🔗 API Integration

The frontend integrates with the GeoGuardian FastAPI backend:

- **Authentication**: `/api/v1/auth/*`
- **AOI Management**: `/api/v1/aoi/*`
- **Analysis**: `/api/v2/analyze/*`
- **Alerts**: `/api/v1/alerts/*`

## 🎨 Design System

### Color Palette
- **Primary**: Forest Green (#2d5a27)
- **Secondary**: Ocean Blue (#1e3a5f)
- **Accent**: Earth Brown (#8b4513)
- **Background**: Light Gray (#f8f9fa)

### Typography
- **Font Family**: Inter
- **Sizes**: Responsive scaling from 12px to 48px
- **Weights**: 300-700

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Friendly**: Large touch targets and gestures

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

### Manual Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📖 Development Guide

### Adding New Components
1. Create component in appropriate directory
2. Export from index file
3. Add TypeScript types
4. Include in Storybook (if applicable)

### State Management
- Use Zustand stores for global state
- Implement proper error handling
- Add loading states for async operations

### API Integration
- Use existing API client modules
- Handle errors gracefully
- Implement proper TypeScript types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0.

## 🆘 Support

For support and questions, please contact the GeoGuardian team.

---

Built with ❤️ for environmental monitoring and protection.