# VNIT Hostel Grievance Management System - Backend

A Flask-based backend API for managing hostel grievances with role-based access control.

## Features

- **Role-based Authentication**: Resident, Admin, and Worker roles
- **Complaint Management**: File, track, and resolve complaints
- **Emergency Detection**: Automatic priority escalation for emergency keywords
- **Admin Panel**: Assign tasks, verify work, and monitor statistics
- **Worker Portal**: View assigned tasks and update progress

## Tech Stack

- Flask (Python web framework)
- Supabase (PostgreSQL database)
- JWT (Authentication)
- Flask-CORS (Cross-origin support)

## Setup Instructions

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Supabase

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `database_schema.sql` in your Supabase SQL editor
3. Get your Supabase URL and anon key from Project Settings > API

### 3. Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET_KEY=your_random_secret_key
FLASK_ENV=development
```

### 4. Run the Application

```bash
python run.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Complaints (Resident)

- `POST /api/complaints/` - Create new complaint
- `GET /api/complaints/` - Get user's complaints
- `GET /api/complaints/<id>` - Get specific complaint
- `PATCH /api/complaints/<id>/status` - Update complaint status

### Admin

- `GET /api/admin/complaints` - Get all complaints (with filters)
- `POST /api/admin/complaints/<id>/assign` - Assign complaint to worker
- `POST /api/admin/complaints/<id>/verify` - Verify completed work
- `GET /api/admin/workers` - Get all workers
- `GET /api/admin/stats` - Get complaint statistics

### Worker

- `GET /api/worker/tasks` - Get assigned tasks
- `PATCH /api/worker/tasks/<id>/update` - Update task progress
- `POST /api/worker/tasks/<id>/complete` - Mark task as completed

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Emergency Detection

The system automatically detects emergency keywords in complaint descriptions:
- fire
- water leakage
- short circuit
- medical emergency
- urgent
- emergency

Complaints with these keywords are automatically marked as high priority.

## Database Schema

See `database_schema.sql` for the complete database structure including:
- Users table (residents, admins, workers)
- Complaints table (with status tracking)
- Notifications table (for alerts)

## Next Steps

1. Implement file upload for images (using Supabase Storage)
2. Add real-time notifications using Supabase Realtime
3. Implement voice-to-text for emergency complaints
4. Add SMS/email notification integration
5. Create frontend applications for each role
