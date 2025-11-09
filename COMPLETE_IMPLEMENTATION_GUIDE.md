# Complete Worker Rating & Photo System Implementation Guide

## 🎯 What's Been Implemented

A complete worker performance tracking system with:
- **Photo uploads** for work progress and completion
- **Student ratings** (1-5 stars) with feedback
- **Worker profiles** showing ratings and performance
- **Admin dashboard** to monitor all workers

## 📋 Setup Steps

### 1. Database Migration (REQUIRED)

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Add photo fields to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS progress_photo_url TEXT,
ADD COLUMN IF NOT EXISTS completion_photo_url TEXT,
ADD COLUMN IF NOT EXISTS worker_rating INTEGER CHECK (worker_rating >= 1 AND worker_rating <= 5),
ADD COLUMN IF NOT EXISTS rated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP WITH TIME ZONE;

-- Add rating fields to users table for workers
ALTER TABLE users
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0;

-- Create worker_ratings table
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

-- Update existing workers
UPDATE users SET average_rating = 0.00, total_ratings = 0, completed_tasks = 0 
WHERE role = 'worker' AND average_rating IS NULL;
```

### 2. Create Storage Bucket (REQUIRED)

1. Go to **Supabase Dashboard → Storage**
2. Click **"New bucket"**
3. Name: `complaint-photos`
4. Set to **Public** (or configure RLS policies)
5. Click **Create bucket**

### 3. Start the Application

```bash
# Backend
python app.py

# Frontend (in another terminal)
cd frontend
npm start
```

## 🔄 Complete Workflow

### Worker Workflow

1. **Login as Worker**
   - Navigate to home page
   - Click "Worker Login"
   - Enter credentials

2. **View Assigned Tasks**
   - See all tasks assigned by supervisor
   - Tasks show: title, description, location, priority

3. **Start Work (Upload Progress Photo)**
   - Click "Upload Progress Photo & Start Work"
   - Take/select photo of the problem
   - Upload → Task status changes to "in_progress"

4. **Complete Work (Upload Completion Photo)**
   - Click "Upload Completion Photo & Mark Complete"
   - Take/select photo of completed work
   - Upload → Task status changes to "completed"
   - Completed tasks count increases

5. **View Profile & Ratings**
   - Click "My Profile & Ratings" tab
   - See:
     - Average rating (stars)
     - Total ratings received
     - Completed tasks count
     - Recent ratings with feedback

### Student Workflow

1. **Login as Student**
   - File complaints as usual

2. **View Resolved Complaints**
   - Click "View Resolved" from menu
   - See all completed complaints

3. **View Work Photos**
   - See "Progress Photo" (before work)
   - See "Completion Photo" (after work)

4. **Rate Worker**
   - Click "Rate Worker ⭐" button
   - Select 1-5 stars
   - Optionally add text feedback
   - Submit rating
   - Can only rate once per task

### Admin Workflow

1. **Login as Admin**
   - Use admin credentials

2. **View Complaints** (existing functionality)
   - Validate, assign, verify complaints

3. **View Worker Performance** (NEW)
   - Click "Worker Performance" tab
   - See all workers with:
     - Average rating (stars)
     - Total ratings
     - Completed tasks
     - In-progress tasks
     - Total assigned tasks

4. **View Worker Details**
   - Click on any worker card
   - See detailed information:
     - Performance statistics
     - Recent ratings with feedback
     - All assigned tasks
     - Photos for each task
     - Individual task ratings

## 📁 Files Modified/Created

### Backend (Python/Flask)
- ✅ `app/routes/worker.py` - Added photo upload endpoints
- ✅ `app/routes/complaints.py` - Added rating endpoint
- ✅ `app/routes/admin.py` - Added performance endpoints

### Frontend (React)
- ✅ `frontend/src/pages/WorkerDashboard.js` - Complete redesign with tabs
- ✅ `frontend/src/pages/WorkerDashboard.css` - New styling
- ✅ `frontend/src/pages/StudentDashboard.js` - Added rating modal
- ✅ `frontend/src/pages/AdminDashboard.js` - Added performance tab
- ✅ `frontend/src/api.js` - Added new API methods
- ✅ `frontend/src/App.css` - Added worker/admin styles

### Database
- ✅ `database_worker_ratings.sql` - Migration script

### Documentation
- ✅ `WORKER_PHOTO_RATING_SETUP.md` - Setup guide
- ✅ `COMPLETE_IMPLEMENTATION_GUIDE.md` - This file
- ✅ `test_worker_rating_api.py` - API testing guide

## 🧪 Testing Checklist

### Database Setup
- [ ] Run SQL migration in Supabase
- [ ] Verify new columns exist in `complaints` table
- [ ] Verify new columns exist in `users` table
- [ ] Verify `worker_ratings` table created
- [ ] Create `complaint-photos` storage bucket

### Worker Features
- [ ] Worker can login
- [ ] Worker sees assigned tasks
- [ ] Worker can upload progress photo
- [ ] Progress photo appears in task
- [ ] Task status changes to "in_progress"
- [ ] Worker can upload completion photo
- [ ] Completion photo appears in task
- [ ] Task status changes to "completed"
- [ ] Worker profile shows correct stats
- [ ] Worker can see their ratings

### Student Features
- [ ] Student can view resolved complaints
- [ ] Student can see progress photos
- [ ] Student can see completion photos
- [ ] Student can click "Rate Worker" button
- [ ] Rating modal opens with stars
- [ ] Student can select 1-5 stars
- [ ] Student can add optional feedback
- [ ] Rating submits successfully
- [ ] "Rate Worker" button disappears after rating
- [ ] Rating displays on complaint

### Admin Features
- [ ] Admin can see "Worker Performance" tab
- [ ] Tab shows all workers
- [ ] Workers display correct statistics
- [ ] Admin can click on worker
- [ ] Worker details page loads
- [ ] Details show all ratings
- [ ] Details show all tasks
- [ ] Photos visible in task details
- [ ] Can navigate back to worker list

## 🔧 API Endpoints

### Worker Endpoints
```
GET    /api/worker/profile
POST   /api/worker/tasks/<id>/upload-progress-photo
POST   /api/worker/tasks/<id>/upload-completion-photo
```

### Student Endpoints
```
POST   /api/complaints/<id>/rate
```

### Admin Endpoints
```
GET    /api/admin/workers/performance
GET    /api/admin/workers/<id>/details
```

## 🎨 UI Features

### Worker Dashboard
- **Two Tabs**: "My Tasks" and "My Profile & Ratings"
- **Photo Upload Modal**: Clean interface for capturing photos
- **Photo Preview**: See photos before uploading
- **Star Display**: Visual rating representation
- **Stats Cards**: Professional performance metrics

### Student Dashboard
- **Photo Viewing**: Embedded images in complaint cards
- **Rating Modal**: Interactive star selection
- **Feedback Input**: Optional text area
- **Rating Display**: Shows existing ratings

### Admin Dashboard
- **Worker Grid**: Card-based layout
- **Performance Metrics**: Clear statistics
- **Detailed View**: Comprehensive worker information
- **Sortable**: Workers sorted by rating

## 🚨 Troubleshooting

### Photos Not Uploading
**Problem**: Error when uploading photos
**Solutions**:
1. Check Supabase storage bucket exists
2. Verify bucket is public or has correct policies
3. Check file size (may need to increase limits)
4. Verify base64 encoding is correct

### Ratings Not Saving
**Problem**: Rating doesn't save or update
**Solutions**:
1. Verify database migration ran successfully
2. Check task status is "completed"
3. Ensure student owns the complaint
4. Check for existing rating (can only rate once)

### Worker Performance Empty
**Problem**: No workers showing in admin dashboard
**Solutions**:
1. Verify workers exist in database
2. Check workers have role = 'worker'
3. Ensure some tasks have been completed
4. Check browser console for errors

### Average Rating Not Updating
**Problem**: Rating submitted but average doesn't change
**Solutions**:
1. Check `worker_ratings` table has entries
2. Verify calculation logic in backend
3. Refresh the page
4. Check database constraints

## 📊 Database Schema

### complaints table (new columns)
- `progress_photo_url` - URL to progress photo
- `completion_photo_url` - URL to completion photo
- `worker_rating` - Integer 1-5
- `rated_by` - UUID of student who rated
- `rated_at` - Timestamp of rating

### users table (new columns)
- `average_rating` - Decimal(3,2) average rating
- `total_ratings` - Integer count of ratings
- `completed_tasks` - Integer count of completed tasks

### worker_ratings table (new)
- `id` - UUID primary key
- `worker_id` - UUID reference to worker
- `complaint_id` - Bigint reference to complaint
- `rated_by` - UUID reference to student
- `rating` - Integer 1-5
- `feedback` - Text feedback
- `created_at` - Timestamp

## 🎯 Success Criteria

✅ Workers can upload photos at each stage
✅ Students can rate workers after completion
✅ Ratings calculate average automatically
✅ Admin can view all worker performance
✅ Photos are stored and displayed correctly
✅ System tracks completed tasks count
✅ UI is intuitive and user-friendly

## 📝 Notes

- Photos are stored in Supabase Storage
- Ratings are immutable (can't change after submission)
- Workers cannot see who rated them
- Only completed tasks can be rated
- Photos are required for workflow progression
- Average rating updates in real-time
- Performance metrics are calculated on-demand

## 🚀 Next Steps (Optional Enhancements)

1. **Photo Compression**: Reduce file sizes before upload
2. **Multiple Photos**: Allow multiple photos per stage
3. **Rating Analytics**: Charts and graphs for trends
4. **Worker Leaderboard**: Top performers display
5. **Notification System**: Alert workers of new ratings
6. **Export Reports**: Download worker performance data
7. **Photo Comparison**: Side-by-side before/after view
8. **Rating Filters**: Filter by date range, rating value
9. **Worker Response**: Allow workers to respond to feedback
10. **Mobile Optimization**: Better mobile photo capture

---

**Implementation Complete!** 🎉

All features are ready to use. Just complete the database setup and storage bucket creation, then test the workflow.
