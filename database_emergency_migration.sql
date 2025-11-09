-- Emergency Complaint System Database Migration
-- This migration adds support for emergency complaints that bypass normal validation

-- Add emergency-related columns to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Update status check constraint to include 'emergency' status
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('pending', 'validated', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected', 'escalated', 'emergency'));

-- Create index for emergency complaint queries (optimized for filtering)
CREATE INDEX IF NOT EXISTS idx_complaints_emergency_status 
ON complaints(is_emergency, status) 
WHERE is_emergency = true;

-- Create index for resolved_by lookups
CREATE INDEX IF NOT EXISTS idx_complaints_resolved_by 
ON complaints(resolved_by) 
WHERE resolved_by IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN complaints.is_emergency IS 'Flag indicating if this is an emergency complaint that bypasses normal validation';
COMMENT ON COLUMN complaints.resolved_by IS 'Warden who resolved the emergency complaint';
COMMENT ON COLUMN complaints.resolved_at IS 'Timestamp when emergency complaint was resolved';
COMMENT ON COLUMN complaints.resolution_notes IS 'Notes added by warden when resolving emergency complaint';
