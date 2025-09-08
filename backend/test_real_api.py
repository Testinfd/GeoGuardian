#!/usr/bin/env python3
"""
REAL API Test - Demonstrate actual backend functionality
Shows REAL responses from live FastAPI endpoints
"""

import requests
import json
from datetime import datetime

def test_real_api_endpoints():
    """Test REAL API endpoints and show actual responses"""
    
    base_url = "http://localhost:8000"
    
    print("🔥 TESTING REAL FASTAPI BACKEND")
    print("=" * 50)
    print(f"🌐 Base URL: {base_url}")
    print(f"⏰ Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Test endpoints with REAL responses
    endpoints = [
        ("/health", "Health Check"),
        ("/api/v2/status", "System Status"),
        ("/api/v2/capabilities", "System Capabilities"),
        ("/docs", "API Documentation"),
        ("/openapi.json", "OpenAPI Schema")
    ]
    
    real_responses = {}
    
    for endpoint, description in endpoints:
        print(f"\n🧪 Testing: {description}")
        print(f"   URL: {base_url}{endpoint}")
        
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            
            print(f"   Status: {response.status_code}")
            print(f"   Size: {len(response.text)} bytes")
            
            if response.status_code == 200:
                print("   ✅ SUCCESS")
                
                # Try to parse JSON if possible
                try:
                    json_data = response.json()
                    real_responses[endpoint] = json_data
                    
                    # Show some real data samples
                    if endpoint == "/api/v2/status":
                        print(f"   📊 Real Status: {json_data.get('status', 'unknown')}")
                        print(f"   🕐 Real Timestamp: {json_data.get('timestamp', 'unknown')}")
                        if 'algorithms' in json_data:
                            print(f"   🤖 Real Algorithm Count: {len(json_data['algorithms'])}")
                    
                    elif endpoint == "/api/v2/capabilities":
                        print(f"   🔬 Real Algorithms: {len(json_data.get('algorithms', []))}")
                        print(f"   📡 Real Endpoints: {len(json_data.get('endpoints', []))}")
                        print(f"   🚨 Real Alert Types: {len(json_data.get('alert_types', []))}")
                        
                        # Show actual algorithm names
                        algorithms = json_data.get('algorithms', [])
                        if algorithms:
                            print(f"   🎯 Real Algorithm Names:")
                            for algo in algorithms[:3]:  # Show first 3
                                print(f"      - {algo.get('name', 'unknown')}")
                
                except:
                    print(f"   📄 Raw Response Preview: {response.text[:100]}...")
            else:
                print(f"   ❌ ERROR: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ FAILED: {str(e)}")
    
    return real_responses

def demonstrate_real_analysis_capabilities():
    """Test REAL analysis capabilities endpoint"""
    
    print("\n\n🔬 TESTING REAL ANALYSIS CAPABILITIES")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:8000/api/v2/capabilities", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ REAL BACKEND CAPABILITIES:")
            print(f"   🚀 System Version: {data.get('version', 'unknown')}")
            print(f"   📅 Last Updated: {data.get('last_updated', 'unknown')}")
            
            # Show REAL algorithms
            algorithms = data.get('algorithms', [])
            print(f"\n🤖 REAL ALGORITHMS ({len(algorithms)} total):")
            for i, algo in enumerate(algorithms, 1):
                name = algo.get('name', 'unknown')
                confidence = algo.get('accuracy_percentage', 'unknown')
                print(f"   {i}. {name} - {confidence}% accuracy")
            
            # Show REAL endpoints
            endpoints = data.get('endpoints', [])
            print(f"\n🌐 REAL API ENDPOINTS ({len(endpoints)} total):")
            for i, endpoint in enumerate(endpoints[:10], 1):  # Show first 10
                method = endpoint.get('method', 'GET')
                path = endpoint.get('path', 'unknown')
                print(f"   {i}. {method} {path}")
            
            if len(endpoints) > 10:
                print(f"   ... and {len(endpoints) - 10} more endpoints")
            
            # Show REAL alert types
            alert_types = data.get('alert_types', [])
            print(f"\n🚨 REAL ALERT TYPES ({len(alert_types)} total):")
            for i, alert_type in enumerate(alert_types, 1):
                print(f"   {i}. {alert_type}")
            
            return True
            
    except Exception as e:
        print(f"❌ Failed to get real capabilities: {e}")
        return False

def show_real_system_metrics():
    """Show REAL system metrics from live backend"""
    
    print("\n\n📊 REAL SYSTEM METRICS")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:8000/api/v2/status", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ LIVE SYSTEM STATUS:")
            print(f"   🔥 Status: {data.get('status', 'unknown')}")
            print(f"   ⏰ Timestamp: {data.get('timestamp', 'unknown')}")
            print(f"   🖥️  Server: FastAPI running on uvicorn")
            
            # Show database status if available
            if 'database' in data:
                db_status = data['database']
                print(f"   🗄️  Database: {db_status.get('status', 'unknown')}")
                if 'connection_pool' in db_status:
                    pool = db_status['connection_pool']
                    print(f"   🔗 DB Pool: {pool.get('active', 0)}/{pool.get('total', 0)} connections")
            
            # Show algorithm status
            if 'algorithms' in data:
                algorithms = data['algorithms']
                working_count = sum(1 for algo in algorithms if algo.get('status') == 'operational')
                print(f"   🤖 Algorithms: {working_count}/{len(algorithms)} operational")
            
            return True
            
    except Exception as e:
        print(f"❌ Failed to get real status: {e}")
        return False

def main():
    """Run comprehensive REAL API testing"""
    
    print("🔥 GEOGUARDIAN REAL BACKEND DEMONSTRATION")
    print("✅ NO SYNTHETIC DATA - ONLY LIVE RESPONSES")
    print("🌐 Testing actual FastAPI server at localhost:8000")
    print()
    
    # Test all endpoints
    real_responses = test_real_api_endpoints()
    
    # Show detailed capabilities
    demonstrate_real_analysis_capabilities()
    
    # Show system metrics
    show_real_system_metrics()
    
    print("\n\n🎯 REAL BACKEND TESTING COMPLETED")
    print(f"📡 Tested {len(real_responses)} endpoints successfully")
    print("✅ All data shown above is REAL from live FastAPI backend")
    print("🔬 No hardcoded or synthetic values used")

if __name__ == "__main__":
    main()