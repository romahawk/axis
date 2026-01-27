// src/features/review/components/EditEntryModal.tsx
import { X } from "lucide-react";
import type { WeeklyOutcomeDraft } from "../types";

export function EditEntryModal({
  type,
  onClose,
  onSave,

  // daily
  editWinsText,
  setEditWinsText,
  editMiss,
  setEditMiss,
  editFix,
  setEditFix,

  // weekly
  editWeeklyOutcomes,
  setEditWeeklyOutcomes,
  editWeeklyConstraint,
  setEditWeeklyConstraint,
  editWeeklyDecision,
  setEditWeeklyDecision,
  editWeeklyNextFocus,
  setEditWeeklyNextFocus,
}: {
  type: "daily" | "weekly";
  onClose: () => void;
  onSave: () => void;

  editWinsText: string;
  setEditWinsText: (v: string) => void;
  editMiss: string;
  setEditMiss: (v: string) => void;
  editFix: string;
  setEditFix: (v: string) => void;

  editWeeklyOutcomes: WeeklyOutcomeDraft[];
  setEditWeeklyOutcomes: (fn: (prev: WeeklyOutcomeDraft[]) => WeeklyOutcomeDraft[]) => void;
  editWeeklyConstraint: string;
  setEditWeeklyConstraint: (v: string) => void;
  editWeeklyDecision: string;
  setEditWeeklyDecision: (v: string) => void;
  editWeeklyNextFocus: string;
  setEditWeeklyNextFocus: (v: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800/70 bg-slate-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              {type === "daily" ? "Edit Daily Entry" : "Edit Weekly Entry"}
            </div>

            <div className="text-xs text-amber-200 mt-1">
              Local-only for now. Timestamp stays immutable.
            </div>
          </div>
          <button
            className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-2 text-slate-300 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {type === "daily" ? (
            <>
              <div>
                <div className="mb-1 text-xs text-slate-300">
                  Wins (max 3, one per line)
                </div>
                <textarea
                  className="w-full min-h-[84px] resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                  value={editWinsText}
                  onChange={(e) => setEditWinsText(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-300">Miss</div>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                  value={editMiss}
                  onChange={(e) => setEditMiss(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-300">Fix</div>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                  value={editFix}
                  onChange={(e) => setEditFix(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-slate-300">Outcomes (editable)</div>

              {editWeeklyOutcomes.map((o, idx) => (
                <div
                  key={o.id}
                  className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-300 uppercase tracking-widest">
                      {o.id}
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={o.achieved}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditWeeklyOutcomes((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], achieved: checked };
                            return next;
                          });
                        }}
                      />
                      Achieved
                    </label>
                  </div>

                  <input
                    className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                    value={o.note}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditWeeklyOutcomes((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], note: v };
                        return next;
                      });
                    }}
                    placeholder="Optional note"
                  />
                </div>
              ))}

              <div>
                <div className="mb-1 text-xs text-slate-300">Biggest constraint</div>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                  value={editWeeklyConstraint}
                  onChange={(e) => setEditWeeklyConstraint(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-300">One decision</div>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                  value={editWeeklyDecision}
                  onChange={(e) => setEditWeeklyDecision(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-300">Next week focus</div>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                  value={editWeeklyNextFocus}
                  onChange={(e) => setEditWeeklyNextFocus(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="rounded-xl border border-indigo-400/25 bg-indigo-950/25 px-3 py-2 text-xs text-indigo-100 hover:bg-indigo-900/25"
              onClick={onSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
