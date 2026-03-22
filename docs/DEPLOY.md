# PageYoink — Deployment Guide

## Option A: Railway (Recommended — Easiest)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub Repo"
3. Select `claudiusbirdwhistle/pageyoink`
4. Set these environment variables:
   ```
   PORT=3000
   API_KEYS=your-key-1,your-key-2
   RATE_LIMIT_PER_MINUTE=60
   DB_PATH=/app/data/pageyoink.db
   ```
5. Railway auto-detects the Dockerfile and deploys
6. Add a persistent volume mounted at `/app/data` (for SQLite)
7. Note your deployment URL (e.g., `pageyoink-production.up.railway.app`)

## Option B: Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service" → Connect GitHub repo
3. Select `claudiusbirdwhistle/pageyoink`
4. Set environment to "Docker"
5. Add environment variables (same as above)
6. Add a persistent disk mounted at `/app/data`
7. Deploy

## Option C: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth signup

# Launch (from repo root)
fly launch --name pageyoink

# Set secrets
fly secrets set API_KEYS=your-key-1,your-key-2
fly secrets set RATE_LIMIT_PER_MINUTE=60
fly secrets set DB_PATH=/app/data/pageyoink.db

# Create persistent volume
fly volumes create pageyoink_data --size 1

# Deploy
fly deploy
```

## After Deployment

1. Verify health: `curl https://YOUR-URL/internal/health`
2. Test screenshot: `curl "https://YOUR-URL/v1/screenshot?url=https://example.com" -H "x-api-key: YOUR-KEY" -o test.png`
3. Visit landing page: `https://YOUR-URL/`
4. Visit API docs: `https://YOUR-URL/docs`

## Generate API Keys

API keys are simple strings. Generate secure ones:
```bash
# Generate 3 API keys
for i in 1 2 3; do openssl rand -hex 24; done
```

Set them as comma-separated values in the `API_KEYS` environment variable.
