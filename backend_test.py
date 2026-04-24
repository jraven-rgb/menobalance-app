#!/usr/bin/env python3
"""
Backend API Testing for MenoWellness App v3.0
Tests the 3 new backend endpoints: daily-routine, partner-tips, health-report
Plus verification of existing auth endpoints
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# API Configuration
BASE_URL = "https://meno-life-guide.preview.emergentagent.com/api"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def test_login(self):
        """Test user authentication and get token"""
        print("=== TESTING AUTHENTICATION ===")
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.token = data["access_token"]
                    self.headers["Authorization"] = f"Bearer {self.token}"
                    self.log_test("User Login", True, f"Token received: {self.token[:20]}...")
                    return True
                else:
                    self.log_test("User Login", False, "No access_token in response")
                    return False
            else:
                self.log_test("User Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False

    def test_auth_me(self):
        """Test authenticated profile endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/auth/me",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "email" in data and data["email"] == TEST_EMAIL:
                    self.log_test("GET /auth/me", True, f"User profile retrieved: {data.get('name', 'No name')}")
                    return True
                else:
                    self.log_test("GET /auth/me", False, "Invalid user data returned")
                    return False
            else:
                self.log_test("GET /auth/me", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /auth/me", False, f"Exception: {str(e)}")
            return False

    def test_daily_routine(self):
        """Test POST /api/daily-routine endpoint with all routine types"""
        print("=== TESTING DAILY ROUTINE ENDPOINTS ===")
        
        routine_types = ["yoga", "pelvic_floor", "affirmation"]
        
        for routine_type in routine_types:
            try:
                payload = {
                    "routine_type": routine_type,
                    "language": "en"
                }
                
                response = requests.post(
                    f"{self.base_url}/daily-routine",
                    json=payload,
                    headers=self.headers,
                    timeout=60  # Longer timeout for AI generation
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "content" in data and "routine_type" in data:
                        content_length = len(data["content"])
                        if content_length > 100:  # Ensure substantial content
                            self.log_test(
                                f"POST /daily-routine ({routine_type})", 
                                True, 
                                f"Generated {content_length} chars, Type: {data['routine_type']}"
                            )
                        else:
                            self.log_test(
                                f"POST /daily-routine ({routine_type})", 
                                False, 
                                f"Content too short: {content_length} chars"
                            )
                    else:
                        self.log_test(
                            f"POST /daily-routine ({routine_type})", 
                            False, 
                            "Missing required fields in response"
                        )
                else:
                    self.log_test(
                        f"POST /daily-routine ({routine_type})", 
                        False, 
                        f"Status: {response.status_code}, Response: {response.text[:200]}"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"POST /daily-routine ({routine_type})", 
                    False, 
                    f"Exception: {str(e)}"
                )

    def test_partner_tips(self):
        """Test POST /api/partner-tips endpoint"""
        print("=== TESTING PARTNER TIPS ENDPOINT ===")
        
        try:
            payload = {"language": "en"}
            
            response = requests.post(
                f"{self.base_url}/partner-tips",
                json=payload,
                headers=self.headers,
                timeout=60  # Longer timeout for AI generation
            )
            
            if response.status_code == 200:
                data = response.json()
                if "tips" in data and "phase" in data:
                    tips_length = len(data["tips"])
                    if tips_length > 100:  # Ensure substantial content
                        self.log_test(
                            "POST /partner-tips", 
                            True, 
                            f"Generated {tips_length} chars, Phase: {data['phase']}"
                        )
                    else:
                        self.log_test(
                            "POST /partner-tips", 
                            False, 
                            f"Tips content too short: {tips_length} chars"
                        )
                else:
                    self.log_test(
                        "POST /partner-tips", 
                        False, 
                        "Missing required fields (tips, phase) in response"
                    )
            else:
                self.log_test(
                    "POST /partner-tips", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test("POST /partner-tips", False, f"Exception: {str(e)}")

    def test_health_report(self):
        """Test GET /api/health-report endpoint"""
        print("=== TESTING HEALTH REPORT ENDPOINT ===")
        
        # Test without date parameters
        try:
            response = requests.get(
                f"{self.base_url}/health-report",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["patient_name", "menopause_phase", "top_symptoms", "averages", "generated_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test(
                        "GET /health-report (no params)", 
                        True, 
                        f"Report generated for {data.get('patient_name', 'Unknown')}, Phase: {data.get('menopause_phase', 'Unknown')}"
                    )
                else:
                    self.log_test(
                        "GET /health-report (no params)", 
                        False, 
                        f"Missing required fields: {missing_fields}"
                    )
            else:
                self.log_test(
                    "GET /health-report (no params)", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test("GET /health-report (no params)", False, f"Exception: {str(e)}")

        # Test with date parameters
        try:
            start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            end_date = datetime.now().strftime('%Y-%m-%d')
            
            response = requests.get(
                f"{self.base_url}/health-report",
                params={"start_date": start_date, "end_date": end_date},
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "report_period" in data:
                    period = data["report_period"]
                    if period["start"] == start_date and period["end"] == end_date:
                        self.log_test(
                            "GET /health-report (with dates)", 
                            True, 
                            f"Date filtering working: {start_date} to {end_date}"
                        )
                    else:
                        self.log_test(
                            "GET /health-report (with dates)", 
                            False, 
                            f"Date parameters not applied correctly"
                        )
                else:
                    self.log_test(
                        "GET /health-report (with dates)", 
                        False, 
                        "Missing report_period in response"
                    )
            else:
                self.log_test(
                    "GET /health-report (with dates)", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test("GET /health-report (with dates)", False, f"Exception: {str(e)}")

    def test_existing_endpoints(self):
        """Test existing endpoints to ensure they still work"""
        print("=== TESTING EXISTING ENDPOINTS ===")
        
        # Test symptoms endpoint
        try:
            response = requests.get(
                f"{self.base_url}/symptoms",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("GET /symptoms", True, f"Retrieved {len(data)} symptoms")
                else:
                    self.log_test("GET /symptoms", False, "No symptoms returned")
            else:
                self.log_test("GET /symptoms", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("GET /symptoms", False, f"Exception: {str(e)}")

        # Test symptom logs endpoint
        try:
            response = requests.get(
                f"{self.base_url}/symptom-logs",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /symptom-logs", True, f"Retrieved {len(data)} logs")
            else:
                self.log_test("GET /symptom-logs", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("GET /symptom-logs", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"Starting Backend API Tests for MenoWellness v3.0")
        print(f"Base URL: {self.base_url}")
        print(f"Test User: {TEST_EMAIL}")
        print("=" * 60)
        
        # Authentication is required for all new endpoints
        if not self.test_login():
            print("❌ CRITICAL: Authentication failed. Cannot proceed with other tests.")
            return False
            
        # Test authenticated profile endpoint
        self.test_auth_me()
        
        # Test new endpoints
        self.test_daily_routine()
        self.test_partner_tips()
        self.test_health_report()
        
        # Test existing endpoints
        self.test_existing_endpoints()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY:")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED!")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)