# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Supabase account with database set up
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Deploy Backend (Flask API)

### 1.1 Push to Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 1.2 Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your repository
3. Select the root directory (not frontend)
4. Vercel will auto-detect it as a Python project
5. Add environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon key
   - `JWT_SECRET_KEY`: A random secret key (generate with: `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `FLASK_ENV`: production
   - `ALLOWED_ORIGINS`: Your frontend URL (e.g., https://your-frontend.vercel.app)

6. Click "Deploy"
7. Copy your backend URL (e.g., https://your-backend.vercel.app)

## Step 2: Deploy Frontend (React)

### 2.1 Create New Vercel Project
1. Go to https://vercel.com/new
2. Import the same repository
3. Set "Root Directory" to `frontend`
4. Framework Preset: Create React App
5. Add environment variable:
   - `REACT_APP_API_URL`: Your backend URL + /api (e.g., https://your-backend.vercel.app/api)

6. Click "Deploy"

### 2.2 Update Backend CORS
After frontend is deployed, update the backend environment variable:
- `ALLOWED_ORIGINS`: Add your frontend URL (e.g., https://your-frontend.vercel.app)

## Step 3: Database Setup

Run your database schema in Supabase SQL Editor:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Create tables for users, complaints, notifications, etc.

## Step 4: Test Deployment

1. Visit your frontend URL
2. Try registering a new user
3. Create a test complaint
4. Verify API calls are working

## Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` in backend includes your frontend URL
- Check that both URLs use HTTPS

### API Connection Failed
- Verify `REACT_APP_API_URL` is set correctly in frontend
- Check backend logs in Vercel dashboard

### Database Connection Issues
- Verify Supabase credentials are correct
- Check Supabase project is active

## Environment Variables Summary

### Backend (.env)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_key
JWT_SECRET_KEY=your_secret_key
FLASK_ENV=production
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

## Continuous Deployment

Both projects will auto-deploy on git push to main branch.

## Custom Domain (Optional)

1. Go to Project Settings > Domains in Vercel
2. Add your custom domain
3. Update DNS records as instructed
4. Update CORS settings with new domain
