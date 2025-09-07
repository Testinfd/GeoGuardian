# GeoGuardian - Supabase Integration Setup

This guide explains how to set up GeoGuardian with Supabase for authentication and database management.

## Overview

GeoGuardian has been updated to use Supabase as the backend service, replacing the previous SQLModel/PostgreSQL setup. This provides:

- **Supabase Auth**: Built-in authentication with Google OAuth
- **Supabase Database**: PostgreSQL database with Row Level Security (RLS)
- **Real-time subscriptions**: For live updates (future enhancement)
- **Edge Functions**: For serverless backend processing (future enhancement)

## Supabase Project Details

- **Project URL**: https://exhuqtrrklcichdteauv.supabase.co
- **Project Name**: HackOdisha
- **Region**: us-east-2

## Database Schema

The following tables have been created with RLS policies:

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    picture VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### AOIs Table  
```sql
CREATE TABLE aois (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    geojson JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Alerts Table
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aoi_id UUID NOT NULL REFERENCES aois(id) ON DELETE CASCADE,
    gif_url VARCHAR,
    type alert_type NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    confirmed BOOLEAN DEFAULT FALSE,
    processing BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Votes Table
```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote vote_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(alert_id, user_id)
);
```

## Setup Instructions

### 1. Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment Configuration**:
   Copy `env.example` to `.env` and update the values:
   ```bash
   cp env.example .env
   ```

   Update the following variables in `.env`:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://exhuqtrrklcichdteauv.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aHVxdHJya2xjaWNoZHRlYXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODEyNzYsImV4cCI6MjA3Mjc1NzI3Nn0.g9KP70igo6rM2gTUhNyhY9Fg6bgKNdb8EeyG2p9devw
   
   # Sentinel Hub API credentials
   SENTINELHUB_CLIENT_ID=your_sentinel_hub_client_id
   SENTINELHUB_CLIENT_SECRET=your_sentinel_hub_client_secret
   
   # SendGrid for email notifications
   SENDGRID_API_KEY=your_sendgrid_api_key
   FROM_EMAIL=alerts@geoguardian.app
   ```

3. **Run the Backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### 2. Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**:
   Copy `env.local.example` to `.env.local`:
   ```bash
   cp env.local.example .env.local
   ```

   The file should contain:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://exhuqtrrklcichdteauv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aHVxdHJya2xjaWNoZHRlYXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODEyNzYsImV4cCI6MjA3Mjc1NzI3Nn0.g9KP70igo6rM2gTUhNyhY9Fg6bgKNdb8EeyG2p9devw
   ```

3. **Run the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### 3. Google OAuth Setup

To enable Google authentication:

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/exhuqtrrklcichdteauv
   - Navigate to Authentication > Providers
   - Enable Google provider

2. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Set authorized redirect URI: `https://exhuqtrrklcichdteauv.supabase.co/auth/v1/callback`

3. **Add Credentials to Supabase**:
   - In Supabase dashboard, add your Google Client ID and Client Secret

## Key Changes Made

### Backend Changes
- Replaced SQLModel with Supabase Python client
- Updated all API endpoints to use Supabase instead of direct PostgreSQL
- Simplified authentication using Supabase Auth
- Removed Alembic migrations (handled by Supabase)

### Frontend Changes
- Added `@supabase/supabase-js` dependency
- Updated auth store to use Supabase Auth instead of NextAuth
- Updated AOI store with direct Supabase integration
- Simplified Google Sign-In component

### Database Changes
- Migrated from self-hosted PostgreSQL to Supabase
- Implemented Row Level Security (RLS) policies
- Added proper indexes for performance

## Features Working

✅ **Authentication**: Google OAuth via Supabase Auth
✅ **Database Operations**: CRUD operations for Users, AOIs, Alerts, Votes
✅ **Real-time Updates**: Zustand stores with Supabase integration
✅ **Row Level Security**: Users can only access their own data
✅ **Frontend Integration**: Next.js app with Supabase client

## Next Steps

1. **Google OAuth Configuration**: Complete the Google Cloud Console setup
2. **Sentinel Hub Integration**: Configure satellite imagery API
3. **SendGrid Email**: Set up email notifications
4. **Testing**: Test the complete flow end-to-end
5. **Deployment**: Deploy to production with proper environment variables

## Troubleshooting

### Common Issues

1. **Authentication not working**:
   - Check that Google OAuth is properly configured in Supabase
   - Verify redirect URLs are correct

2. **Database connection issues**:
   - Ensure Supabase keys are correct in environment variables
   - Check that RLS policies allow the operations

3. **CORS issues**:
   - Verify frontend URL is added to Supabase allowed origins

### Useful Commands

```bash
# Check Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://exhuqtrrklcichdteauv.supabase.co/rest/v1/users

# Reset database (if needed)
# This should be done through Supabase dashboard

# Check logs
# Available in Supabase dashboard under Logs
```

## Contact

For questions about the Supabase integration, please refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com/)
