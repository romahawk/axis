import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ClipboardCheck, X } from "lucide-react";

import {
  useDeleteJournalEntry,
  useJournalList,
  useUpdateJournalEntry,
  type JournalEntry,
} from "../../hooks/useJournal";

import { DailyReviewForm } from "./components/DailyReviewForm";
import { WeeklyReviewForm } from "./components/WeeklyReviewForm";
import { JournalTimeline } from "./components/JournalTimeline";
import { EditEntryModal } from "./components/EditEntryModal";
import { useLockBodyScroll } from "./state/useReviewState";
import { fmt, splitLinesMax3, useReviewState } from "./state/useReviewState";

/**
 * Completed tasks snapshots are stored in localStorage as a date-indexed map:
 * key: "axis_closed_day_snapshots_map_v1"
 * value: { [YYYY-MM-DD]: { date, closed_at, tasks: [{id,text,done,area}] } }
 */
const CLOSED_DAY_SNAPSHOTS_MAP_KEY = "axis_closed_day_snapshots_map_v1";

/* ======================
   Life Areas (canonical)
====================== */
type LifeArea =
  | "career"
  | "ai_leverage"
  | "health"
  | "family"
  | "finance"
  | "admin"
  | "education"
  | "none";

const AREA_LABEL: Record<LifeArea, string> = {
  career: "Career",
  ai_leverage: "AI × Leverage",
  health: "Health",
  family: "Family",
  finance: "Finance",
  admin: "Admin",
  education: "Education",
  none: "—",
};

const AREA_PILL_CLASS: Record<LifeArea, string> = {
  career: "border-indigo-400/25 bg-indigo-950/25 text-indigo-100",
  ai_leverage: "border-cyan-400/25 bg-cyan-950/20 text-cyan-100",
  health: "border-emerald-400/25 bg-emerald-950/20 text-emerald-100",
  family: "border-pink-400/25 bg-pink-950/20 text-pink-100",
  finance: "border-amber-400/25 bg-amber-950/20 text-amber-100",
  admin: "border-slate-400/20 bg-slate-950/30 text-slate-200",
  education: "border-violet-400/25 bg-violet-950/20 text-violet-100",
  none: "border-slate-800/70 bg-slate-950/30 text-slate-400",
};

function AreaPill({ area }: { area: LifeArea }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
        AREA_PILL_CLASS[area],
      ].join(" ")}
      title={AREA_LABEL[area]}
    >
      {AREA_LABEL[area]}
    </span>
  );
}

/* ======================
   Snapshot reading
====================== */

type ClosedDaySnapshot = {
  date: string; // YYYY-MM-DD
  closed_at?: string;
  tasks: Array<{ id: string; text: string; done: boolean; area: LifeArea }>;
};

function readSnapshotsMap(): Record<string, ClosedDaySnapshot> {
  try {
    const raw = localStorage.getItem(CLOSED_DAY_SNAPSHOTS_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ClosedDaySnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/* ======================
   View modal
====================== */
function ViewEntryModal({
  entry,
  onClose,
}: {
  entry: JournalEntry;
  onClose: () => void;
}) {
  const ymd =
    typeof entry.created_at === "string" ? entry.created_at.slice(0, 10) : "";

  const snapshot = ymd ? readSnapshotsMap()[ymd] : undefined;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800/70 bg-slate-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest border",
                  entry.type === "daily"
                    ? "border-indigo-400/25 bg-indigo-950/25 text-indigo-100"
                    : "border-emerald-400/25 bg-emerald-950/20 text-emerald-100",
                ].join(" ")}
              >
                {entry.type}
              </span>
              <div className="text-xs text-slate-400 truncate">
                {fmt(entry.created_at)}
              </div>
            </div>

            <div className="mt-1 text-sm font-semibold text-slate-100">
              {entry.type === "daily" ? "Daily entry" : "Weekly entry"}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Read-only view. Use Edit to change.
            </div>

            {ymd ? (
              <div className="mt-1 text-xs text-slate-500">{ymd}</div>
            ) : null}
          </div>

          <button
            className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-2 text-slate-300 hover:text-white"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* ✅ Completed tasks with area pills (from snapshot map) */}
          {snapshot?.tasks?.length ? (
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Completed tasks
              </div>

              <div className="mt-2 text-sm text-slate-200">
                <ul className="space-y-2">
                  {snapshot.tasks.slice(0, 3).map((t) => (
                    <li key={t.id} className="flex items-start gap-2">
                      <span className="mt-[2px]">
                        <AreaPill area={(t.area ?? "none") as LifeArea} />
                      </span>
                      <span className="text-slate-200">{t.text || "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {entry.type === "daily" ? (
            <>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Wins
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {entry.wins?.length ? entry.wins.join(" · ") : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Miss
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {entry.miss || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Fix
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {entry.fix || "—"}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Constraint
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {(entry as any).constraint || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Decision
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {(entry as any).decision || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Next focus
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {(entry as any).next_focus || "—"}
                </div>
              </div>

              {(entry as any).outcomes?.length ? (
                <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    Outcomes
                  </div>
                  <div className="mt-2 text-sm text-slate-200">
                    <ul className="list-disc pl-5 space-y-1">
                      {(entry as any).outcomes.map((o: any) => (
                        <li key={o.id}>
                          <span className="text-slate-300">{o.id}:</span>{" "}
                          {o.note || "—"}{" "}
                          {o.achieved ? (
                            <span className="text-emerald-300/80">
                              (achieved)
                            </span>
                          ) : (
                            <span className="text-slate-500">(missed)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================
   Drawer
====================== */
type Props = {
  open: boolean;
  onClose: () => void;
};

export function ReviewDrawer({ open, onClose }: Props) {
  useLockBodyScroll(open);

  const s = useReviewState(open);
  const journal = useJournalList({ limit: 50 });

  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const isBusy = updateEntry.isPending || deleteEntry.isPending;

  // ✅ Read-only view modal state
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);

  // ESC closes drawer
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const setTab = s.setTab;

  // ✅ When a day is explicitly closed, jump to Daily closeout
  useEffect(() => {
    const onDayClosed = () => {
      setTab("daily");

      if (!open) {
        window.dispatchEvent(
          new CustomEvent("axis:request-open-review", {
            detail: { tab: "daily" },
          })
        );
      }
    };

    window.addEventListener("axis:day-closed", onDayClosed as EventListener);
    return () =>
      window.removeEventListener("axis:day-closed", onDayClosed as EventListener);
  }, [open, setTab]);

  // ✅ When a week is explicitly closed, jump to Weekly closeout
  useEffect(() => {
    const onRequestOpen = (e: Event) => {
      const ce = e as CustomEvent;
      const tab = ce.detail?.tab as "daily" | "weekly" | "journal" | undefined;
      if (tab) s.setTab(tab);
    };

    window.addEventListener(
      "axis:request-open-review",
      onRequestOpen as EventListener,
    );
    return () =>
      window.removeEventListener(
        "axis:request-open-review",
        onRequestOpen as EventListener,
      );
  }, [s]);


  const portalTarget = s.portalTarget;
  const entries: JournalEntry[] = journal.data?.entries ?? [];

  if (!portalTarget) return null;

  const Tabs = (
    <div className="flex items-center gap-2">
      {[
        { key: "daily" as const, label: "Daily" },
        { key: "weekly" as const, label: "Weekly" },
        { key: "journal" as const, label: "Journal" },
      ].map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => s.setTab(t.key)}
          className={[
            "rounded-lg px-3 py-1.5 text-xs border",
            s.tab === t.key
              ? "border-indigo-400/30 bg-indigo-950/25 text-indigo-100 shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]"
              : "border-slate-800/70 bg-slate-950/30 text-slate-300 hover:text-white",
          ].join(" ")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  async function handleSaveEdit() {
    if (!s.editId) return;

    if (s.editType === "daily") {
      const wins = splitLinesMax3(s.editWinsText);
      const miss = s.editMiss.trim();
      const fix = s.editFix.trim();

      await updateEntry.mutateAsync({
        id: s.editId,
        payload: { type: "daily", wins, miss, fix },
      });

      s.setEditId(null);
      return;
    }

    const outcomes = (s.editWeeklyOutcomes ?? []).map((o) => ({
      id: o.id,
      achieved: !!o.achieved,
      note: (o.note ?? "").trim(),
    }));

    await updateEntry.mutateAsync({
      id: s.editId,
      payload: {
        type: "weekly",
        outcomes,
        constraint: s.editWeeklyConstraint.trim(),
        decision: s.editWeeklyDecision.trim(),
        next_focus: s.editWeeklyNextFocus.trim(),
      },
    });

    s.setEditId(null);
  }

  async function handleConfirmDelete() {
    if (!s.deleteId) return;
    await deleteEntry.mutateAsync(s.deleteId);
    s.setDeleteId(null);
  }

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-[60]",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        className={[
          "absolute inset-0 transition-opacity duration-200 bg-black/65",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onMouseDown={onClose}
      />

      {/* Panel */}
      <div
        ref={s.panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Review"
        className={[
          "absolute right-0 top-0 h-full w-full sm:w-[520px] md:w-[640px]",
          "bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900/95",
          "text-slate-100 border-l border-indigo-400/20",
          "shadow-[0_0_0_1px_rgba(99,102,241,0.12)_inset,0_25px_60px_rgba(0,0,0,0.55)]",
          "backdrop-blur-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          "outline-none flex flex-col",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 p-4 border-b border-indigo-400/15 bg-slate-950/40">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent" />

          <div className="min-w-0 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-400/20 bg-slate-950/40 shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]">
              <ClipboardCheck className="h-4 w-4 text-indigo-200/90" />
            </div>

            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.22em] text-indigo-200/80">
                Review
              </div>
              <div className="text-base font-semibold text-slate-100 truncate">
                Closeout & Journal
              </div>
              <div className="text-xs text-slate-300/90 truncate">
                Log results fast. Don’t write a novel.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Tabs}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/25 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800/60 transition"
              title="Close"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {s.tab === "daily" && (
            <DailyReviewForm onSuccess={() => s.setTab("journal")} />
          )}
          {s.tab === "weekly" && (
            <WeeklyReviewForm onSuccess={() => s.setTab("journal")} />
          )}

          {s.tab === "journal" && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    Journal Timeline
                  </div>
                  <div className="text-sm text-slate-300">
                    Latest entries (newest first)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => journal.refetch()}
                    className="rounded-lg border border-slate-800/70 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {journal.isLoading ? (
                <div className="text-sm text-slate-500">Loading…</div>
              ) : journal.isError ? (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
                  {String((journal.error as any)?.message ?? "Failed to load")}
                </div>
              ) : (
                <>
                  <JournalTimeline
                    entries={entries}
                    isBusy={isBusy}
                    onOpen={(entry) => setViewEntry(entry)}
                    onEdit={s.openEdit}
                    onDelete={(id) => s.setDeleteId(id)}
                  />

                  {!entries.length && (
                    <div className="text-sm text-slate-500">No entries yet.</div>
                  )}

                  {(updateEntry.isError || deleteEntry.isError) && (
                    <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
                      {String(
                        (updateEntry.error as any)?.message ??
                          (deleteEntry.error as any)?.message ??
                          "Operation failed"
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative p-4 border-t border-indigo-400/15 text-xs text-slate-300/90 bg-slate-950/25">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent" />
          Rule: Log signal. Don’t overthink.
        </div>

        {/* View modal */}
        {viewEntry && (
          <ViewEntryModal entry={viewEntry} onClose={() => setViewEntry(null)} />
        )}

        {/* Edit modal */}
        {s.editId && (
          <EditEntryModal
            type={s.editType}
            isSaving={updateEntry.isPending}
            onClose={() => s.setEditId(null)}
            onSave={handleSaveEdit}
            editWinsText={s.editWinsText}
            setEditWinsText={s.setEditWinsText}
            editMiss={s.editMiss}
            setEditMiss={s.setEditMiss}
            editFix={s.editFix}
            setEditFix={s.setEditFix}
            editWeeklyOutcomes={s.editWeeklyOutcomes}
            setEditWeeklyOutcomes={s.setEditWeeklyOutcomes}
            editWeeklyConstraint={s.editWeeklyConstraint}
            setEditWeeklyConstraint={s.setEditWeeklyConstraint}
            editWeeklyDecision={s.editWeeklyDecision}
            setEditWeeklyDecision={s.setEditWeeklyDecision}
            editWeeklyNextFocus={s.editWeeklyNextFocus}
            setEditWeeklyNextFocus={s.setEditWeeklyNextFocus}
          />
        )}

        {/* Delete confirm */}
        {s.deleteId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => (isBusy ? null : s.setDeleteId(null))}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-800/70 bg-slate-950 p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-amber-900/40 bg-amber-950/10">
                  <AlertTriangle className="h-4 w-4 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">
                    Delete entry?
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    This will permanently delete the entry.
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  disabled={isBusy}
                  className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => s.setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  disabled={isBusy}
                  className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-200 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleConfirmDelete}
                >
                  {deleteEntry.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    portalTarget
  );
}
