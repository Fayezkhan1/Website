# Frontend Architecture - Detailed Summary

## Technology Stack

### Core Technologies
- **React.js** (v18+) - UI library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Custom styling (no framework)
- **LocalStorage** - Client-side data persistence

### Build Tools
- **Create React App** - Project scaffolding
- **Webpack** - Module bundler (via CRA)
- **Babel** - JavaScript transpiler (via CRA)

---

## Project Structure

```
frontend/
├── public/
│   ├── index.html              # HTML template
│   ├── HOSTEL_IMAGES_GUIDE.md  # Image assets guide
│   └── LOGO_INSTRUCTIONS.md    # Logo setup guide
├── src/
│   ├── pages/
│   │   ├── Home.js             # Landing page
│   │   ├── Login.js            # Login page
│   │   ├── Register.js         # Registration page
│   │   ├── StudentDashboard.js # Student interface
│   │   ├── AdminDashboard.js   # Admin interface
│   │   ├── WorkerDashboard.js  # Worker interface
│   │   └── Profile.js          # User profile
│   ├── api.js                  # API client configuration
│   ├── App.js                  # Main app component & routing
│   ├── App.css                 # Global styles
│   └── index.js                # React entry point
└── package.json                # Dependencies
```

---

## Page Components

### 1. Home.js - Landing Page
**Purpose**: Welcome page with navigation to login/register

**Features:**
- Hero section with system description
- Login and Register buttons
- Responsive design
- Gradient background

**State**: None (stateless)

**Navigation**: 
- `/login` - Login page
- `/register` - Registration page

---

### 2. Login.js - Authentication
**Purpose**: User login interface

**Features:**
- Email and password input
- Form validation
- JWT token storage
- Role-based redirection

**State:**
```javascript
- email: string
- password: string
```

**API Calls:**
- `POST /api/auth/login`

**Flow:**
1. User enters credentials
2. Submit to backend
3. Receive JWT token
4. Store token in localStorage
5. Store user data in localStorage
6. Redirect based on role:
   - resident → /student-dashboard
   - admin → /admin-dashboard
   - worker → /worker-dashboard

---

### 3. Register.js - User Registration
**Purpose**: New user account creation

**Features:**
- Multi-field form (name, email, student_id, password, hostel, room)
- Role selection
- Input validation
- Auto-redirect to login

**State:**
```javascript
- name: string
- email: string
- student_id: string
- password: string
- hostel: string
- room_number: string
- role: string (resident/admin/worker)
```

**API Calls:**
- `POST /api/auth/register`

---

### 4. StudentDashboard.js - Student Interface
**Purpose**: Main interface for students to manage complaints

#### Features

**A. Complaint Submission**
- Structured complaint form with hierarchical selection
- Area selection (Room / Common Area)
- Problem type/location selection
- Specific issue selection
- Description textarea
- Emergency toggle with warning
- Auto-location from hostel + room number

**B. Complaint Tracking**
- Visual 4-stage progress bar
- Pending complaints view
- Resolved complaints view
- Recent complaints summary

**C. Upvote System**
- View similar complaints at same location
- "Me too!" button to upvote
- Remove upvote functionality
- Upvote count display

**D. Worker Rating**
- 5-star rating system
- Optional feedback text
- Rating modal
- View submitted ratings

**E. Photo Viewing**
- Progress photos from workers
- Completion photos
- Click to enlarge

#### State Management
```javascript
- complaintsList: array          // All user's complaints
- activeView: string             // menu, file, pending, resolved
- showModal: boolean             // Complaint form modal
- formData: object               // Form fields
- isEmergency: boolean           // Emergency flag
- locationComplaints: array      // Similar complaints
- showExistingComplaints: bool   // Show upvote section
- ratingModal: number            // Complaint ID for rating
- rating: number                 // Star rating (1-5)
- feedback: string               // Rating feedback
```

#### Key Functions
```javascript
- loadComplaints()              // Fetch user's complaints
- handleSubmit()                // Submit new complaint
- handleUpvote()                // Upvote similar complaint
- handleRemoveUpvote()          // Remove upvote
- handleRateWorker()            // Submit worker rating
- handleLocationChange()        // Fetch similar complaints
- renderProgressBar()           // Render tracking bar
- renderStars()                 // Render star rating
```

#### Complaint Structure
```javascript
complaintStructure = {
  'Room': {
    'ELECTRICAL': ['Light Issues', 'Fan Issue', 'Switches Issue', 'Others'],
    'MAINTENANCE': ['Wall Related', 'Network Issue', 'Cupboards', ...],
    'NETWORK': ['LAN Port', 'Internet Connection', 'Others'],
    'OTHERS': []
  },
  'Common Area': {
    'Ground': ['Cleaning Issue', 'Water Stoppage', 'Others'],
    'TV-Hall': ['Equipment Missing/Damaged', 'Chairs Issue', ...],
    'Games Area': [...],
    'Left-Wing': { 'Corridor': [...], 'Washroom': [...] },
    'Right-Wing': { 'Corridor': [...], 'Washroom': [...] },
    'Extension': { 'Corridor': [...], 'Washroom': [...] }
  }
}
```

---

### 5. AdminDashboard.js - Admin Interface
**Purpose**: Multi-role admin interface for complaint management

#### Admin Roles
1. **Validator** - Validates pending complaints
2. **Supervisor** - Assigns complaints to workers
3. **Warden** - Handles escalations and emergencies
4. **Dean** - Handles escalations

#### Features by Role

**Validator:**
- View pending complaints
- Validate with priority (medium/high)
- View emergency complaints
- Statistics: Pending validation count

**Supervisor:**
- View validated complaints (pending assignment)
- Assign complaints to workers
- Set deadline (days)
- Monitor in-progress tasks
- View worker workload
- Quick assign interface
- Statistics: Pending assignment, In progress

**Warden/Dean:**
- View escalated complaints
- Resolve emergency complaints
- Statistics: Escalated count

**All Admins:**
- Emergency tab (view and resolve)
- Worker performance dashboard
- Complaint history

#### State Management
```javascript
- complaintsList: array          // All complaints
- stats: object                  // Dashboard statistics
- adminRole: string              // validator/supervisor/warden/dean
- selectedComplaint: object      // Complaint being acted on
- workers: array                 // Available workers
- assignData: object             // Assignment form data
- activeTab: string              // complaints/emergency/workers
- complaintsView: string         // all/pending/in_progress/completed
- workerPerformance: array       // Worker stats
- selectedWorker: object         // Worker details view
- supervisorView: string         // overview/workers/assignments/progress
- emergencyComplaints: array     // Emergency complaints
- showEmergencyModal: boolean    // Resolution modal
- selectedEmergency: object      // Emergency being resolved
- resolutionNotes: string        // Resolution notes
```

#### Key Functions
```javascript
- loadData()                    // Fetch complaints
- loadWorkers()                 // Fetch worker list
- loadWorkerPerformance()       // Fetch worker stats
- loadEmergencyComplaints()     // Fetch emergencies
- handleValidate()              // Validate complaint
- handleAssign()                // Assign to worker
- handleResolveEmergency()      // Resolve emergency
- getUnassignedComplaints()     // Filter validated, unassigned
- getAssignedComplaints()       // Filter assigned complaints
- getWorkerWorkload()           // Calculate worker stats
```

#### Tabs & Views

**Main Tabs:**
1. 🚨 Emergency - Emergency complaints (all admins)
2. Complaints - Regular complaints (role-filtered)
3. Worker Performance - Worker stats and ratings

**Supervisor Sub-Views:**
1. 📋 Overview - General complaints view
2. 👷 Worker Workload - Worker capacity monitoring
3. ⚡ Quick Assign - Fast assignment interface
4. 🔄 In Progress - Assigned tasks monitoring

**Complaints View Filters:**
- All
- Pending
- In Progress
- Completed

---

### 6. WorkerDashboard.js - Worker Interface
**Purpose**: Task management for maintenance workers

#### Features

**A. Task Management**
- View assigned tasks
- Update task status
- Upload progress photos
- Upload completion photos
- Add completion notes

**B. Performance Tracking**
- View average rating
- View total ratings
- See recent feedback
- Task completion count

**C. Photo Upload**
- Camera/file upload
- Base64 encoding
- Preview before upload
- Supabase storage integration

#### State Management
```javascript
- tasks: array                  // Assigned tasks
- profile: object               // Worker profile data
- selectedTask: object          // Task being updated
- progressPhoto: string         // Base64 progress photo
- completionPhoto: string       // Base64 completion photo
- completionNotes: string       // Completion notes
- showUploadModal: boolean      // Photo upload modal
```

#### Key Functions
```javascript
- loadTasks()                   // Fetch assigned tasks
- loadProfile()                 // Fetch worker profile
- handlePhotoUpload()           // Handle photo selection
- handleUploadProgress()        // Upload progress photo
- handleUploadCompletion()      // Upload completion photo
- handleComplete()              // Mark task complete
```

---

### 7. Profile.js - User Profile
**Purpose**: View and manage user profile

**Features:**
- Display user information
- Show role and hostel
- View statistics (for workers)
- Logout functionality

**State:**
```javascript
- user: object                  // User data from localStorage
```

---

## API Client (api.js)

### Configuration
```javascript
const API_URL = 'http://localhost:5002/api';

// Axios instance with interceptors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Modules

#### auth
```javascript
- register(data)                // User registration
- login(data)                   // User login
```

#### complaints
```javascript
- create(data)                  // Create complaint
- createEmergency(data)         // Create emergency
- getAll()                      // Get user's complaints
- getOne(id)                    // Get single complaint
- updateStatus(id, status)      // Update status
- getByLocation(data)           // Get similar complaints
- upvote(id)                    // Upvote complaint
- removeUpvote(id)              // Remove upvote
- rateWorker(id, rating, feedback) // Rate worker
```

#### admin
```javascript
- getAllComplaints(params)      // Get all complaints
- getEmergencyComplaints(params)// Get emergencies
- resolveEmergency(id, data)    // Resolve emergency
- validate(id, data)            // Validate complaint
- assign(id, data)              // Assign to worker
- verify(id, data)              // Verify completion
- getWorkers()                  // Get worker list
- getStats()                    // Get statistics
- getDashboard()                // Get dashboard data
- getWorkerPerformance()        // Get worker metrics
- getWorkerDetails(id)          // Get worker details
```

#### worker
```javascript
- getTasks()                    // Get assigned tasks
- updateTask(id, data)          // Update task
- completeTask(id, data)        // Complete task
- uploadProgressPhoto(id, photo)// Upload progress photo
- uploadCompletionPhoto(id, photo)// Upload completion photo
- getProfile()                  // Get worker profile
```

---

## Routing (App.js)

### Routes
```javascript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/student-dashboard" element={<StudentDashboard />} />
  <Route path="/admin-dashboard" element={<AdminDashboard />} />
  <Route path="/worker-dashboard" element={<WorkerDashboard />} />
  <Route path="/profile" element={<Profile />} />
</Routes>
```

### Navigation Flow
```
Home → Login → Dashboard (role-based)
     → Register → Login → Dashboard
```

---

## Styling (App.css)

### Design System

**Colors:**
- Primary: #667eea (Purple-blue)
- Success: #27ae60 (Green)
- Warning: #f39c12 (Orange)
- Danger: #e74c3c (Red)
- Background: #f5f6fa (Light gray)

**Components:**
- `.navbar` - Fixed header (z-index: 9999)
- `.dashboard` - Main content area (margin-top: 140px)
- `.admin-tabs` - Tab navigation (fixed, z-index: 100)
- `.complaint-card` - Complaint display card
- `.stat-card` - Statistics card
- `.modal` - Modal overlay
- `.badge` - Status badges

**Responsive:**
- Mobile breakpoint: 768px
- Grid layouts with auto-fit
- Flexible containers

---

## State Management Pattern

### LocalStorage Usage
```javascript
// Stored on login
localStorage.setItem('token', jwt_token);
localStorage.setItem('user', JSON.stringify(user_data));

// Retrieved on page load
const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = localStorage.getItem('token');

// Cleared on logout
localStorage.clear();
```

### Component State Pattern
```javascript
// Data fetching
useEffect(() => {
  loadData();
}, []);

// Auto-refresh
useEffect(() => {
  const interval = setInterval(() => {
    loadData();
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

---

## Key UI Components

### 1. Progress Tracking Bar (StudentDashboard)

**Visual Design:**
```
📝 -------- ✓ -------- 👷 -------- ✅
Submitted   Validated   Assigned   Completed
```

**Implementation:**
- 4 circular stage indicators
- Connecting progress line
- Color-coded stages (gray → blue)
- Current stage highlighted with border
- Smooth transitions

**Status Mapping:**
- pending → Stage 0 (Submitted)
- validated → Stage 1 (Validated)
- assigned/in_progress → Stage 2 (Assigned)
- completed/resolved → Stage 3 (Completed)

### 2. Emergency Toggle (StudentDashboard)

**Visual Design:**
- Checkbox with red styling when active
- Warning message box
- Red submit button
- Border and background change

**Features:**
- Toggle emergency mode
- Display warning about bypass
- Change form styling
- Use different API endpoint

### 3. Upvote System (StudentDashboard)

**Visual Design:**
- Card list of similar complaints
- Upvote count badge
- "Me too!" button (blue)
- "✓ Voted - Remove" button (red)

**Features:**
- Fetch complaints by location
- Show upvote count
- Toggle upvote status
- Real-time count updates

### 4. Worker Rating Modal (StudentDashboard)

**Visual Design:**
- Star selection (1-5)
- Feedback textarea
- Submit button

**Features:**
- Only for completed tasks
- One-time rating
- Optional feedback
- Updates worker average

### 5. Admin Tabs (AdminDashboard)

**Tabs:**
- 🚨 Emergency (red when active)
- Complaints (default)
- Worker Performance

**Features:**
- Fixed positioning below navbar
- Active tab highlighting
- Role-based visibility
- Count badges

### 6. Supervisor Views (AdminDashboard)

**Sub-tabs:**
- 📋 Overview - All complaints
- 👷 Worker Workload - Capacity view
- ⚡ Quick Assign - Fast assignment
- 🔄 In Progress - Assigned tasks

**Quick Assign Interface:**
- Card-based layout
- Worker dropdown
- Deadline input
- One-click assign

**Worker Workload:**
- Worker cards with stats
- Assigned/In Progress/Completed counts
- Click to view details
- Color-coded capacity

**In Progress View:**
- Assigned complaints list
- Worker details displayed
- Progress photo visibility
- Assignment timestamp

### 7. Emergency Section (AdminDashboard)

**Layout:**
- Active emergencies (red styling)
- Resolved emergencies (green styling)
- "Mark as Resolved" button
- Student details
- Photo display
- Timestamps

### 8. Worker Performance (AdminDashboard)

**Features:**
- Worker cards with ratings
- Star display
- Task statistics
- Recent ratings list
- Click for detailed view

**Worker Details Modal:**
- Full rating history
- All assigned tasks
- Completion statistics
- Performance metrics

---

## Data Flow

### Authentication Flow
```
1. User enters credentials
2. Frontend → POST /api/auth/login
3. Backend validates → Returns JWT + user data
4. Frontend stores in localStorage
5. All subsequent requests include JWT in header
6. Backend validates token on each request
```

### Complaint Submission Flow
```
1. Student fills form
2. Frontend validates required fields
3. Auto-generates location from hostel + room
4. POST /api/complaints/ or /api/complaints/emergency
5. Backend creates complaint record
6. Returns complaint data
7. Frontend refreshes complaint list
8. Shows success message
```

### Complaint Progress Flow
```
1. Student submits → status: pending
2. Validator validates → status: validated
3. Supervisor assigns → status: assigned
4. Worker uploads progress photo → status: in_progress
5. Worker completes → status: completed
6. Student rates worker → worker_rating saved
```

### Emergency Flow
```
1. Student checks emergency toggle
2. Submits via /api/complaints/emergency
3. Backend creates with status: emergency
4. Notifications sent to warden + validator
5. Any admin can resolve
6. Status changes to: resolved
7. Student receives notification
```

---

## UI/UX Patterns

### 1. Modal Pattern
```javascript
{showModal && (
  <div className="modal" onClick={() => setShowModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {/* Modal content */}
    </div>
  </div>
)}
```

### 2. Card Pattern
```javascript
<div className="complaint-card" style={{ borderLeft: '4px solid color' }}>
  <h4>{title}</h4>
  <p>{description}</p>
  <div>{badges}</div>
  <div>{actions}</div>
</div>
```

### 3. Badge Pattern
```javascript
<span className={`badge badge-${status}`}>
  {status.replace('_', ' ')}
</span>
```

### 4. Conditional Rendering
```javascript
{condition && <Component />}
{condition ? <ComponentA /> : <ComponentB />}
{array.length === 0 ? <EmptyState /> : <List />}
```

---

## Styling Architecture

### CSS Organization
1. **Global Styles** - Body, containers, typography
2. **Layout Components** - Navbar, dashboard, grids
3. **UI Components** - Buttons, forms, cards, badges
4. **Page-Specific** - Dashboard-specific styles
5. **Responsive** - Media queries for mobile

### Key CSS Classes

**Layout:**
- `.navbar` - Fixed header
- `.dashboard` - Main content area
- `.admin-tabs` - Tab navigation
- `.stats` - Statistics grid

**Components:**
- `.complaint-card` - Complaint display
- `.stat-card` - Statistic card
- `.modal` - Modal overlay
- `.modal-content` - Modal box
- `.form-group` - Form field wrapper

**Buttons:**
- `.btn` - Base button
- `.btn-primary` - Primary action (blue)
- `.btn-secondary` - Secondary action (gray)

**Badges:**
- `.badge` - Base badge
- `.badge-pending` - Gray
- `.badge-validated` - Blue
- `.badge-assigned` - Orange
- `.badge-completed` - Green
- `.badge-high` - Red (priority/emergency)

---

## Performance Optimizations

### 1. Auto-Refresh Strategy
```javascript
// Emergency complaints - 30 seconds
setInterval(() => loadEmergencyComplaints(), 30000);

// Regular data - Manual refresh on actions
```

### 2. Conditional Rendering
- Only render active tab content
- Lazy load worker details
- Filter data client-side

### 3. Image Optimization
- Base64 encoding for small images
- Click to open full size
- Max dimensions in CSS

### 4. State Updates
- Batch state updates
- Avoid unnecessary re-renders
- Use functional updates

---

## Error Handling

### Pattern
```javascript
try {
  const response = await api.call();
  // Success handling
  alert('Success message');
  loadData();
} catch (err) {
  console.error('Error:', err);
  const errorMsg = err.response?.data?.error || 'Generic error';
  alert(errorMsg);
}
```

### User Feedback
- Alert messages for success/error
- Console logging for debugging
- Error messages from backend
- Loading states

---

## Security Features

### 1. Token Management
- JWT stored in localStorage
- Included in all API requests
- Cleared on logout
- Validated on backend

### 2. Role-Based UI
- Different dashboards per role
- Conditional feature rendering
- Action buttons based on permissions

### 3. Input Validation
- Required field checks
- Form validation
- Sanitized inputs
- Confirmation dialogs

---

## Responsive Design

### Breakpoints
- Desktop: > 768px
- Mobile: ≤ 768px

### Mobile Adaptations
- Stacked layouts
- Smaller fonts
- Touch-friendly buttons
- Simplified navigation

---

## Browser Compatibility

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Required Features
- ES6+ JavaScript
- LocalStorage
- Fetch/Axios
- CSS Grid/Flexbox

---

## Development Workflow

### Running Frontend
```bash
cd frontend
npm install
npm start
```

### Build for Production
```bash
npm run build
# Creates optimized build in frontend/build/
```

### Environment
- Development server: localhost:3000
- API endpoint: localhost:5002
- Hot reload enabled
- Source maps enabled

---

## Component Lifecycle

### Typical Component Pattern
```javascript
function Component() {
  // 1. State declarations
  const [data, setData] = useState([]);
  
  // 2. Effects (data loading)
  useEffect(() => {
    loadData();
  }, []);
  
  // 3. Event handlers
  const handleAction = async () => {
    // API call
    // Update state
  };
  
  // 4. Render helpers
  const renderItem = (item) => {
    return <div>{item.name}</div>;
  };
  
  // 5. Conditional rendering
  if (!data) return <Loading />;
  
  // 6. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## Key React Patterns Used

1. **Functional Components** - All components use hooks
2. **useState** - Local state management
3. **useEffect** - Side effects and data fetching
4. **useNavigate** - Programmatic navigation
5. **Conditional Rendering** - Show/hide based on state
6. **Event Handlers** - User interactions
7. **Props** - None (all components are pages)
8. **LocalStorage** - Persistent data

---

## Summary

The frontend is a **React.js single-page application** with:
- 7 main page components
- Role-based dashboards
- Real-time data updates
- Responsive design
- Custom CSS styling
- Axios for API communication
- LocalStorage for authentication
- Modal-based interactions
- Progress tracking visualization
- Emergency alert system

All components follow React best practices with functional components, hooks, and clear separation of concerns.
