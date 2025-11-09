# Auto-Escalation System for Unassigned Complaints

## Overview
This system automatically escalates validated complaints that haven't been assigned to a worker within 2 days to the warden for immediate attention.

## Implementation Steps

### 1. Database Setup

Run the SQL migration in Supabase SQL Editor:

```bash
# Apply the migration
Run: database_auto_escalation.sql in Supabase SQL Editor
```

This creates:
- `escalate_overdue_complaints()` function to check and escalate complaints
- Indexes for better query performance
- Views to monitor escalation status

### 2. Backend API

The following endpoint has been added to `app/routes/admin.py`:

**POST /api/admin/complaints/check-unassigned**
- Checks for validated complaints older than 2 days
- Automatically escalates them to warden
- Creates notifications for wardens
- Logs the escalation action

### 3. How It Works

#### Automatic Escalation Flow:
1. Validator validates a complaint → `validated_at` timestamp is set
2. System checks periodically (or manually triggered)
3. If complaint is still in 'validated' status after 2 days → escalate
4. Complaint status changes to 'escalated'
5. `escalated_to` is set to 'warden'
6. `escalated_at` timestamp is recorded
7. Warden receives notification
8. Action is logged in complaint_history

#### Manual Trigger:
Admins can manually trigger the escalation check by calling:
```javascript
await admin.checkUnassignedEscalations();
```

### 4. Testing the System

#### Test Script:
```python
# test_auto_escalation.py
import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:5002/api'

# Login as admin
login_response = requests.post(f'{BASE_URL}/auth/login', json={
    'email': 'supervisor@vnit.ac.in',
    'password': 'password123'
})
token = login_response.json()['token']
headers = {'Authorization': f'Bearer {token}'}

# Trigger escalation check
response = requests.post(
    f'{BASE_URL}/admin/complaints/check-unassigned',
    headers=headers
)

print('Escalation Check Result:')
print(json.dumps(response.json(), indent=2))
```

#### Manual Database Test:
```sql
-- 1. Create a test complaint and validate it with old timestamp
UPDATE complaints
SET 
    status = 'validated',
    validated_at = NOW() - INTERVAL '3 days',
    validated_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE id = 'YOUR_COMPLAINT_ID';

-- 2. Check complaints that should be escalated
SELECT * FROM complaints_pending_escalation;

-- 3. Run the escalation function
SELECT escalate_overdue_complaints();

-- 4. Verify escalation
SELECT 
    id, 
    title, 
    status, 
    validated_at, 
    escalated_at,
    escalated_to
FROM complaints
WHERE status = 'escalated';
```

### 5. Warden Dashboard View

Wardens will see escalated complaints in their dashboard:
- Separate "Escalated Complaints" tab
- Shows complaints not assigned within 2 days
- Displays how long the complaint has been waiting
- Allows warden to manually assign or resolve

### 6. Automated Scheduling (Optional)

For production, you can set up automated checking:

#### Option A: Backend Scheduler (Recommended)
Add to your Flask app:
```python
from apscheduler.schedulers.background import BackgroundScheduler

def check_escalations_job():
    with app.app_context():
        # Call the escalation check
        supabase = get_supabase_client()
        # Run escalation logic
        pass

scheduler = BackgroundScheduler()
scheduler.add_job(
    func=check_escalations_job,
    trigger="interval",
    hours=6  # Check every 6 hours
)
scheduler.start()
```

#### Option B: Supabase pg_cron (If available)
```sql
-- Schedule to run every 6 hours
SELECT cron.schedule(
    'escalate-unassigned-complaints',
    '0 */6 * * *',  -- Every 6 hours
    $$SELECT escalate_overdue_complaints()$$
);
```

#### Option C: External Cron Job
```bash
# Add to crontab
0 */6 * * * curl -X POST http://localhost:5002/api/admin/complaints/check-unassigned \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 7. Monitoring

#### View Escalated Complaints:
```sql
SELECT * FROM escalated_complaints;
```

#### View Pending Escalations:
```sql
SELECT * FROM complaints_pending_escalation;
```

#### Check Escalation History:
```sql
SELECT 
    ch.*,
    c.title,
    c.category
FROM complaint_history ch
JOIN complaints c ON ch.complaint_id = c.id
WHERE ch.action = 'auto_escalated_unassigned'
ORDER BY ch.created_at DESC;
```

### 8. Configuration

You can adjust the escalation timeframe by modifying:

**In SQL function:**
```sql
-- Change from 2 days to X days
validated_at < NOW() - INTERVAL '2 days'
```

**In Python backend:**
```python
# In check_unassigned_complaints()
two_days_ago = (datetime.utcnow() - timedelta(days=2)).isoformat()
# Change days=2 to your preferred value
```

## Benefits

1. **Accountability**: Supervisors are held accountable for timely assignments
2. **Visibility**: Wardens can see bottlenecks in the system
3. **Student Satisfaction**: Complaints don't get stuck in validation limbo
4. **Automatic**: No manual intervention needed once set up
5. **Auditable**: All escalations are logged in complaint_history

## Notifications

When a complaint is escalated:
- Warden receives a notification
- Complaint appears in warden's "Escalated" tab
- Original student is not notified (to avoid confusion)
- Supervisor can still see the complaint but it's marked as escalated

## Next Steps

1. Apply the database migration
2. Test the escalation manually
3. Set up automated scheduling (choose one option above)
4. Monitor the escalated_complaints view
5. Train wardens on handling escalated complaints

## Troubleshooting

**Complaints not escalating?**
- Check if `validated_at` is being set when validator approves
- Verify the complaint status is exactly 'validated'
- Ensure `escalated_at` is NULL

**Too many escalations?**
- Adjust the time threshold (currently 2 days)
- Check if supervisors need more workers
- Review supervisor workload

**Escalations not showing for warden?**
- Verify warden role is set correctly
- Check the admin dashboard filtering logic
- Ensure warden is looking at the correct tab
