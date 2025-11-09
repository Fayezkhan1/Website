import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

print("Running worker ratings migration...")
print("Note: Please run this SQL manually in Supabase SQL Editor:")
print("=" * 60)

with open('database_worker_ratings.sql', 'r') as f:
    sql = f.read()
    print(sql)

print("=" * 60)
print("\nTo apply this migration:")
print("1. Go to your Supabase Dashboard")
print("2. Navigate to SQL Editor")
print("3. Copy and paste the SQL above")
print("4. Click 'Run'")
print("\nOr use the Supabase CLI if you have it installed:")
