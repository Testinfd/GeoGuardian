#!/usr/bin/env python3
"""
Test script to verify GeoGuardian backend setup with Supabase
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

def test_imports():
    """Test if all required modules can be imported"""
    print("🔍 Testing imports...")
    
    try:
        import fastapi
        print(f"✅ FastAPI: {fastapi.__version__}")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    try:
        import supabase
        print(f"✅ Supabase: {supabase.__version__}")
    except ImportError as e:
        print(f"❌ Supabase import failed: {e}")
        return False
    
    try:
        import sentinelhub
        print(f"✅ Sentinel Hub: {sentinelhub.__version__}")
    except ImportError as e:
        print(f"❌ Sentinel Hub import failed: {e}")
        return False
    
    try:
        import uvicorn
        print(f"✅ Uvicorn: {uvicorn.__version__}")
    except ImportError as e:
        print(f"❌ Uvicorn import failed: {e}")
        return False
    
    return True

def test_environment():
    """Test environment configuration"""
    print("\n🔧 Testing environment configuration...")
    
    # Load environment variables
    from app.core.config import settings
    
    required_vars = [
        ('SUPABASE_URL', settings.SUPABASE_URL),
        ('SUPABASE_ANON_KEY', settings.SUPABASE_ANON_KEY),
        ('SENTINELHUB_CLIENT_ID', settings.SENTINELHUB_CLIENT_ID),
        ('SENTINELHUB_CLIENT_SECRET', settings.SENTINELHUB_CLIENT_SECRET),
    ]
    
    all_good = True
    for var_name, var_value in required_vars:
        if var_value and var_value != f"your_{var_name.lower()}":
            print(f"✅ {var_name}: {'*' * 10}...{var_value[-4:]}")
        else:
            print(f"❌ {var_name}: Not configured or using default value")
            all_good = False
    
    return all_good

def test_supabase_connection():
    """Test Supabase connection"""
    print("\n🔗 Testing Supabase connection...")
    
    try:
        from app.core.database import get_supabase
        supabase_client = get_supabase()
        
        # Test basic connection by trying to count users table
        response = supabase_client.table("users").select("*").limit(0).execute()
        print(f"✅ Supabase connection successful!")
        print(f"   Can access database tables")
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def test_database_tables():
    """Test if database tables exist"""
    print("\n🗄️  Testing database tables...")
    
    try:
        from app.core.database import get_supabase
        supabase_client = get_supabase()
        
        tables = ['users', 'aois', 'alerts', 'votes']
        
        for table in tables:
            try:
                # Try to query the table (limit 0 to avoid loading data)
                response = supabase_client.table(table).select("*").limit(0).execute()
                print(f"✅ Table '{table}' exists and is accessible")
            except Exception as e:
                print(f"❌ Table '{table}' error: {e}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Database table test failed: {e}")
        return False

def test_fastapi_app():
    """Test FastAPI app initialization"""
    print("\n🚀 Testing FastAPI app...")
    
    try:
        from app.main import app
        print(f"✅ FastAPI app initialized successfully")
        print(f"   Title: {app.title}")
        print(f"   Version: {app.version}")
        
        # Get router information
        routes = []
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                routes.append(f"{list(route.methods)[0]} {route.path}")
        
        print(f"   Routes: {len(routes)} endpoints found")
        for route in routes[:5]:  # Show first 5 routes
            print(f"     - {route}")
        if len(routes) > 5:
            print(f"     ... and {len(routes) - 5} more")
        
        return True
        
    except Exception as e:
        print(f"❌ FastAPI app test failed: {e}")
        return False

def test_sentinel_hub():
    """Test Sentinel Hub configuration"""
    print("\n🛰️  Testing Sentinel Hub configuration...")
    
    try:
        from app.core.config import settings
        from sentinelhub import SHConfig
        
        config = SHConfig()
        config.sh_client_id = settings.SENTINELHUB_CLIENT_ID
        config.sh_client_secret = settings.SENTINELHUB_CLIENT_SECRET
        
        if config.sh_client_id and config.sh_client_secret:
            print(f"✅ Sentinel Hub credentials configured")
            print(f"   Client ID: {config.sh_client_id[:8]}...")
            
            # Test if we can create a basic config (doesn't test actual API call)
            if len(config.sh_client_id) > 10 and len(config.sh_client_secret) > 10:
                print(f"✅ Credentials format looks valid")
                return True
            else:
                print(f"⚠️  Credentials format may be invalid (too short)")
                return False
        else:
            print(f"❌ Sentinel Hub credentials not configured")
            return False
        
    except Exception as e:
        print(f"❌ Sentinel Hub test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🌍 GeoGuardian Backend Setup Test")
    print("=" * 50)
    
    tests = [
        ("Import Tests", test_imports),
        ("Environment Config", test_environment),
        ("Supabase Connection", test_supabase_connection),
        ("Database Tables", test_database_tables),
        ("FastAPI App", test_fastapi_app),
        ("Sentinel Hub Config", test_sentinel_hub),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'=' * 50}")
        print(f"Running {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'=' * 50}")
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! Backend is ready for development.")
        return True
    else:
        print(f"\n⚠️  {len(results) - passed} test(s) failed. Please check the configuration.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
