# Quick Test Guide - Auto-Escalation (2 Minutes)

## ⚠️ TESTING MODE
The system is now configured to escalate after **2 MINUTES** instead of 2 days for easy testing.

## Quick Test Steps

### 1. Apply Database Migration
```bash
# In Supabase SQL Editor, run:
database_auto_escalation.sql
```

### 2. Create and Validate a Test Complaint

#### Option A: Using the Web Interface
1. Login as a student
2. Create a complaint (any type)
3. Login as validator
4. Validate the complaint
5. **Wait 2 minutes** (or go to Option B)
6. Login as supervisor or warden
7. Trigger escalation check (or wait for auto-check)

#### Option B: Using SQL (Faster)
```sql
-- Create a test complaint that was validated 3 minutes ago
UPDATE complaints
SET 
    status = 'validated',
    validated_at = NOW() - INTERVAL '3 minutes',
    validated_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE id = (SELECT id FROM complaints WHERE status = 'pending' LIMIT 1);
```

### 3. Trigger Escalation Check

#### Option A: Using Test Script
```bash
python test_auto_escalation.py
```

#### Option B: Using API Call
```bash
# Login first to get token
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supervisor@vnit.ac.in","password":"password123"}'

# Use the token to trigger escalation
curl -X POST http://localhost:5002/api/admin/complaints/check-unassigned \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Option C: Using SQL Function
```sql
SELECT escalate_overdue_complaints();
```

### 4. Verify Escalation

#### Check in Database:
```sql
-- See escalated complaints
SELECT 
    id, 
    title, 
    status, 
    validated_at, 
    escalated_at,
    escalated_to,
    EXTRACT(EPOCH FROM (escalated_at - validated_at))/60 as minutes_to_escalate
FROM complaints
WHERE status = 'escalated'
ORDER BY escalated_at DESC;

-- See pending escalations
SELECT * FROM complaints_pending_escalation;
```

#### Check in Web Interface:
1. Login as warden
2. Go to dashboard
3. Look for "Escalated Complaints" tab
4. Should see the escalated complaint

## Expected Results

✅ Complaint status changes from 'validated' to 'escalated'
✅ `escalated_to` is set to 'warden'
✅ `escalated_at` timestamp is recorded
✅ Warden receives notification
✅ Action logged in complaint_history
✅ Complaint visible in warden's dashboard

## Timeline for Testing

```
Time 0:00 - Complaint validated
Time 0:01 - Still in 'validated' status
Time 0:02 - Eligible for escalation
Time 0:02+ - Run escalation check → Escalated!
```

## Troubleshooting

**Complaint not escalating?**
```sql
-- Check if validated_at is set
SELECT id, title, status, validated_at 
FROM complaints 
WHERE status = 'validated';

-- Check if it's old enough (> 2 minutes)
SELECT 
    id, 
    title, 
    validated_at,
    EXTRACT(EPOCH FROM (NOW() - validated_at))/60 as minutes_old
FROM complaints 
WHERE status = 'validated';
```

**Already escalated?**
```sql
-- Check if escalated_at is already set
SELECT id, title, status, escalated_at 
FROM complaints 
WHERE escalated_at IS NOT NULL;
```

## Switching Back to Production (2 Days)

When ready for production, change these values:

### 1. Backend (app/routes/admin.py)
```python
# Change from:
two_minutes_ago = (datetime.utcnow() - timedelta(minutes=2)).isoformat()

# To:
two_days_ago = (datetime.utcnow() - timedelta(days=2)).isoformat()
```

### 2. Database (database_auto_escalation.sql)
```sql
-- Change from:
validated_at < NOW() - INTERVAL '2 minutes'

-- To:
validated_at < NOW() - INTERVAL '2 days'
```

### 3. Update messages
Remove "(TESTING)" from log messages and notifications

## Complete Test Example

```bash
# 1. Start backend
cd /path/to/project
python app.py

# 2. In another terminal, create test complaint
python test_auto_escalation.py create

# 3. Login as validator and validate the complaint
# (Use web interface or API)

# 4. Wait 2 minutes (or manually update database)

# 5. Run escalation check
python test_auto_escalation.py

# 6. Check results
# Should see: "Escalated X complaints to warden"
```

## Monitoring During Test

```sql
-- Watch complaints in real-time
SELECT 
    id,
    title,
    status,
    validated_at,
    EXTRACT(EPOCH FROM (NOW() - validated_at))/60 as minutes_since_validation,
    escalated_at
FROM complaints
WHERE status IN ('validated', 'escalated')
ORDER BY validated_at DESC;
```

Run this query before and after triggering escalation to see the changes!
