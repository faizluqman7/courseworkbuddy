# Deployment Guide: Backend on Render.com, Frontend on Vercel

This guide will help you deploy CourseworkBuddy with the backend on Render.com and the frontend on Vercel.

## Architecture

- **Backend**: Python FastAPI with LangChain → Render.com Web Service
- **Frontend**: React/Vite SPA → Vercel
- **Database**: PostgreSQL (can use Render PostgreSQL or external)
- **Vector Store**: Qdrant Cloud

## Prerequisites

- GitHub repository with your code
- Render.com account
- Vercel account
- Google API key (for Gemini)
- Qdrant Cloud account (or self-hosted Qdrant)
- PostgreSQL database (Render provides free tier)

---

## Part 1: Deploy Backend to Render.com

### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `courseworkbuddy-api` (or your preference)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r server/requirements.txt`
   - **Start Command**: `uvicorn server.main:app --host 0.0.0.0 --port $PORT`

### Step 2: Set Environment Variables

In the Render dashboard, add these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `GOOGLE_API_KEY` | Your Google Gemini API key | `AIza...` |
| `QDRANT_URL` | Qdrant Cloud URL | `https://xxx.qdrant.io` |
| `QDRANT_API_KEY` | Qdrant API key | `your-api-key` |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Generate with `openssl rand -hex 32` |
| `FRONTEND_URL` | Your Vercel frontend URL | `https://courseworkbuddy.vercel.app` |

> **Note**: Set `FRONTEND_URL` after deploying the frontend (Step 3). You can come back and add it.

### Step 3: Deploy

1. Click **Create Web Service**
2. Wait for the build to complete
3. Note your backend URL: `https://courseworkbuddy-api.onrender.com`

### Step 4: Verify Backend

Test the health endpoint:
```bash
curl https://YOUR-APP.onrender.com/api/health
```

You should see:
```json
{"status": "healthy", "service": "infoflow-api"}
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository

### Step 2: Configure Build Settings

Vercel should auto-detect Vite. Verify:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables

Add these environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-BACKEND.onrender.com/api` |

> Replace `YOUR-BACKEND` with your actual Render backend URL from Part 1, Step 3.

### Step 4: Deploy

1. Click **Deploy**
2. Wait for deployment to complete
3. Note your frontend URL: `https://courseworkbuddy.vercel.app`

### Step 5: Update Backend CORS

1. Go back to your Render dashboard
2. Add/update the `FRONTEND_URL` environment variable
3. Set it to your Vercel URL: `https://courseworkbuddy.vercel.app`
4. Render will automatically redeploy

---

## Part 3: Verification

### Test the Full Flow

1. Visit your Vercel URL: `https://courseworkbuddy.vercel.app`
2. Upload a PDF coursework specification
3. Verify the decomposition works
4. Test the chat functionality
5. Test login/register (if you're using auth)

### Check Browser Console

Open DevTools and verify:
- No CORS errors
- API requests go to your Render backend
- Images load correctly

### Common Issues

#### CORS Errors
- Verify `FRONTEND_URL` is set correctly in Render
- Ensure it matches your Vercel URL exactly (no trailing slash)

#### API Connection Failed
- Check `VITE_API_URL` is set in Vercel
- Verify backend is running: `curl https://YOUR-BACKEND.onrender.com/api/health`

#### Database Connection Issues
- Verify `DATABASE_URL` format is correct
- Check database is accessible from Render

---

## Local Development

For local development, the setup remains the same:

1. **Backend**: Run `uvicorn server.main:app --reload` from project root
2. **Frontend**: Run `npm run dev` (uses proxy to `localhost:8000`)

The frontend will use `/api` (proxy) when `VITE_API_URL` is not set.

---

## Environment Variables Reference

### Backend (Render.com)

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
GOOGLE_API_KEY=your_gemini_api_key
QDRANT_URL=https://xxx.qdrant.io
QDRANT_API_KEY=your_qdrant_key
JWT_SECRET_KEY=your_secret_key_here
FRONTEND_URL=https://courseworkbuddy.vercel.app
```

### Frontend (Vercel)

```env
VITE_API_URL=https://courseworkbuddy-api.onrender.com/api
```

---

## Updating Your Deployment

### Backend Changes
- Push to GitHub → Render auto-deploys

### Frontend Changes
- Push to GitHub → Vercel auto-deploys

### Environment Variable Changes
- Update in respective dashboards
- Services will automatically redeploy

---

## Cost Estimate

- **Render**: Free tier available (spins down after inactivity, cold starts ~30s)
- **Vercel**: Free tier for personal projects
- **Qdrant Cloud**: Free tier available (1GB)
- **PostgreSQL**: Render offers free tier

For production, consider paid tiers for better performance and uptime.
