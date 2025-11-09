# Vercel Deployment Checklist

## ✅ Pre-Deployment

- [ ] Have a GitHub/GitLab account
- [ ] Have a Vercel account (sign up at vercel.com)
- [ ] Have Supabase database set up with tables created
- [ ] Have your Supabase URL and anon key ready

## 📦 Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 🔧 Step 2: Deploy Backend (Flask API)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository
4. **Important:** Keep root directory as `.` (root)
5. Vercel auto-detects Python
6. Click "Environment Variables" and add:
   ```
   SUPABASE_URL = https://xxxxx.supabase.co
   SUPABASE_KEY = your_supabase_anon_key
   JWT_SECRET_KEY = any_random_long_string_here
   FLASK_ENV = production
   ALLOWED_ORIGINS = http://localhost:3000
   ```
7. Click "Deploy"
8. Wait for deployment (2-3 minutes)
9. **Copy your backend URL** (e.g., `https://your-project.vercel.app`)

## 🎨 Step 3: Deploy Frontend (React)

1. Go to https://vercel.com/new again
2. Click "Import Git Repository"
3. Select the **same repository**
4. **Important:** Set "Root Directory" to `frontend`
5. Framework Preset: Create React App (auto-detected)
6. Click "Environment Variables" and add:
   ```
   REACT_APP_API_URL = https://your-backend-url.vercel.app/api
   ```
   (Use the backend URL from Step 2)
7. Click "Deploy"
8. Wait for deployment (2-3 minutes)
9. **Copy your frontend URL** (e.g., `https://your-frontend.vercel.app`)

## 🔄 Step 4: Update Backend CORS

1. Go to your backend project in Vercel
2. Go to Settings → Environment Variables
3. Find `ALLOWED_ORIGINS`
4. Update it to include your frontend URL:
   ```
   ALLOWED_ORIGINS = https://your-frontend.vercel.app
   ```
5. Go to Deployments tab
6. Click "..." on latest deployment → "Redeploy"

## 🧪 Step 5: Test Your App

1. Open your frontend URL
2. Try to register a new user
3. Login
4. Create a test complaint
5. Check if everything works

## 🐛 Troubleshooting

**"Network Error" or CORS issues:**
- Check `ALLOWED_ORIGINS` includes your frontend URL
- Redeploy backend after changing env vars

**"Cannot connect to API":**
- Verify `REACT_APP_API_URL` is correct
- Make sure it ends with `/api`
- Check backend is deployed and running

**Database errors:**
- Verify Supabase credentials
- Check your database tables exist
- Test Supabase connection in Supabase dashboard

## 📝 Quick Reference

**Backend URL format:**
```
https://your-backend-name.vercel.app
```

**Frontend URL format:**
```
https://your-frontend-name.vercel.app
```

**API endpoint example:**
```
https://your-backend-name.vercel.app/api/auth/login
```

## 🎉 Done!

Your app is now live! Both projects will auto-deploy when you push to GitHub.

**To update:**
```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically redeploy both projects.
