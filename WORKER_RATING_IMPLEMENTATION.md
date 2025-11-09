# Worker Rating & Photo Upload System

## Overview
Workers upload photos at different stages, and students rate workers after completion.

## Database Setup

Run `database_worker_ratings.sql` in Supabase SQL Editor to add:
- Photo URL fields (progress_photo_url, completion_photo_url)
- Rating fields (worker_rating, rated_by, rated_at)
- Worker stats (average_rating, total_ratings, completed_tasks)
- worker_ratings table for rating history

## Features to Implement

### 1. Worker Dashboard Updates
- **Start Work button** → Upload progress photo + mark as in_progress
- **Complete Work button** → Upload completion photo + mark as completed
- **Photo preview** in task cards

### 2. Student Dashboard Updates  
- **After work completed** → Show rating modal
- **5-star rating system** → Student rates worker
- **One-time rating** → Can't rate same task twice

### 3. Admin Dashboard Updates
- **Worker Performance Tab** → View all workers with ratings
- **Sort by rating** → Best workers first
- **View photos** → See progress and completion photos
- **Rating history** → See all ratings for each worker

### 4. Worker Profile
- **Display average rating** → Show stars (e.g., ⭐⭐⭐⭐☆ 4.2/5.0)
- **Total completed tasks**
- **Total ratings received**

## Implementation Priority

Due to complexity, implement in this order:
1. ✅ Database schema (run SQL migration)
2. Backend routes for photo upload
3. Worker dashboard photo upload UI
4. Student rating UI
5. Admin worker performance view
6. Worker profile with ratings

## Photo Storage

For now, use:
- Base64 encoded images (simple but limited)
- Or Supabase Storage (recommended for production)

## Next Steps

Would you like me to:
1. Implement the complete system now?
2. Or implement it in phases (photos first, then ratings)?

This is a significant feature that will take multiple files to implement properly.
