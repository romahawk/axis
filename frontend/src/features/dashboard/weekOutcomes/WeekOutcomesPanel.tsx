// frontend/src/features/dashboard/weekOutcomes/WeekOutcomesPanel.tsx
import { useQueryClient } from "@tanstack/react-query";

import { Panel } from "../../../components/Panel";
import { useWeekOutcomesEditor } from "./useWeekOutcomesEditor";

type WeekOutcome = {
  id: string;
  text: string;
};

function clamp3(items: WeekOutcome[]) {
  return (items ?? []).slice(0, 3);
}

export function WeekOutcomesPanel(props: {
  weekOutcomes: WeekOutcome[];
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const qc = useQueryClient();

  const items = clamp3(props.weekOutcomes);
  const setCount = items.filter(
    (i) => Boolean(i.text && i.text.trim() && i.text !== "—")
  ).length;

  const pct = Math.round((setCount / 3) * 100);
  const isWeekSet = setCount === 3;

  const now = new Date();
  const isLateWeek =
    now.getDay() === 0 && now.getHours() >= 18; // Sunday 18:00+

  const {
    editMode,
    draft,
    setDraft,
    saving,
    saveError,
    startEdit,
    cancelEdit,
    save,
  } = useWeekOutcomesEditor({
    weekOutcomes: props.weekOutcomes ?? [],
    queryClient: qc,
    putJSON: props.putJSON,
  });

  return (
    <Panel
      title="Top 3 Outcomes (weekly)"
      className={isWeekSet ? "border-emerald-900/60 bg-emerald-950/10" : ""}
    >
      {/* Header / progress */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="text-xs text-slate-500">Rule: exactly 3.</div>

          <div className="flex items-center gap-3">
            <div className="h-2 w-40 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-emerald-500/40"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-slate-400">
              {setCount} / 3 set
            </div>

            {isWeekSet ? (
              <span className="rounded-full border border-emerald-900/60 bg-emerald-950/30 px-2 py-0.5 text-xs text-emerald-200">
                WEEK SET
              </span>
            ) : (
              <span className="rounded-full border border-slate-800 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-400">
                Week in progress
              </span>
            )}
          </div>
        </div>

        {/* Mode controls */}
        {!editMode ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-800 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300">
              SET
            </span>
            <button
              className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
              onClick={startEdit}
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-800 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300">
              EDIT
            </span>
            <button
              className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Late-week soft signal */}
      {!editMode && !isWeekSet && isLateWeek && (
        <div className="mb-3 rounded-lg border border-amber-900/40 bg-amber-950/10 p-2 text-xs text-amber-200">
          Week not set. Decide outcomes or consciously skip this week.
        </div>
      )}

      {/* Content */}
      {!editMode ? (
        <div className="space-y-2">
          {items.map((i) => (
            <div
              key={i.id}
              className="rounded-md border border-slate-900 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            >
              {i.text && i.text.trim() ? i.text : `—`}
            </div>
          ))}

          {isWeekSet && (
            <div className="pt-1 text-xs text-slate-500">
              Execution happens via <span className="text-slate-300">Today</span>.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {draft.slice(0, 3).map((v, idx) => (
            <input
              key={idx}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={v}
              onChange={(e) =>
                setDraft((prev) => {
                  const next = [...prev];
                  next[idx] = e.target.value;
                  return next;
                })
              }
              placeholder={`Weekly outcome ${idx + 1}`}
            />
          ))}

          {saveError && (
            <div className="rounded-md border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-200">
              {saveError}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
