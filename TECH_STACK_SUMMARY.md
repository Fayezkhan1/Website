# VNIT Hostel Grievance Management System - Technical Summary

## Technology Stack

### Backend
- **Framework**: Flask (Python 3.9)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **CORS**: Flask-CORS
- **API Style**: RESTful API

### Frontend
- **Framework**: React.js
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: CSS (Custom)
- **State Management**: React Hooks (useState, useEffect)

### Database
- **Provider**: Supabase
- **Type**: PostgreSQL (Cloud-hosted)
- **ORM**: Supabase Python Client
- **Schema**: Relational database with foreign keys

---

## Backend Architecture

### Project Structure
```
app/
├── routes/
│   ├── auth.py          # Authentication endpoints
│   ├── complaints.py    # Complaint management
│   ├── admin.py         # Admin operations
│   └── worker.py        # Worker operations
├── auth_middleware.py   # JWT authentication & role-based access
└── database.py          # Supabase client configuration

app.py                   # Main Flask application
```

### Key Backend Components

#### 1. **Authentication System**
- **JWT-based authentication**
- Token generation on login
- Token validation middleware
- Role-based access control (RBAC)

**Roles:**
- `resident` (Students)
- `admin` (Validators, Supervisors, Wardens, Deans)
- `worker` (Maintenance workers)

#### 2. **API Endpoints**

**Authentication (`/api/auth`)**
- `POST /register` - User registration
- `POST /login` - User login (returns JWT token)

**Complaints (`/api/complaints`)**
- `POST /` - Create complaint
- `POST /emergency` - Create emergency complaint
- `GET /` - Get complaints (filtered by role)
- `GET /<id>` - Get single complaint
- `PATCH /<id>/status` - Update complaint status
- `POST /by-location` - Get complaints by location (for upvoting)
- `POST /<id>/upvote` - Upvote complaint
- `POST /<id>/remove-upvote` - Remove upvote
- `POST /<id>/rate` - Rate worker after completion

**Admin (`/api/admin`)**
- `GET /complaints` - Get all complaints (role-filtered)
- `GET /complaints/emergency` - Get emergency complaints
- `POST /complaints/<id>/validate` - Validator validates complaint
- `POST /complaints/<id>/assign` - Supervisor assigns to worker
- `POST /complaints/<id>/resolve-emergency` - Resolve emergency
- `GET /workers` - Get all workers
- `GET /workers/performance` - Get worker performance metrics
- `GET /workers/<id>/details` - Get worker details
- `GET /dashboard` - Get dashboard statistics

**Worker (`/api/worker`)**
- `GET /tasks` - Get assigned tasks
- `PATCH /tasks/<id>/update` - Update task status
- `POST /tasks/<id>/complete` - Mark task complete
- `POST /tasks/<id>/upload-progress-photo` - Upload progress photo
- `POST /tasks/<id>/upload-completion-photo` - Upload completion photo

#### 3. **Middleware**
- `@token_required` - Validates JWT token
- `@role_required(['role'])` - Checks user role

#### 4. **Database Schema**

**Main Tables:**
- `users` - User accounts (students, admins, workers)
- `complaints` - Complaint records
- `notifications` - User notifications
- `complaint_history` - Audit trail
- `complaint_upvotes` - Upvote tracking
- `worker_ratings` - Worker performance ratings

**Key Fields in Complaints:**
- `status`: pending, validated, assigned, in_progress, completed, resolved, emergency
- `priority`: low, medium, high
- `is_emergency`: Boolean flag
- `assigned_to`: Worker ID
- `upvote_count`: Number of upvotes
- `worker_rating`: Student rating (1-5)

---

## Frontend Architecture

### Project Structure
```
frontend/src/
├── pages/
│   ├── Home.js              # Landing page
│   ├── Login.js             # Login page
│   ├── Register.js          # Registration page
│   ├── StudentDashboard.js  # Student interface
│   ├── AdminDashboard.js    # Admin interface
│   ├── WorkerDashboard.js   # Worker interface
│   └── Profile.js           # User profile
├── api.js                   # API client (Axios)
├── App.js                   # Main app component
└── App.css                  # Global styles
```

### Key Frontend Features

#### 1. **Student Dashboard**
- File complaints with structured form
- View pending and resolved complaints
- Track complaint progress (4-stage progress bar)
- Upvote similar complaints
- Rate workers after completion
- Emergency complaint submission

#### 2. **Admin Dashboard**
**Validator:**
- View pending complaints
- Validate and set priority
- View emergency complaints

**Supervisor:**
- View validated complaints
- Assign complaints to workers
- Monitor in-progress tasks
- View worker workload

**Warden/Dean:**
- View escalated complaints
- Resolve emergency complaints
- Monitor system-wide issues

#### 3. **Worker Dashboard**
- View assigned tasks
- Upload progress photos
- Upload completion photos
- Mark tasks complete
- View performance ratings

#### 4. **Emergency System**
- Separate emergency tab for all admins
- Bypass validation workflow
- Direct warden resolution
- Real-time notifications

---

## Key Features Implemented

### 1. **Complaint Workflow**
```
Student Submits → Validator Validates → Supervisor Assigns → Worker Completes
```

**Status Flow:**
- `pending` → `validated` → `assigned` → `completed`

### 2. **Emergency System**
```
Student Submits Emergency → Warden/Admin Resolves (bypasses validation)
```

**Status Flow:**
- `emergency` → `resolved`

### 3. **Progress Tracking**
- Visual 4-stage progress bar for students
- Real-time status updates
- Icons and colors for each stage

### 4. **Upvote System**
- Students can upvote similar complaints
- Hostel-based filtering
- Remove upvote functionality
- Upvote count display

### 5. **Worker Rating System**
- 1-5 star rating
- Optional feedback
- Average rating calculation
- Performance dashboard

### 6. **Photo Upload**
- Progress photos (before work)
- Completion photos (after work)
- Base64 encoding
- Supabase storage integration

### 7. **Role-Based Access Control**
- JWT authentication
- Role-specific dashboards
- Permission-based API access
- Secure endpoints

---

## Database Design

### Users Table
```sql
- id (BIGINT, Primary Key)
- student_id (VARCHAR, Unique)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- name (VARCHAR)
- hostel (VARCHAR)
- room_number (VARCHAR)
- role (VARCHAR: resident, admin, worker)
- admin_role (VARCHAR: validator, supervisor, warden, dean)
- average_rating (DECIMAL)
- total_ratings (INT)
```

### Complaints Table
```sql
- id (UUID, Primary Key)
- user_id (BIGINT, Foreign Key)
- title (VARCHAR)
- description (TEXT)
- category (VARCHAR)
- location (VARCHAR)
- status (VARCHAR)
- priority (VARCHAR)
- is_emergency (BOOLEAN)
- assigned_to (BIGINT, Foreign Key)
- upvote_count (INT)
- worker_rating (INT)
- progress_photo_url (TEXT)
- completion_photo_url (TEXT)
- resolved_by (BIGINT, Foreign Key)
- resolved_at (TIMESTAMP)
- deadline (TIMESTAMP)
```

---

## API Authentication Flow

1. **User Login**
   - POST `/api/auth/login` with credentials
   - Server validates and returns JWT token
   - Frontend stores token in localStorage

2. **Authenticated Requests**
   - Frontend includes token in Authorization header
   - Backend validates token via middleware
   - Extracts user info from token payload

3. **Role-Based Access**
   - Middleware checks user role
   - Returns 403 if unauthorized
   - Allows access if role matches

---

## Deployment Configuration

### Backend (Flask)
- **Port**: 5002
- **Host**: 0.0.0.0
- **Debug Mode**: Enabled (development)
- **CORS**: Enabled for localhost:3000

### Frontend (React)
- **Port**: 3000
- **API Base URL**: http://localhost:5002/api
- **Build Tool**: Create React App

### Database (Supabase)
- **URL**: https://edgtolokpiamnvbtscey.supabase.co
- **Connection**: REST API via Supabase client
- **Authentication**: API Key

---

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://edgtolokpiamnvbtscey.supabase.co
SUPABASE_KEY=<anon_key>
JWT_SECRET_KEY=<secret>
FLASK_ENV=development
```

---

## Security Features

1. **Password Hashing** - Bcrypt for password storage
2. **JWT Tokens** - Secure authentication
3. **Role-Based Access** - Permission checks on all endpoints
4. **Input Validation** - Required field checks
5. **SQL Injection Prevention** - Parameterized queries via Supabase
6. **CORS Configuration** - Restricted to frontend origin

---

## Performance Optimizations

1. **Database Indexing** - Indexes on frequently queried fields
2. **Filtered Queries** - Role-based data filtering
3. **Pagination** - Limited result sets
4. **Caching** - LocalStorage for user data
5. **Auto-refresh** - 30-second intervals for emergency complaints

---

## Known Issues & Workarounds

1. **Supabase Schema Cache**
   - Issue: New columns not recognized immediately
   - Workaround: Avoid using new columns or refresh schema cache

2. **Admin Role Detection**
   - Issue: admin_role field cache issues
   - Workaround: Parse role from user name

3. **Deadline Field**
   - Issue: Schema cache doesn't recognize deadline column
   - Workaround: Deadline not saved (pending schema refresh)

---

## Future Enhancements

1. Real-time notifications (WebSocket)
2. Email notifications
3. SMS alerts for emergencies
4. Advanced analytics dashboard
5. Mobile app
6. File attachment support
7. Complaint escalation automation
8. Performance metrics tracking
9. Deadline enforcement and alerts
10. Multi-language support

---

## Development Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python app.py

# Run on specific port
PORT=5002 python app.py
```

### Frontend
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

---

## Summary

This is a **full-stack web application** built with:
- **Backend**: Flask (Python) + Supabase (PostgreSQL)
- **Frontend**: React.js
- **Authentication**: JWT
- **Architecture**: RESTful API with role-based access control

The system manages hostel complaints through a structured workflow with different user roles, emergency handling, progress tracking, and worker performance management.
