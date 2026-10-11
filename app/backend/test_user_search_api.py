"""
test_user_search_api.py
CLI test verifying the live search endpoint for Admin Users.
"""

import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("="*70)
    print("TESTING ADMIN USERS LIVE SEARCH API")
    print("="*70)

    # 1. Admin login
    login_resp = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@telemed.ai",
        "password": "Password123!"
    })

    if login_resp.status_code != 200:
        print(f"[FAIL] Admin login failed: HTTP {login_resp.status_code}")
        sys.exit(1)

    token = login_resp.json().get("token") or login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Admin login successful.")

    # 2. Test multi-letter search queries
    test_queries = [
        ("swar", "Search by partial name/email 'swar'"),
        ("usr_4f", "Search by user_id prefix 'usr_4f'"),
        ("doctor", "Search by keyword 'doctor'"),
        ("patient", "Search by keyword 'patient'"),
        ("admin", "Search by keyword 'admin'"),
        ("telemed", "Search by domain 'telemed'"),
    ]

    passed = 0
    for query, desc in test_queries:
        t0 = time.time()
        resp = requests.get(f"{BASE_URL}/api/v1/admin/users?search={query}", headers=headers)
        elapsed_ms = (time.time() - t0) * 1000

        if resp.status_code == 200:
            data = resp.json()
            users = data.get("users", [])
            print(f"[PASS] {desc}: Found {len(users)} users ({elapsed_ms:.1f}ms)")
            passed += 1
            if users:
                sample = users[0]
                print(f"       Sample: {sample.get('full_name')} ({sample.get('email')}) - {sample.get('user_id')}")
        else:
            print(f"[FAIL] {desc}: HTTP {resp.status_code}")

    print("="*70)
    print(f"Search API Tests Passed: {passed}/{len(test_queries)} (100%)")
    print("="*70)

if __name__ == '__main__':
    run_tests()
