# Troubleshooting: Changes Not Showing

## Quick Fixes (Try in order):

### 1. Hard Refresh Browser
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

### 2. Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 3. Logout and Login Again
- This forces the app to fetch fresh data
- Clears any cached user data

### 4. Restart Backend
```bash
# Stop Flask (Ctrl+C)
python app.py
```

### 5. Restart Frontend
```bash
# Stop React (Ctrl+C)
cd frontend
npm start
```

## Verify Changes Were Saved

### In Supabase Dashboard:
1. Go to Table Editor
2. Find your table
3. Look for your changes
4. If not there, the edit didn't save

### In SQL Editor:
```sql
-- Check users table
SELECT * FROM users ORDER BY updated_at DESC LIMIT 5;

-- Check complaints table
SELECT * FROM complaints ORDER BY updated_at DESC LIMIT 5;

-- Check specific user by email
SELECT * FROM users WHERE email = 'your@email.com';

-- Check if worker_ratings columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('average_rating', 'total_ratings', 'completed_tasks');
```

## Common Scenarios:

### Scenario 1: Added columns but app doesn't see them
**Problem:** Migration not run or app using old schema

**Solution:**
1. Run migration SQL in Supabase SQL Editor
2. Restart Flask backend
3. Hard refresh browser

### Scenario 2: Edited user data but login still fails
**Problem:** Password hash doesn't match

**Solution:**
- Don't edit password directly in database
- Use the app's "Register" to create new users
- Or update password via SQL:
```sql
-- Don't do this - passwords are hashed!
-- Instead, register through the app
```

### Scenario 3: Changed complaint status but UI shows old status
**Problem:** React state not updated

**Solution:**
```javascript
// In your component, add a refresh function
const refreshData = async () => {
  await loadComplaints(); // or whatever your load function is called
};

// Call it after making changes
```

### Scenario 4: Added worker rating but doesn't show
**Problem:** Need to reload worker profile

**Solution:**
- Logout and login as worker
- Or add refresh button to worker dashboard

## Debug with Browser Console

### Check what data the app has:
1. Open DevTools (F12)
2. Go to Console tab
3. Type:
```javascript
// Check localStorage
console.log(localStorage.getItem('user'));
console.log(localStorage.getItem('token'));

// Check if data is being fetched
// (Look in Network tab for API calls)
```

### Check Network Requests:
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for calls to Supabase
5. Click on them to see:
   - Request headers (check auth token)
   - Response data (check if it includes your changes)

## Force Data Refresh in Code

### Add refresh button to any dashboard:

```javascript
const [refreshKey, setRefreshKey] = useState(0);

// In useEffect
useEffect(() => {
  loadData();
}, [refreshKey]); // Re-run when refreshKey changes

// Add button
<button onClick={() => setRefreshKey(prev => prev + 1)}>
  Refresh Data
</button>
```

## Check Row Level Security (RLS)

If you can see data in Supabase but not in app:

### In Supabase Dashboard:
1. Go to **Authentication** → **Policies**
2. Find your table
3. Check if policies are blocking reads

### Temporarily disable RLS for testing:
```sql
-- In SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE worker_ratings DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable after testing!
```

## Still Not Working?

### Check these:
1. ✅ Are you logged in with the right account?
2. ✅ Is the backend running? (Check terminal)
3. ✅ Is the frontend running? (Check browser)
4. ✅ Are there errors in browser console? (F12)
5. ✅ Are there errors in backend terminal?
6. ✅ Is your .env file correct?

### Get detailed logs:

**Backend (Flask):**
```python
# Add to your route
print(f"Data fetched: {result.data}")
```

**Frontend (React):**
```javascript
// Add to your component
console.log('Data loaded:', data);
```

## Nuclear Option (Reset Everything):

If nothing works:

```bash
# 1. Stop everything
# Ctrl+C in both terminals

# 2. Clear browser completely
# - Clear all cache
# - Clear localStorage
# - Close all tabs

# 3. Restart backend
python app.py

# 4. Restart frontend
cd frontend
npm start

# 5. Open fresh browser window
# Go to http://localhost:3000
# Register new user
# Test functionality
```

## Prevention:

### Always refresh after database changes:
1. Make change in Supabase
2. Hard refresh browser (Ctrl+Shift+R)
3. Or logout/login
4. Or restart backend

### Use React Query or SWR for auto-refresh:
```bash
npm install @tanstack/react-query
```

This will automatically keep data in sync!
