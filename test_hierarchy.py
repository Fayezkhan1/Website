import requests
import json

BASE_URL = "http://localhost:5001/api"

def create_admin(student_id, name, admin_role):
    """Helper to create admin users"""
    data = {
        "student_id": student_id,
        "email": f"{student_id.lower()}@vnit.ac.in",
        "password": "admin123",
        "name": name,
        "hostel": "Admin Block",
        "room_number": "N/A"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    return response.json()

def login(student_id):
    """Login and get token"""
    data = {"student_id": student_id, "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    return response.json().get('token')

def test_hierarchy_workflow():
    print("=" * 60)
    print("Testing Admin Hierarchy Workflow")
    print("=" * 60)
    
    # 1. Student files complaint
    print("\n1. Student files complaint...")
    student_token = login("BT21CSE001")
    headers = {"Authorization": f"Bearer {student_token}"}
    
    complaint_data = {
        "title": "Broken AC in room",
        "description": "The AC has stopped working completely",
        "category": "Electrical",
        "location": "Hostel A, Room 101"
    }
    response = requests.post(f"{BASE_URL}/complaints/", json=complaint_data, headers=headers)
    complaint = response.json()['complaint']
    complaint_id = complaint['id']
    print(f"✓ Complaint filed: ID {complaint_id}, Status: {complaint['status']}")
    
    # Note: You need to manually update admin_role in Supabase for these users
    print("\n2. Validator validates complaint...")
    print("   (First, manually set admin_role='validator' for a user in Supabase)")
    print(f"   Then call: POST /api/admin/complaints/{complaint_id}/validate")
    
    print("\n3. Supervisor assigns to worker...")
    print("   (Set admin_role='supervisor' for a user in Supabase)")
    print(f"   Then call: POST /api/admin/complaints/{complaint_id}/assign")
    print("   With body: {{'worker_id': <worker_id>, 'deadline_days': 2}}")
    
    print("\n4. Check escalations (after 2 days)...")
    print("   Call: POST /api/admin/complaints/check-escalations")
    
    print("\n5. View complaint history...")
    print(f"   Call: GET /api/admin/complaints/{complaint_id}/history")
    
    print("\n" + "=" * 60)
    print("Hierarchy workflow test setup complete!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_hierarchy_workflow()
    except Exception as e:
        print(f"\nError: {e}")
