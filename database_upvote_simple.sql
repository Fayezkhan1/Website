-- Simple upvote migration without foreign key constraints
-- This will work regardless of ID types

-- Add upvote_count column to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Drop table if exists
DROP TABLE IF EXISTS complaint_upvotes;

-- Create complaint_upvotes table WITHOUT foreign keys
-- We'll handle referential integrity in the application code
CREATE TABLE complaint_upvotes (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(complaint_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_complaint_upvotes_complaint ON complaint_upvotes(complaint_id);
CREATE INDEX idx_complaint_upvotes_user ON complaint_upvotes(user_id);
CREATE INDEX idx_complaints_upvote_count ON complaints(upvote_count DESC);

-- Update existing complaints to have upvote_count = 0
UPDATE complaints SET upvote_count = 0 WHERE upvote_count IS NULL;

-- Done! The table is ready to use.
-- Note: Without foreign keys, you need to ensure data integrity in your application code.
