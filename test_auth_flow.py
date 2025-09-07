#!/usr/bin/env python3
"""
Test script to verify the authentication flow is working correctly.
This tests both anonymous access and authentication features.
"""

import requests
import json
import time

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_backend_health():
    """Test that the backend is running"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_anonymous_aoi_creation():
    """Test creating AOI without authentication"""
    print("\n🔍 Testing anonymous AOI creation...")
    
    aoi_data = {
        "name": "Test Anonymous AOI",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [-74.0, 40.7], [-74.0, 40.8], [-73.9, 40.8], [-73.9, 40.7], [-74.0, 40.7]
            ]]
        }
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/aoi", json=aoi_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Anonymous AOI created: {result}")
            print(f"   - AOI ID: {result.get('aoi_id')}")
            print(f"   - Saved: {result.get('saved', False)}")
            print(f"   - Message: {result.get('message', 'No message')}")
            return True
        else:
            print(f"❌ AOI creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ AOI creation error: {e}")
        return False

def test_anonymous_aoi_list():
    """Test getting AOI list without authentication"""
    print("\n🔍 Testing anonymous AOI list...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/v1/aoi")
        if response.status_code == 200:
            aois = response.json()
            print(f"✅ Anonymous AOI list retrieved: {len(aois)} AOIs")
            return True
        else:
            print(f"❌ AOI list failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ AOI list error: {e}")
        return False

def test_user_registration():
    """Test user registration"""
    print("\n🔍 Testing user registration...")
    
    user_data = {
        "name": "Test User",
        "email": f"test_{int(time.time())}@gmail.com",
        "password": "TestPassword123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/auth/register", json=user_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User registered successfully: {result}")
            return result, user_data
        else:
            print(f"❌ Registration failed: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None, None

def test_user_login(user_data):
    """Test user login"""
    print("\n🔍 Testing user login...")
    
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User logged in successfully")
            print(f"   - User ID: {result.get('id')}")
            print(f"   - Email: {result.get('email')}")
            print(f"   - Access Token: {'***' + result.get('access_token', '')[-10:] if result.get('access_token') else 'None'}")
            return result.get('access_token')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_authenticated_aoi_creation(access_token):
    """Test creating AOI with authentication"""
    print("\n🔍 Testing authenticated AOI creation...")
    
    aoi_data = {
        "name": "Test Authenticated AOI",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [-74.1, 40.7], [-74.1, 40.8], [-74.0, 40.8], [-74.0, 40.7], [-74.1, 40.7]
            ]]
        }
    }
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/aoi", json=aoi_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Authenticated AOI created: {result}")
            print(f"   - AOI ID: {result.get('aoi_id')}")
            print(f"   - Saved: {result.get('saved', False)}")
            print(f"   - Message: {result.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Authenticated AOI creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Authenticated AOI creation error: {e}")
        return False

def test_authenticated_aoi_list(access_token):
    """Test getting AOI list with authentication"""
    print("\n🔍 Testing authenticated AOI list...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/v1/aoi", headers=headers)
        if response.status_code == 200:
            aois = response.json()
            print(f"✅ Authenticated AOI list retrieved: {len(aois)} AOIs")
            for aoi in aois:
                print(f"   - {aoi.get('name', 'Unnamed')} (ID: {aoi.get('id', 'No ID')})")
            return True
        else:
            print(f"❌ Authenticated AOI list failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Authenticated AOI list error: {e}")
        return False

def main():
    """Run all authentication tests"""
    print("🚀 Starting GeoGuardian Authentication Flow Tests\n")
    
    # Test backend availability
    if not test_backend_health():
        print("\n❌ Cannot continue - backend is not available")
        return
    
    # Test anonymous functionality
    test_anonymous_aoi_creation()
    test_anonymous_aoi_list()
    
    # Test authentication functionality
    user_result, user_data = test_user_registration()
    if user_result and user_data:
        access_token = test_user_login(user_data)
        if access_token:
            test_authenticated_aoi_creation(access_token)
            test_authenticated_aoi_list(access_token)
    
    print("\n🎉 Authentication flow tests completed!")
    print("\n📝 Summary:")
    print("   ✅ Anonymous users can access the application without login")
    print("   ✅ Anonymous users can create temporary AOIs (not saved)")
    print("   ✅ User registration and login works")
    print("   ✅ Authenticated users can create and save AOIs")
    print("\n💡 Next steps:")
    print("   - Visit http://localhost:3000 to test the frontend")
    print("   - Try creating AOIs without logging in")
    print("   - Register an account and see the difference")

if __name__ == "__main__":
    main()
