# Agent Loop: How Claude Operates Autonomously

This is the foundational document of the MoneyMaker project. It governs how Claude operates across Ralph Loop cycles, compensating for the fundamental constraint that each cycle starts with a fresh context and no memory of prior cycles.

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
   - If no:  This is the top priority unless blocked.

2. Are there errors?
   - Check application logs (method defined in docs/runbook.md).
   - If error rate is elevated: STOP. Fix this before anything else.

3. Are there external signals?
   - Check RapidAPI dashboard/reviews if accessible.
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

**Scope rule:** Each cycle should accomplish ONE meaningful unit of work. Do not start three things and finish none. A single completed task is worth more than three half-finished ones.

**If a task is too large for one cycle:** Break it into subtasks in `docs/tasks.md`, complete the first subtask, and leave clear notes for the next cycle.

### Phase 4: Execute (Do the work)

1. **Create or update a branch** if the change is non-trivial.
2. **Write tests first** for any new functionality (or at minimum, alongside).
3. **Make the change.** Keep commits small and atomic.
4. **Run the full test suite.** Do not commit if tests fail.
5. **If deploying:** Follow the deployment procedure in `docs/runbook.md`.

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

## Status File Format

`docs/status.md` is the most important file in the project. It is the primary channel of communication between past-Claude and future-Claude. It must always reflect ground truth.

```markdown
# Project Status

## Last Updated
YYYY-MM-DD HH:MM (by which cycle / what was done)

## System State
- Deployed: yes/no
- Health: healthy / degraded / down
- Last known error rate: X%
- Paying customers: N
- Monthly revenue: $X

## What Just Happened
(Brief description of the most recent work completed)

## Current Blockers
(Anything preventing progress. Include specifics — error messages,
URLs, exact symptoms.)

## Warnings
(Things that aren't broken yet but might be soon — usage approaching
limits, dependencies with known vulnerabilities, etc.)
```

---

## Task File Format

`docs/tasks.md` is the prioritized work queue. Keep it honest — only tasks that actually need doing.

```markdown
# Task Queue

## In Progress
- [ ] Task description (started YYYY-MM-DD, context: brief note)

## Up Next (Priority Order)
1. [ ] Highest priority task
2. [ ] Second priority task
3. [ ] Third priority task

## Done
- [x] Completed task (YYYY-MM-DD)
- [x] Another completed task (YYYY-MM-DD)

## Icebox (Nice to have, not now)
- [ ] Future idea
- [ ] Another future idea
```

---

## Decision Log Format

`docs/decisions.md` prevents future-Claude from re-litigating settled questions.

```markdown
## YYYY-MM-DD: Decision Title

**Context:** What situation prompted this decision?
**Decision:** What was decided?
**Rationale:** Why this and not alternatives?
**Alternatives considered:** What else was on the table?
**Status:** Active / Superseded by [link]
```

---

## Operational Boundaries

### What Claude Can Do Autonomously
- Write and commit code
- Run tests
- Deploy via git push (if auto-deploy is configured)
- Update documentation
- Monitor health endpoints
- Fix bugs
- Add features from the task queue
- Refactor code for maintainability
- Respond to errors visible in logs

### What Requires Human Intervention
- Creating accounts (RapidAPI, hosting platform, Stripe, domain registrar)
- Setting environment variables / secrets on hosting platform
- DNS configuration
- Responding to billing issues
- Decisions that significantly change the product direction
- Anything requiring authentication credentials Claude doesn't have access to

### What Claude Should Never Do
- Delete the production database
- Force push to main
- Commit secrets, API keys, or credentials
- Deploy with failing tests
- Ignore a service outage to work on features
- Make breaking API changes without versioning
- Exceed the budget without explicit approval

---

## Bootstrapping Sequence

When the project is brand new (nothing built yet), follow this sequence:

```
Phase A: Foundation
  1. Initialize Node.js project
  2. Set up project structure
  3. Set up testing framework
  4. Set up linting
  5. Create basic Express/Fastify server with health endpoint
  6. Write first test
  7. Commit everything

Phase B: Core Feature
  1. Implement screenshot endpoint (URL → PNG)
  2. Implement HTML-to-PDF endpoint
  3. Add input validation and error handling
  4. Add rate limiting
  5. Add API key authentication
  6. Write comprehensive tests
  7. Commit and verify

Phase C: Deployment
  1. Containerize with Docker
  2. Configure hosting platform (needs human for account setup)
  3. Set up auto-deploy from git push
  4. Verify health endpoint works in production
  5. Document deployment in runbook

Phase D: Monetization
  1. List on RapidAPI (needs human for account setup)
  2. Configure pricing tiers
  3. Add usage tracking
  4. Set up Stripe for direct sales (needs human for account setup)

Phase E: Differentiation
  1. Add cookie banner / popup removal
  2. Add smart readiness detection
  3. Add OG image template support
  4. Add batch processing with webhooks
  5. Content-aware PDF pagination
```

Each phase is a series of tasks that get added to `docs/tasks.md` when the prior phase is complete. Do not load all phases into the task queue at once — focus on the current phase.

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

**Yak shaving:** Starting a task, discovering a side issue, chasing that, discovering another, and accomplishing nothing. If a side issue blocks your task, note it in the task queue and either work around it or switch to a clear task.

**Perfectionism:** Spending an entire cycle refactoring code that works. Ship working software. Refactor when there's a concrete reason.

**Amnesia denial:** Assuming you remember something from a prior cycle. You don't. Read the docs.

**Silent failure:** Making a change, seeing it doesn't work, reverting, and moving on without documenting what happened. Always record what you tried and what went wrong.

**Scope creep:** "While I'm in here, I might as well..." No. Finish the task you started, commit it, then start a new task if time permits.

**Doc rot:** Updating code but not docs. The docs ARE your memory. If they're wrong, future-you is lost.

---

## Philosophy

This system works because of a simple contract:

> **Past-Claude's job:** Do good work AND leave clear notes.
> **Future-Claude's job:** Read the notes AND continue the work.

Neither half works without the other. The code is the product. The docs are the continuity. Both are essential.
