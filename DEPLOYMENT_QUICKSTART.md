# 🚀 GeoGuardian - Quick Start Deployment Guide

## For Your Teammate - Frontend Developer

This guide will get you up and running with GeoGuardian in minutes!

---

## 📋 Prerequisites

**Required Software:**
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Visual Studio Code** (recommended) - [Download here](https://code.visualstudio.com/)

**Accounts You'll Need:**
- **Google Cloud Console** - for OAuth setup
- **Supabase** - for database and auth
- **Sentinel Hub** - for satellite imagery (optional for frontend dev)

---

## ⚡ Quick Setup (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/Testinfd/GeoGuardian.git
cd geoguardian
```

### 2. Install Dependencies
```bash
# Frontend dependencies
cd frontend
npm install

# Go back to root
cd ..
```

### 3. Configure Environment
```bash
# Copy and configure frontend environment
cd frontend
copy .env.local.example .env.local

# Edit .env.local with your keys (see step 4)
```

### 4. Get Your API Keys

#### **Supabase Setup (Required)**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API
4. Copy your project URL and anon key to `frontend/.env.local`

#### **Google OAuth Setup (Required)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins: `http://localhost:3000`
6. Copy client ID and secret to `frontend/.env.local`

---

## 🎯 Start Development

### Frontend Only (What you'll work on)
```bash
# Start frontend development server
cd frontend
npm run dev
```

Your frontend will be available at: **http://localhost:3000**

### Full Stack Development
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 📁 Project Structure

```
geoguardian/
├── frontend/           # Your workspace - Next.js + TypeScript
│   ├── src/
│   │   ├── app/        # Next.js 13 app directory
│   │   ├── components/ # React components
│   │   └── lib/        # Utilities and configurations
│   ├── .env.local      # Your environment variables
│   └── package.json
├── backend/            # Python FastAPI backend
├── docs/              # All documentation
└── README.md          # Main project README
```

---

## 🎨 Frontend Development Tasks

### **Current Status:**
- ✅ **Basic UI components** created
- ✅ **Map integration** with Leaflet
- ✅ **Authentication flow** with Supabase
- ✅ **API integration** structure in place

### **Your Tasks:**
1. **Enhance the UI/UX** - Make it beautiful and user-friendly
2. **Improve the map interface** - Better AOI drawing tools
3. **Add data visualization** - Charts, graphs for analysis results
4. **Optimize for mobile** - Responsive design improvements
5. **Add loading states** - Better user feedback during analysis
6. **Error handling** - User-friendly error messages

### **Key Files to Focus On:**
```
frontend/src/
├── components/
│   ├── Map.tsx              # Main map component
│   ├── AlertViewer.tsx      # Alert display component
│   ├── EnhancedAnalysisDemo.tsx # Analysis demo
│   └── AOICard.tsx          # AOI management
├── app/
│   ├── dashboard/page.tsx   # Main dashboard
│   └── alerts/[id]/page.tsx # Alert detail pages
└── lib/
    ├── supabase.ts          # Supabase client
    └── api.ts               # API integration
```

---

## 🔗 API Endpoints (Backend provides)

### **Authentication:**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user

### **AOI Management:**
- `GET /aoi/list` - List user's AOIs
- `POST /aoi/create` - Create new AOI
- `PUT /aoi/{id}` - Update AOI
- `DELETE /aoi/{id}` - Delete AOI

### **Analysis (Enhanced v2 API):**
- `POST /api/v2/analysis/analyze` - Run comprehensive analysis
- `GET /api/v2/analysis/status/{aoi_id}` - Check analysis status
- `GET /api/v2/analysis/algorithms` - List available algorithms

### **Alerts:**
- `GET /alerts/list` - List user alerts
- `GET /alerts/{id}` - Get alert details
- `PUT /alerts/{id}/confirm` - Confirm alert

---

## 🐛 Troubleshooting

### **Common Issues:**

**"Module not found" errors:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Environment variables not working:**
- Make sure `.env.local` is in the `frontend/` directory
- Restart the development server after changing env vars
- Check that variable names match exactly

**Port 3000 already in use:**
```bash
# Kill process using port 3000
npx kill-port 3000
```

**Supabase connection issues:**
- Verify your project URL and anon key
- Check Supabase dashboard for any service outages
- Ensure your IP is allowed (Supabase allows all by default)

---

## 📞 Need Help?

1. **Check the docs:** Look in the `docs/` folder for detailed guides
2. **Read the code:** Each component has comments explaining functionality
3. **Check existing issues:** See if similar problems were already solved
4. **Ask your backend teammate:** For API-related questions

---

## 🎯 Development Workflow

1. **Make changes** to frontend components
2. **Test locally** with `npm run dev`
3. **Check browser console** for errors
4. **Test different screen sizes** with browser dev tools
5. **Commit your changes** with clear commit messages

Happy coding! 🎉
