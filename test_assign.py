#!/usr/bin/env python3
"""Test the assign endpoint"""

import requests
import json

# This is a test script - you'll need to:
# 1. Login as supervisor to get a token
# 2. Replace TOKEN, COMPLAINT_ID, and WORKER_ID below
# 3. Run: python3 test_assign.py

TOKEN = "your_token_here"
COMPLAINT_ID = "40"
WORKER_ID = "your_worker_id_here"

url = f"http://localhost:5002/api/admin/complaints/{COMPLAINT_ID}/assign"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

data = {
    "worker_id": WORKER_ID,
    "deadline_days": 3
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
