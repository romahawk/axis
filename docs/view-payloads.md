# Axis — View Payload Contracts (v0)

Purpose: Freeze the JSON shapes the frontend consumes for core views.
Scope: v0 contracts (minimal, stable, manual-first). No DB assumptions.

---

## Common conventions

- All payloads are JSON.
- IDs are strings (stable within the view).
- Text fields are plain strings (no markdown).
- Dates:
  - `date` = `YYYY-MM-DD`
  - `week` = ISO week string `YYYY-Www` (e.g., `2026-W03`)
- Ordering is meaningful:
  - Arrays are returned in the order the UI should display.

---

## 1) Week View Payload

### Endpoint
`GET /api/v1/views/week?week=YYYY-Www`
- If `week` omitted → server returns current week.

### Contract (v0)
```ts
type WeekView = {
  week: string; // "YYYY-Www"
  focus: {
    id: string;
    text: string; // max 3
  }[];
  commitments: {
    id: string;
    text: string;
    domain?: string; // optional tag (e.g., "career", "health")
    trello?: { url: string; title?: string }; // optional reference
    status?: "planned" | "doing" | "done" | "blocked"; // optional
  }[];
  constraints: {
    id: string;
    text: string; // immovable commitments / hard constraints
  }[];
  notes?: string; // optional short note for the week
};
