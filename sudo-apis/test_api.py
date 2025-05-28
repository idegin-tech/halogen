#!/usr/bin/env python3

import requests
import json
import sys
import time

API_BASE_URL = "http://localhost:8082"
TEST_DOMAIN = "test.example.com"
TEST_PROJECT_ID = "test_proj_123"

def test_api_endpoint(method, endpoint, data=None):
    try:
        url = f"{API_BASE_URL}{endpoint}"
        
        if method.upper() == "GET":
            response = requests.get(url)
        elif method.upper() == "POST":
            response = requests.post(url, json=data)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "data": response.json() if response.content else None
        }
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": "Connection refused - API server not running"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def print_test_result(test_name, result):
    status = "✅ PASS" if result.get("success") else "❌ FAIL"
    print(f"{status} {test_name}")
    
    if not result.get("success"):
        print(f"   Error: {result.get('error', 'Unknown error')}")
        if result.get("status_code"):
            print(f"   Status Code: {result.get('status_code')}")
    
    if result.get("data"):
        print(f"   Response: {json.dumps(result['data'], indent=2)[:200]}...")
    print()

def main():
    print("🚀 Testing Halogen Sudo API")
    print("=" * 50)
    
    tests = [
        ("Health Check", "GET", "/health", None),
        ("Deploy Nginx Config (No SSL)", "POST", "/nginx/deploy", {
            "domain": TEST_DOMAIN,
            "project_id": TEST_PROJECT_ID,
            "ssl_enabled": False
        }),
        ("Check Nginx Status", "GET", f"/nginx/status/{TEST_DOMAIN}", None),
        ("Generate SSL Certificate", "POST", "/ssl/generate", {
            "domain": TEST_DOMAIN,
            "project_id": TEST_PROJECT_ID,
            "email": "test@example.com",
            "force_renewal": False
        }),
        ("Check SSL Status", "GET", f"/ssl/status/{TEST_DOMAIN}", None),
        ("Deploy Nginx Config (With SSL)", "POST", "/nginx/deploy", {
            "domain": TEST_DOMAIN,
            "project_id": TEST_PROJECT_ID,
            "ssl_enabled": True
        }),
        ("Complete Domain Setup", "POST", "/domain/setup", {
            "domain": f"setup-{TEST_DOMAIN}",
            "project_id": TEST_PROJECT_ID,
            "ssl_enabled": True,
            "email": "test@example.com"
        }),
        ("Remove Nginx Config", "POST", "/nginx/remove", {
            "domain": TEST_DOMAIN,
            "project_id": TEST_PROJECT_ID
        }),
        ("Remove SSL Certificate", "POST", "/ssl/remove", {
            "domain": TEST_DOMAIN,
            "project_id": TEST_PROJECT_ID
        })
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, method, endpoint, data in tests:
        result = test_api_endpoint(method, endpoint, data)
        print_test_result(test_name, result)
        
        if result.get("success"):
            passed += 1
        
        time.sleep(0.5)
    
    print("=" * 50)
    print(f"Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("💥 Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
