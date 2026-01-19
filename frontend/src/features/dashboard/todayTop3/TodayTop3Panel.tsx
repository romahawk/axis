// frontend/src/features/dashboard/todayTop3/TodayTop3Panel.tsx
import { useQueryClient } from "@tanstack/react-query";

import CheckList from "../../../components/CheckList";
import { Panel } from "../../../components/Panel";
import { useTodayTop3Editor } from "./useTodayTop3Editor";

type TodayTop3Item = { id: string; text: string; done?: boolean };

type ToggleToday = {
  mutate: (args: { kind: "outcomes" | "actions"; id: string; done: boolean }) => void;
};

export function TodayTop3Panel(props: {
  date: string;
  todayTop3: TodayTop3Item[];
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
  toggleToday: ToggleToday;
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
  } = useTodayTop3Editor({
    todayTop3: props.todayTop3 ?? [],
    queryClient: qc,
    putJSON: props.putJSON,
  });

  return (
    <Panel title={`Today — Top 3 (${props.date})`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Rule: 3 slots. Toggle done. Edit text when needed.
        </div>

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
        <CheckList
          title=""
          items={props.todayTop3}
          onToggle={(id, nextDone) =>
            // keep exact existing behavior (even though "outcomes" looks weird here)
            props.toggleToday.mutate({ kind: "outcomes", id, done: nextDone })
          }
        />
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
              placeholder={`Today task ${idx + 1}`}
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
