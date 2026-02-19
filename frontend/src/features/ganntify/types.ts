export type RowStatus = "planned" | "active" | "shipped" | "stalled";

export interface AuditEvent {
  ts: string; // ISO timestamp
  event: string;
  from?: string;
  to?: string;
  meta?: string;
}

export interface GanntifyRow {
  id: string;
  projectKey: string;
  feature: string;
  startWeek: string; // ISO week id, e.g. "2026-W08"
  endWeek: string;
  status: RowStatus;
  linkedOutcomeId: string;
  artifact: { type: string; url: string };
  auditTrail: AuditEvent[];
}

/** Valid status transitions + conditions */
const VALID_TRANSITIONS: Record<RowStatus, RowStatus[]> = {
  planned: ["active", "stalled"],
  active: ["shipped", "stalled"],
  shipped: [], // terminal
  stalled: [], // terminal
};

export function canTransition(from: RowStatus, to: RowStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const STATUS_COLORS: Record<RowStatus, string> = {
  planned: "bg-slate-600",
  active: "bg-emerald-500",
  shipped: "bg-cyan-400",
  stalled: "bg-rose-500",
};

export const STATUS_DOT_GLOW: Record<RowStatus, string> = {
  planned: "shadow-[0_0_4px_rgba(148,163,184,0.4)]",
  active: "shadow-[0_0_6px_rgba(16,185,129,0.5)]",
  shipped: "shadow-[0_0_6px_rgba(34,211,238,0.5)]",
  stalled: "shadow-[0_0_6px_rgba(244,63,94,0.5)]",
};

export const STATUS_BAR_COLORS: Record<RowStatus, string> = {
  planned: "bg-slate-700/60 border-slate-600/40",
  active: "bg-emerald-900/40 border-emerald-500/30",
  shipped: "bg-cyan-900/40 border-cyan-400/30",
  stalled: "bg-rose-900/40 border-rose-500/30",
};
