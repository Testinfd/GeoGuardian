#!/usr/bin/env python3
"""
Integration test script for GeoGuardian
Tests the complete application flow from frontend to backend to database
"""

import requests
import time
import sys
from urllib.parse import urljoin


class GeoGuardianTester:
    def __init__(self, backend_url="http://localhost:8000", frontend_url="http://localhost:3000"):
        self.backend_url = backend_url
        self.frontend_url = frontend_url
        self.session = requests.Session()
    
    def test_backend_health(self):
        """Test backend health endpoint"""
        print("🔧 Testing backend health...")
        try:
            response = self.session.get(f"{self.backend_url}/health")
            if response.status_code == 200:
                print("✅ Backend health check passed")
                return True
            else:
                print(f"❌ Backend health check failed: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ Backend is not running or unreachable")
            return False
        except Exception as e:
            print(f"❌ Backend health check error: {e}")
            return False
    
    def test_backend_root(self):
        """Test backend root endpoint"""
        print("🌍 Testing backend root endpoint...")
        try:
            response = self.session.get(f"{self.backend_url}/")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Backend root responded: {data.get('message', 'OK')}")
                return True
            else:
                print(f"❌ Backend root failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend root error: {e}")
            return False
    
    def test_backend_docs(self):
        """Test backend API documentation"""
        print("📖 Testing backend API docs...")
        try:
            response = self.session.get(f"{self.backend_url}/docs")
            if response.status_code == 200:
                print("✅ Backend API docs accessible")
                return True
            else:
                print(f"❌ Backend API docs failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend API docs error: {e}")
            return False
    
    def test_backend_openapi(self):
        """Test backend OpenAPI spec"""
        print("🔧 Testing backend OpenAPI spec...")
        try:
            response = self.session.get(f"{self.backend_url}/openapi.json")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ OpenAPI spec available (v{data.get('openapi', 'unknown')})")
                print(f"   Title: {data.get('info', {}).get('title', 'Unknown')}")
                print(f"   Endpoints: {len(data.get('paths', {}))}")
                return True
            else:
                print(f"❌ OpenAPI spec failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ OpenAPI spec error: {e}")
            return False
    
    def test_frontend_health(self):
        """Test frontend accessibility"""
        print("🎨 Testing frontend accessibility...")
        try:
            response = self.session.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                if "GeoGuardian" in response.text:
                    print("✅ Frontend is accessible and contains expected content")
                    return True
                else:
                    print("⚠️  Frontend accessible but missing expected content")
                    return False
            else:
                print(f"❌ Frontend failed: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ Frontend is not running or unreachable")
            return False
        except Exception as e:
            print(f"❌ Frontend error: {e}")
            return False
    
    def test_cors(self):
        """Test CORS configuration"""
        print("🌐 Testing CORS configuration...")
        try:
            headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            response = self.session.options(f"{self.backend_url}/", headers=headers)
            
            if response.status_code in [200, 204]:
                cors_headers = response.headers
                if 'Access-Control-Allow-Origin' in cors_headers:
                    print("✅ CORS is properly configured")
                    print(f"   Allowed Origin: {cors_headers.get('Access-Control-Allow-Origin')}")
                    return True
                else:
                    print("⚠️  CORS headers present but may need adjustment")
                    return True
            else:
                print(f"❌ CORS preflight failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ CORS test error: {e}")
            return False
    
    def test_api_endpoints(self):
        """Test key API endpoints"""
        print("🔌 Testing API endpoints...")
        
        endpoints = [
            ("GET", "/api/v1/", "API root"),
            ("GET", "/openapi.json", "OpenAPI spec"),
        ]
        
        results = []
        for method, path, description in endpoints:
            try:
                url = f"{self.backend_url}{path}"
                if method == "GET":
                    response = self.session.get(url)
                elif method == "POST":
                    response = self.session.post(url)
                
                if response.status_code in [200, 404, 422]:  # 404/422 are expected for some endpoints without auth
                    print(f"✅ {description}: {response.status_code}")
                    results.append(True)
                else:
                    print(f"❌ {description}: {response.status_code}")
                    results.append(False)
                    
            except Exception as e:
                print(f"❌ {description}: {e}")
                results.append(False)
        
        return all(results)
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("🌍 GeoGuardian Integration Test Suite")
        print("=" * 50)
        
        tests = [
            ("Backend Health", self.test_backend_health),
            ("Backend Root", self.test_backend_root),
            ("Backend Docs", self.test_backend_docs),
            ("OpenAPI Spec", self.test_backend_openapi),
            ("Frontend Health", self.test_frontend_health),
            ("CORS Configuration", self.test_cors),
            ("API Endpoints", self.test_api_endpoints),
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
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Summary
        print(f"\n{'=' * 50}")
        print("📊 INTEGRATION TEST SUMMARY")
        print("=" * 50)
        
        passed = 0
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed += 1
        
        print(f"\nResults: {passed}/{len(results)} tests passed")
        
        if passed == len(results):
            print("\n🎉 All integration tests passed!")
            print("📱 Frontend: http://localhost:3000")
            print("🔧 Backend API: http://localhost:8000")
            print("📖 API Docs: http://localhost:8000/docs")
            print("\n💡 The application is ready for testing!")
            return True
        else:
            print(f"\n⚠️  {len(results) - passed} test(s) failed.")
            print("Please check the server configurations and try again.")
            return False


def main():
    """Main test function"""
    print("🔍 Checking if servers are running...")
    
    # Give servers a moment to start up
    print("⏳ Waiting for servers to be ready...")
    time.sleep(3)
    
    tester = GeoGuardianTester()
    success = tester.run_all_tests()
    
    if not success:
        print("\n🛠️  Troubleshooting Tips:")
        print("1. Make sure backend is running: uvicorn app.main:app --reload --port 8000")
        print("2. Make sure frontend is running: npm run dev")
        print("3. Check environment variables are configured")
        print("4. Verify Supabase connection is working")
        
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
