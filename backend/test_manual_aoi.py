#!/usr/bin/env python3
"""
Manual AOI Backend Test
=======================

This script allows you to manually input AOI GeoJSON coordinates and run a comprehensive
test against the backend. It's designed for simplicity, removing the need for a
frontend by allowing direct data input.

**HOW TO USE:**
1.  **Edit the `aoi_name` and `geojson_coordinates` variables below.**
2.  Replace the default Umananda Island data with your own AOI name and GeoJSON.
3.  Run the script from your terminal: `python test_manual_aoi.py`

The script will then execute a series of tests:
- Health check to ensure the backend is online.
- AOI (Area of Interest) creation.
- Satellite imagery preview availability.
- Comprehensive data analysis.
- System status check.

This provides a complete, end-to-end validation of the backend processing pipeline
for any given set of coordinates.
"""

import requests
import json
import sys
import uuid

# --- EDIT THIS SECTION ---
# Put your AOI name and GeoJSON coordinates here.
# The default is Umananda Island, the world's smallest inhabited river island.

aoi_name = "Guwahati Urban Area (Manual Test)"
geojson_coordinates = {
    "type": "Polygon",
    "coordinates": [[
        [91.7330, 26.1415],  # Southwest corner (urban Guwahati)
        [91.7330, 26.1475],  # Northwest corner
        [91.7390, 26.1475],  # Northeast corner
        [91.7390, 26.1415],  # Southeast corner
        [91.7330, 26.1415]   # Close the polygon
    ]]
}

# --- END OF EDIT SECTION ---


# Backend API base URL
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test if backend is running"""
    print("\n[HEALTH] Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            print("[OK] Backend is running and healthy")
            return True
        else:
            print(f"[ERROR] Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] Cannot connect to backend: {e}")
        print("[TIP] Make sure the backend is running on http://localhost:8000")
        return False

def test_aoi_creation(name, geojson):
    """Test AOI creation"""
    print(f"\n[BUILD] Testing AOI creation: {name}")
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/aoi",
            json={"name": name, "geojson": geojson},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            print(f"[OK] AOI created successfully. ID: {result.get('aoi_id')}")
            return result.get('aoi_id')
        else:
            print(f"[ERROR] AOI creation failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"[ERROR] AOI creation error: {e}")
        return None

def test_satellite_preview(geojson):
    """Test satellite imagery preview"""
    print("\n[SATELLITE] Testing satellite imagery preview...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/v2/analysis/data-availability/preview",
            json={"geojson": geojson},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        if response.status_code == 200 and response.json().get('success'):
            result = response.json()
            print("[OK] Satellite preview successful.")
            print(f"   - Timestamp: {result.get('timestamp', 'N/A')}")
            print(f"   - Cloud Cover: {result.get('cloud_coverage', 'N/A')}")
            print(f"   - Quality: {result.get('quality_score', 'N/A')}")
            return True
        else:
            error_msg = response.json().get('error', response.text)
            print(f"[WARN] Preview failed or data not available: {error_msg}")
            return False
    except Exception as e:
        print(f"[ERROR] Preview error: {e}")
        return False

def test_comprehensive_analysis(name, geojson):
    """Test comprehensive analysis"""
    print(f"\n[ANALYSIS] Testing comprehensive analysis: {name}")
    analysis_data = {
        "aoi_id": str(uuid.uuid4()),
        "geojson": geojson,
        "analysis_type": "comprehensive",
    }
    try:
        response = requests.post(
            f"{BASE_URL}/api/v2/analysis/analyze/comprehensive",
            json=analysis_data,
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        if response.status_code == 200:
            result = response.json()
            print("[OK] Analysis completed.")
            print(f"   - Success: {result.get('success', False)}")
            print(f"   - Status: {result.get('status', 'unknown')}")
            print(f"   - Overall Confidence: {result.get('overall_confidence', 0):.3f}")
            print(f"   - Priority Level: {result.get('priority_level', 'unknown')}")
            print(f"   - Detections Found: {len(result.get('detections', []))}")
            print(f"   - Algorithms Used: {result.get('algorithms_used', [])}")
            print(f"   - Processing Time: {result.get('processing_time_seconds', 0):.1f}s")
            print(f"   - Data Quality Score: {result.get('data_quality_score', 0):.3f}")

            # Show detailed detection results
            detections = result.get('detections', [])
            if detections:
                print(f"   - Detection Details:")
                for i, detection in enumerate(detections[:3]):  # Show first 3
                    print(f"     {i+1}. Type: {detection.get('type', 'unknown')}")
                    print(f"        Confidence: {detection.get('confidence', 0):.3f}")
                    print(f"        Change Detected: {detection.get('change_detected', False)}")
            else:
                print("   - No environmental changes detected")

            # Show satellite metadata if available
            satellite_meta = result.get('satellite_metadata', {})
            if satellite_meta:
                recent = satellite_meta.get('recent_image', {})
                baseline = satellite_meta.get('baseline_image', {})
                if recent and baseline:
                    print(f"   - Satellite Data:")
                    print(f"     Recent Image: {recent.get('timestamp', 'N/A')[:10]}")
                    print(f"     Baseline Image: {baseline.get('timestamp', 'N/A')[:10]}")
                    print(f"     Time Separation: {satellite_meta.get('time_separation_days', 0)} days")

            return True
        else:
            print(f"[ERROR] Analysis failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Analysis error: {e}")
        return False

def test_system_status():
    """Test system status"""
    print("\n[STATUS] Testing system status...")
    try:
        response = requests.get(f"{BASE_URL}/api/v2/analysis/system/status", timeout=30)
        if response.status_code == 200:
            status = response.json()
            print("[OK] System status retrieved.")
            print(f"   - System Online: {status.get('system_online', False)}")
            print(f"   - DB Status: {status.get('database_status', 'unknown')}")
            print(f"   - Satellite Status: {status.get('satellite_data_status', 'unknown')}")
            return True
        else:
            print(f"[ERROR] System status failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] System status error: {e}")
        return False

def main():
    """Main test function"""
    print("="*60)
    print("      MANUAL GEOJSON COORDINATES BACKEND TESTER")
    print("="*60)
    print(f"TARGET AOI: {aoi_name}")
    print(f"COORDINATES: {json.dumps(geojson_coordinates)}")
    print("-" * 60)

    if not test_health_check():
        print("\n[FATAL] Backend is not running. Please start the backend server first.")
        print("Command: `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`")
        return 1

    results = [
        ("AOI Creation", test_aoi_creation(aoi_name, geojson_coordinates)),
        ("Satellite Preview", test_satellite_preview(geojson_coordinates)),
        ("Comprehensive Analysis", test_comprehensive_analysis(aoi_name, geojson_coordinates)),
        ("System Status", test_system_status()),
    ]

    print("\n" + "="*60)
    print("                    TEST SUMMARY")
    print("="*60)
    passed_count = sum(1 for _, success in results if success)
    for name, success in results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status:6} - {name}")

    print(f"\nOVERALL: {passed_count}/{len(results)} tests passed.")
    if passed_count == len(results):
        print("\n[SUCCESS] All tests passed! The backend is working correctly.")
        return 0
    else:
        print("\n[FAILURE] Some tests failed. Please review the logs above.")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n[INFO] Test interrupted by user. Exiting.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[CRITICAL] A critical error occurred: {e}")
        sys.exit(1)
