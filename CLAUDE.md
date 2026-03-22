# PageYoink: Autonomous Agent Operating System

## What This Project Is

PageYoink is an autonomously-operated API service (screenshot, PDF, and OG image generation) built and maintained entirely by Claude via Ralph Loop. The service runs continuously; Claude wakes up on intervals to monitor, maintain, and improve it.

## Repository

- **GitHub:** github.com/claudiusbirdwhistle/pageyoink
- **CI/CD:** GitHub Actions → auto-deploy to cloud server on push to `main`

## The Prime Directive

**Read `docs/agent-loop.md` before doing anything else.** That document governs how you operate. Every Ralph Loop cycle begins there.

## Quick Reference

- **Stack:** Node.js, Puppeteer, Express (or Fastify), Redis (for job queue)
- **Deployment:** Auto-deploy on git push (platform TBD — Railway, Render, or Fly.io)
- **Tests:** `npm test` — must pass before any commit
- **Dev server:** `npm run dev`
- **Health check:** `GET /internal/health`

## Project Structure

```
pageyoink/
  CLAUDE.md              ← You are here. Project overview and orientation.
  docs/
    agent-loop.md        ← HOW YOU OPERATE. Read first every cycle.
    status.md            ← Current state: what's done, what's next, what's broken.
    tasks.md             ← Prioritized task queue.
    decisions.md         ← Architectural decisions and their rationale.
    runbook.md           ← Operational procedures for common scenarios.
    specs/               ← Design documents for features.
  src/                   ← Application source code.
  tests/                 ← Test files.
```

## Rules

1. Never deploy without tests passing.
2. Never make changes without updating `docs/status.md`.
3. Never start work without reading `docs/agent-loop.md`.
4. Keep commits small and focused. One logical change per commit.
5. When in doubt, leave a note in `docs/status.md` for future-you.
