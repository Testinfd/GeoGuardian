@echo off
echo 🌍 Setting up GeoGuardian Frontend...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Copy environment file if it doesn't exist
if not exist ".env.local" (
    echo 📝 Creating environment file...
    copy env.local.example .env.local
    echo ⚠️  Please edit .env.local with your configuration
) else (
    echo ✅ Environment file already exists
)

REM Create public directory structure if needed
if not exist "public\leaflet" mkdir public\leaflet

REM Download Leaflet marker icons if they don't exist
if not exist "public\leaflet\marker-icon.png" (
    echo 🗺️  Downloading Leaflet marker icons...
    curl -o public\leaflet\marker-icon.png https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png
    curl -o public\leaflet\marker-icon-2x.png https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png
    curl -o public\leaflet\marker-shadow.png https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png
    echo ✅ Leaflet icons downloaded
) else (
    echo ✅ Leaflet icons already exist
)

echo.
echo 🎉 Frontend setup complete!
echo.
echo Next steps:
echo 1. Edit .env.local with your configuration
echo 2. Ensure backend is running on http://localhost:8000
echo 3. Run 'npm run dev' to start development server
echo 4. Open http://localhost:3000 in your browser
echo.
echo For Google OAuth:
echo - Set up Google Cloud Console credentials
echo - Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local
echo.
echo Happy coding! 🚀
pause
