#!/usr/bin/env python3
"""Test script to verify upvote functionality"""

import requests
import json

BASE_URL = "http://localhost:5001/api"

def test_upvote():
    print("=" * 70)
    print("TESTING UPVOTE FUNCTIONALITY")
    print("=" * 70)
    
    # Login as student
    print("\n1. Logging in as student...")
    login_data = {"student_id": "STUDENT002", "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    token = response.json()['token']
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")
    
    # Get complaints
    print("\n2. Fetching complaints...")
    response = requests.get(f"{BASE_URL}/complaints/", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch complaints: {response.text}")
        return
    
    complaints = response.json()['complaints']
    print(f"✅ Found {len(complaints)} complaints")
    
    if len(complaints) == 0:
        print("⚠️  No complaints to test upvote. Please file a complaint first.")
        return
    
    complaint_id = complaints[0]['id']
    print(f"\n3. Testing upvote on complaint ID: {complaint_id}")
    
    # Try to upvote
    response = requests.post(f"{BASE_URL}/complaints/{complaint_id}/upvote", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Upvote successful!")
    elif response.status_code == 400 and "Already upvoted" in response.text:
        print("✅ Upvote working (already voted)")
    else:
        print(f"❌ Upvote failed")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    try:
        test_upvote()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
