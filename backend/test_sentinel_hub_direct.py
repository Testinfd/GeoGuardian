"""
Direct Sentinel Hub Testing Script
Tests Sentinel Hub API connectivity, credentials, and data retrieval
"""

import os
import sys
from datetime import datetime, timedelta
from sentinelhub import (
    SHConfig, 
    DataCollection, 
    SentinelHubRequest, 
    BBox, 
    CRS, 
    MimeType,
    MosaickingOrder,
    bbox_to_dimensions
)
from PIL import Image
import numpy as np
from io import BytesIO
import base64

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_credentials():
    """Test if Sentinel Hub credentials are configured"""
    print("\n=== TESTING CREDENTIALS ===")
    
    from app.core.config import settings
    
    client_id = settings.SENTINELHUB_CLIENT_ID
    client_secret = settings.SENTINELHUB_CLIENT_SECRET
    
    if not client_id or not client_secret:
        print("[FAIL] Sentinel Hub credentials not configured")
        print(f"   Client ID: {'Set' if client_id else 'Missing'}")
        print(f"   Client Secret: {'Set' if client_secret else 'Missing'}")
        return False
    
    print("[PASS] Credentials are configured")
    print(f"   Client ID: {client_id[:8]}...{client_id[-4:]}")
    return True


def test_api_connection():
    """Test basic API connection"""
    print("\n=== TESTING API CONNECTION ===")
    
    try:
        from app.core.config import settings
        
        config = SHConfig()
        config.sh_client_id = settings.SENTINELHUB_CLIENT_ID
        config.sh_client_secret = settings.SENTINELHUB_CLIENT_SECRET
        
        # Try to get a token
        print("Attempting to authenticate with Sentinel Hub...")
        # The get_data() call will handle authentication
        
        print("[PASS] API connection successful")
        return True
        
    except Exception as e:
        print(f"[FAIL] API connection failed")
        print(f"   Error: {str(e)}")
        return False


def test_data_availability(bbox, date_range):
    """Test if data is available for a specific location and time"""
    print("\n=== TESTING DATA AVAILABILITY ===")
    print(f"Location: [{bbox.min_x}, {bbox.min_y}, {bbox.max_x}, {bbox.max_y}]")
    print(f"Date Range: {date_range[0].date()} to {date_range[1].date()}")
    
    try:
        from app.core.config import settings
        
        config = SHConfig()
        config.sh_client_id = settings.SENTINELHUB_CLIENT_ID
        config.sh_client_secret = settings.SENTINELHUB_CLIENT_SECRET
        
        # Simple evalscript to check data availability
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: ["B04", "B03", "B02", "SCL"],
                output: { bands: 4 }
            };
        }
        
        function evaluatePixel(sample) {
            return [sample.B04, sample.B03, sample.B02, sample.SCL];
        }
        """
        
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=date_range,
                    mosaicking_order=MosaickingOrder.LEAST_CC,
                    maxcc=0.5  # 50% cloud coverage tolerance for testing
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            size=(512, 512),
            config=config
        )
        
        print("Fetching data... (this may take 30-60 seconds)")
        data = request.get_data(save_data=False)
        
        if data and len(data) > 0:
            print(f"[PASS] Retrieved {len(data)} image(s)")
            print(f"   Image shape: {data[0].shape}")
            print(f"   Data type: {data[0].dtype}")
            
            # Check SCL band for cloud coverage
            scl_band = data[0][:, :, 3]
            cloud_pixels = np.isin(scl_band, [8, 9, 10, 11])
            cloud_coverage = np.sum(cloud_pixels) / scl_band.size
            print(f"   Cloud coverage: {cloud_coverage * 100:.1f}%")
            
            return True, data[0]
        else:
            print("[FAIL] No data available for this location/time")
            return False, None
            
    except Exception as e:
        print(f"[FAIL] Error fetching data")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        return False, None


def save_test_image(data, filename="test_sentinel_output.png"):
    """Save the retrieved image for visual inspection"""
    print(f"\n=== SAVING TEST IMAGE ===")
    
    try:
        # Extract RGB bands (first 3 bands)
        rgb = data[:, :, :3]
        
        # Normalize to 0-255
        rgb_normalized = ((rgb / np.max(rgb)) * 255).astype(np.uint8)
        
        # Create PIL Image
        img = Image.fromarray(rgb_normalized)
        
        # Save
        img.save(filename)
        print(f"[PASS] Image saved as {filename}")
        print(f"   Resolution: {img.size}")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] Error saving image")
        print(f"   Error: {str(e)}")
        return False


def run_comprehensive_test():
    """Run all tests"""
    print("\n" + "="*60)
    print("SENTINEL HUB COMPREHENSIVE TEST")
    print("="*60)
    
    # Test 1: Credentials
    if not test_credentials():
        print("\n[WARNING] Cannot proceed without credentials")
        return
    
    # Test 2: API Connection
    if not test_api_connection():
        print("\n[WARNING] Cannot proceed without API connection")
        return
    
    # Test 3: Data Availability
    # Test locations in India
    test_locations = [
        {
            "name": "Umananda Island, Guwahati",
            "bbox": BBox(bbox=[91.7345, 26.1775, 91.7395, 26.1825], crs=CRS.WGS84),
        },
        {
            "name": "Chilika Lake, Odisha",
            "bbox": BBox(bbox=[85.32, 19.68, 85.50, 19.82], crs=CRS.WGS84),
        },
        {
            "name": "Delhi Region",
            "bbox": BBox(bbox=[77.1, 28.5, 77.3, 28.7], crs=CRS.WGS84),
        }
    ]
    
    # Test different date ranges
    now = datetime.now()
    date_ranges = [
        ("Recent (last 10 days)", (now - timedelta(days=10), now)),
        ("Last month", (now - timedelta(days=30), now - timedelta(days=10))),
        ("2 months ago", (now - timedelta(days=60), now - timedelta(days=30))),
    ]
    
    successful_tests = 0
    total_tests = len(test_locations) * len(date_ranges)
    
    for location in test_locations:
        print(f"\n{'='*60}")
        print(f"TESTING LOCATION: {location['name']}")
        print(f"{'='*60}")
        
        for range_name, date_range in date_ranges:
            print(f"\n--- Testing: {range_name} ---")
            success, data = test_data_availability(location['bbox'], date_range)
            
            if success and data is not None:
                successful_tests += 1
                # Save the first successful image
                if successful_tests == 1:
                    safe_name = location['name'].replace(' ', '_').replace(',', '')
                    save_test_image(data, f"test_{safe_name}_{range_name.replace(' ', '_')}.png")
                break  # Found data for this location, move to next
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Successful retrievals: {successful_tests} / {len(test_locations)}")
    print(f"Success rate: {(successful_tests / len(test_locations)) * 100:.1f}%")
    
    if successful_tests == 0:
        print("\n[DIAGNOSIS]")
        print("   - Credentials might be invalid or expired")
        print("   - API quota might be exceeded")
        print("   - Network connectivity issues")
        print("   - Sentinel Hub service might be down")
        print("\n[RECOMMENDATIONS]")
        print("   1. Check your Sentinel Hub dashboard: https://apps.sentinel-hub.com/")
        print("   2. Verify credentials are correct")
        print("   3. Check API quotas and usage")
        print("   4. Try again in a few minutes")
    elif successful_tests < len(test_locations):
        print("\n[PARTIAL SUCCESS]")
        print("   Some locations have no recent cloud-free imagery")
        print("   This is normal - try expanding the date range")
    else:
        print("\n[SUCCESS] ALL TESTS PASSED!")
        print("   Sentinel Hub integration is working correctly")


if __name__ == "__main__":
    run_comprehensive_test()

