# Hostel-Based Upvote System

## Features Implemented

### 1. **Hostel-Wide Complaint Viewing**
- Students see complaints from their hostel only
- Automatic search when opening complaint form
- Shows pending/in-progress complaints
- Sorted by upvote count (most popular first)

### 2. **Default Upvote Count = 1**
- Every new complaint starts with 1 upvote (the filer)
- Never goes below 1
- Shows community support level

### 3. **Upvote/Remove Upvote**
- Students can upvote similar complaints
- Can remove their upvote if they change their mind
- Real-time count updates
- Visible to admins immediately

## How It Works

### For Students:

#### Filing a Complaint:
```
1. Open complaint form
2. Hostel automatically shown: "Hostel 1"
3. System shows existing complaints from Hostel 1:
   
   🔍 Existing Issues in Hostel 1 (3)
   
   ┌─────────────────────────────────────┐
   │ Light not working                   │
   │ Status: in_progress | 👥 5 people   │
   │                    [👍 Me too!]     │
   ├─────────────────────────────────────┤
   │ Fan issue                           │
   │ Status: pending | 👥 3 people       │
   │                    [👍 Me too!]     │
   ├─────────────────────────────────────┤
   │ Water problem                       │
   │ Status: pending | 👥 1 person       │
   │                    [👍 Me too!]     │
   └─────────────────────────────────────┘
```

#### Upvoting:
```
1. See similar complaint
2. Click "👍 Me too!"
3. Count increases: 3 → 4 people
4. Button changes to "✓ Voted - Remove"
5. Can click again to remove vote
```

#### Removing Upvote:
```
1. See complaint you upvoted
2. Button shows: "✓ Voted - Remove" (red)
3. Click to remove your vote
4. Count decreases: 4 → 3 people
5. Button changes back to "👍 Me too!"
```

### For Admins/Supervisors:

#### Viewing Complaints:
```
Complaint Card:
┌─────────────────────────────────────┐
│ Room - ELECTRICAL - Light Issues    │
│ Status: pending | Priority: medium  │
│ Location: Hostel 1 - Room 101       │
│ 👥 5 people reported this ← Upvotes │
└─────────────────────────────────────┘
```

#### Priority Indicators:
- **5+ upvotes**: Red border, high priority
- **3-4 upvotes**: Orange border, medium-high
- **1-2 upvotes**: Normal border

## Technical Implementation

### Backend Changes:

#### 1. Search by Hostel (complaints.py)
```python
# Old: Exact location match
complaints = supabase.table('complaints').eq('location', location)

# New: Hostel-wide search
complaints = supabase.table('complaints').ilike('location', f'{hostel}%')
```

#### 2. Default Upvote Count
```python
complaint_data = {
    ...
    'upvote_count': 1,  # Start with 1 (the filer)
    ...
}
```

#### 3. Remove Upvote Endpoint
```python
@bp.route('/<complaint_id>/remove-upvote', methods=['POST'])
def remove_upvote(complaint_id):
    # Remove from complaint_upvotes table
    # Decrement count (but keep at least 1)
    new_count = max(current_count - 1, 1)
```

### Frontend Changes:

#### 1. API Methods (api.js)
```javascript
upvote: (id) => api.post(`/complaints/${id}/upvote`),
removeUpvote: (id) => api.post(`/complaints/${id}/remove-upvote`),
```

#### 2. Conditional Button (StudentDashboard.js)
```javascript
{complaint.user_upvoted ? (
  <button onClick={() => handleRemoveUpvote(complaint.id)}>
    ✓ Voted - Remove
  </button>
) : (
  <button onClick={() => handleUpvote(complaint.id)}>
    👍 Me too!
  </button>
)}
```

## Benefits

### For Students:
- ✅ **See relevant issues** - Only from their hostel
- ✅ **Avoid duplicates** - Upvote instead of filing new
- ✅ **Show support** - Upvote to increase priority
- ✅ **Change mind** - Remove upvote if resolved
- ✅ **Community voice** - See how many others affected

### For Admins:
- ✅ **Priority indication** - High upvotes = urgent
- ✅ **Resource allocation** - Focus on popular issues
- ✅ **Hostel insights** - See which hostels have most issues
- ✅ **Duplicate reduction** - Fewer redundant complaints
- ✅ **Real impact** - Know how many students affected

### For System:
- ✅ **Better data** - Consolidated complaints
- ✅ **Accurate counts** - Real-time upvote tracking
- ✅ **Hostel grouping** - Easy filtering and analytics
- ✅ **User engagement** - Students participate more

## Example Scenarios

### Scenario 1: Popular Issue
```
Day 1:
- Student A files: "Light not working in corridor"
- Count: 1 person

Day 2:
- Student B sees it, clicks "Me too!"
- Count: 2 people

Day 3:
- Students C, D, E upvote
- Count: 5 people
- Admin sees: High priority (5+ upvotes)
- Gets assigned immediately
```

### Scenario 2: Resolved Issue
```
Day 1:
- Student A files: "Water cooler broken"
- Students B, C upvote
- Count: 3 people

Day 2:
- Worker fixes it
- Student A sees it's fixed
- Removes upvote
- Count: 2 people

Day 3:
- Students B, C also remove upvotes
- Count: 1 person (original filer)
- Shows issue had temporary support
```

### Scenario 3: Hostel-Specific
```
Hostel 1:
- "AC not working" - 8 upvotes
- "Lights flickering" - 5 upvotes
- "Door lock issue" - 2 upvotes

Hostel 2:
- "Water pressure low" - 6 upvotes
- "Wifi slow" - 4 upvotes

Each hostel sees only their issues
Admins can filter by hostel
```

## UI Display

### Complaint Form:
```
┌─────────────────────────────────────────────┐
│ File New Complaint                          │
├─────────────────────────────────────────────┤
│ Hostel (Reference Location)                 │
│ [Hostel 1] 🔒                               │
├─────────────────────────────────────────────┤
│ 🔍 Existing Issues in Hostel 1 (3)         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Light not working                       │ │
│ │ Status: in_progress | 👥 5 people       │ │
│ │                    [✓ Voted - Remove]   │ │ ← Already voted
│ ├─────────────────────────────────────────┤ │
│ │ Fan issue                               │ │
│ │ Status: pending | 👥 3 people           │ │
│ │                    [👍 Me too!]         │ │ ← Can vote
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Admin View:
```
┌─────────────────────────────────────────────┐
│ Room - ELECTRICAL - Light Issues            │
│ ┌─────────────────────────────────────────┐ │
│ │ 👥 5 people reported this               │ │ ← High priority
│ └─────────────────────────────────────────┘ │
│ Status: pending | Priority: medium          │
│ Location: Hostel 1 - Room 101               │
│ Filed: 2024-01-15 10:30 AM                  │
│                                             │
│ [Validate] [Assign to Worker]               │
└─────────────────────────────────────────────┘
```

## Data Flow

### Upvote Flow:
```
1. Student clicks "Me too!"
   ↓
2. POST /api/complaints/{id}/upvote
   ↓
3. Insert into complaint_upvotes table
   ↓
4. Increment upvote_count in complaints table
   ↓
5. Return new count
   ↓
6. UI updates: "👍 Me too!" → "✓ Voted - Remove"
   ↓
7. Count updates: "3 people" → "4 people"
```

### Remove Upvote Flow:
```
1. Student clicks "✓ Voted - Remove"
   ↓
2. POST /api/complaints/{id}/remove-upvote
   ↓
3. Delete from complaint_upvotes table
   ↓
4. Decrement upvote_count (min 1)
   ↓
5. Return new count
   ↓
6. UI updates: "✓ Voted - Remove" → "👍 Me too!"
   ↓
7. Count updates: "4 people" → "3 people"
```

## Database Schema

### complaint_upvotes table:
```sql
CREATE TABLE complaint_upvotes (
    id UUID PRIMARY KEY,
    complaint_id BIGINT REFERENCES complaints(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP
);
```

### complaints table (upvote_count):
```sql
ALTER TABLE complaints 
ADD COLUMN upvote_count INTEGER DEFAULT 1;
```

## Edge Cases Handled

### 1. Minimum Count = 1
- Upvote count never goes below 1
- Original filer always counts
- Even if all upvotes removed

### 2. Duplicate Upvote Prevention
- User can only upvote once
- Trying again shows error
- Must remove first to vote again

### 3. Hostel Filtering
- Only shows complaints from same hostel
- Uses ILIKE for flexible matching
- "Hostel 1 - Room 101" matches "Hostel 1"

### 4. Real-time Updates
- Upvote/remove immediately reflects
- Reloads similar complaints list
- Shows updated counts

## Future Enhancements (Optional)

- Show who upvoted (for admins)
- Upvote notifications to filer
- Trending complaints dashboard
- Upvote history per user
- Auto-escalate at threshold (e.g., 10 upvotes)
- Upvote analytics by hostel
- Time-based trending (most upvoted this week)
- Upvote leaderboard

---

**Implementation Complete!** ✅

Students can now see hostel-wide complaints, upvote similar issues, and remove their upvotes. All complaints start with 1 upvote and admins see the updated counts in real-time.
