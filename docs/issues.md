# AXIS Backlog (Actionable Issues)

Updated: 2026-02-16

## P0

### P0-1: Fix responsive dashboard layout and scrolling behavior
- Effort: `M`
- Dependencies: none
- Scope: `frontend/src/App.tsx`, `frontend/src/pages/DashboardPage.tsx`
- Acceptance criteria:
1. Dashboard has no horizontal overflow at 360px width.
2. Layout is single-column on mobile, multi-column only at defined breakpoints.
3. Main user journey (week outcomes -> today top3 -> close day -> review) is fully usable on mobile and desktop.
4. Nested scroll containers are limited to desktop breakpoints where intended.

### P0-2: Correct setup and navigation docs to match actual app behavior
- Effort: `S`
- Dependencies: none
- Scope: `README.md`, `frontend/README.md`
- Acceptance criteria:
1. Documented URLs match actual available app entrypoints.
2. Frontend README is project-specific (not Vite template boilerplate).
3. Local run commands and env var expectations are accurate and verified.

## P1

### P1-1: Add retry and improved recovery messaging for dashboard load failures
- Effort: `S`
- Dependencies: none
- Scope: `frontend/src/pages/DashboardPage.tsx`, optional `frontend/src/App.tsx`
- Acceptance criteria:
1. Error state includes explicit retry control.
2. Retry re-triggers dashboard query without full page refresh.
3. Error message remains visible and understandable until resolved.

### P1-2: Add empty state for Resources panel in view mode
- Effort: `S`
- Dependencies: none
- Scope: `frontend/src/features/dashboard/resources/ResourcesPanel.tsx`
- Acceptance criteria:
1. When no resource sections exist, a clear empty-state message is shown.
2. Empty state includes next action hint (edit to add first section).

### P1-3: Keyboard-accessible project reordering
- Effort: `M`
- Dependencies: P0-1 recommended (layout updates)
- Scope: `frontend/src/features/dashboard/projectsRouter/ProjectsRouterPanel.tsx`, `frontend/src/features/dashboard/projectsRouter/useProjectsRouter.ts`
- Acceptance criteria:
1. User can reorder projects without pointer drag-and-drop.
2. Move up/down actions are available and disabled at boundaries.
3. Order changes persist through existing `/api/v1/projects` flow.

### P1-4: Implement focus trap and focus return in Review drawer
- Effort: `M`
- Dependencies: none
- Scope: `frontend/src/components/review/ReviewDrawer.tsx`, `frontend/src/components/review/state/useReviewState.ts`
- Acceptance criteria:
1. Tabbing while drawer is open cycles within drawer controls.
2. `Escape` closes drawer and focus returns to invoking control.
3. Background content is not focusable while drawer is open.

### P1-5: Consolidate API URL/fetch helper usage
- Effort: `M`
- Dependencies: none
- Scope: `frontend/src/lib/api.ts`, `frontend/src/hooks/useJournal.ts`, `frontend/src/hooks/useToggleTodayItem.ts`, `frontend/src/features/dashboard/api/putJSON.ts`
- Acceptance criteria:
1. Shared API base resolution logic lives in one place.
2. Credential behavior is consistent across GET/POST/PUT/PATCH/DELETE calls.
3. Existing dashboard/journal/toggle flows continue to function.

### P1-6: Add minimal backend tests for critical API contracts
- Effort: `M`
- Dependencies: none
- Scope: `backend/tests/*` (new), `backend/main.py`
- Acceptance criteria:
1. Tests cover health, dashboard view, today top3 update, and journal create/list.
2. Invalid payload path covered for at least one endpoint family.
3. Tests run with one documented command.

## P2

### P2-1: Standardize panel variants and helper text contrast
- Effort: `M`
- Dependencies: P0-1
- Scope: `frontend/src/components/Panel.tsx`, `frontend/src/index.css`, dashboard feature panels
- Acceptance criteria:
1. Panel visual variants are intentional and reusable.
2. Secondary copy maintains readable contrast in dark theme.

### P2-2: Add inline validation hints for review and resource forms
- Effort: `S`
- Dependencies: none
- Scope: `frontend/src/components/review/components/WeeklyReviewForm.tsx`, `frontend/src/features/dashboard/resources/ResourcesPanel.tsx`
- Acceptance criteria:
1. Empty/invalid submissions show clear user guidance.
2. Validation messages are non-blocking and disappear when corrected.

### P2-3: Document persistence/backup expectations for `/data`
- Effort: `S`
- Dependencies: none
- Scope: `README.md` or `docs/ops-data-persistence.md` (new)
- Acceptance criteria:
1. Data files and storage location are clearly documented.
2. Recovery/backup expectation is explicitly stated for local and deployed environments.
