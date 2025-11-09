from config import Config
from supabase import create_client

print("Testing Supabase connection...")
print(f"URL: {Config.SUPABASE_URL}")
print(f"Key: {Config.SUPABASE_KEY[:20]}...")

try:
    supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
    print("✓ Supabase client created successfully")
    
    # Test query
    result = supabase.table('users').select('*').limit(1).execute()
    print(f"✓ Database connection successful")
    print(f"Users table exists: {result is not None}")
    
except Exception as e:
    print(f"✗ Error: {e}")
