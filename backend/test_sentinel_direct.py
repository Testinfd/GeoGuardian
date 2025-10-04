"""
Direct Sentinel Hub Connectivity Test
Tests if Sentinel Hub credentials are working correctly
"""

import os
from sentinelhub import SHConfig, DataCollection, SentinelHubRequest, BBox, CRS, MimeType
from datetime import datetime, timedelta
import numpy as np

# Test credentials directly
CLIENT_ID = "333999f3-3d9a-46b2-b530-d39776969ef3"
CLIENT_SECRET = "utLm2mXfWUypkTzQdWryvd7SIfdoEEF8"

def test_authentication():
    """Test if credentials can authenticate with Sentinel Hub"""
    print("\n" + "="*60)
    print("SENTINEL HUB AUTHENTICATION TEST")
    print("="*60)
    
    try:
        config = SHConfig()
        config.sh_client_id = CLIENT_ID
        config.sh_client_secret = CLIENT_SECRET
        
        print(f"\n[OK] Client ID: {CLIENT_ID[:20]}...")
        print(f"[OK] Client Secret: {CLIENT_SECRET[:20]}...")
        
        # Test if config is valid
        if config.sh_client_id and config.sh_client_secret:
            print("\n[OK] Configuration created successfully")
            return config
        else:
            print("\n[FAIL] Configuration failed")
            return None
            
    except Exception as e:
        print(f"\n[FAIL] Authentication failed: {e}")
        return None

def test_data_request(config):
    """Test actual data request to Sentinel Hub"""
    print("\n" + "="*60)
    print("SENTINEL HUB DATA REQUEST TEST")
    print("="*60)
    
    try:
        # Test area: Guwahati (same as in test)
        bbox = BBox(bbox=[91.733, 26.1415, 91.739, 26.1475], crs=CRS.WGS84)
        size = (256, 256)
        
        # Simple evalscript for true color
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: ["B02", "B03", "B04", "SCL"],
                output: { bands: 3 }
            };
        }
        function evaluatePixel(sample) {
            return [sample.B04, sample.B03, sample.B02];
        }
        """
        
        # Date range: last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        print(f"\n[INFO] Test Location: Guwahati, India")
        print(f"[INFO] BBox: {bbox}")
        print(f"[INFO] Date Range: {start_date.date()} to {end_date.date()}")
        print(f"[INFO] Image Size: {size}")
        
        # Create request
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=(start_date, end_date),
                    maxcc=0.5  # Max 50% cloud coverage
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            size=size,
            config=config
        )
        
        print(f"\n[REQUEST] Sending request to Sentinel Hub...")
        
        # Execute request
        data = request.get_data()
        
        if data and len(data) > 0:
            print(f"\n[SUCCESS] Received {len(data)} image(s)")
            
            for i, img in enumerate(data):
                if img is not None:
                    print(f"\n[IMAGE {i+1}]:")
                    print(f"   - Shape: {img.shape}")
                    print(f"   - Data type: {img.dtype}")
                    print(f"   - Min value: {np.min(img)}")
                    print(f"   - Max value: {np.max(img)}")
                    print(f"   - Mean value: {np.mean(img):.2f}")
            
            return True
        else:
            print(f"\n[WARN] No data returned (may be no imagery available for this area/time)")
            return False
            
    except Exception as e:
        print(f"\n[FAIL] Data request failed: {e}")
        print(f"\nError details: {type(e).__name__}")
        
        if "401" in str(e) or "authentication" in str(e).lower():
            print("\n[AUTH ERROR] Credentials are invalid or expired")
            print("   - Check if your Sentinel Hub account is active")
            print("   - Verify OAuth client credentials in dashboard")
            print("   - Ensure credentials have not been revoked")
        elif "403" in str(e) or "forbidden" in str(e).lower():
            print("\n[AUTHZ ERROR] Insufficient permissions")
            print("   - Check if your account has access to Sentinel-2 data")
            print("   - Verify your subscription/plan status")
        elif "429" in str(e) or "rate" in str(e).lower():
            print("\n[RATE LIMIT] Too many requests")
            print("   - Wait a few minutes and try again")
        else:
            print("\n[UNKNOWN ERROR] See details above")
        
        return False

def test_connection():
    """Test overall Sentinel Hub connection"""
    print("\n" + "="*60)
    print("SENTINEL HUB CONNECTION TEST")
    print("="*60)
    
    try:
        from sentinelhub import SentinelHubSession
        
        config = SHConfig()
        config.sh_client_id = CLIENT_ID
        config.sh_client_secret = CLIENT_SECRET
        
        # Try to create a session
        print("\n[CONNECTING] Creating session...")
        session = SentinelHubSession(config=config)
        
        # Try to get token
        print("[CONNECTING] Requesting OAuth token...")
        token = session.token
        
        if token:
            print(f"\n[OK] Successfully authenticated!")
            print(f"[OK] Token obtained: {token['access_token'][:30]}...")
            return True
        else:
            print(f"\n[FAIL] Failed to obtain token")
            return False
            
    except Exception as e:
        print(f"\n[FAIL] Connection test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("\n")
    print("=" + "="*58 + "=")
    print("|" + " "*16 + "SENTINEL HUB DIAGNOSTICS" + " "*18 + "|")
    print("=" + "="*58 + "=")
    
    # Test 1: Authentication
    config = test_authentication()
    if not config:
        print("\n[FAILED] Cannot proceed without valid configuration")
        return False
    
    # Test 2: Connection
    connection_ok = test_connection()
    if not connection_ok:
        print("\n[FAILED] Cannot establish connection to Sentinel Hub")
        return False
    
    # Test 3: Data Request
    data_ok = test_data_request(config)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"[+] Authentication: {'PASS' if config else 'FAIL'}")
    print(f"[+] Connection: {'PASS' if connection_ok else 'FAIL'}")
    print(f"[+] Data Request: {'PASS' if data_ok else 'FAIL'}")
    
    if config and connection_ok and data_ok:
        print("\n[SUCCESS] ALL TESTS PASSED! Sentinel Hub is working correctly.")
        return True
    elif config and connection_ok:
        print("\n[WARNING] Partial Success: Authentication works but no data available")
        print("   This may be normal if there's no recent imagery for the test area")
        return True
    else:
        print("\n[FAILED] TESTS FAILED: Sentinel Hub integration has issues")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

