# Operational Runbook

This document contains procedures for operating the PageYoink API service. Update this as new procedures are discovered.

---

## Development

### Run the dev server
```bash
cd /home/michael/Documents/GitHub/moneymaker
npm run dev
```

### Run tests
```bash
npm test
```

### Run linter
```bash
npm run lint
```

---

## Deployment

### How to deploy
(To be documented once hosting platform is configured)

Approach: GitHub Actions CI/CD pipeline triggers on push to `main`. Deploys to cloud server.

### How to check if deployment succeeded
(To be documented once hosting platform is configured)

---

## Monitoring

### Check service health
```bash
curl https://<production-url>/internal/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": "3d 4h 12m",
  "version": "1.0.0",
  "requests_24h": 847,
  "error_rate": "0.3%"
}
```

### Check application logs
(To be documented once hosting platform is configured)

---

## Troubleshooting

### Service is down (health endpoint unreachable)
1. Check if the hosting platform itself is having issues (status page).
2. Check recent commits — did a bad deploy go out?
3. If a bad deploy: revert the commit, push to trigger redeploy.
4. If platform issue: note in status.md, wait, and retry next cycle.

### High error rate (> 5%)
1. Check logs for the most common error.
2. Common causes:
   - Puppeteer/Chrome crash: usually memory pressure. Check if instance needs more RAM.
   - Timeout errors: target URLs taking too long. Check if timeout config is reasonable.
   - Invalid input: missing validation. Add validation and return 400.
3. Fix root cause, deploy, verify error rate drops.

### Chrome/Puppeteer won't start
1. Check that all system dependencies are installed (see Dockerfile).
2. Common missing deps: `libx11`, `libxcomposite`, `libxdamage`, `libxrandr`, `libasound2`, `libatk1.0`, `libcups2`, `libpangocairo-1.0`.
3. Ensure `--no-sandbox` flag is set in Puppeteer launch args (required in containerized environments).
4. Check available memory — Chrome needs at least 256MB per instance.

### Out of memory
1. Check number of concurrent browser instances.
2. Reduce max concurrency in config.
3. Ensure pages are being closed after capture (`page.close()`).
4. Ensure browser instances are being recycled periodically.
5. Consider upgrading instance size if legitimate traffic growth.

---

## Accounts Required (Human Setup)

| Account | Purpose | Status |
|---------|---------|--------|
| Hosting platform (Railway/Render/Fly.io) | Deploy and run the service | Not created |
| RapidAPI | API marketplace listing | Not created |
| Stripe | Direct payment processing | Not created |
| Domain registrar | Custom domain (optional) | Not created |
| GitHub | Repository hosting | Created — claudiusbirdwhistle/pageyoink |

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `API_KEYS` | Valid API keys (comma-separated or DB reference) | TBD |
| `MAX_CONCURRENCY` | Max simultaneous browser instances | `5` |
| `REQUEST_TIMEOUT_MS` | Max time per screenshot/PDF request | `30000` |
| `RATE_LIMIT_PER_MINUTE` | Requests per API key per minute | `60` |
