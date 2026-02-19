import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GanntifyRow, RowStatus, AuditEvent } from "../features/ganntify/types";
import { canTransition } from "../features/ganntify/types";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function auditEntry(
  event: string,
  from?: string,
  to?: string,
  meta?: string
): AuditEvent {
  return { ts: new Date().toISOString(), event, from, to, meta };
}

interface GanntifyState {
  rows: GanntifyRow[];
  addRow: (row: Omit<GanntifyRow, "id" | "auditTrail">) => void;
  updateRow: (id: string, patch: Partial<Pick<GanntifyRow, "feature" | "startWeek" | "endWeek" | "linkedOutcomeId">>) => void;
  updateRowStatus: (id: string, newStatus: RowStatus, meta?: string) => string | null;
  setArtifact: (id: string, artifact: { type: string; url: string }) => void;
  removeRow: (id: string) => void;
}

export const useGanntifyStore = create<GanntifyState>()(
  persist(
    (set, get) => ({
      rows: [],

      addRow: (row) =>
        set((s) => ({
          rows: [
            ...s.rows,
            {
              ...row,
              id: generateId(),
              auditTrail: [auditEntry("created", undefined, row.status)],
            },
          ],
        })),

      updateRow: (id, patch) =>
        set((s) => ({
          rows: s.rows.map((r) => {
            if (r.id !== id) return r;
            const updated = { ...r, ...patch };
            const changes = Object.entries(patch)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(", ");
            updated.auditTrail = [
              ...r.auditTrail,
              auditEntry("edited", undefined, undefined, changes),
            ];
            return updated;
          }),
        })),

      updateRowStatus: (id, newStatus, meta) => {
        const row = get().rows.find((r) => r.id === id);
        if (!row) return "Row not found";
        if (!canTransition(row.status, newStatus)) {
          return `Cannot transition from ${row.status} to ${newStatus}`;
        }
        if (
          newStatus === "shipped" &&
          (!row.artifact.url || !row.artifact.url.trim())
        ) {
          return "Artifact URL required to ship";
        }
        set((s) => ({
          rows: s.rows.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: newStatus,
                  auditTrail: [
                    ...r.auditTrail,
                    auditEntry("status_change", r.status, newStatus, meta),
                  ],
                }
              : r
          ),
        }));
        return null; // success
      },

      setArtifact: (id, artifact) =>
        set((s) => ({
          rows: s.rows.map((r) =>
            r.id === id
              ? {
                  ...r,
                  artifact,
                  auditTrail: [
                    ...r.auditTrail,
                    auditEntry(
                      "artifact_set",
                      undefined,
                      undefined,
                      `${artifact.type}: ${artifact.url}`
                    ),
                  ],
                }
              : r
          ),
        })),

      removeRow: (id) =>
        set((s) => ({
          rows: s.rows.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "axis_ganntify_v1",
    }
  )
);
