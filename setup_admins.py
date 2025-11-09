import requests
from app.database import get_supabase_client

BASE_URL = "http://localhost:5001/api"

def register_user(student_id, name, email, role='resident'):
    """Register a user"""
    data = {
        "student_id": student_id,
        "email": email,
        "password": "password123",
        "name": name,
        "hostel": "Hostel A" if role == 'resident' else "Admin Block",
        "room_number": "101" if role == 'resident' else "N/A"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    return response.json()

def update_user_role(student_id, role, admin_role=None):
    """Update user role in database"""
    supabase = get_supabase_client()
    
    update_data = {'role': role}
    if admin_role:
        update_data['admin_role'] = admin_role
    
    result = supabase.table('users').update(update_data).eq('student_id', student_id).execute()
    return result.data

print("=" * 60)
print("Setting up Admin Hierarchy Users")
print("=" * 60)

# Register users
users = [
    ("VALIDATOR001", "Validator One", "validator1@vnit.ac.in", "admin", "validator"),
    ("SUPERVISOR001", "Supervisor One", "supervisor1@vnit.ac.in", "admin", "supervisor"),
    ("WARDEN001", "Warden One", "warden1@vnit.ac.in", "admin", "warden"),
    ("DEAN001", "Dean One", "dean1@vnit.ac.in", "admin", "dean"),
    ("WORKER001", "Worker One", "worker1@vnit.ac.in", "worker", None),
    ("STUDENT002", "Student Two", "student2@vnit.ac.in", "resident", None),
]

for student_id, name, email, role, admin_role in users:
    print(f"\nRegistering {name} ({student_id})...")
    try:
        result = register_user(student_id, name, email, role)
        if 'user_id' in result:
            print(f"✓ Registered: {result}")
            # Update role
            update_result = update_user_role(student_id, role, admin_role)
            if admin_role:
                print(f"✓ Updated to {role} with admin_role={admin_role}")
            else:
                print(f"✓ Updated to {role}")
        else:
            print(f"✗ Error: {result}")
    except Exception as e:
        print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("Setup Complete!")
print("=" * 60)
print("\nTest Credentials:")
print("Validator:   VALIDATOR001 / password123")
print("Supervisor:  SUPERVISOR001 / password123")
print("Warden:      WARDEN001 / password123")
print("Dean:        DEAN001 / password123")
print("Worker:      WORKER001 / password123")
print("Student:     STUDENT002 / password123")
print("=" * 60)
