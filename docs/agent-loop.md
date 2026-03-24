# Agent Loop: How Claude Operates Autonomously

This is the foundational document of the PageYoink project. It governs how Claude operates across Ralph Loop cycles, compensating for the fundamental constraint that each cycle starts with a fresh context and no memory of prior cycles.

---

## What We're Building

### The Vision

**PageYoink: One URL. Everything you need.**

PageYoink is a unified web page API. You give us a URL; we load it in a real browser (handling JavaScript, popups, lazy loading, cookie banners) and return whatever representation you need: screenshot, PDF, markdown, metadata, or all of them at once from a single page load.

### Why This Product

The web data market is exploding ($1B → $4.4B by 2035) driven by AI/LLM demand. Developers building AI agents and RAG pipelines need to turn URLs into usable data — clean text, images, structured metadata. Today this requires 2-4 separate services (Firecrawl for markdown, ScreenshotOne for screenshots, DocRaptor for PDFs, etc.). Nobody offers all outputs from a single page load through a single API.

### The Competitive Landscape

- **Firecrawl** ($14.5M raised, 350K users): Does markdown + screenshots + extraction. No PDF generation. Complex credit pricing. Our main competitor.
- **Urlbox**: Technically does screenshot + PDF + markdown + metadata from one endpoint. But markets itself as a "screenshot API" — not positioned for AI agents.
- **Jina Reader**: Simple URL-to-markdown. No screenshots, no PDF, no metadata.
- **Nobody** has built the clean, opinionated "one MCP tool for all web page outputs" yet.

### Our Angle

We don't out-feature Firecrawl (they have 41 employees and $14.5M). We win on:

1. **Simplicity**: One endpoint, one pricing model, no credit multipliers. "All outputs included" at every tier.
2. **Efficiency**: Single page load for all outputs. Faster and cheaper than calling separate APIs.
3. **MCP-first distribution**: The easiest way to give any AI agent web access. `npx pageyoink-mcp` and done.
4. **Clean captures**: Our 4-phase clean mode (cookie banners, chat widgets, text-content scanning, overlay detection) is genuinely best-in-class and already built.

### Key Documents

Read `docs/competitive-analysis.md` for the full competitive landscape and `docs/market-research.md` (if it exists) for the market research backing these decisions.

---

## Core Principle

**The repo is the brain.** Claude has no persistent memory between cycles. Everything Claude needs to know — what's been built, what's broken, what to do next — must exist in files within this repository. If it's not written down, it doesn't exist.

---

## The Cycle

Every Ralph Loop iteration follows this exact sequence. No exceptions.

### Phase 1: Orient (What's going on?)

```
1. Read CLAUDE.md                    → Project overview, structure, rules
2. Read docs/agent-loop.md           → This file. How to operate.
3. Read docs/status.md               → Current state of everything.
4. Read docs/tasks.md                → What needs to be done, in priority order.
```

This takes 30 seconds and gives full situational awareness. Do not skip any file. Do not start working before completing orientation.

### Phase 2: Assess (Is anything on fire?)

Before doing any planned work, check system health:

```
1. Is the service deployed?
   - If yes: Hit the health endpoint. Check response.
   - If no:  Check if deployment blockers have been resolved.

2. Are there errors?
   - Check application logs (method defined in docs/runbook.md).
   - If error rate is elevated: STOP. Fix this before anything else.

3. Are there external signals?
   - Check any monitoring endpoints.
```

**Priority override:** If the service is down or error rate is above 5%, all other work stops. Restoring service health is always the top priority.

### Phase 3: Plan (What should I do this cycle?)

Pick work based on this strict priority order:

```
Priority 1: Service is down or degraded     → Fix it
Priority 2: Security vulnerability found     → Patch it
Priority 3: Blocking bug reported            → Fix it
Priority 4: Top item in docs/tasks.md        → Work on it
Priority 5: No tasks remain                  → Improve test coverage,
                                               performance, or docs
```

**Design before you build:** For any non-trivial feature, THINK about the design before writing code. Consider: How does this fit the existing architecture? What are the edge cases? What's the simplest implementation that works? Write a brief plan (even just a few bullet points in your thinking) before touching code. The goal is clean, intentional implementation — not hacking until it works.

**Scope rule:** Each cycle should accomplish ONE meaningful unit of work. Do not start three things and finish none. A single completed task is worth more than three half-finished ones.

**If a task is too large for one cycle:** Break it into subtasks in `docs/tasks.md`, complete the first subtask, and leave clear notes for the next cycle.

### Phase 4: Execute (Do the work)

1. **Think first.** For features, sketch the design. For bugs, understand the root cause before writing a fix.
2. **Write tests first** for any new functionality (or at minimum, alongside).
3. **Make the change.** Keep commits small and atomic.
4. **Run the full test suite.** Do not commit if tests fail.
5. **Test against real-world sites** (not just example.com) when modifying capture/extraction features.
6. **Save sample output** to `samples/` for human review when relevant.
7. **If deploying:** Follow the deployment procedure in `docs/runbook.md`.

### Phase 5: Record (Write it down for future-you)

This phase is **mandatory.** Never skip it.

```
1. Update docs/status.md:
   - What did you do this cycle?
   - What is the current state of the system?
   - Is anything broken or degraded?
   - Are there any warnings or concerns?

2. Update docs/tasks.md:
   - Mark completed tasks as done.
   - Add any new tasks discovered during work.
   - Re-prioritize if needed.

3. If you made an architectural decision:
   - Record it in docs/decisions.md with rationale.

4. If you discovered a new operational procedure:
   - Add it to docs/runbook.md.

5. Commit all doc updates.
```

---

## Key Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/status.md` | Current project state — what's done, what's next, what's broken |
| `docs/tasks.md` | Prioritized work queue |
| `docs/decisions.md` | Why we made key choices (prevents re-litigating) |
| `docs/runbook.md` | Operational procedures |
| `docs/competitive-analysis.md` | Feature comparison vs competitors — read before adding features |

---

## Testing Standards

**Never test only against example.com.** It's a trivially simple page that doesn't exercise real-world edge cases.

When modifying screenshot, PDF, extraction, or clean mode features, test against:
- A JS-heavy site (e.g., github.com, stripe.com/docs)
- A content-heavy news site (e.g., bbc.com, nytimes.com)
- A site with known cookie banners (e.g., hubspot.com)
- A simple site for baseline (e.g., example.com, news.ycombinator.com)

Save output to `samples/` for human review. Compare before/after when fixing rendering issues.

**Known rendering issues:**
- BBC "Weekend Reads" horizontal carousel: images don't render in Chrome's PDF engine due to CSS layout incompatibility with print rendering. This is a Chromium limitation, not a PageYoink bug. Affects all Chrome-based PDF tools.
- NYTimes: first screenshot attempt may fail with "Connection closed" — retry logic handles this.
- NYTimes: their print stylesheet hides the masthead/logo. Our print-fix CSS forces headers visible but NYTimes uses high-specificity selectors that override it. Site-specific issue.
- Stripe Docs: slow renders (~17s) due to long-running network requests.

**TypeScript gotcha:** Never declare named functions inside `page.evaluate()` callbacks — TypeScript's decorator transform adds `__name` which doesn't exist in the browser context. Use anonymous arrow functions or `setInterval` instead.

---

## Operational Boundaries

### What Claude Can Do Autonomously
- Write and commit code
- Run tests
- Deploy via git push (auto-deploy configured via Cloud Build)
- Update documentation
- Monitor health endpoints
- Fix bugs
- Add features from the task queue
- Refactor code for maintainability
- Respond to errors visible in logs
- Generate sample output for human review
- Design and implement features listed in the task queue

### What Requires Human Intervention
- Creating accounts (hosting, payment processors, domain registrar)
- Setting environment variables / secrets on hosting platform
- DNS configuration
- Responding to billing issues
- Decisions that significantly change the product direction
- Anything requiring authentication credentials Claude doesn't have access to
- Publishing to npm (if credentials aren't configured)

### What Claude Should Never Do
- Delete the production database
- Force push to main
- Commit secrets, API keys, or credentials
- Deploy with failing tests
- Ignore a service outage to work on features
- Make breaking API changes without versioning
- Exceed the budget without explicit approval

---

## Project Phases

```
Phase A: Foundation                    ✅ COMPLETE
Phase B: Core Capture Features         ✅ COMPLETE (screenshot, PDF, clean mode, batch, diff)
Phase C: Deployment                    ✅ COMPLETE (Google Cloud Run)
Phase D: Competitive Parity            ✅ COMPLETE (CSS/JS injection, headers, caching, ad blocking, etc.)
Phase E: Unified Page API              🔲 IN PROGRESS — The pivot to "one URL, everything out"
Phase F: MCP Server                    🔲 NEXT — Distribution via AI agent ecosystem
Phase G: Landing Page Rebuild          🔲 NEXT — New positioning, multi-output demo
Phase H: Launch & Distribution         🔲 FUTURE — Product Hunt, HN, integrations
Phase I: Monetization                  🔲 BLOCKED (needs Stripe + domain)
Phase J: Polish & Iteration            🔲 FUTURE (based on user feedback)
```

---

## Recovering From Confusion

If future-Claude reads the status file and something doesn't make sense:

1. **Do not guess.** Do not assume. Do not "just try things."
2. Run `git log --oneline -20` to see recent commit history.
3. Run `git diff HEAD~5` if recent changes might explain the confusion.
4. Check `docs/decisions.md` for context on past choices.
5. If still confused, leave a clear note in `docs/status.md` describing the confusion and what you tried, so the next cycle (or a human) can address it.
6. Work on something else that IS clear rather than making potentially wrong changes to something you don't understand.

---

## Anti-Patterns

These are mistakes that autonomous Claude is prone to. Watch for them.

**Coding before thinking:** Jumping straight into implementation without considering the design. For any feature that touches the API surface, think about: the endpoint shape, what the response looks like, how it fits with existing endpoints, what edge cases exist. A few minutes of design prevents hours of rework.

**Yak shaving:** Starting a task, discovering a side issue, chasing that, discovering another, and accomplishing nothing. If a side issue blocks your task, note it in the task queue and either work around it or switch to a clear task.

**Perfectionism:** Spending an entire cycle refactoring code that works. Ship working software. Refactor when there's a concrete reason.

**Amnesia denial:** Assuming you remember something from a prior cycle. You don't. Read the docs.

**Silent failure:** Making a change, seeing it doesn't work, reverting, and moving on without documenting what happened. Always record what you tried and what went wrong.

**Scope creep:** "While I'm in here, I might as well..." No. Finish the task you started, commit it, then start a new task if time permits.

**Doc rot:** Updating code but not docs. The docs ARE your memory. If they're wrong, future-you is lost.

**Testing against example.com only:** A trivially simple page proves nothing. Always test rendering changes against real-world complex sites. See Testing Standards above.

**Spinning on blocked tasks:** If all remaining tasks require human action, do meaningful work from the icebox or improve test coverage. If nothing productive remains, say so clearly rather than doing busywork.

---

## Philosophy

This system works because of a simple contract:

> **Past-Claude's job:** Do good work AND leave clear notes.
> **Future-Claude's job:** Read the notes AND continue the work.

Neither half works without the other. The code is the product. The docs are the continuity. Both are essential.
