# VNIT Hostel Grievance Management System

A full-stack complaint management system with role-based access control for hostel residents, workers, and administrators.

## Tech Stack

**Backend:**
- Flask (Python)
- Supabase (PostgreSQL)
- JWT Authentication

**Frontend:**
- React
- React Router
- Axios

## Features

- Role-based authentication (Resident, Worker, Admin)
- Complaint filing and tracking
- Emergency complaint detection
- Task assignment and verification
- Worker performance ratings
- Real-time dashboard statistics

## Quick Start

### Local Development

**Backend:**
```bash
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### Environment Variables

Create `.env` in root:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET_KEY=your_secret_key
FLASK_ENV=development
```

Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5002/api
```

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed Vercel deployment instructions.

### Quick Deploy

1. Push to GitHub
2. Import to Vercel (2 projects: root for backend, frontend folder for frontend)
3. Set environment variables
4. Deploy!

## Project Structure

```
├── app/                    # Backend application
│   ├── routes/            # API endpoints
│   ├── auth_middleware.py # JWT authentication
│   └── database.py        # Supabase connection
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── api.js        # API client
│   │   └── App.js        # Main app
│   └── public/           # Static assets
├── app.py                # Flask app entry point
├── config.py             # Configuration
└── requirements.txt      # Python dependencies
```

## License

MIT
