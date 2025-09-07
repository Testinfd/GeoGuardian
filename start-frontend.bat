@echo off
echo 🌍 Starting GeoGuardian Frontend...

cd frontend

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies first...
    call npm install
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo ⚠️  Environment file missing! Copying template...
    copy env.local.example .env.local
    echo Please edit .env.local with your configuration before running again.
    pause
    exit /b 1
)

echo 🚀 Starting development server...
call npm run dev
