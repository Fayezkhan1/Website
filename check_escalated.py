#!/usr/bin/env python3
"""
Quick script to check if there are any escalated complaints in the database
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

print("Checking for escalated complaints...\n")

# Check all complaints
all_complaints = supabase.table('complaints').select('id, title, status, validated_at, escalated_at, escalated_to').execute()

print(f"Total complaints: {len(all_complaints.data)}\n")

# Filter by status
validated = [c for c in all_complaints.data if c['status'] == 'validated']
escalated = [c for c in all_complaints.data if c['status'] == 'escalated']

print(f"Validated complaints: {len(validated)}")
for c in validated:
    print(f"  - ID: {c['id']}, Title: {c['title'][:50]}, Validated at: {c.get('validated_at', 'N/A')}")

print(f"\nEscalated complaints: {len(escalated)}")
for c in escalated:
    print(f"  - ID: {c['id']}, Title: {c['title'][:50]}")
    print(f"    Escalated to: {c.get('escalated_to', 'N/A')}")
    print(f"    Escalated at: {c.get('escalated_at', 'N/A')}")
    print(f"    Validated at: {c.get('validated_at', 'N/A')}")

# Check if escalated_at and escalated_to columns exist
print("\n" + "="*60)
print("Checking if escalation columns exist...")
try:
    test = supabase.table('complaints').select('escalated_at, escalated_to').limit(1).execute()
    print("✅ escalated_at and escalated_to columns exist")
except Exception as e:
    print(f"❌ Error: {e}")
    print("You need to add these columns to the database")
