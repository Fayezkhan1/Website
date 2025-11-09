# Auto-Escalation System - Quick Summary

## What Was Implemented

An automatic escalation system that notifies wardens when validated complaints aren't assigned to workers within 2 days.

## Files Created/Modified

### New Files:
1. **database_auto_escalation.sql** - Database migration with escalation logic
2. **AUTO_ESCALATION_GUIDE.md** - Complete implementation guide
3. **test_auto_escalation.py** - Test script for the system
4. **ESCALATION_SUMMARY.md** - This file

### Modified Files:
1. **app/routes/admin.py** - Added escalation endpoints and logic
2. **frontend/src/api.js** - Added API client method

## How It Works

```
Complaint Created → Validated by Validator → 2 Days Pass → Auto-Escalate to Warden
                                          ↓
                                    Assigned by Supervisor
                                    (Normal flow - no escalation)
```

### Timeline:
- **Day 0**: Validator validates complaint, sets `validated_at` timestamp
- **Day 1**: Supervisor should assign to worker
- **Day 2**: Still not assigned? System escalates to warden
- **Warden**: Can now see and handle the complaint directly

## Quick Setup

### 1. Apply Database Migration
```bash
# In Supabase SQL Editor, run:
database_auto_escalation.sql
```

### 2. Test the System
```bash
# Run the test script
python test_auto_escalation.py
```

### 3. Trigger Escalation Check (Manual)
```bash
# Call the API endpoint
curl -X POST http://localhost:5002/api/admin/complaints/check-unassigned \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## API Endpoint

**POST /api/admin/complaints/check-unassigned**

Response:
```json
{
  "message": "Escalated 3 unassigned complaints to warden",
  "count": 3,
  "complaints": [
    {
      "id": "complaint-uuid",
      "title": "Fan not working",
      "validated_at": "2024-01-01T10:00:00"
    }
  ]
}
```

## Database Views

### Check Pending Escalations:
```sql
SELECT * FROM complaints_pending_escalation;
```

### View All Escalated:
```sql
SELECT * FROM escalated_complaints;
```

## For Production

Set up automated checking (choose one):

### Option 1: Python Scheduler (Recommended)
```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(
    func=check_escalations_job,
    trigger="interval",
    hours=6  # Every 6 hours
)
scheduler.start()
```

### Option 2: Cron Job
```bash
# Add to crontab - check every 6 hours
0 */6 * * * curl -X POST http://localhost:5002/api/admin/complaints/check-unassigned \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Benefits

✅ **Accountability** - Supervisors must assign within 2 days
✅ **Visibility** - Wardens see bottlenecks immediately  
✅ **Automatic** - No manual intervention needed
✅ **Auditable** - All escalations logged in complaint_history
✅ **Student-Focused** - Complaints don't get stuck

## Testing Checklist

- [ ] Apply database migration
- [ ] Create test complaint
- [ ] Validate complaint (as validator)
- [ ] Manually set validated_at to 3 days ago
- [ ] Run escalation check
- [ ] Verify complaint status changed to 'escalated'
- [ ] Login as warden and verify visibility
- [ ] Check complaint_history for escalation log

## Configuration

Change escalation timeframe in:

**Backend (admin.py):**
```python
two_days_ago = (datetime.utcnow() - timedelta(days=2))
# Change days=2 to your preference
```

**Database (SQL):**
```sql
validated_at < NOW() - INTERVAL '2 days'
-- Change '2 days' to your preference
```

## Monitoring

```sql
-- See how many complaints are close to escalation
SELECT 
    COUNT(*) as pending_escalation,
    AVG(EXTRACT(EPOCH FROM (NOW() - validated_at))/3600) as avg_hours_waiting
FROM complaints
WHERE status = 'validated'
  AND validated_at < NOW() - INTERVAL '1 day';
```

## Next Steps

1. Apply the database migration
2. Test manually with test script
3. Set up automated scheduling
4. Train wardens on handling escalated complaints
5. Monitor the system for the first week
6. Adjust timeframe if needed (currently 2 days)
