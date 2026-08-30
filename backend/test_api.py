import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_analyze():
    print("--- Testing POST /api/analyze ---")
    payload = {
        "text": "URGENT: Your bank account is suspended. Click here to verify KYC: http://bit.ly/fake-kyc"
    }
    response = requests.post(f"{BASE_URL}/analyze", json=payload)
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_history():
    print("\n--- Testing GET /api/history ---")
    response = requests.get(f"{BASE_URL}/history?limit=2")
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_stats():
    print("\n--- Testing GET /api/stats ---")
    response = requests.get(f"{BASE_URL}/stats")
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    print("Make sure Flask is running on port 5000 before running these tests.")
    try:
        test_analyze()
        test_history()
        test_stats()
    except requests.exceptions.ConnectionError:
        print("Connection failed. Is the Flask server running?")
