-- Add escalation tracking columns to complaints table
-- Run this in Supabase SQL Editor

-- Add validated_at column if it doesn't exist
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;

-- Add validated_by column if it doesn't exist (to track who validated)
-- Using BIGINT to match the users.id type
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS validated_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Add escalated_at column for tracking when complaint was escalated
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;

-- Add escalated_to column for tracking who it was escalated to (warden/dean)
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS escalated_to VARCHAR(20);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_validated_at ON complaints(validated_at);
CREATE INDEX IF NOT EXISTS idx_complaints_escalated_at ON complaints(escalated_at);
CREATE INDEX IF NOT EXISTS idx_complaints_escalated_to ON complaints(escalated_to);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'complaints' 
AND column_name IN ('validated_at', 'validated_by', 'escalated_at', 'escalated_to');
