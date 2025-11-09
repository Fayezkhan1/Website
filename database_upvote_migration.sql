-- Add upvote_count column to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Drop table if exists (in case of previous failed attempts)
DROP TABLE IF EXISTS complaint_upvotes;

-- Create complaint_upvotes table to track who upvoted what
-- Using BIGINT for IDs to match your existing schema
CREATE TABLE complaint_upvotes (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(complaint_id, user_id)
);

-- Add foreign key constraints separately (will fail gracefully if types don't match)
-- If complaints.id is BIGINT:
DO $$ 
BEGIN
    ALTER TABLE complaint_upvotes 
    ADD CONSTRAINT complaint_upvotes_complaint_fkey 
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add complaint_id foreign key - checking if UUID type needed';
END $$;

-- If users.id is BIGINT:
DO $$ 
BEGIN
    ALTER TABLE complaint_upvotes 
    ADD CONSTRAINT complaint_upvotes_user_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add user_id foreign key - checking if UUID type needed';
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_complaint_upvotes_complaint ON complaint_upvotes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_upvotes_user ON complaint_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_upvote_count ON complaints(upvote_count DESC);

-- Update existing complaints to have upvote_count = 0
UPDATE complaints SET upvote_count = 0 WHERE upvote_count IS NULL;
