# Axis v0.4 — Personal Stable Release

## Status
**LOCKED / STABLE**

This release marks the first **daily-usable personal version** of Axis.
All core execution loops are functional, visually coherent, and intentionally limited.

Tag: `axis-v0.4`  
Branch: `personal-stable`

---

## Purpose of this release
Axis v0.4 is designed to be:
- a **daily execution cockpit**
- fast to open
- low cognitive load
- safe to rely on without fear of breaking changes

No experimental features should be merged into this release branch.

---

## What is included

### Core layout (stable)
- **Left sidebar**: routing & speed
  - Collapsible sci‑fi dock
  - Weekly resource shortcuts
  - Project-based routing
  - Visual de‑emphasis of inactive projects
- **Center column**: execution
  - Weekly Top 3 Outcomes (set / in progress / locked)
  - Active Projects (max 3)
  - Today Top 3 (execute-first loop)
  - Blockers / Risks (weekly)
  - Resources (weekly)
- **Right sidebar**: awareness & capture
  - Current time (read-only)
  - Inbox buffer (capture now, decide later)

---

## Execution logic (guaranteed)

### Weekly loop
- Exactly 3 weekly outcomes
- Clear “week set” vs “in progress” state
- Progress indicator
- Manual edit only when needed

### Daily loop
- Exactly 3 Today items
- Execute-first mode
- Completion persists
- Visual day-progress indicator
- End-of-day closure supported

### Inbox
- Frictionless multiline capture
- Enter = save, Shift+Enter = newline
- Items buffered locally
- Explicit send-to-Today action
- Dismiss supported
- Expand / collapse state persisted

---

## UI / UX principles locked in

- Semantic background tones:
  - Week = cyan
  - Focus / projects = indigo
  - Today = emerald
  - Risks = rose
- One-surface sci‑fi aesthetic
- Consistent spacing, borders, and radii
- Lucide icons used for clarity (not decoration)
- No unused or misleading indicators (e.g. MODE flag removed)

---

## Explicitly out of scope (by design)

- Task management system
- Project planning inside Axis
- Tool embedding
- Data sync with external tools
- Google Calendar API integration
- Advanced auth / multi-user logic
- Automation or AI assistance

Axis is **not** a second brain or PM tool.
It is an execution control layer.

---

## Known limitations (accepted)

- Personal usage only
- No offline-first guarantees
- Backend required for persistence
- No keyboard navigation layer yet
- Collapsed dock has no icon shortcuts (intentional)

---

## Deployment intent

Recommended setup:
- **Personal deployment** from `personal-stable`
- Password-protected
- Stable URL (e.g. `axis.<domain>`)
- Auto-deploy on push

Experimental work continues on `main`.

---

## Change policy after v0.4

Allowed:
- Bug fixes
- Minor UX polish
- Performance improvements

Not allowed:
- New core concepts
- New panels
- Scope expansion
- Structural refactors

Any larger change requires a new tagged release.

---

## Mental contract

Axis v0.4 exists to answer one question daily:

> “What actually matters **this week** and **today**, and am I executing it?”

If a feature does not help answer that question faster, it does not belong here.
