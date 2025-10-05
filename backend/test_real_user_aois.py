"""
Test with REAL user AOI coordinates from database
Tests the exact coordinates that are failing in production
"""

import sys
import os
from datetime import datetime, timedelta
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sentinelhub import SHConfig, DataCollection, SentinelHubRequest, BBox, CRS, MimeType, MosaickingOrder

def test_simple_fast_preview(geojson, name):
    """Test a SIMPLE, FAST preview - just get ONE image"""
    print(f"\n{'='*60}")
    print(f"TESTING: {name}")
    print(f"{'='*60}")
    
    from app.core.config import settings
    
    # Extract bbox from geojson
    coords = geojson['coordinates'][0]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    bbox = BBox(bbox=[min(lons), min(lats), max(lons), max(lats)], crs=CRS.WGS84)
    
    print(f"BBox: [{min(lons):.4f}, {min(lats):.4f}, {max(lons):.4f}, {max(lats):.4f}]")
    
    config = SHConfig()
    config.sh_client_id = settings.SENTINELHUB_CLIENT_ID
    config.sh_client_secret = settings.SENTINELHUB_CLIENT_SECRET
    
    # SIMPLE evalscript - just RGB for preview
    evalscript = """
    //VERSION=3
    function setup() {
        return {
            input: ["B04", "B03", "B02"],
            output: { bands: 3 }
        };
    }
    
    function evaluatePixel(sample) {
        return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5];
    }
    """
    
    # Get just ONE recent image - last 10 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=10)
    
    print(f"Date range: {start_date.date()} to {end_date.date()}")
    print("Fetching SINGLE PREVIEW image...")
    
    request = SentinelHubRequest(
        evalscript=evalscript,
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=DataCollection.SENTINEL2_L2A,
                time_interval=(start_date, end_date),
                mosaicking_order=MosaickingOrder.LEAST_CC,
                maxcc=0.8  # More lenient for preview
            )
        ],
        responses=[
            SentinelHubRequest.output_response('default', MimeType.PNG)
        ],
        bbox=bbox,
        size=(512, 512),  # Fixed size for speed
        config=config
    )
    
    start_time = time.time()
    
    try:
        data = request.get_data(save_data=False)
        elapsed = time.time() - start_time
        
        if data and len(data) > 0:
            print(f"[SUCCESS] Retrieved preview in {elapsed:.1f} seconds")
            print(f"   Image shape: {data[0].shape}")
            
            # Check if within frontend timeout
            if elapsed < 30:
                print(f"   [OK] Within 30s frontend timeout")
            else:
                print(f"   [WARNING] Exceeds 30s timeout - will fail in frontend!")
            
            return True, elapsed
        else:
            print(f"[FAIL] No data after {elapsed:.1f} seconds")
            return False, elapsed
            
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"[ERROR] Failed after {elapsed:.1f} seconds: {str(e)}")
        return False, elapsed


def main():
    print("\n" + "="*60)
    print("TESTING REAL USER AOIs FROM DATABASE")
    print("="*60)
    
    # Real AOI coordinates from database
    test_aois = [
        {
            "name": "Chilika Lake (User AOI)",
            "geojson": {
                "type": "Polygon",
                "coordinates": [[[85.0393904841706, 19.539342982843024], [85.12315397507217, 19.473324996727605], 
                                [85.60376416876959, 19.747575286922515], [85.46782014255233, 19.89098130267869], 
                                [85.1945589181358, 19.804436387301486], [85.0393904841706, 19.539342982843024]]]
            }
        },
        {
            "name": "Guwahati Test (User AOI)",
            "geojson": {
                "type": "Polygon",
                "coordinates": [[[91.733, 26.1415], [91.733, 26.1475], [91.739, 26.1475], 
                                [91.739, 26.1415], [91.733, 26.1415]]]
            }
        }
    ]
    
    results = []
    for aoi in test_aois:
        success, elapsed = test_simple_fast_preview(aoi['geojson'], aoi['name'])
        results.append({
            'name': aoi['name'],
            'success': success,
            'time': elapsed
        })
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    for result in results:
        status = "[PASS]" if result['success'] else "[FAIL]"
        timeout_ok = "[OK]" if result['time'] < 30 else "[TIMEOUT RISK]"
        print(f"{status} {result['name']}: {result['time']:.1f}s {timeout_ok}")
    
    success_count = sum(1 for r in results if r['success'])
    print(f"\nSuccess Rate: {success_count}/{len(results)}")
    
    # Check if any will timeout
    timeout_risk = [r for r in results if r['time'] >= 30]
    if timeout_risk:
        print(f"\n[WARNING] {len(timeout_risk)} AOI(s) will timeout in frontend!")
        print("RECOMMENDATION: Optimize API or increase frontend timeout")
    else:
        print("\n[OK] All within 30s frontend timeout")

if __name__ == "__main__":
    main()

