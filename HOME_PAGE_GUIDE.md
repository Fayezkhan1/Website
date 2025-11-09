# Home Page Guide

## Overview
The new home page serves as the main landing page for the VNIT Hostel Grievance Management System with three separate login panels for different user roles.

## Features

### 1. Navigation Bar
- Fixed at the top with VNIT logo
- Quick links to:
  - Portal Login (scrolls to login panels)
  - Photos (scrolls to hostel gallery)
  - About (scrolls to about section)

### 2. Login Panels (Hero Section)
Three expandable panels for different user roles:

#### Student Panel 🎓
- For residents to file and track complaints
- Includes "Register" link for new students
- Credentials only work if user role is "resident"

#### Admin Panel 👔
- For validators, supervisors, wardens, and deans
- Manages complaint workflow and assignments
- Credentials only work if user role is "admin"

#### Worker Panel 🔧
- For maintenance workers
- View and update assigned tasks
- Credentials only work if user role is "worker"

### 3. Photos Section
Gallery showcasing hostel facilities:
- Main hostel building
- Student rooms
- Common areas
- Dining hall

**Note:** Add actual images to `frontend/public/` folder (see `README_IMAGES.md`)

### 4. About Section
Four information cards explaining:
- Mission statement
- Quick resolution features
- Security and transparency
- Smart management capabilities

Contact information included at the bottom.

## How It Works

### Login Flow
1. User clicks on their role panel (Student/Admin/Worker)
2. Panel expands to show login form
3. User enters credentials
4. System validates role matches the panel
5. On success, redirects to appropriate dashboard:
   - Students → `/student-dashboard`
   - Admins → `/admin-dashboard`
   - Workers → `/worker-dashboard`

### Role Validation
The system ensures users can only login through their designated panel:
- Student credentials won't work in Admin/Worker panels
- Admin credentials won't work in Student/Worker panels
- Worker credentials won't work in Student/Admin panels

## Test Credentials

### Students
- ID: `STUDENT002`
- Password: `password123`

### Admins
- ID: `VALIDATOR001`, `SUPERVISOR001`, `WARDEN001`, or `DEAN001`
- Password: `password123`

### Workers
- ID: `WORKER001`
- Password: `password123`

## Customization

### Adding Images
1. Place images in `frontend/public/` folder:
   - `vnit-logo.png` - College logo
   - `hostel1.jpg` - Main building
   - `hostel2.jpg` - Student rooms
   - `hostel3.jpg` - Common area
   - `hostel4.jpg` - Dining hall

### Styling
Edit `frontend/src/pages/Home.css` to customize:
- Colors (currently purple gradient theme)
- Layout and spacing
- Responsive breakpoints
- Animation effects

### Content
Edit `frontend/src/pages/Home.js` to update:
- About section text
- Contact information
- Photo captions
- Section titles

## Running the Application

1. Start the backend:
```bash
python run.py
```

2. Start the frontend:
```bash
cd frontend
npm start
```

3. Visit `http://localhost:3000` to see the new home page

## Mobile Responsive
The page is fully responsive and adapts to:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

Login panels stack vertically on smaller screens.
