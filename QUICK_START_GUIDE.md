# GeoGuardian - Quick Start Guide
## Full Stack Setup & Testing
## Date: 2025-10-04

---

## ✅ Status: All Critical Issues Fixed - Ready to Run!

---

## 🚀 Quick Start Commands

### Step 1: Start Backend Server

```powershell
# Open Terminal 1
cd "C:\Users\Ripuranjan Baruah\Desktop\GeoGuardian\backend"

# Activate virtual environment (if using one)
# .\venv\Scripts\Activate.ps1

# Start backend server
python -m uvicorn app.main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

**Test Backend:**
```powershell
# Open a new terminal and test
curl http://localhost:8000/health
curl http://localhost:8000/api/v2/analysis/system/status
```

---

### Step 2: Start Frontend Development Server

```powershell
# Open Terminal 2
cd "C:\Users\Ripuranjan Baruah\Desktop\GeoGuardian\frontend"

# Install dependencies (if not already done)
# npm install

# Start frontend development server
npm run dev
```

**Expected Output:**
```
> geoguardian-frontend@0.1.0 dev
> next dev

   ▲ Next.js 15.5.3
   - Local:        http://localhost:3000
   - Environments: .env.local, .env.production

 ✓ Starting...
 ✓ Ready in 2.3s
```

---

## 🧪 Testing the Full Stack

### 1. Test Frontend Access
Open your browser: **http://localhost:3000**

**Expected:** Landing page loads successfully

---

### 2. Test Authentication

#### Register New Account
1. Navigate to: **http://localhost:3000/auth/register**
2. Fill in:
   - Email: `test@example.com`
   - Password: `Test123!@#`
   - Full Name: `Test User`
3. Click "Register"
4. **Expected:** Redirect to dashboard with success message

#### Login
1. Navigate to: **http://localhost:3000/auth/login**
2. Enter credentials
3. Click "Login"
4. **Expected:** Redirect to dashboard

---

### 3. Test AOI Creation (Using v2 API)

1. Navigate to: **http://localhost:3000/aoi/create**
2. Draw a polygon on the map
3. Fill in AOI details:
   - Name: "Test AOI"
   - Description: "Testing v2 API integration"
   - Tags: ["test", "demo"]
   - Public: ☐ (unchecked for private)
4. Click "Save AOI"
5. **Expected:** AOI created with all new fields (area_km2, description, tags)

---

### 4. Test Comprehensive Analysis

1. Navigate to: **http://localhost:3000/analysis/new**
2. Select your created AOI
3. Configure analysis:
   - Analysis Type: "Comprehensive"
   - Date Range: 30 days
   - Max Cloud Coverage: 20%
   - Include Visualizations: ✓
4. Click "Start Analysis"
5. **Expected:** 
   - Analysis starts with progress tracking
   - Results show after completion with:
     - Change detection results
     - Confidence scores
     - Spectral indices (NDVI, NDWI, NDBI, etc.)
     - Visualizations (before/after images, GIF)

---

### 5. Test Alerts System

1. After analysis completes, navigate to: **http://localhost:3000/alerts**
2. View generated alerts
3. Click on an alert to see details
4. Test verification (thumbs up/down)
5. **Expected:** 
   - Alerts list displays with all metadata
   - Alert details show correctly
   - Verification updates in real-time

---

## 🔧 Troubleshooting

### Backend Issues

#### Issue: "Module not found" errors
```powershell
pip install -r requirements.txt
```

#### Issue: Database connection errors
- Check `backend/.env` file exists
- Verify Supabase credentials are correct
- Test connection: `curl http://localhost:8000/health`

#### Issue: Sentinel Hub API errors
- Verify `SENTINELHUB_CLIENT_ID` and `SENTINELHUB_CLIENT_SECRET` in `backend/.env`
- Check Sentinel Hub account has credits

---

### Frontend Issues

#### Issue: "Cannot find module" errors
```powershell
cd frontend
npm install
```

#### Issue: Environment variables not loading
- Verify `frontend/.env.local` exists
- Restart development server: `npm run dev`

#### Issue: API connection errors
- Ensure backend is running on http://localhost:8000
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`

---

## 📊 System Health Checks

### Backend Health Check
```powershell
curl http://localhost:8000/api/v2/analysis/system/status
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "up",
    "sentinel_hub": "up",
    "analysis_engine": "up"
  },
  "version": "1.0.0",
  "uptime": 120
}
```

### Frontend Health Check
```powershell
curl http://localhost:3000
```

**Expected:** HTML response with no errors

---

## 🎯 Key Features to Test

### ✅ Must Test (Critical Path)
1. User Registration & Login
2. AOI Creation with v2 API (description, tags, is_public)
3. Comprehensive Analysis with real satellite data
4. Alert Generation and Viewing
5. Data Availability Check

### ⭐ Should Test (Important Features)
1. AOI Editing and Deletion
2. Historical Analysis
3. Alert Verification/Voting
4. System Status Dashboard
5. Analysis Progress Tracking

### 🔄 Can Test (Nice to Have)
1. Google OAuth Login (if configured)
2. Public AOI viewing
3. AOI tagging and filtering
4. Alert filtering and sorting
5. Export functionality

---

## 📈 Expected Performance

### Backend
- API Response Time: < 500ms
- Analysis Time: 20-60 seconds (depending on AOI size)
- Database Queries: < 100ms

### Frontend
- Page Load Time: < 2 seconds
- Build Time: ~10 seconds
- Bundle Size: < 200KB per page

---

## 🎉 Success Criteria

### ✅ Full Stack Integration Successful When:
- [ ] Frontend loads without errors
- [ ] Backend API responds to health checks
- [ ] User can register and login
- [ ] AOIs can be created with all v2 fields
- [ ] Analysis completes successfully
- [ ] Results display with visualizations
- [ ] Alerts are generated and viewable
- [ ] No console errors in browser
- [ ] No server errors in backend logs

---

## 🛠️ Development Workflow

### Making Changes

**Backend Changes:**
```powershell
# Backend auto-reloads with --reload flag
# Just save your files and changes apply immediately
```

**Frontend Changes:**
```powershell
# Next.js auto-reloads on file save
# Fast Refresh applies changes without full reload
```

### Building for Production

**Backend:**
```powershell
# No build step needed for Python backend
# Deploy directly with production WSGI server
```

**Frontend:**
```powershell
cd frontend
npm run build
npm start
```

---

## 📝 Environment Variables Summary

### Backend (.env)
```bash
SUPABASE_URL=https://exhuqtrrklcichdteauv.supabase.co
SUPABASE_ANON_KEY=<your-key>
SENTINELHUB_CLIENT_ID=<your-id>
SENTINELHUB_CLIENT_SECRET=<your-secret>
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://exhuqtrrklcichdteauv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=http://localhost:3000
```

---

## 🔗 Useful Links

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Supabase Dashboard:** https://supabase.com/dashboard/project/exhuqtrrklcichdteauv

---

## 📚 Documentation References

- `FRONTEND_FIXES_COMPLETED.md` - All fixes applied
- `backend/BACKEND_FIXES_SUMMARY.md` - Backend status
- `backend/SUPABASE_DATABASE_STATUS.md` - Database configuration
- `FRONTEND_ISSUES_AND_ROADMAP_SUMMARY.md` - Complete roadmap

---

## 🎊 You're All Set!

**Both frontend and backend are fully functional and ready for development/testing.**

Start both servers and navigate to http://localhost:3000 to begin!

---

*Last Updated: 2025-10-04*  
*Status: Ready for Full Stack Testing* ✅

