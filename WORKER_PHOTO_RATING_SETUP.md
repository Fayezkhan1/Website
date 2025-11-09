# Worker Photo Upload & Rating System - Setup Guide

## Overview
Complete implementation of worker photo uploads, student ratings, and admin performance dashboard.

## Database Migration Required

### Step 1: Run SQL Migration in Supabase
Go to your Supabase Dashboard → SQL Editor and run the following SQL:

```sql
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
```

### Step 2: Create Supabase Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named: `complaint-photos`
3. Set it to **Public** (or configure appropriate policies)
4. Enable file uploads for authenticated users

## Features Implemented

### 1. Worker Dashboard
- **Profile Tab**: Shows worker's average rating, total ratings, and completed tasks
- **Tasks Tab**: Lists all assigned tasks
- **Progress Photo Upload**: When starting work, worker must upload a photo of the problem
- **Completion Photo Upload**: Before marking complete, worker must upload a photo of completed work
- **Photo Preview**: Workers can see both progress and completion photos

### 2. Student Dashboard
- **View Completed Tasks**: Students can see all resolved complaints
- **Photo Viewing**: Students can view progress and completion photos
- **Rate Worker**: After task completion, students can rate workers (1-5 stars)
- **Feedback**: Optional text feedback with rating
- **Rating Display**: Shows if already rated

### 3. Admin Dashboard
- **Worker Performance Tab**: New tab to view all workers
- **Performance Metrics**: 
  - Average rating with star display
  - Total ratings received
  - Completed tasks count
  - In-progress tasks count
  - Total assigned tasks
- **Worker Details**: Click on any worker to see:
  - Detailed statistics
  - Recent ratings with feedback
  - All assigned tasks with their ratings
  - Progress and completion photos

## API Endpoints Added

### Worker Routes (`/api/worker/`)
- `POST /tasks/<id>/upload-progress-photo` - Upload progress photo
- `POST /tasks/<id>/upload-completion-photo` - Upload completion photo
- `GET /profile` - Get worker profile with ratings

### Complaint Routes (`/api/complaints/`)
- `POST /<id>/rate` - Rate a worker (students only)

### Admin Routes (`/api/admin/`)
- `GET /workers/performance` - Get all workers with performance metrics
- `GET /workers/<id>/details` - Get detailed worker information

## Workflow

### Worker Workflow:
1. Worker receives assigned task
2. Worker clicks "Upload Progress Photo & Start Work"
3. Takes photo of the problem/issue
4. Uploads photo → Task status changes to "in_progress"
5. Worker completes the work
6. Worker clicks "Upload Completion Photo & Mark Complete"
7. Takes photo of completed work
8. Uploads photo → Task status changes to "completed"
9. Worker's completed_tasks count increases

### Student Workflow:
1. Student views resolved complaints
2. Sees progress and completion photos
3. If not rated yet, sees "Rate Worker ⭐" button
4. Clicks button, selects 1-5 stars
5. Optionally adds text feedback
6. Submits rating
7. Worker's average rating updates automatically

### Admin Workflow:
1. Admin clicks "Worker Performance" tab
2. Sees all workers sorted by rating
3. Clicks on any worker to view details
4. Reviews:
   - Performance statistics
   - Recent ratings and feedback
   - All tasks with photos
5. Can identify top performers and issues

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Storage bucket created and configured
- [ ] Worker can upload progress photo
- [ ] Worker can upload completion photo
- [ ] Photos are visible in task details
- [ ] Student can rate completed tasks
- [ ] Rating updates worker's average
- [ ] Admin can view worker performance
- [ ] Admin can see worker details
- [ ] Photos display correctly in all views

## Notes

- Photos are stored in Supabase Storage
- Ratings are 1-5 stars (integer)
- Average rating is calculated automatically
- Workers cannot see who rated them
- Students can only rate once per task
- Only completed tasks can be rated
- Photos are required for workflow progression

## Troubleshooting

### Photos not uploading:
- Check Supabase Storage bucket exists
- Verify bucket is public or has correct policies
- Check file size limits

### Ratings not working:
- Verify database migration ran successfully
- Check that task is marked as "completed"
- Ensure student is the complaint owner

### Performance dashboard empty:
- Verify workers exist in database
- Check that some tasks have been completed
- Ensure ratings have been submitted
