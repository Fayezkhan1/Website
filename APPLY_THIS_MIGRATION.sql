-- EMERGENCY SYSTEM DATABASE MIGRATION
-- Copy and paste this entire file into Supabase SQL Editor and click RUN

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
