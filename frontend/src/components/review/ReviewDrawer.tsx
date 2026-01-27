import { useEffect, useMemo } from "react";
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
import { splitLinesMax3, useReviewState } from "./state/useReviewState";

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

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const portalTarget = s.portalTarget;

  // ✅ not a hook, safe before early return
  const entries: JournalEntry[] = journal.data?.entries ?? [];

  // ✅ early return is now safe because no hooks appear below it
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
          {s.tab === "daily" && <DailyReviewForm onSuccess={() => s.setTab("journal")} />}
          {s.tab === "weekly" && <WeeklyReviewForm onSuccess={() => s.setTab("journal")} />}

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
                          "Operation failed",
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
    portalTarget,
  );
}
