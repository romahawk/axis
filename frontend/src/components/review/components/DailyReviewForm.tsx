// src/features/review/components/DailyReviewForm.tsx
import { useState } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { useCreateDailyCloseout } from "../../../hooks/useJournal";
import { splitLinesMax3 } from "../state/useReviewState";

export function DailyReviewForm({ onSuccess }: { onSuccess: () => void }) {
  const [winsText, setWinsText] = useState("");
  const [miss, setMiss] = useState("");
  const [fix, setFix] = useState("");

  const createDaily = useCreateDailyCloseout();

  async function onSaveDaily() {
    const wins = splitLinesMax3(winsText);
    const cleanedMiss = miss.trim();
    const cleanedFix = fix.trim();

    if (!wins.length && !cleanedMiss && !cleanedFix) return;

    await createDaily.mutateAsync({ wins, miss: cleanedMiss, fix: cleanedFix });

    setWinsText("");
    setMiss("");
    setFix("");

    onSuccess();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-950/20 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Daily Closeout (60 sec)
        </div>
        <div className="mt-1 text-sm text-slate-200">
          Capture signal. Snapshot is attached automatically.
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-1 text-xs text-slate-300">
              Wins (max 3, one per line)
            </div>
            <textarea
              className="w-full min-h-[84px] resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={winsText}
              onChange={(e) => setWinsText(e.target.value)}
              placeholder={"1) …\n2) …\n3) …"}
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-300">Miss (1 line)</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={miss}
              onChange={(e) => setMiss(e.target.value)}
              placeholder="What went wrong or slipped?"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-300">
              Fix (tomorrow rule / constraint)
            </div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={fix}
              onChange={(e) => setFix(e.target.value)}
              placeholder="What changes tomorrow?"
            />
          </div>

          {createDaily.isError && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
              {String((createDaily.error as any)?.message ?? "Failed to save")}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">Tip: log at least one signal.</div>

            <button
              type="button"
              onClick={onSaveDaily}
              disabled={createDaily.isPending}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
                "border border-indigo-400/25",
                "bg-indigo-950/25 hover:bg-indigo-900/25",
                "text-indigo-100",
                "shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]",
                createDaily.isPending ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {createDaily.isSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-300/90" />
              ) : (
                <ClipboardCheck className="h-4 w-4 text-indigo-200/90" />
              )}
              {createDaily.isPending ? "Saving…" : "Save day"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
