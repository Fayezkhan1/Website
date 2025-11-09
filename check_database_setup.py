"""
Quick script to check if database is properly set up for worker ratings
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("DATABASE SETUP CHECK")
print("=" * 70)

# Check complaints table
print("\n1. Checking complaints table...")
try:
    result = supabase.table('complaints').select('progress_photo_url, completion_photo_url, worker_rating').limit(1).execute()
    print("   ✅ Complaints table has photo and rating columns")
except Exception as e:
    print(f"   ❌ Missing columns in complaints table")
    print(f"      Error: {e}")
    print("      → Run the SQL migration in Supabase SQL Editor")

# Check users table
print("\n2. Checking users table...")
try:
    result = supabase.table('users').select('average_rating, total_ratings, completed_tasks').limit(1).execute()
    print("   ✅ Users table has rating columns")
except Exception as e:
    print(f"   ❌ Missing columns in users table")
    print(f"      Error: {e}")
    print("      → Run the SQL migration in Supabase SQL Editor")

# Check worker_ratings table
print("\n3. Checking worker_ratings table...")
try:
    result = supabase.table('worker_ratings').select('*').limit(1).execute()
    print("   ✅ Worker_ratings table exists")
except Exception as e:
    print(f"   ❌ Worker_ratings table not found")
    print(f"      Error: {e}")
    print("      → Run the SQL migration in Supabase SQL Editor")

# Check storage bucket
print("\n4. Checking storage bucket...")
try:
    buckets = supabase.storage.list_buckets()
    bucket_names = [b['name'] for b in buckets]
    if 'complaint-photos' in bucket_names:
        print("   ✅ Storage bucket 'complaint-photos' exists")
    else:
        print("   ⚠️  Storage bucket 'complaint-photos' not found")
        print("      → Photos will be stored in database (works fine)")
        print("      → Optional: Create bucket in Supabase Dashboard → Storage")
except Exception as e:
    print(f"   ⚠️  Could not check storage: {e}")
    print("      → Photos will be stored in database (works fine)")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print("\nTo fix any ❌ issues:")
print("1. Go to: https://supabase.com/dashboard/project/edgtolokpiamnvbtscey")
print("2. Click 'SQL Editor' in left sidebar")
print("3. Copy and paste the SQL from: database_worker_ratings.sql")
print("4. Click 'Run'")
print("\nFor storage bucket (optional):")
print("1. Click 'Storage' in left sidebar")
print("2. Click 'New bucket'")
print("3. Name: complaint-photos")
print("4. Toggle 'Public bucket' ON")
print("5. Click 'Create bucket'")
print("=" * 70)
