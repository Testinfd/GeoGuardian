# OAuth Setup Instructions for GeoGuardian 🔐

## Current Status ✅
- **Database**: Fixed to allow anonymous AOI creation
- **Backend**: Updated to handle both authenticated and anonymous users
- **AOI Storage**: Working properly (4 test AOIs created)
- **Frontend**: OAuth configuration ready

## Google OAuth Setup Required

### 1. Google Cloud Console Setup
Go to [Google Cloud Console](https://console.cloud.google.com/) and:

1. **Select your project** (or create one)
2. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" 
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "GeoGuardian Local"

4. **Add Authorized Redirect URLs**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

5. **Copy the credentials**:
   - Client ID: `your-client-id.apps.googleusercontent.com`
   - Client Secret: `your-client-secret`

### 2. Update Environment Variables
Add these to your `frontend/.env.local`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth Configuration  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### 3. Backend URL Configuration
Make sure this is in your `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Current Database Status 📊

Your Supabase database now has:
- ✅ **4 AOIs** ready to display
- ✅ **RLS disabled** on AOIs table  
- ✅ **Anonymous users** can create AOIs
- ✅ **Foreign key constraints** fixed

## Test the Application Now 🚀

1. **Start Frontend**: `npm run dev` in frontend directory
2. **Visit**: http://localhost:3000/dashboard  
3. **Expected Result**: You should see **4/5 Areas** instead of **0/5 Areas**

## AOIs That Should Appear:
1. Test AOI - Anonymous
2. Mumbai Coastal Area  
3. Delhi Industrial Zone
4. Bangalore Tech Park

## OAuth Flow:
- **Without Login**: Can create and view anonymous AOIs
- **With Google Login**: Can create personal AOIs tied to user account
- **Redirect URL**: `http://localhost:3000/api/auth/callback/google`

The application should now work perfectly even without OAuth setup! The AOI creation and display should be functional.
