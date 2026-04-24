# JeliTraining — Project State

> **For future Claude sessions:** read this file first. It tracks what's done, what's next, and the constraints/conventions that aren't obvious from the code alone.
>
> **Update rule:** whenever a phase ships (PR merged) or a decision is made, update the relevant section in the same PR. Keep it short — this is a handoff doc, not documentation.

---

## Current status

- **Branch of record:** `main`
- **Last merged:** PR #15 — Weekly availability config (Phase 2c), commit `a649f5c`
- **Next target:** Phase 3a — Email invites via Resend (manual button + serverless function)
- **App status:** live in production, used by a real trainer. Do not break.

---

## Calendar roadmap

| Phase | Scope | Status | PR |
|---|---|---|---|
| 1 | Read-only calendar view behind `VITE_CALENDAR_ENABLED` flag | ✅ merged | `4c412c8` |
| 2a | Event CRUD with time-of-day support | ✅ merged | #13 |
| 2b | iPhone `.ics` subscription feed (webcal, Vercel serverless) | ✅ merged | #14 |
| 2c | Weekly availability config in Settings | ✅ merged | #15 |
| 3a | Manual "Send invite" button + `api/send-invite.js` (Resend, HTML + `.ics`) | 🚧 in progress | — |
| 3b | Email template polish (HTML layout, French copy, sender identity) | 💭 later | — |
| 3c | Auto-send on event create or bulk resend | 💭 later | — |
| later | Recurring events, reminders, client view | 💭 not planned | — |

---

## Phase 3a — decisions locked in

1. **Platform** — Vercel serverless function (`api/send-invite.js`), matches Phase 2b pattern.
2. **Trigger** — manual "Envoyer l'invitation" button inside the event edit modal. Auto-send + bulk resend deferred to 3c.
3. **Content** — HTML email body (French) + `.ics` attachment built with the existing `buildICal` helper (`METHOD:PUBLISH`).

### Phase 3a env + prep

- ✅ **Resend API key rotated.** Old `re_cLUPmnNM_...` was pasted in chat once — replaced with a fresh key in Vercel.
- ⏳ **Sender domain NOT verified yet** — no custom domain (using `*.vercel.app`). Resend sandbox sender `onboarding@resend.dev` only delivers to the Resend account owner's email. So 3a can be shipped and self-tested, but real client delivery is blocked until a domain is bought + DNS-verified in Resend. Defer domain purchase decision.
- Vercel env vars:
  - `RESEND_API_KEY` — **server-only** (no `VITE_` prefix). Preview + Production.
  - `INVITE_FROM_EMAIL` — server-only. Leave unset for now; defaults to `onboarding@resend.dev`. Set once a domain is verified.
  - `VITE_INVITE_TOKEN` — dual-use (same pattern as `VITE_ICAL_FEED_TOKEN`). Shared secret the SPA sends with every POST; server rejects anything else. Generate with `openssl rand -hex 32`. Preview + Production.
- Resend free tier: 3k emails/month, 100/day.

### Phase 3a abuse protection

The serverless function takes `{ clientId, sessionId, token }` — **not** a user-supplied email. Server loads the client row from Supabase and uses the stored email, so a leaked token can't fan out to arbitrary recipients.

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
- `api/send-invite.js` — Resend-backed client invite. POST `{ clientId, sessionId, token }`, server looks up client + session in Supabase and emails the stored address with an `.ics` attachment. (Phase 3a)
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
