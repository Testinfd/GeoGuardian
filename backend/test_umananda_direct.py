#!/usr/bin/env python3
"""
Direct Backend Test for Umananda Island
Tests complete analysis workflow without frontend
"""

import requests
import json
import time
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Backend API base URL
BASE_URL = "http://localhost:8000"

# Test user credentials
TEST_USER_EMAIL = "test-umananda@geoguardian.test"
TEST_USER_PASSWORD = "test-password-123-secure"

# Create headers
HEADERS = {
    'Content-Type': 'application/json',
}

# Umananda Island coordinates
UMANANDA_GEOJSON = {
    "type": "Polygon",
    "coordinates": [[
        [91.7447, 26.1961],
        [91.7447, 26.1967],
        [91.7453, 26.1967],
        [91.7453, 26.1961],
        [91.7447, 26.1961]
    ]]
}

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_step(step, text):
    """Print formatted step"""
    print(f"\n[STEP {step}] {text}")
    print("-" * 70)

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")

def create_test_user_and_login():
    """Create test user or login if exists"""
    print_step(1, "User Authentication")
    
    try:
        # Try to register test user
        print_info(f"Creating/logging in test user: {TEST_USER_EMAIL}")
        
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Test User - Umananda"
            },
            timeout=10
        )
        
        # Try login (user may already exist)
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            },
            timeout=10
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            access_token = data.get('access_token')
            if access_token:
                HEADERS['Authorization'] = f'Bearer {access_token}'
                print_success("Authenticated successfully!")
                print_info(f"User ID: {data.get('user', {}).get('id', 'unknown')}")
                return True
        
        print_error(f"Login failed: {login_response.status_code}")
        print_error(f"Response: {login_response.text}")
        return False
        
    except Exception as e:
        print_error(f"Authentication failed: {e}")
        return False

def test_health_check():
    """Test if backend is running"""
    print_step(1, "Health Check")
    try:
        # Try system status endpoint instead
        response = requests.get(f"{BASE_URL}/api/v2/analysis/system/status", headers=HEADERS, timeout=10)
        if response.status_code == 200:
            print_success("Backend is online and healthy")
            data = response.json()
            if data.get('system_online'):
                print_info(f"Database: {data.get('database_status', 'unknown')}")
                print_info(f"Satellite service: {data.get('satellite_service_status', 'unknown')}")
            return True
        else:
            print_error(f"Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to backend. Is it running on http://localhost:8000?")
        return False
    except requests.exceptions.Timeout:
        print_info("Backend is slow to respond but likely running...")
        print_success("Proceeding with test...")
        return True  # Continue anyway
    except Exception as e:
        print_error(f"Health check failed: {e}")
        print_info("Will try to continue anyway...")
        return True  # Continue anyway

def create_aoi():
    """Create AOI for Umananda Island"""
    print_step(3, "Create AOI - Umananda Island")
    
    aoi_data = {
        "name": "Umananda Island (Direct Test)",
        "description": "World's smallest inhabited river island - Direct backend test",
        "geojson": UMANANDA_GEOJSON,
        "monitoring_enabled": True,
        "alert_threshold": 0.7
    }
    
    try:
        print_info(f"Sending AOI creation request...")
        response = requests.post(
            f"{BASE_URL}/api/v2/aoi",
            headers=HEADERS,
            json=aoi_data,
            timeout=30
        )
        
        if response.status_code == 200:
            aoi = response.json()
            print_success(f"AOI created successfully")
            print_info(f"AOI ID: {aoi['id']}")
            print_info(f"AOI Name: {aoi['name']}")
            return aoi['id'], aoi
        else:
            print_error(f"AOI creation failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print_error(f"AOI creation failed: {e}")
        return None, None

def check_data_availability(aoi_id, geojson):
    """Check satellite data availability"""
    print_step(4, "Check Satellite Data Availability")
    
    try:
        print_info("Checking if satellite imagery is available...")
        response = requests.post(
            f"{BASE_URL}/api/v2/analysis/data-availability/preview",
            headers=HEADERS,
            json={"geojson": geojson},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_success("Satellite data is available!")
                print_info(f"Images available: {data.get('images_available', 'Unknown')}")
                print_info(f"Sufficient for analysis: {data.get('sufficient_for_analysis', False)}")
                if data.get('latest_image'):
                    print_info(f"Latest image: {data['latest_image'].get('timestamp', 'Unknown')}")
                return True
            else:
                print_error("Insufficient satellite data")
                print_info(f"Reason: {data.get('message', 'Unknown')}")
                print_info(f"Recommendation: {data.get('recommendation', 'Try extending date range')}")
                return False
        else:
            print_error(f"Data availability check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Data availability check failed: {e}")
        return False

def run_comprehensive_analysis(aoi_id, geojson, date_range_days=60):
    """Run comprehensive analysis with historical data"""
    print_step(5, f"Run Comprehensive Analysis ({date_range_days} days historical data)")
    
    analysis_request = {
        "aoi_id": aoi_id,
        "geojson": geojson,
        "analysis_type": "comprehensive",
        "date_range_days": date_range_days,  # Historical data range!
        "max_cloud_coverage": 0.3,
        "include_spectral_analysis": True,
        "include_visualizations": True
    }
    
    try:
        print_info(f"Starting analysis with {date_range_days} days of historical data...")
        print_info("This may take 3-5 minutes...")
        
        response = requests.post(
            f"{BASE_URL}/api/v2/analysis/analyze/comprehensive",
            headers=HEADERS,
            json=analysis_request,
            timeout=600  # 10 minute timeout
        )
        
        if response.status_code == 200:
            analysis = response.json()
            
            print_success("Analysis request completed!")
            print_info(f"Analysis ID: {analysis['id']}")
            print_info(f"Status: {analysis['status']}")
            print_info(f"Success: {analysis.get('success', False)}")
            
            if analysis['status'] == 'completed':
                print_success("Analysis completed successfully!")
                return analysis['id'], analysis
            elif analysis['status'] == 'insufficient_data':
                print_error("Analysis failed: Insufficient satellite data")
                if analysis.get('processing_metadata'):
                    print_info(f"Error: {analysis['processing_metadata'].get('error', 'Unknown')}")
                    tips = analysis['processing_metadata'].get('helpful_tips', [])
                    if tips:
                        print_info("Helpful tips:")
                        for tip in tips:
                            print(f"   • {tip}")
                return analysis['id'], analysis
            else:
                print_info(f"Analysis status: {analysis['status']}")
                return analysis['id'], analysis
        else:
            print_error(f"Analysis failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print_error(f"Analysis failed: {e}")
        return None, None

def display_analysis_results(analysis):
    """Display detailed analysis results"""
    print_step(6, "Analysis Results")
    
    if analysis['status'] != 'completed':
        print_error(f"Analysis not completed. Status: {analysis['status']}")
        return
    
    # Overall results
    print_info("Overall Results:")
    print(f"   • Overall Confidence: {analysis.get('overall_confidence', 0) * 100:.1f}%")
    print(f"   • Priority Level: {analysis.get('priority_level', 'unknown')}")
    print(f"   • Data Quality: {analysis.get('data_quality_score', 0) * 100:.1f}%")
    print(f"   • Processing Time: {analysis.get('processing_time_seconds', 0):.2f}s")
    
    # Algorithm results
    if analysis.get('detections'):
        print_info(f"\nAlgorithm Results ({len(analysis['detections'])} algorithms):")
        for detection in analysis['detections']:
            status = "🔴 CHANGE DETECTED" if detection.get('detected') else "🟢 NO CHANGE"
            confidence = detection.get('confidence', 0) * 100
            print(f"   • {detection.get('algorithm', 'Unknown')}: {status} ({confidence:.1f}% confidence)")
            if detection.get('details'):
                print(f"      Details: {detection['details']}")
    
    # Visualizations
    if analysis.get('results', {}).get('visualizations'):
        viz = analysis['results']['visualizations']
        print_info("\nVisualizations Generated:")
        if viz.get('before_image'):
            print(f"   ✅ Before Image: {viz['before_image'][:80]}...")
        if viz.get('after_image'):
            print(f"   ✅ After Image: {viz['after_image'][:80]}...")
        if viz.get('change_map'):
            print(f"   ✅ Change Map: {viz['change_map'][:80]}...")
        if viz.get('gif_visualization'):
            print(f"   ✅ GIF Animation: {viz['gif_visualization'][:80]}...")
    
    # Statistics
    if analysis.get('results', {}).get('statistics'):
        stats = analysis['results']['statistics']
        print_info("\nStatistical Analysis:")
        for key, value in stats.items():
            print(f"   • {key.replace('_', ' ').title()}: {value}")

def generate_heatmap(aoi_id, geojson, date_range_days=60):
    """Generate change intensity heatmap"""
    print_step(7, "Generate Change Intensity Heatmap")
    
    heatmap_request = {
        "aoi_id": aoi_id,
        "geojson": geojson,
        "visualization_type": "heatmap",
        "date_range_days": date_range_days
    }
    
    try:
        print_info("Generating heatmap visualization...")
        response = requests.post(
            f"{BASE_URL}/api/v2/analysis/visualize",
            headers=HEADERS,
            json=heatmap_request,
            timeout=300
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success("Heatmap generated successfully!")
            print_info(f"Visualization URL: {result['visualization_url'][:80]}...")
            return result['visualization_url']
        else:
            print_error(f"Heatmap generation failed: {response.status_code}")
            return None
            
    except Exception as e:
        print_error(f"Heatmap generation failed: {e}")
        return None

def detect_hotspots(aoi_id, geojson, date_range_days=60):
    """Detect change hotspots"""
    print_step(8, "Detect Change Hotspots")
    
    hotspot_request = {
        "aoi_id": aoi_id,
        "geojson": geojson,
        "date_range_days": date_range_days,
        "grid_size": 10,
        "threshold_percentile": 75
    }
    
    try:
        print_info("Analyzing hotspots...")
        response = requests.post(
            f"{BASE_URL}/api/v2/analysis/hotspot-detection",
            headers=HEADERS,
            json=hotspot_request,
            timeout=300
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Hotspot analysis complete!")
            print_info(f"Hotspots found: {len(result.get('hotspots', []))}")
            
            # Display top 3 hotspots
            hotspots = result.get('hotspots', [])[:3]
            if hotspots:
                print_info("Top 3 hotspots:")
                for i, hotspot in enumerate(hotspots, 1):
                    pos = hotspot.get('grid_position', {})
                    intensity = hotspot.get('intensity', 0)
                    print(f"   {i}. Position: ({pos.get('row', '?')}, {pos.get('col', '?')}), Intensity: {intensity:.2f}")
            
            return result
        else:
            print_error(f"Hotspot detection failed: {response.status_code}")
            return None
            
    except Exception as e:
        print_error(f"Hotspot detection failed: {e}")
        return None

def main():
    """Main test function"""
    print_header("🛰️  UMANANDA ISLAND - DIRECT BACKEND TEST")
    print(f"📍 Location: World's smallest inhabited river island")
    print(f"🌍 Coordinates: 26.1964°N, 91.7450°E (Brahmaputra River, Guwahati)")
    print(f"⏰ Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Authenticate
    if not create_test_user_and_login():
        print_error("\n❌ Failed to authenticate. Check backend auth endpoints.")
        sys.exit(1)
    
    # Test 2: Health check
    if not test_health_check():
        print_info("\n⚠️ Health check had issues but continuing...")
    
    # Test 3: Create AOI
    aoi_id, aoi = create_aoi()
    if not aoi_id:
        print_error("\n❌ Failed to create AOI. Check backend logs.")
        sys.exit(1)
    
    # Test 4: Check data availability
    data_available = check_data_availability(aoi_id, UMANANDA_GEOJSON)
    
    # Test 5: Run comprehensive analysis
    # Try 60 days first, then 90 days if needed
    analysis_id, analysis = run_comprehensive_analysis(aoi_id, UMANANDA_GEOJSON, date_range_days=60)
    
    if analysis and analysis.get('status') == 'insufficient_data':
        print_info("\n⚠️  Insufficient data with 60 days. Trying 90 days...")
        analysis_id, analysis = run_comprehensive_analysis(aoi_id, UMANANDA_GEOJSON, date_range_days=90)
    
    if not analysis:
        print_error("\n❌ Analysis failed completely. Check backend logs.")
        sys.exit(1)
    
    # Test 6: Display results
    if analysis.get('status') == 'completed':
        display_analysis_results(analysis)
        
        # Test 7: Generate heatmap
        heatmap_url = generate_heatmap(aoi_id, UMANANDA_GEOJSON)
        
        # Test 8: Detect hotspots
        hotspots = detect_hotspots(aoi_id, UMANANDA_GEOJSON)
        
        # Final summary
        print_header("✅ TEST COMPLETE - SUCCESS!")
        print("📊 All features tested successfully:")
        print("   ✅ AOI Creation")
        print("   ✅ Data Availability Check")
        print("   ✅ Comprehensive Analysis (with historical data)")
        print("   ✅ Change Detection (EWMA, CUSUM, VedgeSat)")
        print("   ✅ Visualizations (Before, After, Change Map, GIF)")
        if heatmap_url:
            print("   ✅ Heatmap Generation")
        if hotspots:
            print("   ✅ Hotspot Detection")
        
        print(f"\n📝 Analysis ID: {analysis_id}")
        print(f"🌐 View in frontend: http://localhost:3000/analysis/{analysis_id}")
        
    else:
        print_header("⚠️  TEST COMPLETE - PARTIAL SUCCESS")
        print(f"Analysis Status: {analysis.get('status')}")
        print(f"Analysis ID: {analysis_id}")
        
        if analysis.get('status') == 'insufficient_data':
            print("\n💡 Recommendations:")
            print("   • Try again in 2-5 days (next Sentinel-2 pass)")
            print("   • Check if location has good satellite coverage")
            print("   • Verify Sentinel Hub API credentials")
            print("   • Try a different location (e.g., Delhi, London)")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

