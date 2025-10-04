#!/usr/bin/env python3
"""Test v2 imports"""

try:
    from app.api.v2 import aoi
    print("✅ AOI v2 import successful")
    print(f"Router exists: {hasattr(aoi, 'router')}")
    if hasattr(aoi, 'router'):
        print(f"Router routes: {[route.path for route in aoi.router.routes]}")
except Exception as e:
    print(f"❌ AOI v2 import failed: {e}")
    import traceback
    traceback.print_exc()
