# PageYoink — Deployment Guide

## Current Deployment: Google Cloud Run

PageYoink is deployed on Google Cloud Run with auto-deploy via Cloud Build.

- **Project:** pageyoink-api
- **Region:** us-east1
- **Service URL:** https://pageyoink-1085551159615.us-east1.run.app
- **Config:** 2 vCPU, 2GB RAM, 0-5 instances (scale to zero)
- **Database:** Firestore (us-east1)
- **GCP Account:** claudius.birdwhistle@gmail.com

### Auto-Deploy

Cloud Build is connected to the GitHub repo. Pushing to `main` triggers:
1. Docker image build (via `cloudbuild.yaml`)
2. Push to Artifact Registry
3. Deploy new revision to Cloud Run

### Manual Deploy

```bash
gcloud run deploy pageyoink --source . --region us-east1
```

### Set Environment Variables

```bash
gcloud run services update pageyoink --region us-east1 \
  --set-env-vars "API_KEYS=key1,key2,RATE_LIMIT_PER_MINUTE=60"
```

### View Logs

```bash
gcloud run services logs read pageyoink --region us-east1 --limit 50
```

### Check Service Status

```bash
gcloud run services describe pageyoink --region us-east1
curl https://pageyoink-1085551159615.us-east1.run.app/internal/health
```

---

## Alternative Deployments

### Railway

```bash
# Connect repo at railway.app, set env vars:
# NODE_ENV=production, API_KEYS=..., RATE_LIMIT_PER_MINUTE=60
# Railway auto-detects Dockerfile and deploys
```

### Render

Docker web service, set env vars, deploy from GitHub.

### Fly.io

```bash
fly launch --name pageyoink
fly secrets set API_KEYS=key1,key2
fly deploy
```

---

## Generate API Keys

```bash
for i in 1 2 3; do openssl rand -hex 24; done
```

Set as comma-separated `API_KEYS` environment variable.
