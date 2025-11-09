import requests
import json
from time import sleep

BASE_URL = "http://localhost:5001/api"

def login(student_id, password="password123"):
    """Login and get token"""
    data = {"student_id": student_id, "password": password}
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    if response.status_code == 200:
        return response.json().get('token')
    else:
        print(f"Login failed: {response.json()}")
        return None

def test_complete_workflow():
    print("=" * 70)
    print("TESTING COMPLETE ADMIN HIERARCHY WORKFLOW")
    print("=" * 70)
    
    # Step 1: Student files complaint
    print("\n📝 STEP 1: Student files complaint")
    print("-" * 70)
    student_token = login("STUDENT002")
    if not student_token:
        print("❌ Student login failed")
        return
    
    headers = {"Authorization": f"Bearer {student_token}"}
    complaint_data = {
        "title": "Broken AC in room",
        "description": "The AC has stopped working completely. It's very hot!",
        "category": "Electrical",
        "location": "Hostel A, Room 202"
    }
    
    response = requests.post(f"{BASE_URL}/complaints/", json=complaint_data, headers=headers)
    print(f"Response Status: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 201:
        complaint = response.json()['complaint']
        complaint_id = complaint['id']
        print(f"✅ Complaint filed successfully!")
        print(f"   ID: {complaint_id}")
        print(f"   Status: {complaint['status']}")
        print(f"   Priority: {complaint['priority']}")
        print(f"   Emergency: {complaint.get('is_emergency', False)}")
    else:
        print(f"❌ Failed: Status {response.status_code}")
        if response.text:
            try:
                print(f"Error: {response.json()}")
            except:
                print(f"Raw response: {response.text}")
        return
    
    # Step 2: Validator validates complaint
    print("\n✓ STEP 2: Validator validates complaint")
    print("-" * 70)
    validator_token = login("VALIDATOR001")
    if not validator_token:
        print("❌ Validator login failed")
        return
    
    headers = {"Authorization": f"Bearer {validator_token}"}
    
    # Check validator dashboard
    response = requests.get(f"{BASE_URL}/admin/dashboard", headers=headers)
    if response.status_code == 200:
        stats = response.json()['stats']
        print(f"📊 Validator Dashboard:")
        print(f"   Pending validation: {stats.get('pending_validation', 0)}")
    
    # Validate complaint
    validate_data = {"priority": "high"}
    response = requests.post(f"{BASE_URL}/admin/complaints/{complaint_id}/validate", 
                            json=validate_data, headers=headers)
    if response.status_code == 200:
        complaint = response.json()['complaint']
        print(f"✅ Complaint validated!")
        print(f"   Status: {complaint['status']}")
        print(f"   Priority: {complaint['priority']}")
    else:
        print(f"❌ Failed: {response.json()}")
        return
    
    # Step 3: Supervisor assigns to worker
    print("\n👷 STEP 3: Supervisor assigns to worker")
    print("-" * 70)
    supervisor_token = login("SUPERVISOR001")
    if not supervisor_token:
        print("❌ Supervisor login failed")
        return
    
    headers = {"Authorization": f"Bearer {supervisor_token}"}
    
    # Get worker ID
    worker_token = login("WORKER001")
    worker_response = requests.get(f"{BASE_URL}/complaints/", 
                                   headers={"Authorization": f"Bearer {worker_token}"})
    
    # Assign to worker (we'll use user_id 6 which is WORKER001)
    assign_data = {
        "worker_id": "6",  # This should be the actual UUID from your database
        "deadline_days": 2
    }
    
    response = requests.post(f"{BASE_URL}/admin/complaints/{complaint_id}/assign",
                            json=assign_data, headers=headers)
    if response.status_code == 200:
        complaint = response.json()['complaint']
        print(f"✅ Complaint assigned to worker!")
        print(f"   Status: {complaint['status']}")
        print(f"   Deadline: {complaint.get('deadline', 'N/A')}")
    else:
        print(f"❌ Failed: {response.json()}")
    
    # Step 4: View complaint history
    print("\n📜 STEP 4: View complaint history")
    print("-" * 70)
    response = requests.get(f"{BASE_URL}/admin/complaints/{complaint_id}/history",
                           headers=headers)
    if response.status_code == 200:
        history = response.json()['history']
        print(f"✅ Found {len(history)} history entries:")
        for entry in history:
            print(f"   - {entry['action']}: {entry['from_status']} → {entry['to_status']}")
            if entry['notes']:
                print(f"     Notes: {entry['notes']}")
    
    # Step 5: Check escalations
    print("\n⚠️  STEP 5: Check for escalations")
    print("-" * 70)
    response = requests.post(f"{BASE_URL}/admin/complaints/check-escalations",
                            headers=headers)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Escalation check complete")
        print(f"   Escalated: {result['count']} complaints")
    
    print("\n" + "=" * 70)
    print("WORKFLOW TEST COMPLETE!")
    print("=" * 70)
    print("\n💡 Next steps:")
    print("   1. Worker can update task: PATCH /api/worker/tasks/{id}/update")
    print("   2. Worker completes task: POST /api/worker/tasks/{id}/complete")
    print("   3. Admin verifies: POST /api/admin/complaints/{id}/verify")
    print("=" * 70)

if __name__ == "__main__":
    try:
        test_complete_workflow()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
