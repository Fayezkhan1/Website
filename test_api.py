import requests
import json

BASE_URL = "http://localhost:5001/api"

def test_register():
    """Test user registration"""
    print("\n1. Testing User Registration...")
    data = {
        "student_id": "BT21CSE001",
        "email": "student@vnit.ac.in",
        "password": "password123",
        "name": "Test Student",
        "hostel": "Hostel A",
        "room_number": "101"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_login():
    """Test user login"""
    print("\n2. Testing User Login...")
    data = {
        "student_id": "BT21CSE001",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json().get('token')

def test_create_complaint(token):
    """Test creating a complaint"""
    print("\n3. Testing Create Complaint...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Water leakage in bathroom",
        "description": "There is a water leakage in the bathroom ceiling. It's an emergency!",
        "category": "Plumbing",
        "location": "Hostel A, Room 101"
    }
    response = requests.post(f"{BASE_URL}/complaints/", json=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_get_complaints(token):
    """Test getting complaints"""
    print("\n4. Testing Get Complaints...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/complaints/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    print("=" * 50)
    print("VNIT Hostel Grievance System - API Tests")
    print("=" * 50)
    
    try:
        # Test registration
        test_register()
        
        # Test login
        token = test_login()
        
        if token:
            # Test creating complaint
            test_create_complaint(token)
            
            # Test getting complaints
            test_get_complaints(token)
        
        print("\n" + "=" * 50)
        print("All tests completed!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\nError: {e}")
