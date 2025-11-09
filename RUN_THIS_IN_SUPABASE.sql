-- ============================================
-- EMERGENCY COMPLAINT SYSTEM - DATABASE MIGRATION
-- ============================================
-- Instructions:
-- 1. Open Supabase SQL Editor
-- 2. Copy this entire file
-- 3. Paste into SQL Editor
-- 4. Click RUN
-- ============================================

-- Drop old status constraint
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

-- Add new status constraint with 'emergency'
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('pending', 'validated', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected', 'escalated', 'emergency'));

-- Add emergency resolution columns
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_emergency_status 
ON complaints(is_emergency, status) 
WHERE is_emergency = true;

CREATE INDEX IF NOT EXISTS idx_complaints_resolved_by 
ON complaints(resolved_by) 
WHERE resolved_by IS NOT NULL;

-- Verify
SELECT 'Migration completed successfully!' as status;
