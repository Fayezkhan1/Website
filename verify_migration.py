"""
Verify if database migration has been run
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("CHECKING DATABASE MIGRATION STATUS")
print("=" * 70)

# Test if we can access the new columns
print("\n1. Testing complaints table columns...")
try:
    result = supabase.table('complaints').select('progress_photo_url, completion_photo_url, worker_rating').limit(1).execute()
    print("   ✅ SUCCESS - All photo and rating columns exist!")
except Exception as e:
    print("   ❌ FAILED - Columns missing!")
    print(f"   Error: {e}")
    print("\n   → YOU NEED TO RUN THE MIGRATION SQL")
    print("   → Go to Supabase Dashboard → SQL Editor")
    print("   → Run the SQL from: database_worker_ratings.sql")

print("\n2. Testing users table columns...")
try:
    result = supabase.table('users').select('average_rating, total_ratings, completed_tasks').limit(1).execute()
    print("   ✅ SUCCESS - All rating columns exist!")
except Exception as e:
    print("   ❌ FAILED - Columns missing!")
    print(f"   Error: {e}")

print("\n3. Testing worker_ratings table...")
try:
    result = supabase.table('worker_ratings').select('*').limit(1).execute()
    print("   ✅ SUCCESS - worker_ratings table exists!")
except Exception as e:
    print("   ❌ FAILED - Table doesn't exist!")
    print(f"   Error: {e}")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

try:
    # Try all at once
    supabase.table('complaints').select('progress_photo_url').limit(1).execute()
    supabase.table('users').select('average_rating').limit(1).execute()
    supabase.table('worker_ratings').select('id').limit(1).execute()
    
    print("\n✅ ALL CHECKS PASSED!")
    print("   Your database is ready for photo uploads and ratings.")
    print("\n   Next steps:")
    print("   1. Restart Flask backend: python app.py")
    print("   2. Refresh browser: Ctrl+Shift+R")
    print("   3. Try uploading a photo again")
    
except Exception as e:
    print("\n❌ MIGRATION NEEDED!")
    print("\n   Follow these steps:")
    print("   1. Go to: https://supabase.com/dashboard/project/edgtolokpiamnvbtscey")
    print("   2. Click 'SQL Editor' in left sidebar")
    print("   3. Click 'New query'")
    print("   4. Copy SQL from: database_worker_ratings.sql")
    print("   5. Paste and click 'Run'")
    print("   6. Restart Flask: python app.py")

print("=" * 70)
