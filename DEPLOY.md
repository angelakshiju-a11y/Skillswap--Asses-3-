# SkillSwap Deployment Guide

Deploy SkillSwap to production using **Vercel** (Frontend) and **Render** (Backend).

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │   Render        │
│   (Frontend)    │◄───────►│   (Backend)     │
│   React + Vite  │  HTTPS  │   Express API   │
└─────────────────┘         └─────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────┴──────┐
              │  Supabase   │
              │  PostgreSQL │
              └─────────────┘
```

---

## Prerequisites

1. **GitHub repository** with your SkillSwap code pushed
2. **Vercel account** (free): https://vercel.com
3. **Render account** (free): https://render.com
4. **Supabase project** already set up with schema applied

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "SkillSwap MVP ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/skillswap.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### Option A: Using render.yaml (Blueprint)

1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect your GitHub repository
4. Render will read `backend/render.yaml` and create the service
5. Add environment variables in the Render dashboard:
   - `SUPABASE_URL` = `https://tttinuqepucvjfdbggln.supabase.co`
   - `SUPABASE_ANON_KEY` = `sb_publishable_GQj6_o3ugFrMHa7fgJWWyg_e_lcKihL`
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
   - `FRONTEND_URL` = (your Vercel URL - get this after Step 3)

### Option B: Manual Web Service

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: `skillswap-backend`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
5. Add environment variables (same as above)
6. Click "Create Web Service"

**Your backend URL will be:** `https://skillswap-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_SUPABASE_URL` = `https://tttinuqepucvjfdbggln.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_GQj6_o3ugFrMHa7fgJWWyg_e_lcKihL`
   - `VITE_API_URL` = `https://skillswap-backend.onrender.com/api` (from Step 2)
5. Click "Deploy"

**Your frontend URL will be:** `https://skillswap-yourname.vercel.app`

---

## Step 4: Update CORS (After Both Deployed)

1. Go to your **Render dashboard** → your backend service → Environment
2. Update `FRONTEND_URL` to your actual Vercel URL:
   ```
   FRONTEND_URL=https://skillswap-yourname.vercel.app
   ```
3. Click "Save Changes" - Render will redeploy automatically

---

## Environment Variables Summary

### Frontend (Vercel)
| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

### Backend (Render)
| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |
| `NODE_ENV` | `production` |

---

## Verification

After deployment, verify:

1. **Frontend loads**: Open your Vercel URL, should show login page
2. **Backend health**: Visit `https://your-backend.onrender.com/api/health`
3. **API works**: Try registering a new account
4. **Database connected**: Check Supabase dashboard for new rows

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check `FRONTEND_URL` matches exactly (including https://) |
| 404 on refresh | `vercel.json` rewrites are configured - should work |
| Build fails | Check that `frontend/dist` is created by `npm run build` |
| API not found | Verify `VITE_API_URL` ends with `/api` |
| Auth fails | Check Supabase Auth is enabled in dashboard |

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Vercel | Unlimited static sites, 100GB bandwidth |
| Render | 512MB RAM, sleeps after 15 min inactivity |
| Supabase | 500MB database, 2GB bandwidth |

**Note**: Render free tier spins down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain and follow DNS instructions

### Render
1. Go to Service Settings → Custom Domains
2. Add your domain and verify

---

**Happy Deploying!** 🚀
