# Admin Hierarchy System Setup Guide

## Overview

The system now has a 4-tier admin hierarchy:
1. **Validators** - Review and validate incoming complaints
2. **Supervisors** - Assign validated complaints to workers with deadlines
3. **Deans** - Handle escalated complaints
4. **Wardens** - Handle escalated complaints

## Setup Steps

### 1. Run Database Migration

In your Supabase SQL Editor, run the migration:

```sql
-- Copy and paste contents from database_migration_hierarchy.sql
```

### 2. Create Admin Users

You can register users normally, then update their roles in Supabase:

```sql
-- Make a user a validator
UPDATE users SET admin_role = 'validator' WHERE student_id = 'VALIDATOR001';

-- Make a user a supervisor
UPDATE users SET admin_role = 'supervisor' WHERE student_id = 'SUPERVISOR001';

-- Make a user a warden
UPDATE users SET admin_role = 'warden' WHERE student_id = 'WARDEN001';

-- Make a user a dean
UPDATE users SET admin_role = 'dean' WHERE student_id = 'DEAN001';
```

## Workflow

### Step 1: Student Files Complaint
```bash
POST /api/complaints/
{
  "title": "Water leakage",
  "description": "Emergency water leakage in bathroom",
  "category": "Plumbing",
  "location": "Hostel A, Room 101"
}
```
- Status: `pending`
- System automatically detects emergency keywords
- Tracks complaint frequency for similar issues

### Step 2: Validator Reviews
```bash
POST /api/admin/complaints/{id}/validate
{
  "priority": "high"  // optional, system auto-adjusts based on frequency
}
```
- Validator sees all `pending` complaints
- System checks frequency (>3 similar in 7 days = auto high priority)
- Status changes: `pending` → `validated`

### Step 3: Supervisor Assigns
```bash
POST /api/admin/complaints/{id}/assign
{
  "worker_id": 5,
  "deadline_days": 2  // default is 2 days
}
```
- Supervisor sees all `validated` complaints
- Sets deadline for worker
- Status changes: `validated` → `assigned`

### Step 4: Worker Updates
```bash
PATCH /api/worker/tasks/{id}/update
{
  "status": "in_progress"
}
```
- Worker marks as in progress
- Status: `assigned` → `in_progress`

### Step 5: Auto-Escalation (if deadline missed)
```bash
POST /api/admin/complaints/check-escalations
```
- Run this periodically (cron job or scheduler)
- Complaints past deadline automatically escalate to warden
- Status: `in_progress` → `escalated`

### Step 6: Manual Escalation (optional)
```bash
POST /api/admin/complaints/{id}/escalate
{
  "escalate_to": "warden"  // or "dean"
}
```
- Any admin can manually escalate urgent issues

## API Endpoints

### Validator Endpoints
- `GET /api/admin/complaints` - See pending complaints
- `POST /api/admin/complaints/{id}/validate` - Validate complaint
- `GET /api/admin/dashboard` - Validator dashboard stats

### Supervisor Endpoints
- `GET /api/admin/complaints` - See validated complaints
- `POST /api/admin/complaints/{id}/assign` - Assign to worker with deadline
- `GET /api/admin/dashboard` - Supervisor dashboard stats

### Dean/Warden Endpoints
- `GET /api/admin/complaints` - See escalated complaints
- `POST /api/admin/complaints/{id}/verify` - Resolve escalated complaints
- `GET /api/admin/dashboard` - Escalation stats

### Common Endpoints
- `GET /api/admin/complaints/{id}/history` - View complaint history
- `POST /api/admin/complaints/{id}/escalate` - Manual escalation
- `POST /api/admin/complaints/check-escalations` - Check for overdue complaints

## Features

### Automatic Priority Adjustment
- Emergency keywords detected → High priority
- Frequency > 3 similar complaints in 7 days → High priority

### Complaint Tracking
- Full history log of all actions
- Track who validated, assigned, escalated
- Timestamp all actions

### Deadline Management
- Supervisors set deadlines (default 2 days)
- Auto-escalate to warden if missed
- Track overdue complaints

### Role-Based Views
- Each admin role sees only relevant complaints
- Validators: pending
- Supervisors: validated, assigned, in_progress
- Deans/Wardens: escalated

## Testing

1. Restart your Flask server
2. Run the test script:
```bash
python test_hierarchy.py
```

3. Manually test the workflow using Postman or curl

## Database Schema Changes

New columns in `complaints` table:
- `validated_by` - ID of validator
- `validated_at` - Validation timestamp
- `supervisor_id` - ID of supervisor who assigned
- `deadline` - Worker deadline
- `escalated_to` - dean/warden
- `escalated_at` - Escalation timestamp
- `complaint_frequency` - Number of similar complaints

New table:
- `complaint_history` - Full audit log of all actions
