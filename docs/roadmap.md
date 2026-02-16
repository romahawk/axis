# AXIS Roadmap (Execution-First)

Last updated: 2026-02-16

## Scope and Constraints
- Product: AXIS personal execution dashboard (single-page app + review drawer).
- Constraint: prioritize small, reversible changes that improve execution reliability.
- Owner profile: solo builder; roadmap is intentionally tight and outcome-based.

## Source of Truth
- Product rules: `docs/AI-prompts/AXIS.md`
- Frontend shell and main flow: `frontend/src/App.tsx`, `frontend/src/pages/DashboardPage.tsx`
- Dashboard payload contract: `frontend/src/hooks/useDashboardView.ts`, `backend/main.py`
- Journal/review flows: `frontend/src/components/review/ReviewDrawer.tsx`, `frontend/src/hooks/useJournal.ts`, `backend/main.py`
- Deployment/runtime config: `frontend/src/config/api.ts`, `backend/fly.toml`, `backend/Dockerfile`

## Now (1-2 Weeks)

### 1) Stabilize core dashboard usability on mobile and desktop
Outcome:
- Dashboard is usable at common mobile/tablet widths without horizontal overflow or trapped scroll areas.

Definition of Done:
- Main flow (`Week Outcomes -> Today Top 3 -> Close Day -> Review`) works on 360px+ viewport.
- No forced 3-column layout below desktop breakpoint.
- Manual pass completed for 360px, 768px, 1280px widths.

Primary files:
- `frontend/src/App.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/index.css`

### 2) Make error/loading states actionable in core flows
Outcome:
- Users can recover from transient API failures without page reloads.

Definition of Done:
- Dashboard fetch errors show clear message + retry action.
- Form save failures in Top3/Week/Resources remain visible until resolved or canceled.
- Journal timeline error state includes recovery path (refresh present and validated).

Primary files:
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/components/review/ReviewDrawer.tsx`
- `frontend/src/features/dashboard/*`

### 3) Align docs and runtime truth
Outcome:
- Setup and navigation docs match current app behavior.

Definition of Done:
- Root `README.md` routes/commands verified against running app.
- `frontend/README.md` replaced with project-specific instructions.
- Environment variable expectations documented for local and production.

Primary files:
- `README.md`
- `frontend/README.md`
- `frontend/src/config/api.ts`

## Next (2-6 Weeks)

### 1) Add confidence checks around critical backend contracts
Outcome:
- Regressions in `/api/v1/views/dashboard`, `/api/v1/today/top3`, `/api/v1/journal/*` are caught early.

Definition of Done:
- Minimal automated API tests cover happy path + invalid payload for each critical endpoint family.
- Test run command documented and runnable in CI/local.

Primary files:
- `backend/main.py`
- `backend/tests/*` (new)
- `backend/requirements.txt`

### 2) Improve information architecture for power usage
Outcome:
- Users find and act in primary panels faster with less scanning.

Definition of Done:
- Left dock, center execution, right capture/review are visually and behaviorally consistent across breakpoints.
- Panel headers/actions follow a consistent pattern (title, helper text, primary action, secondary action).

Primary files:
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/components/Panel.tsx`
- `frontend/src/features/dashboard/*`

### 3) Harden accessibility baseline
Outcome:
- Keyboard-first usage and focus visibility are reliable.

Definition of Done:
- Focus-visible styling standardized.
- Drawer behavior is keyboard-safe (focus handling + ESC + background inert behavior).
- Icon-only controls have accessible names.

Primary files:
- `frontend/src/index.css`
- `frontend/src/components/review/ReviewDrawer.tsx`
- `frontend/src/features/dashboard/projectsRouter/ProjectsRouterPanel.tsx`

## Later (6-12 Weeks)

### 1) Performance and payload efficiency pass
Outcome:
- Faster first interaction and smoother panel interactions.

Definition of Done:
- Bundle/report baseline captured.
- Non-critical UI blocks code-split where practical.
- Expensive list/panel rendering hotspots profiled and reduced.

Primary files:
- `frontend/src/main.tsx`
- `frontend/src/components/review/*`
- `frontend/src/features/dashboard/*`

### 2) Data integrity and migration posture for persisted JSON docs
Outcome:
- Corrupted or legacy docs are handled predictably without silent breakage.

Definition of Done:
- Backend normalization behavior documented with examples.
- Backup/restore notes for `/data` volume documented.
- At least one migration path documented for schema evolution.

Primary files:
- `backend/main.py`
- `docs/view-payloads.md`
- `docs/*` (new ops notes)

### 3) Optional multi-user/auth hardening (only if product scope changes)
Outcome:
- Current single-user assumptions are explicitly isolated.

Definition of Done:
- Auth model decision documented.
- API boundaries that assume a single identity are listed and triaged.

Primary files:
- `backend/main.py`
- `frontend/src/hooks/useMe.ts`
- `docs/*` (auth decision note)

## Explicit Non-Goals (Near Term)
- No full frontend architecture rewrite.
- No design system migration.
- No state management framework replacement.
- No microservice or backend decomposition.
- No broad feature expansion beyond execution + closeout core loop.
