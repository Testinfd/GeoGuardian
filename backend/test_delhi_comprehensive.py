#!/usr/bin/env python3
"""
Direct Backend Test for Delhi, India - Better Satellite Coverage
"""

import sys
import os
import asyncio
sys.path.append('.')

from datetime import datetime
import logging
from test_umananda_comprehensive import UmanandaDirectTester, print_header, print_info

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Delhi, India coordinates (excellent Sentinel-2 coverage)
DELHI_GEOJSON = {
    "type": "Polygon",
    "coordinates": [[
        [77.2050, 28.6100],  # Southwest
        [77.2050, 28.6180],  # Northwest  
        [77.2130, 28.6180],  # Northeast
        [77.2130, 28.6100],  # Southeast
        [77.2050, 28.6100]   # Close polygon
    ]]
}

async def main():
    """Test with Delhi coordinates"""
    print_header("🛰️  DELHI, INDIA - COMPREHENSIVE BACKEND TEST")
    print(f"📍 Location: Delhi city center, India")
    print(f"🌍 Coordinates: 28.6139°N, 77.2090°E")
    print(f"📅 Date range: 60 days of historical data")
    print(f"⏰ Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info("Delhi has excellent Sentinel-2 coverage - high success rate!")
    
    # Create tester and override GeoJSON
    tester = UmanandaDirectTester()
    
    # Monkey-patch the GeoJSON
    import test_umananda_comprehensive
    test_umananda_comprehensive.UMANANDA_GEOJSON = DELHI_GEOJSON
    
    # Run full test
    success = await tester.run_full_test(date_range_days=60)
    
    if success:
        print_info("\n🏆 All tests passed with Delhi location!")
        sys.exit(0)
    else:
        print_info("\n⚠️ Test incomplete - check logs")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

