# Axis v0.5 — Review & Journal Release

Tag: `axis-v0.5`  
Branch: `personal-stable` (recommended)  
Release date: 2026-01-22

## Status
**STABLE / DAILY-USABLE**

v0.5 keeps the v0.4 “execution cockpit” contract, and adds a **review + journaling loop** with production-safe persistence and better UX guardrails.

---

## What’s new vs v0.4

### 1) Review & Journal loop (major)
- **Review button** in the top header (next to AXIS Guide).
- **Review Drawer** (right-side drawer, consistent sci‑fi glass styling) with tabs:
  - Daily Closeout (wins / miss / fix)
  - Journal timeline (daily entries)
  - Weekly review tab scaffold (UI placeholder; logic next)
- **Daily Closeout → Journal** workflow:
  - Save a closeout entry
  - Entry includes an **automatic snapshot** of Today/Week/Projects at time of logging

### 2) Journal backend (major)
New backend persistence and endpoints for journaling:
- `GET /api/v1/journal?limit=…&type=daily|weekly`
- `POST /api/v1/journal/daily`
- `POST /api/v1/journal/weekly`
- `PATCH /api/v1/journal/{id}` (edits content fields only; timestamps immutable)
- `DELETE /api/v1/journal/{id}`

Design rules:
- **`created_at` is immutable**
- **`snapshot` is immutable**
- Journal is a **ledger** (historical record), not “current state”

### 3) Production stability fixes (major)
- Fixed production bugs caused by **relative `/api/...` calls on Vercel**:
  - All relevant calls now respect `VITE_API_BASE_URL` (Fly backend), preventing Vercel `NOT_FOUND` failures.
- Today Top 3 toggles now use canonical endpoint:
  - `PATCH /api/v1/today/top3/{id}` with `{ done: boolean }`

### 4) EOD is manual (UX)
- End-of-day (EOD) mode is now **manual toggle** (on/off) instead of time-based.
- Persisted via local storage.
- EOD warning appears only when EOD is enabled and the day is not completed.

### 5) Projects Router UX fixes
- **Link editor overlap fixed** in narrow sidebar:
  - Responsive layout: stacks fields on narrow widths; grid on larger widths.
- Project display:
  - Prevent internal project keys from leaking into normal UI (key visible only in edit/debug contexts).

### 6) Active Projects clarity
- Center “Active Projects (max 3)” displays **project name** (not internal key).
- Active projects show **Execution space** link when available (derived from project links such as “Execution space” or “Trello”).

### 7) Axis Guide readability (UI polish)
- Improved Axis Guide drawer readability:
  - Better contrast, typography, spacing
  - Sci-fi glass background refinements

---

## What remains unchanged (still true from v0.4)
- Same stable 3-column cockpit: Dock / Execution spine / Awareness+Inbox
- Weekly outcomes = 3; Today items = 3; Active projects max = 3
- Inbox capture stays frictionless, lightweight, and intentionally limited
- Same “no second-brain / no PM tool” stance

---

## Breaking changes / behavioral changes
- EOD is no longer time-triggered (18:00). It is manual.
- Journal is append-only by default (multiple daily entries can exist for one date).  
  - This is intentional: every closeout is an event.
  - If needed later, UI can “group by day” or enforce “one daily closeout per date”.

---

## Known limitations (v0.5)
- Weekly Review UI is scaffolded but not fully wired yet (Daily + Journal is the working loop).
- Journal UI improvements still pending:
  - grouping by day/week
  - search / filtering chips (daily/weekly)
  - expandable snapshot view (collapsible)
- No multi-user/auth hardening beyond current MVP.

---

## Recommended tagging + deployment process
1) Ensure `VITE_API_BASE_URL` points to the Fly backend.
2) Ensure Fly volume is mounted and backend `DATA_DIR` points to that mount (so journal/week/today/projects persist across deploys).
3) Tag and deploy:
   - `axis-v0.5` on `personal-stable`

---

## Comparison summary (v0.4 → v0.5)
v0.4 answered:
> “What matters this week and today?”

v0.5 also answers:
> “What actually happened — and what changes tomorrow?”

That closes the loop from **execution → reflection → iteration**.
