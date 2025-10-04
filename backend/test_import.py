#!/usr/bin/env python3
"""Test script to check v2 imports"""

try:
    from app.api.v2 import analysis
    print("✅ Analysis import successful")
    print(f"Router endpoints: {[route.path for route in analysis.router.routes]}")
except Exception as e:
    print(f"❌ Analysis import failed: {e}")
    import traceback
    traceback.print_exc()

try:
    from app.api.v2 import aoi as aoi_v2
    print("✅ AOI v2 import successful")
    print(f"Router endpoints: {[route.path for route in aoi_v2.router.routes]}")
except Exception as e:
    print(f"❌ AOI v2 import failed: {e}")

try:
    from app.api.v2 import alerts as alerts_v2
    print("✅ Alerts v2 import successful")
    print(f"Router endpoints: {[route.path for route in alerts_v2.router.routes]}")
except Exception as e:
    print(f"❌ Alerts v2 import failed: {e}")
