// src/features/review/components/WeeklyReviewForm.tsx
import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useCreateWeeklyReview } from "../../../hooks/useJournal";
import type { WeeklyOutcomeDraft } from "../types";

const DEFAULT_OUTCOMES: WeeklyOutcomeDraft[] = [
  { id: "w1", achieved: false, note: "" },
  { id: "w2", achieved: false, note: "" },
  { id: "w3", achieved: false, note: "" },
];

export function WeeklyReviewForm({ onSuccess }: { onSuccess: () => void }) {
  const [weeklyOutcomes, setWeeklyOutcomes] =
    useState<WeeklyOutcomeDraft[]>(DEFAULT_OUTCOMES);
  const [weeklyConstraint, setWeeklyConstraint] = useState("");
  const [weeklyDecision, setWeeklyDecision] = useState("");
  const [weeklyNextFocus, setWeeklyNextFocus] = useState("");

  const createWeekly = useCreateWeeklyReview();

  async function onSaveWeekly() {
    const payload = {
      outcomes: weeklyOutcomes.map((o) => ({
        id: o.id,
        achieved: o.achieved,
        note: o.note.trim(),
      })),
      constraint: weeklyConstraint.trim(),
      decision: weeklyDecision.trim(),
      next_focus: weeklyNextFocus.trim(),
    };

    const anyOutcome = payload.outcomes.some((o) => o.achieved || o.note);
    const anyText = Boolean(payload.constraint || payload.decision || payload.next_focus);
    if (!anyOutcome && !anyText) return;

    await createWeekly.mutateAsync(payload);

    setWeeklyOutcomes(DEFAULT_OUTCOMES);
    setWeeklyConstraint("");
    setWeeklyDecision("");
    setWeeklyNextFocus("");

    onSuccess();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-950/20 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Weekly Review (10 min)
        </div>
        <div className="mt-1 text-sm text-slate-200">
          Decide what worked, what blocked you, and what changes next week.
        </div>

        <div className="mt-4 space-y-3">
          <div className="text-xs text-slate-300">Outcomes (w1–w3)</div>

          {weeklyOutcomes.map((o, idx) => (
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
                      setWeeklyOutcomes((prev) => {
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
                  setWeeklyOutcomes((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], note: v };
                    return next;
                  });
                }}
                placeholder="Optional note (what happened / why)"
              />
            </div>
          ))}

          <div>
            <div className="mb-1 text-xs text-slate-300">Biggest constraint</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={weeklyConstraint}
              onChange={(e) => setWeeklyConstraint(e.target.value)}
              placeholder="What limited execution most?"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-300">One decision</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={weeklyDecision}
              onChange={(e) => setWeeklyDecision(e.target.value)}
              placeholder="What decision changes next week?"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-300">Next week focus</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={weeklyNextFocus}
              onChange={(e) => setWeeklyNextFocus(e.target.value)}
              placeholder="Primary focus statement"
            />
          </div>

          {createWeekly.isError && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
              {String((createWeekly.error as any)?.message ?? "Failed to save")}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              Tip: don’t over-explain. Log decisions.
            </div>

            <button
              type="button"
              onClick={onSaveWeekly}
              disabled={createWeekly.isPending}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
                "border border-indigo-400/25",
                "bg-indigo-950/25 hover:bg-indigo-900/25",
                "text-indigo-100",
                "shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]",
                createWeekly.isPending ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <ClipboardCheck className="h-4 w-4 text-indigo-200/90" />
              {createWeekly.isPending ? "Saving…" : "Save week"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
