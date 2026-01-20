# Sprint 2 Closure — Axis Execution Enablers

## Sprint Name
**Sprint 2 — Right Sidebar + Daily/Weekly Loop Hardening**

## Sprint Goal
Reduce cognitive load by tightening the **capture → execute → close** loop:

- **Capture:** frictionless Inbox buffer (right sidebar)
- **Execute:** Today Top 3 as the single daily execution surface
- **Close:** clear “day completed” state + soft end-of-day signal
- **Week:** minimal “week is set” signal (no weekly task management)

---

## Scope & Constraints
- **Frontend-only** changes (no backend schema or new endpoints)
- Minimal UI, execution-first
- Inbox is a **temporary buffer**, not a task manager
- Week remains **orientation + closure**, not execution

---

## What Shipped

### 1) Right Sidebar — simplified to execution helpers
**Final right sidebar composition:**
- **NOW**: live time awareness + link-out to Google Calendar
- **Inbox**: capture buffer with expandable list

**Removed from right sidebar (to cut noise):**
- Calendar/Agenda embed (skipped for now)
- Anchors panel
- Drift panel

### 2) Inbox v1 — frictionless capture buffer
**Behavior:**
- Multiline input
- **Enter = save**, **Shift+Enter = newline**
- Clears after save
- Items appear instantly
- Expand/collapse inbox list (persisted)

**Actions (minimal):**
- **➕ Today** (promotes into Today Top 3)
- **🗑 Dismiss**

**Persistence:**
- `localStorage.axis_inbox_v1` — array of inbox items
- `localStorage.axis_inbox_open_v1` — list expanded/collapsed

### 3) Today — close the daily loop
**Execute vs Edit is explicit:**
- Execute mode is the default
- Edit mode is intentional via “Edit”

**Execution loop features:**
- Progress bar (0–100%)
- Done state persists (existing API)
- Visual “Day completed” state when 3/3 are done
- Soft end-of-day signal after 18:00 if not completed
- Hide checked toggle
- Auto-hide checked when completed
- “Close day” action resets Today to placeholders (uses existing endpoint)

**Persistence:**
- `localStorage.axis_today_hide_checked_v1`

### 4) Week — minimal progress control
Weekly outcomes remain exactly 3, but now have a **set-progress signal**:
- `0/3 set` → not set
- `1–2/3 set` → in progress
- `3/3 set` → **WEEK SET** (subtle green state)

No weekly checkboxes; execution happens via Today.

Also included:
- Late-week soft warning Sunday 18:00+ if week not set

---

## System Architecture (current)
Sprint 2 builds on the **feature-based dashboard modularization** completed previously (composition in `pages/`, domain UI + logic in `features/dashboard/`, primitives in `components/`).

### Key modules
- `pages/DashboardPage.tsx` — layout/composition only
- `features/dashboard/panels/NowPanel.tsx` — time awareness
- `features/dashboard/panels/InboxPanel.tsx` — capture buffer
- `features/dashboard/todayTop3/TodayTop3Panel.tsx` — daily execution loop UI
- `features/dashboard/weekOutcomes/WeekOutcomesPanel.tsx` — weekly set state UI
- `components/Panel.tsx` — UI primitive wrapper

### Client-side storage
- Inbox: `axis_inbox_v1`, `axis_inbox_open_v1`
- Today hide checked: `axis_today_hide_checked_v1`

---

## Data Flow (no backend changes)

### Inbox → Today
1. User captures item (saved to localStorage)
2. User promotes item to Today
3. Frontend updates Today Top 3 using existing endpoint
4. Inbox item removed locally

### Today execution
- Done toggle uses existing Today toggle mutation endpoint (already present)
- “Close day” uses existing Today Top 3 endpoint to reset placeholders

### Week outcomes
- Edit/save uses existing weekly outcomes endpoint (already present)
- Week set state is derived (frontend-only) from filled outcomes

---

## Sprint 2 Definition of Done — Status
✅ Right sidebar supports daily use (time awareness + capture buffer)
✅ Inbox capture is effortless; list is expandable and persists
✅ Today loop has completion state and reduces end-of-day ambiguity
✅ Week has a clear “set” signal without becoming a task list
✅ No backend changes required

**Sprint 2 can be closed.**

---

## Commit Plan (GitHub Desktop or CLI)

### Recommended commit message
```
feat(axis): sprint 2 execution enablers (now + inbox + today/ week polish)
```

### Sanity checks before commit
- `npm run build` (frontend)
- Quick smoke test in browser:
  - Inbox saves on Enter / expands
  - ➕ Today promotes and clears item
  - Today checkboxes persist + auto-hide on 3/3
  - Week outcomes shows correct set state

### Files expected in commit (high level)
- Right sidebar composition (remove agenda/anchors/drift)
- `NowPanel`, `InboxPanel` updates
- `TodayTop3Panel` loop closure updates
- `WeekOutcomesPanel` minimal progress updates

---

## Next Sprint Candidates (keep it small)
- Keyboard-first microflows (focus, promote, dismiss)
- “Today full” safety behavior (avoid silent overwrite)
- Weekly review snapshot (minimal, text-only)

