from app.database import get_supabase_client

supabase = get_supabase_client()

# Update each user
users_to_update = [
    ('Validator One', 'validator'),
    ('Supervisor One', 'supervisor'),
    ('Warden One', 'warden'),
    ('Dean One', 'dean'),
]

for name, admin_role in users_to_update:
    result = supabase.table('users').update({
        'role': 'admin',
        'admin_role': admin_role
    }).eq('name', name).execute()
    
    if result.data:
        print(f"✓ Updated {name} to admin with role {admin_role}")
    else:
        print(f"✗ Failed to update {name}")

# Verify
print("\nVerifying updates:")
result = supabase.table('users').select('name, role, admin_role').in_('name', [u[0] for u in users_to_update]).execute()
for user in result.data:
    print(f"  {user['name']}: role={user['role']}, admin_role={user.get('admin_role')}")
