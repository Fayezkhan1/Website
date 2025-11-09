-- Migration: Add Admin Hierarchy System

-- First, check what type the users.id column is
-- If it's UUID, we need to use UUID for foreign keys
-- If it's BIGINT, we use BIGINT

-- Update users table to support admin roles
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role VARCHAR(20) CHECK (admin_role IN ('validator', 'supervisor', 'dean', 'warden'));

-- Update complaints table for hierarchy workflow
-- Using the same type as users.id (check your users table first)
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS escalated_to VARCHAR(20);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS complaint_frequency INT DEFAULT 1;

-- Update status to include new workflow states
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
    CHECK (status IN ('pending', 'validated', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected', 'escalated'));

-- Create complaint history table for tracking escalations
CREATE TABLE IF NOT EXISTS complaint_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_validated_by ON complaints(validated_by);
CREATE INDEX IF NOT EXISTS idx_complaints_supervisor_id ON complaints(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_complaints_deadline ON complaints(deadline);
CREATE INDEX IF NOT EXISTS idx_complaints_escalated_to ON complaints(escalated_to);
CREATE INDEX IF NOT EXISTS idx_complaint_history_complaint_id ON complaint_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_users_admin_role ON users(admin_role);
