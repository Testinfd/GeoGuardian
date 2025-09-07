@echo off
REM GeoGuardian Development Startup Script for Windows

echo 🌍 Starting GeoGuardian Development Environment...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is required but not installed.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed.
    pause
    exit /b 1
)

echo ✅ All dependencies found!

REM Start backend
echo 🔧 Starting backend server...
cd backend

if not exist ".env" (
    echo ⚠️  Backend .env file not found. Copying from env.example...
    copy env.example .env
    echo 📝 Please update .env with your actual API keys!
)

REM Install backend dependencies
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt

REM Start backend server
echo 🚀 Starting FastAPI server on port 8000...
start "Backend Server" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

cd ..

REM Start frontend
echo 🎨 Starting frontend server...
cd frontend

if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

if not exist ".env.local" (
    echo ⚠️  Frontend .env.local file not found. Copying from env.local.example...
    copy env.local.example .env.local
)

echo 🚀 Starting Next.js server on port 3000...
start "Frontend Server" cmd /k "npm run dev"

cd ..

echo 🎉 GeoGuardian is starting up!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo 💡 Tip: Make sure you've configured your .env files with valid API keys!
echo.
echo Press any key to exit...
pause >nul
