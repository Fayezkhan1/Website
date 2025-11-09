#!/usr/bin/env python3
"""Test emergency complaint creation"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

print("Testing emergency complaint creation...")
print()

# Check if 'emergency' status is allowed
print("1. Checking complaints table schema...")
try:
    # Try to get table info
    result = supabase.table('complaints').select('status').limit(1).execute()
    print("✓ Can query complaints table")
except Exception as e:
    print(f"✗ Error querying complaints: {e}")

print()
print("2. Testing emergency status constraint...")

# Try to create a test emergency complaint
test_data = {
    'user_id': 1,  # Replace with actual user ID
    'title': 'TEST EMERGENCY',
    'description': 'Test emergency complaint',
    'category': 'ELECTRICAL',
    'location': 'Test Location',
    'status': 'emergency',
    'is_emergency': True
}

try:
    result = supabase.table('complaints').insert(test_data).execute()
    print("✓ Emergency complaint created successfully!")
    print(f"   Complaint ID: {result.data[0]['id']}")
    
    # Clean up - delete test complaint
    supabase.table('complaints').delete().eq('id', result.data[0]['id']).execute()
    print("✓ Test complaint cleaned up")
    
except Exception as e:
    print(f"✗ Error creating emergency complaint: {e}")
    print()
    print("This likely means the 'emergency' status is not in the status constraint.")
    print("Run the database migration: database_emergency_migration.sql")

print()
print("3. Checking if migration was applied...")
try:
    # Check if resolved_by column exists
    result = supabase.table('complaints').select('resolved_by').limit(1).execute()
    print("✓ resolved_by column exists")
except Exception as e:
    print(f"✗ resolved_by column missing: {e}")
    print("   Run the database migration!")
