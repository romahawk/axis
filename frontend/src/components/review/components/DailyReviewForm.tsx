import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, AlertTriangle } from "lucide-react";
import {
  useCreateDailyCloseout,
  useJournalList,
  useUpdateJournalEntry,
  type JournalEntry,
} from "../../../hooks/useJournal";
import { splitLinesMax3 } from "../state/useReviewState";

const CLOSED_DAY_SNAPSHOT_KEY = "axis_closed_day_snapshot_v1";

type ClosedDaySnapshot = {
  date: string;
  closed_at?: string;
  tasks: Array<{ id: string; text: string; done: boolean }>;
};

function safeParseSnapshot(raw: string | null): ClosedDaySnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ClosedDaySnapshot;
    if (!parsed?.date || !Array.isArray(parsed.tasks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function ymdTodayLocal(): string {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function DailyReviewForm({ onSuccess }: { onSuccess: () => void }) {
  const [winsText, setWinsText] = useState("");
  const [miss, setMiss] = useState("");
  const [fix, setFix] = useState("");

  const [snapshot, setSnapshot] = useState<ClosedDaySnapshot | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createDaily = useCreateDailyCloseout();
  const updateEntry = useUpdateJournalEntry();
  const journal = useJournalList({ limit: 50 });

  const targetDate = snapshot?.date ?? ymdTodayLocal();

  const existingDailyId = useMemo(() => {
    const entries: JournalEntry[] = journal.data?.entries ?? [];
    const sameDayDaily = entries.find(
      (e) =>
        e.type === "daily" &&
        typeof e.created_at === "string" &&
        e.created_at.startsWith(targetDate),
    );
    return sameDayDaily?.id ?? null;
  }, [journal.data, targetDate]);

  const canSave = useMemo(() => {
    const wins = splitLinesMax3(winsText);
    const cleanedMiss = miss.trim();
    const cleanedFix = fix.trim();
    return Boolean(wins.length || cleanedMiss || cleanedFix);
  }, [winsText, miss, fix]);

  useEffect(() => {
    if (validationError && canSave) setValidationError(null);
  }, [validationError, canSave]);

  // Event snapshot (immediate)
  useEffect(() => {
    const onDayClosed = (e: Event) => {
      const ce = e as CustomEvent;
      const detail = ce.detail as ClosedDaySnapshot | undefined;
      if (detail?.date && Array.isArray(detail.tasks)) {
        setSnapshot(detail);
        try {
          localStorage.setItem(CLOSED_DAY_SNAPSHOT_KEY, JSON.stringify(detail));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("axis:day-closed", onDayClosed as EventListener);
    return () => window.removeEventListener("axis:day-closed", onDayClosed as EventListener);
  }, []);

  // Fallback snapshot
  useEffect(() => {
    if (snapshot) return;
    const parsed = safeParseSnapshot(localStorage.getItem(CLOSED_DAY_SNAPSHOT_KEY));
    if (parsed?.tasks?.length) setSnapshot(parsed);
  }, [snapshot]);

  const isBusy = createDaily.isPending || updateEntry.isPending;

  async function onSaveDaily() {
    const wins = splitLinesMax3(winsText);
    const cleanedMiss = miss.trim();
    const cleanedFix = fix.trim();

    if (!wins.length && !cleanedMiss && !cleanedFix) {
      setValidationError("Log at least one signal (Wins, Miss, or Fix) before saving.");
      return;
    }

    if (existingDailyId) {
      await updateEntry.mutateAsync({
        id: existingDailyId,
        payload: { type: "daily", wins, miss: cleanedMiss, fix: cleanedFix },
      });
    } else {
      await createDaily.mutateAsync({ wins, miss: cleanedMiss, fix: cleanedFix });
    }

    setWinsText("");
    setMiss("");
    setFix("");
    setValidationError(null);

    // Clear only the “last snapshot” (optional). We KEEP the date-indexed map.
    try {
      localStorage.removeItem(CLOSED_DAY_SNAPSHOT_KEY);
    } catch {
      // ignore
    }
    setSnapshot(null);

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

        {snapshot?.tasks?.length ? (
          <div className="mt-4 rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Completed tasks ({snapshot.date})
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-300">
              {snapshot.tasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-start gap-2">
                  <span className="mt-[2px] inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                  <span className={t.done ? "text-slate-200" : "text-slate-400"}>
                    {t.text || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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

          {validationError && (
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>{validationError}</div>
            </div>
          )}

          {(createDaily.isError || updateEntry.isError) && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
              {String(
                (createDaily.error as any)?.message ??
                  (updateEntry.error as any)?.message ??
                  "Failed to save",
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">Tip: log at least one signal.</div>

            <button
              type="button"
              onClick={onSaveDaily}
              disabled={isBusy || !canSave}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
                "border border-indigo-400/25",
                "bg-indigo-950/25 hover:bg-indigo-900/25",
                "text-indigo-100",
                "shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]",
                isBusy || !canSave ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              title={!canSave ? "Add at least one signal to save" : "Save day"}
            >
              {createDaily.isSuccess || updateEntry.isSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-300/90" />
              ) : (
                <ClipboardCheck className="h-4 w-4 text-indigo-200/90" />
              )}
              {isBusy ? "Saving…" : existingDailyId ? "Update day" : "Save day"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
