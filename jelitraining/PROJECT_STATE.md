# JeliTraining — Project State

> **For future Claude sessions:** read this file first. It tracks what's done, what's next, and the constraints/conventions that aren't obvious from the code alone.
>
> **Update rule:** whenever a phase ships (PR merged) or a decision is made, update the relevant section in the same PR. Keep it short — this is a handoff doc, not documentation.

---

## Current status

- **Branch of record:** `main`
- **Last merged:** PR #22 — Polish email template, logo, brand colors, WhatsApp contact (Phase 3b.2)
- **Next target:** Phase 3c.1 — Bulk resend (manual button to send invites for all upcoming sessions of a client, or all in next N days)
- **App status:** live in production, used by a real trainer. Do not break.
- **Pending prod rollout:** `VITE_CALENDAR_ENABLED` is still `false` in Vercel Production — calendar + réglages tabs are built and shipped but not visible on the live app yet. Flip the env var + redeploy when ready to expose to the trainer.

---

## Calendar roadmap

| Phase | Scope | Status | PR |
|---|---|---|---|
| 1 | Read-only calendar view behind `VITE_CALENDAR_ENABLED` flag | ✅ merged | `4c412c8` |
| 2a | Event CRUD with time-of-day support | ✅ merged | #13 |
| 2b | iPhone `.ics` subscription feed (webcal, Vercel serverless) | ✅ merged | #14 |
| 2c | Weekly availability config in Settings | ✅ merged | #15 |
| 3a | Manual "Send invite" button + `api/send-invite.js` (Resend, HTML + `.ics`) | ✅ merged | #16 |
| 3b.1 | Extract template module + plain-text fallback + Reply-To support | ✅ merged | #21 |
| 3b.2 | Visual + copy polish: logo, brand colors, emoji icons, WhatsApp contact | ✅ merged | #22 |
| 3c.1 | Bulk resend (one click → invites for all upcoming sessions of a client) | 💭 next | — |
| 3c.2 | Auto-send on event create (with safety guards: ≥ tomorrow, opt-in toggle) | 💭 later | — |
| later | Recurring events, reminders, client view | 💭 not planned | — |

---

## Hard constraints

- **Zero budget.** Free tiers only. Confirm before proposing anything paid.
- **Phased PRs by default.** User is an early-career dev and treats PRs as training. Split by default; bundle only when splitting would create churn.
- **Feature flag everything calendar-related** behind `VITE_CALENDAR_ENABLED` until it's fully proven. The flag is build-time — changing it requires a redeploy.
- **Real production data.** Don't touch Supabase rows outside of clearly-scoped migrations.
- **Branch from `origin/main` directly.** `main` lives in another Conductor worktree; don't try to check it out here.

---

## Architecture cheat sheet

### Frontend (`jelitraining/src/`)

- React 19 + Vite SPA, no router — view state is managed in `App.jsx`.
- Components under `src/components/`. `Calendar.jsx` is the large one (week/day/event views).
- Pure helpers: `calendar-utils.js`, `ical-utils.js`, `availability-utils.js` — all unit-tested with Vitest.
- `lib.js` holds the localStorage helpers and cache keys.

### State / sync (`jelitraining/src/api.js`)

Everything persists to a single Supabase `store` table (key-value). Known keys:

| Key | Shape | Notes |
|---|---|---|
| `jeli-client-<id>` | one row per client, JSON-encoded | Clients + their sessions (sessions embedded, flattened on read). |
| `jeli-availability` | singleton, JSON `{mon:{off,start,end}, ...}` | Phase 2c. |
| `jeli-pw-hash` | singleton, string | App password. |
| `jeli-store` | **legacy**, one blob with all clients | Read-only for migration, do not write. |

### Serverless (`jelitraining/api/`)

- `api/ical.js` — iPhone `.ics` feed. Token-gated via `VITE_ICAL_FEED_TOKEN` query param.
- `api/send-invite.js` — Resend-backed client invite. POST `{ clientId, sessionId, token }`, server looks up client + session in Supabase and emails the stored address with an `.ics` attachment. Email body is built in `src/email-template.js` (importable + unit-tested).
- **Invite endpoint security:** the function takes `{ clientId, sessionId, token }` — never a user-supplied email. Server reads the stored email from Supabase, so a leaked token can't fan out to arbitrary recipients.
- ESLint: `api/**/*.js` is treated as Node globals (see `eslint.config.js` override).
- **Gotcha:** Vercel Preview Protection gates `/api/*` behind SSO — external clients (iOS subscription, `curl`) fail on Preview URLs until protection is toggled off in project settings. Test serverless endpoints on production or toggle protection temporarily. ([memory note](~/.claude/projects/-Users-salmaouardi-conductor-repos-trainer-app/memory/project_vercel_preview_protection.md))

### Env vars

- `VITE_*` — baked into the client bundle at build time. Changing requires redeploy (no build cache).
- Non-prefixed — server-only, available to `api/**` via `process.env`.
- `VITE_ICAL_FEED_TOKEN` is dual-use: server validates it; client builds the subscription URL with it. That's why it has the `VITE_` prefix even though it's a "secret."

---

## Conventions worth keeping

- **French UI copy.** The trainer is francophone; all user-facing strings are in French.
- **Tests live next to source** as `*.test.js` (Vitest). Run `npm test` from `jelitraining/`.
- **Commit format:** single-line imperative present tense ("Add X", "Fix Y"). PR titles match.
- **Co-author trailer** on all AI-assisted commits: `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.

---

## How to update this doc

- When a PR merges: flip the row in the roadmap table, update "Current status", clear obsolete "pending decisions".
- When a new constraint is learned: add to "Hard constraints" — keep to one line each.
- When the architecture changes (new store key, new serverless route): update the cheat sheet.
- Don't turn this into a changelog. Git log is the changelog. This doc is "where are we and what's next."
