from app.database import get_supabase_client

supabase = get_supabase_client()

# Get all users to see the structure
result = supabase.table('users').select('*').limit(5).execute()

if result.data:
    print("Users table columns:")
    print(result.data[0].keys())
    print("\nSample data:")
    for user in result.data:
        print(user)
else:
    print("No users found")
