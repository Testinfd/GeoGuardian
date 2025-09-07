# GeoGuardian Frontend

A Next.js 14 application for environmental monitoring with satellite data, featuring both Google OAuth and email/password authentication.

## ✨ Features

- **🔐 Dual Authentication**: Google OAuth and email/password login with NextAuth.js
- **🗺️ Interactive Mapping**: Leaflet-based map with polygon drawing capabilities  
- **📊 Real-time Monitoring**: Up to 5 Areas of Interest (AOI) monitoring
- **🚨 Alert System**: Visual alerts with confidence scores and crowd verification
- **🎨 Modern UI**: Tailwind CSS with animations and responsive design
- **⚡ Performance**: React Query for data fetching and state management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend API running (see backend documentation)
- Google OAuth credentials (optional, for Google sign-in)

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.local.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   # Required
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   
   # Optional (for Google OAuth)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open application:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Authentication**: NextAuth.js with dual providers
- **State Management**: React Query + Zustand
- **Styling**: Tailwind CSS with Framer Motion
- **Maps**: React Leaflet with drawing capabilities
- **Type Safety**: TypeScript throughout

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Main dashboard
│   └── api/auth/          # NextAuth API routes
├── components/            # Reusable UI components
│   ├── AuthProvider.tsx   # Authentication wrapper
│   ├── MapManager.tsx     # Interactive map component
│   ├── AOIList.tsx        # Area of Interest list
│   ├── AlertViewer.tsx    # Alert details viewer
│   └── AOICard.tsx        # Individual AOI card
├── lib/                   # Utility libraries
│   └── auth.ts           # NextAuth configuration
├── services/              # API service layer
│   └── api.ts            # HTTP client and API calls
└── middleware.ts         # Route protection
```

## 🔧 Configuration

### Authentication Setup

1. **NextAuth Secret**: Generate a secure secret
   ```bash
   openssl rand -base64 32
   ```

2. **Google OAuth** (optional):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Application URL | ✅ |
| `NEXTAUTH_SECRET` | Session encryption key | ✅ |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | ❌ |

## 🎯 Usage

### Creating Monitoring Areas

1. **Login/Register**: Create account or sign in
2. **Draw Area**: Use polygon tool on map to draw monitoring area
3. **Name Area**: Give your area a descriptive name
4. **Monitor**: Area will be automatically monitored for changes

### Managing Alerts

1. **View Alerts**: Click on AOI in sidebar to see alerts
2. **Review Changes**: View satellite imagery showing detected changes
3. **Verify**: Help improve AI by confirming or dismissing alerts
4. **Track History**: See previous alerts and their status

## 🔌 API Integration

The frontend expects these backend endpoints:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login  
- `POST /auth/oauth` - OAuth user creation

### Areas of Interest
- `GET /api/v1/aoi` - Get user's AOIs
- `POST /api/v1/aoi` - Create new AOI
- `DELETE /api/v1/aoi/{id}` - Delete AOI

### Alerts
- `GET /api/v1/aoi/{id}/alerts` - Get AOI alerts
- `POST /api/v1/alerts/{id}/verify` - Verify alert

## 🎨 UI Components

### Key Components

- **MapManager**: Interactive Leaflet map with drawing tools
- **AOIList**: Sidebar showing all monitoring areas
- **AlertViewer**: Detailed view of alerts with verification
- **AuthProvider**: Authentication context and session management

### Design System

- **Colors**: Primary blue, success green, warning orange, danger red
- **Typography**: Inter font family
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Heroicons for consistent iconography

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Development Tips

1. **Hot Reload**: Changes auto-reload in development
2. **Type Safety**: TypeScript provides compile-time checking
3. **State**: React Query handles server state, check devtools
4. **Styling**: Use Tailwind classes, check design system

## 📱 Responsive Design

The application is fully responsive:

- **Desktop**: Full sidebar layout with large map
- **Tablet**: Collapsible sidebar with medium map
- **Mobile**: Bottom sheet navigation with mobile-optimized controls

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your Git repository to Vercel
2. **Set Environment Variables**: Add all required env vars in Vercel dashboard
3. **Deploy**: Automatic deployments on every push

### Manual Deployment

1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   npm run start
   ```

### Environment Setup

For production, ensure:
- `NEXTAUTH_URL` points to your domain
- `NEXT_PUBLIC_BACKEND_URL` points to production API
- All secrets are securely generated and stored

## 🐛 Troubleshooting

### Common Issues

1. **Map not loading**: Check if Leaflet CSS is imported
2. **Authentication errors**: Verify NextAuth secret and URLs
3. **API errors**: Ensure backend is running and accessible
4. **Build errors**: Check TypeScript types and imports

### Debug Mode

Enable debug logging:
```env
NEXTAUTH_DEBUG=true
```

## 📄 License

MIT License - see backend LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

For more details, see the main project README.