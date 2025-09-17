# 🔒 Security & Setup Instructions

## Critical Security Updates Applied

### ✅ What Was Fixed

1. **🚨 RLS Bypass Vulnerability** - Removed hardcoded service role key that bypassed Row Level Security
2. **🔒 RLS Policies Enabled** - All tables now have proper Row Level Security policies
3. **🔑 Environment Variables** - Moved sensitive keys from code to environment variables
4. **📊 Database Schema Fixed** - Updated v2 API endpoints to match actual Supabase schema

### 🔐 Required Environment Setup

Create a `backend/.env` file with these variables:

```bash
# Environment Configuration
ENVIRONMENT=development

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://exhuqtrrklcichdteauv.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here

# API Keys (Optional for development)
SENTINELHUB_CLIENT_ID=your_sentinel_client_id
SENTINELHUB_CLIENT_SECRET=your_sentinel_secret

# Email (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=alerts@geoguardian.app

# Frontend
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=your-secure-jwt-secret-here
```

**⚠️ IMPORTANT:** Never commit the `.env` file to git!

### 🔒 RLS Policies Applied

#### Users Table
- Users can only view, update, and insert their own records
- Authenticated via `auth.uid()`

#### AOIs Table  
- Users can view their own AOIs + public AOIs (user_id = null)
- Users can only modify their own AOIs
- Public AOIs are viewable by everyone

#### Alerts & Analyses Tables
- Users can only see alerts/analyses for AOIs they have access to
- Follows the same access pattern as AOIs

### 🛡️ Security Benefits

1. **No More Admin Bypass** - All database operations respect RLS policies
2. **User Isolation** - Users can only access their own data
3. **Public Data Access** - Anonymous users can view public AOIs
4. **Audit Trail** - All access is logged and controlled

### 🧪 Testing Security

Test unauthenticated access:
```bash
curl http://localhost:8000/api/v2/aoi
# Should return only public AOIs (user_id = null)
```

Test authenticated access:
```bash
curl -H "Authorization: Bearer <jwt_token>" http://localhost:8000/api/v2/aoi  
# Should return user's AOIs + public AOIs
```

### 📋 Current Database Schema

#### AOIs Table
```sql
- id (uuid, primary key)
- name (varchar)
- geojson (jsonb)  
- user_id (uuid, nullable - null = public)
- created_at (timestamptz)
- metadata (jsonb)
- status (varchar, default: 'active')
- last_analysis (timestamptz, nullable)
```

#### Alerts Table
```sql
- id (uuid, primary key)
- aoi_id (uuid, foreign key)
- type (alert_type enum)
- confidence (numeric, 0-1)
- confirmed (boolean, default: false)
- processing (boolean, default: true)
- created_at (timestamptz)
- overall_confidence (float)
- priority_level (varchar, default: 'info')
- analysis_type (varchar, default: 'basic')
- algorithms_used (jsonb)
- detections (jsonb)
- spectral_indices (jsonb)
- satellite_metadata (jsonb)
- processing_metadata (jsonb)
- processing_time_seconds (float)
- data_quality_score (float)
- gif_url (varchar, nullable)
```

### 🚀 API Endpoints Working

- ✅ `GET /api/v2/aoi` - List AOIs with RLS
- ✅ `GET /api/v2/aoi/{id}` - Get AOI by ID with RLS  
- ✅ `POST /api/v2/aoi` - Create AOI with RLS
- ✅ `PUT /api/v2/aoi/{id}` - Update AOI with RLS
- ✅ `DELETE /api/v2/aoi/{id}` - Delete AOI with RLS
- ✅ `GET /api/v2/alerts` - List alerts with RLS
- ✅ `GET /api/v2/system/status` - System status

### 🔍 Database Project Info

- **Project**: HackOdisha (exhuqtrrklcichdteauv)
- **Region**: us-east-2  
- **Status**: ACTIVE_HEALTHY
- **Postgres**: Version 17.4

### ⚠️ Important Notes

1. **Service Role Key Disabled** - For security, no admin bypass is available
2. **Frontend Auth** - Make sure frontend sends proper JWT tokens
3. **Public Data** - AOIs with `user_id = null` are considered public
4. **Error Handling** - RLS violations will return 403/empty results (this is correct!)

---

**🔒 Security is now properly enforced - your data is protected!**
