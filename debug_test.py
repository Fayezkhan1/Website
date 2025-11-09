import requests

BASE_URL = "http://localhost:5001/api"

print("Testing login...")
data = {"student_id": "STUDENT002", "password": "password123"}
response = requests.post(f"{BASE_URL}/auth/login", json=data)

print(f"Status Code: {response.status_code}")
print(f"Response Text: {response.text}")
print(f"Response Headers: {response.headers}")

if response.status_code == 200:
    print(f"Success: {response.json()}")
else:
    print(f"Failed!")
