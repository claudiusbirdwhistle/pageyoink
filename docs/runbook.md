# Operational Runbook

Procedures for operating the PageYoink API service.

---

## Development

### Prerequisites
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Run dev server
```bash
cd /home/michael/Documents/GitHub/moneymaker
npm run dev
# Visit http://localhost:3000 (landing page)
# Visit http://localhost:3000/docs (Swagger UI)
```

### Run tests
```bash
npm test
```
Tests use in-memory storage (no Firestore credentials needed).

### Build
```bash
npm run build
```

### Test samples
Save screenshots/PDFs to `samples/` (gitignored) for visual review.

---

## Deployment (Google Cloud Run)

### Auto-deploy
Push to `main` → Cloud Build triggers → builds Docker image → deploys to Cloud Run.
```bash
git push  # That's it
```

### Manual deploy
```bash
gcloud run deploy pageyoink --source . --region us-east1
```

### Update environment variables
```bash
gcloud run services update pageyoink --region us-east1 \
  --set-env-vars "API_KEYS=key1,key2"
```

### Check deployment status
```bash
gcloud run services describe pageyoink --region us-east1
gcloud run revisions list --service pageyoink --region us-east1
```

### Rollback
```bash
# List revisions
gcloud run revisions list --service pageyoink --region us-east1

# Route traffic to a previous revision
gcloud run services update-traffic pageyoink --region us-east1 \
  --to-revisions REVISION_NAME=100
```

---

## Monitoring

### Health check
```bash
curl https://pageyoink-1085551159615.us-east1.run.app/internal/health
```

### View logs
```bash
# Recent logs
gcloud run services logs read pageyoink --region us-east1 --limit 50

# Stream logs
gcloud run services logs tail pageyoink --region us-east1

# Or via console: https://console.cloud.google.com/run/detail/us-east1/pageyoink/logs?project=pageyoink-api
```

### Check Cloud Build status
```bash
gcloud builds list --region=global --limit 5
```

---

## Troubleshooting

### Service returns 500 on screenshot/PDF
1. Check logs: `gcloud run services logs read pageyoink --region us-east1 --limit 20`
2. Common causes:
   - **"__name is not defined"** — Named function inside `page.evaluate()`. TypeScript decorator leak. Fix: inline the function logic, never use named function declarations inside evaluate.
   - **"Connection closed" / "Target closed"** — Chrome crashed. Retry logic handles this automatically. If persistent, increase memory.
   - **"Navigation timeout"** — Target URL too slow. Increase timeout param or check if site is blocking headless Chrome.

### Service is down / cold start slow
- Cloud Run scales to zero. First request after idle takes 5-10 seconds (container start + Chrome launch).
- Subsequent requests are fast (~2-3 seconds for screenshots).
- To keep warm: set `--min-instances 1` (costs ~$40/month).

### Firestore errors in tests
- Tests use in-memory storage (NODE_ENV=test). Firestore is only used in production.
- If you see "Could not load default credentials" in tests, ensure NODE_ENV=test is set.

### Trial limit hit during development
```bash
curl -X DELETE https://pageyoink-1085551159615.us-east1.run.app/trial/reset
# Only works when API_KEYS env var is not set
```

---

## Accounts

| Account | Purpose | Status |
|---------|---------|--------|
| Google Cloud (claudius.birdwhistle@gmail.com) | Cloud Run hosting + Firestore | Active — project: pageyoink-api |
| GitHub (claudiusbirdwhistle) | Repository + CI | Active — claudiusbirdwhistle/pageyoink |
| RapidAPI | API marketplace listing | Not created |
| Stripe | Direct payment processing | Not created |
| Domain registrar | Custom domain (optional) | Not created |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` (set by Cloud Run) | Server port |
| `NODE_ENV` | — | `production` on Cloud Run, `test` for tests |
| `GCP_PROJECT_ID` | `pageyoink-api` | Google Cloud project for Firestore |
| `API_KEYS` | (empty = auth disabled) | Comma-separated valid API keys |
| `RATE_LIMIT_PER_MINUTE` | `60` | Max requests per key per minute |
| `USE_MEMORY_DB` | — | Set to any value to use in-memory store instead of Firestore |

---

## Key Technical Notes

- **Never declare named functions inside `page.evaluate()`** — TypeScript adds `__name` decorator that doesn't exist in browser context. Use inline logic or arrow functions assigned to `const`.
- **Default wait strategy is `load` + 1s delay** — NOT `networkidle2`. This is 3-5x faster. `smart_wait=true` provides comprehensive readiness detection when needed.
- **In-memory cache** — 500 entries max, lost on scale-to-zero. Optimization only, not persistent.
- **Trial rate limit** — 5 captures/day per IP, in-memory (resets on restart). Dev reset: `DELETE /trial/reset`.
