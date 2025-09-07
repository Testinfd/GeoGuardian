#!/bin/bash

# GeoGuardian Frontend Setup Script

echo "🌍 Setting up GeoGuardian Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating environment file..."
    cp env.local.example .env.local
    echo "⚠️  Please edit .env.local with your configuration"
else
    echo "✅ Environment file already exists"
fi

# Create public directory structure if needed
mkdir -p public/leaflet

# Download Leaflet marker icons if they don't exist
if [ ! -f "public/leaflet/marker-icon.png" ]; then
    echo "🗺️  Downloading Leaflet marker icons..."
    curl -o public/leaflet/marker-icon.png https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png
    curl -o public/leaflet/marker-icon-2x.png https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png
    curl -o public/leaflet/marker-shadow.png https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png
    echo "✅ Leaflet icons downloaded"
else
    echo "✅ Leaflet icons already exist"
fi

echo ""
echo "🎉 Frontend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Ensure backend is running on http://localhost:8000"
echo "3. Run 'npm run dev' to start development server"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "For Google OAuth:"
echo "- Set up Google Cloud Console credentials"
echo "- Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local"
echo ""
echo "Happy coding! 🚀"
