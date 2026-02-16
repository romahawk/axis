# UX/UI Audit (AXIS)

Audit date: 2026-02-16
Scope: `frontend/src/*` and related docs/runtime contracts.

## 1) Information Architecture and Navigation

Finding: `P1`
- Problem: README suggests route-based navigation (`/today`, `/week`), but the app currently renders a single dashboard shell with no router.
- Evidence: `README.md:77`, `README.md:78`, `frontend/src/App.tsx:97`
- Fix suggestion: align docs to real app behavior now, or add explicit route handling for backward compatibility if those links must remain.

Finding: `P1`
- Problem: Left/center/right dashboard regions are clear on desktop but stack behavior is not intentionally designed for mobile.
- Evidence: `frontend/src/pages/DashboardPage.tsx:106`
- Fix suggestion: define breakpoint-specific layout rules with explicit order and overflow behavior.

## 2) Visual Hierarchy and Typography

Finding: `P2`
- Problem: Core headers are clear, but helper copy and secondary labels frequently use low-contrast muted text in dense panels.
- Evidence: `frontend/src/pages/DashboardPage.tsx:139`, `frontend/src/features/dashboard/panels/InboxPanel.tsx:75`
- Fix suggestion: raise contrast for instructional text and state labels in critical action areas.

Finding: `P2`
- Problem: Visual style is cohesive but inconsistent panel chrome appears across feature modules (different border/background semantics).
- Evidence: `frontend/src/components/Panel.tsx:12`, `frontend/src/features/dashboard/resources/ResourcesPanel.tsx:33`
- Fix suggestion: centralize panel variants (`default`, `focus`, `risk`, `neutral`) and apply consistently.

## 3) Layout, Spacing, Consistency

Finding: `P0`
- Problem: Fixed 3-column template can cause horizontal compression and usability issues on narrow screens.
- Evidence: `frontend/src/pages/DashboardPage.tsx:106`
- Fix suggestion: switch to responsive grid definition (`1-col` mobile, `2-col` tablet, `3-col` desktop with collapsible left width only on desktop).

Finding: `P1`
- Problem: Full viewport-height main container encourages nested scrolling and can trap content on smaller devices.
- Evidence: `frontend/src/App.tsx:95`
- Fix suggestion: apply fixed-height layout only at larger breakpoints and allow natural page flow on mobile.

## 4) Forms and Validation Feedback

Finding: `P1`
- Problem: Most edit forms show error text but do not expose explicit field-level validation rules (required/length/URL format).
- Evidence: `frontend/src/features/dashboard/projectsRouter/useProjectsRouter.ts:57`, `frontend/src/features/dashboard/resources/useResourcesEditor.ts:37`
- Fix suggestion: add light client-side validation per field and inline error markers before save request.

Finding: `P2`
- Problem: `WeeklyReviewForm` silently no-ops when all inputs are empty.
- Evidence: `frontend/src/components/review/components/WeeklyReviewForm.tsx:86`
- Fix suggestion: show a small inline validation hint when save is attempted with empty payload.

## 5) Loading/Error/Empty States

Finding: `P1`
- Problem: Dashboard load error has no retry control, forcing manual page refresh.
- Evidence: `frontend/src/pages/DashboardPage.tsx:68`
- Fix suggestion: add explicit retry action (`refetch`) and preserve current diagnostic message.

Finding: `P1`
- Problem: `ResourcesPanel` has no explicit empty state in view mode if sections are empty.
- Evidence: `frontend/src/features/dashboard/resources/ResourcesPanel.tsx:82`
- Fix suggestion: show a clear empty-state card with next step (open Edit and add first section).

Finding: `P2`
- Problem: App header API status uses short strings (`Loading…`, `API error`) without context or recovery action.
- Evidence: `frontend/src/App.tsx:85`, `frontend/src/App.tsx:86`
- Fix suggestion: provide contextual tooltip or inline retry affordance for identity fetch failures.

## 6) Accessibility Basics

Finding: `P1`
- Problem: Projects reorder interaction depends on pointer drag-and-drop and lacks keyboard equivalent.
- Evidence: `frontend/src/features/dashboard/projectsRouter/ProjectsRouterPanel.tsx:194`, `frontend/src/features/dashboard/projectsRouter/ProjectsRouterPanel.tsx:195`
- Fix suggestion: add keyboard reorder controls (move up/down buttons) and announce order changes.

Finding: `P1`
- Problem: Drawer focus management sets initial focus but does not implement focus trap/cycling.
- Evidence: `frontend/src/components/review/state/useReviewState.ts:80`, `frontend/src/components/review/ReviewDrawer.tsx:434`
- Fix suggestion: trap tab navigation within drawer while open, return focus to invoker on close.

## 7) Mobile and Responsive Breakpoints

Finding: `P0`
- Problem: Sidebars rely on fixed desktop assumptions (`72/320` and `360` widths), degrading usability on mobile/tablet.
- Evidence: `frontend/src/pages/DashboardPage.tsx:106`
- Fix suggestion: replace inline fixed columns with responsive CSS grid + ordered stacking.

Finding: `P1`
- Problem: Multiple panels use internal `overflow-y-auto` plus viewport-height containers, creating competing scroll regions.
- Evidence: `frontend/src/pages/DashboardPage.tsx:115`, `frontend/src/pages/DashboardPage.tsx:136`, `frontend/src/pages/DashboardPage.tsx:281`
- Fix suggestion: limit nested scrolling to desktop where it improves productivity; default to document scrolling on mobile.

## 8) Trust Signals

Finding: `P2`
- Problem: For deployed usage, there is no user-facing mention of data persistence location/backup behavior despite `/data` volume dependency.
- Evidence: `backend/main.py:34`, `backend/fly.toml:19`
- Fix suggestion: add concise docs note describing where data lives and recovery expectations.

## Priority Summary
- `P0`: Responsive layout reliability (`DashboardPage`, `App`).
- `P1`: Actionable recovery states, keyboard accessibility for reorder, focus-trap behavior, doc/runtime alignment.
- `P2`: Visual consistency polish, richer validation messaging, trust and operational transparency.
