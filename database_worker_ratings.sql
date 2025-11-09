-- Add photo fields to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS progress_photo_url TEXT,
ADD COLUMN IF NOT EXISTS completion_photo_url TEXT,
ADD COLUMN IF NOT EXISTS worker_rating INTEGER CHECK (worker_rating >= 1 AND worker_rating <= 5),
ADD COLUMN IF NOT EXISTS rated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP WITH TIME ZONE;

-- Add rating field to users table for workers
ALTER TABLE users
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0;

-- Create worker_ratings table for detailed rating history
CREATE TABLE IF NOT EXISTS worker_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    complaint_id BIGINT,
    rated_by UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_worker_ratings_worker ON worker_ratings(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_ratings_complaint ON worker_ratings(complaint_id);
CREATE INDEX IF NOT EXISTS idx_users_average_rating ON users(average_rating DESC);

-- Update existing workers to have default ratings
UPDATE users SET average_rating = 0.00, total_ratings = 0, completed_tasks = 0 
WHERE role = 'worker' AND average_rating IS NULL;
