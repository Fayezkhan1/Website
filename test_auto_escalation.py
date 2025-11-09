#!/usr/bin/env python3
"""
Test script for auto-escalation system
Tests that validated complaints not assigned within 2 days are escalated to warden
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:5002/api'

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_auto_escalation():
    print_section("AUTO-ESCALATION SYSTEM TEST (2 MINUTES)")
    print("⚠️  TESTING MODE: Escalation happens after 2 MINUTES (not 2 days)")
    print("    Change back to 2 days for production!\n")
    
    # Step 1: Login as supervisor (who can trigger escalation check)
    print("1. Logging in as Supervisor...")
    login_response = requests.post(f'{BASE_URL}/auth/login', json={
        'email': 'supervisor@vnit.ac.in',
        'password': 'password123'
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    print("✅ Logged in successfully")
    
    # Step 2: Get all complaints to see current state
    print("\n2. Fetching current complaints...")
    complaints_response = requests.get(f'{BASE_URL}/admin/complaints', headers=headers)
    
    if complaints_response.status_code == 200:
        complaints = complaints_response.json()['complaints']
        validated_complaints = [c for c in complaints if c['status'] == 'validated']
        escalated_complaints = [c for c in complaints if c['status'] == 'escalated']
        
        print(f"   Total complaints: {len(complaints)}")
        print(f"   Validated (not assigned): {len(validated_complaints)}")
        print(f"   Already escalated: {len(escalated_complaints)}")
        
        if validated_complaints:
            print("\n   Validated complaints:")
            for c in validated_complaints[:5]:  # Show first 5
                validated_at = c.get('validated_at', 'N/A')
                print(f"   - {c['title'][:50]} (validated: {validated_at})")
    else:
        print(f"❌ Failed to fetch complaints: {complaints_response.text}")
    
    # Step 3: Trigger escalation check
    print("\n3. Triggering auto-escalation check...")
    escalation_response = requests.post(
        f'{BASE_URL}/admin/complaints/check-unassigned',
        headers=headers
    )
    
    if escalation_response.status_code == 200:
        result = escalation_response.json()
        print(f"✅ Escalation check completed")
        print(f"   Escalated: {result['count']} complaints")
        
        if result['complaints']:
            print("\n   Escalated complaints:")
            for c in result['complaints']:
                print(f"   - {c['title']}")
                print(f"     ID: {c['id']}")
                print(f"     Validated at: {c.get('validated_at', 'N/A')}")
        else:
            print("   No complaints needed escalation")
    else:
        print(f"❌ Escalation check failed: {escalation_response.text}")
        return
    
    # Step 4: Verify escalated complaints
    print("\n4. Verifying escalated complaints...")
    complaints_response = requests.get(f'{BASE_URL}/admin/complaints', headers=headers)
    
    if complaints_response.status_code == 200:
        complaints = complaints_response.json()['complaints']
        escalated_complaints = [c for c in complaints if c['status'] == 'escalated']
        
        print(f"   Total escalated complaints now: {len(escalated_complaints)}")
        
        if escalated_complaints:
            print("\n   Escalated complaints details:")
            for c in escalated_complaints[:5]:  # Show first 5
                print(f"\n   - {c['title']}")
                print(f"     Status: {c['status']}")
                print(f"     Escalated to: {c.get('escalated_to', 'N/A')}")
                print(f"     Escalated at: {c.get('escalated_at', 'N/A')}")
                print(f"     Validated at: {c.get('validated_at', 'N/A')}")
    
    # Step 5: Login as warden to see escalated complaints
    print("\n5. Testing warden view...")
    warden_login = requests.post(f'{BASE_URL}/auth/login', json={
        'email': 'warden@vnit.ac.in',
        'password': 'password123'
    })
    
    if warden_login.status_code == 200:
        warden_token = warden_login.json()['token']
        warden_headers = {'Authorization': f'Bearer {warden_token}'}
        
        warden_complaints = requests.get(f'{BASE_URL}/admin/complaints', headers=warden_headers)
        
        if warden_complaints.status_code == 200:
            warden_data = warden_complaints.json()
            print(f"✅ Warden can see {len(warden_data['complaints'])} complaints")
            
            escalated_for_warden = [c for c in warden_data['complaints'] if c['status'] == 'escalated']
            print(f"   Escalated complaints visible to warden: {len(escalated_for_warden)}")
        else:
            print(f"❌ Failed to fetch warden complaints: {warden_complaints.text}")
    else:
        print(f"⚠️  Could not login as warden (may not exist)")
    
    print_section("TEST COMPLETED")

def create_test_complaint():
    """Helper function to create a test complaint for escalation testing"""
    print_section("CREATE TEST COMPLAINT FOR ESCALATION")
    
    # Login as student
    print("1. Logging in as student...")
    login_response = requests.post(f'{BASE_URL}/auth/login', json={
        'email': 'student@vnit.ac.in',
        'password': 'password123'
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return None
    
    token = login_response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    print("✅ Logged in successfully")
    
    # Create complaint
    print("\n2. Creating test complaint...")
    complaint_data = {
        'title': 'Test Escalation - Fan not working',
        'description': 'This is a test complaint to verify auto-escalation after 2 days',
        'category': 'ELECTRICAL',
        'location': 'Hostel 1 - Room 101'
    }
    
    create_response = requests.post(
        f'{BASE_URL}/complaints/',
        headers=headers,
        json=complaint_data
    )
    
    if create_response.status_code == 201:
        complaint = create_response.json()['complaint']
        print(f"✅ Complaint created: {complaint['id']}")
        return complaint['id']
    else:
        print(f"❌ Failed to create complaint: {create_response.text}")
        return None

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'create':
        complaint_id = create_test_complaint()
        if complaint_id:
            print(f"\n✅ Test complaint created: {complaint_id}")
            print("\nNext steps:")
            print("1. Login as validator and validate this complaint")
            print("2. Wait 2 MINUTES OR manually update validated_at in database:")
            print(f"   UPDATE complaints SET validated_at = NOW() - INTERVAL '3 minutes' WHERE id = '{complaint_id}';")
            print("3. Run: python test_auto_escalation.py")
            print("\n⚠️  TESTING MODE: Using 2 minutes instead of 2 days")
    else:
        test_auto_escalation()
