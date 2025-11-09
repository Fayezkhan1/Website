# Fix Emergency Complaint Error

## The Problem
The emergency complaint submission is failing because the database doesn't have the 'emergency' status in its constraint yet.

## The Solution - Apply Database Migration

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard: https://edgtolokpiamnvbtscey.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Migration
Copy and paste this SQL into the editor:

```sql
-- EMERGENCY SYSTEM DATABASE MIGRATION

-- Step 1: Drop the old status constraint
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

-- Step 2: Add new status constraint that includes 'emergency'
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('pending', 'validated', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected', 'escalated', 'emergency'));

-- Step 3: Add emergency resolution columns
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Step 4: Create indexes for emergency queries
CREATE INDEX IF NOT EXISTS idx_complaints_emergency_status 
ON complaints(is_emergency, status) 
WHERE is_emergency = true;

CREATE INDEX IF NOT EXISTS idx_complaints_resolved_by 
ON complaints(resolved_by) 
WHERE resolved_by IS NOT NULL;

-- Step 5: Verify the migration
SELECT 'Migration completed successfully!' as status;
```

### Step 3: Click "RUN"
Click the "RUN" button in the SQL Editor

### Step 4: Verify Success
You should see a message: "Migration completed successfully!"

### Step 5: Test Emergency Submission
1. Refresh your application
2. Login as a student
3. Try submitting an emergency complaint
4. It should now work!

## What This Migration Does

1. **Updates Status Constraint**: Adds 'emergency' as a valid status value
2. **Adds Resolution Columns**: 
   - `resolved_by` - Tracks which warden resolved the emergency
   - `resolved_at` - Timestamp of resolution
   - `resolution_notes` - Warden's notes about the resolution
3. **Creates Indexes**: Optimizes emergency complaint queries

## Troubleshooting

### If you still get an error after migration:

1. **Check the browser console** (F12 → Console tab)
   - Look for the actual error message
   - It will show the specific issue

2. **Check Flask server logs**
   - Look at the terminal where Flask is running
   - You'll see the Python error traceback

3. **Common Issues**:
   - **"Missing required fields"**: Make sure you filled in all form fields
   - **"User not found"**: Your user account might not have a hostel assigned
   - **"Failed to create emergency complaint"**: Database insert failed - check Supabase logs

### Check if migration was applied:

Run this query in Supabase SQL Editor:
```sql
-- Check if emergency status is allowed
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'complaints_status_check';

-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'complaints' 
AND column_name IN ('resolved_by', 'resolved_at', 'resolution_notes');
```

## After Migration Works

Once the migration is applied and emergency complaints work:

1. **Test the full workflow**:
   - Submit emergency as student
   - Login as warden
   - Check Emergency tab
   - Resolve the emergency
   - Verify student sees resolution

2. **Check notifications**:
   - Warden should receive notification
   - Validator should receive notification (FYI)

## Need Help?

If you're still having issues:
1. Share the exact error message from browser console
2. Share any error from Flask server logs
3. Confirm if the migration ran successfully
