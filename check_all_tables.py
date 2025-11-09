"""
Check all tables and their row counts
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 70)
print("DATABASE TABLES STATUS")
print("=" * 70)

tables = ['users', 'complaints', 'worker_ratings', 'complaint_upvotes', 'complaint_history']

for table_name in tables:
    try:
        result = supabase.table(table_name).select('*', count='exact').limit(1).execute()
        count = result.count if hasattr(result, 'count') else len(result.data) if result.data else 0
        
        # Try to get actual count
        all_data = supabase.table(table_name).select('id').execute()
        actual_count = len(all_data.data) if all_data.data else 0
        
        status = "✅ EXISTS" if actual_count >= 0 else "❌ ERROR"
        print(f"\n{table_name.upper()}")
        print(f"  Status: {status}")
        print(f"  Rows: {actual_count}")
        
        if actual_count == 0:
            if table_name == 'users':
                print("  ⚠️  No users! You need to register users first.")
            elif table_name == 'complaints':
                print("  ⚠️  No complaints! Students need to file complaints.")
            elif table_name == 'worker_ratings':
                print("  ℹ️  Normal - No ratings yet (workers need to complete tasks first)")
            elif table_name == 'complaint_upvotes':
                print("  ℹ️  Normal - No upvotes yet")
            elif table_name == 'complaint_history':
                print("  ℹ️  Normal - No history yet")
        else:
            # Show sample data
            sample = supabase.table(table_name).select('*').limit(3).execute()
            if sample.data:
                print(f"  Sample data (first {min(3, len(sample.data))} rows):")
                for i, row in enumerate(sample.data[:3], 1):
                    if table_name == 'users':
                        print(f"    {i}. {row.get('name', 'N/A')} - {row.get('role', 'N/A')} - {row.get('email', 'N/A')}")
                    elif table_name == 'complaints':
                        print(f"    {i}. {row.get('title', 'N/A')[:50]} - Status: {row.get('status', 'N/A')}")
                    elif table_name == 'worker_ratings':
                        print(f"    {i}. Rating: {row.get('rating', 'N/A')} stars - Feedback: {(row.get('feedback', '') or 'None')[:30]}")
                    else:
                        print(f"    {i}. ID: {row.get('id', 'N/A')}")
                        
    except Exception as e:
        print(f"\n{table_name.upper()}")
        print(f"  Status: ❌ ERROR")
        print(f"  Error: {str(e)}")
        if "does not exist" in str(e).lower() or "relation" in str(e).lower():
            print(f"  → Table doesn't exist! Run the migration SQL.")

print("\n" + "=" * 70)
print("NEXT STEPS")
print("=" * 70)

# Check if we need to run migration
try:
    result = supabase.table('worker_ratings').select('id').limit(1).execute()
    print("\n✅ worker_ratings table exists - Migration already done!")
except:
    print("\n❌ worker_ratings table missing - Run migration:")
    print("   1. Go to Supabase Dashboard → SQL Editor")
    print("   2. Run the SQL from: database_worker_ratings.sql")

# Check if we have users
try:
    users = supabase.table('users').select('id').execute()
    if not users.data or len(users.data) == 0:
        print("\n⚠️  No users in database!")
        print("   → Register users through the app:")
        print("   → http://localhost:3000 → Click 'Register'")
    else:
        print(f"\n✅ Found {len(users.data)} users in database")
        
        # Check for workers
        workers = supabase.table('users').select('id').eq('role', 'worker').execute()
        if workers.data and len(workers.data) > 0:
            print(f"   → {len(workers.data)} workers registered")
        else:
            print("   ⚠️  No workers registered yet")
            print("   → Register a worker to test the system")
except Exception as e:
    print(f"\n❌ Error checking users: {e}")

print("\n" + "=" * 70)
