import json
import urllib.request

def test_login():
    url = "http://127.0.0.1:8000/api/v1/auth/login"
    payload = json.dumps({
        "email": "patient@telemed.ai",
        "password": "password123",
        "role": "PATIENT"
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"HTTP Status: {resp.status}")
            print(f"Message: {data.get('message')}")
            print(f"User Email: {data.get('user', {}).get('email')}")
            print(f"User Role: {data.get('user', {}).get('role')}")
            print(f"Access Token Present: {bool(data.get('access_token'))}")
            print("[LOGIN SUCCESSFUL 100%]")
    except Exception as e:
        print(f"Login failed error: {e}")

if __name__ == "__main__":
    test_login()
