import { useEffect, useState } from "react";

export function WeeklyOutcomesHintDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-300 hover:text-white"
        aria-label="How to write Weekly Outcomes"
        title="How to write Weekly Outcomes"
      >
        i
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setOpen(false)}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* modal */}
          <div
            className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  How to write a Weekly Outcome (1 + 2 + 3)
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Outcome → Proof → Next move (≤30 min)
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-200">
              <div className="space-y-1">
                <div className="font-semibold">1) Result (Outcome, not activity)</div>
                <div className="text-xs text-slate-400">
                  Write the end state by end of week.
                </div>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-300">
                  <li>✅ “Ship v0.1 of Inbox capture”</li>
                  <li>❌ “Work on Inbox”</li>
                </ul>
              </div>

              <div className="space-y-1">
                <div className="font-semibold">2) Proof (verifiable “done”)</div>
                <div className="text-xs text-slate-400">
                  Add a concrete check: deployed, PR merged, 3 users tested, €X, N sessions, etc.
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold">3) Next move (first concrete action)</div>
                <div className="text-xs text-slate-400">
                  Smallest step you can do in ≤30 minutes.
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/20 p-3">
                <div className="text-xs font-semibold text-slate-200">Template</div>
                <div className="mt-1 text-xs text-slate-300">
                  <span className="font-mono">
                    [Deliverable/result] + [Definition of done] + [Next 30-min step]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
