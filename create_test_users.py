import requests

BASE_URL = "http://localhost:5001/api"

users = [
    {
        "student_id": "STUDENT002",
        "email": "student2@vnit.ac.in",
        "password": "password123",
        "name": "Student Two",
        "hostel": "Hostel A",
        "room_number": "101"
    },
    {
        "student_id": "VALIDATOR001",
        "email": "validator1@vnit.ac.in",
        "password": "password123",
        "name": "Validator One",
        "hostel": "Admin Block",
        "room_number": "N/A"
    },
    {
        "student_id": "SUPERVISOR001",
        "email": "supervisor1@vnit.ac.in",
        "password": "password123",
        "name": "Supervisor One",
        "hostel": "Admin Block",
        "room_number": "N/A"
    },
    {
        "student_id": "WORKER001",
        "email": "worker1@vnit.ac.in",
        "password": "password123",
        "name": "Worker One",
        "hostel": "Admin Block",
        "room_number": "N/A"
    }
]

print("Creating test users...")
for user in users:
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user)
        if response.status_code == 201:
            print(f"✓ Created {user['name']}")
        else:
            print(f"✗ Failed to create {user['name']}: {response.json()}")
    except Exception as e:
        print(f"✗ Error creating {user['name']}: {e}")

print("\nNow run this SQL in Supabase:")
print("UPDATE users SET role = 'admin', admin_role = 'validator' WHERE name = 'Validator One';")
print("UPDATE users SET role = 'admin', admin_role = 'supervisor' WHERE name = 'Supervisor One';")
print("UPDATE users SET role = 'worker' WHERE name = 'Worker One';")
