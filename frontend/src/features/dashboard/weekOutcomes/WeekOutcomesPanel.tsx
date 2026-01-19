// frontend/src/features/dashboard/weekOutcomes/WeekOutcomesPanel.tsx
import { useQueryClient } from "@tanstack/react-query";

import { Panel } from "../../../components/Panel";
import { useWeekOutcomesEditor } from "./useWeekOutcomesEditor";

type WeekOutcome = { id: string; text: string };

export function WeekOutcomesPanel(props: {
  weekOutcomes: WeekOutcome[];
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const qc = useQueryClient();

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
    <Panel title="Top 3 Outcomes (weekly)">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-slate-500">Rule: exactly 3.</div>

        {!editMode ? (
          <button
            className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
            onClick={startEdit}
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
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

      {!editMode ? (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-200">
          {(props.weekOutcomes ?? []).slice(0, 3).map((o) => (
            <li key={o.id}>{o.text}</li>
          ))}
        </ol>
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
              placeholder={`Outcome ${idx + 1}`}
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
