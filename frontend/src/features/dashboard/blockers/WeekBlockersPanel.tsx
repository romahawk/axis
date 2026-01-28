import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

import { Panel } from "../../../components/Panel";
import { useLocalStorageJson } from "../../../hooks/useLocalStorageJson";
import { useWeekBlockersEditor } from "./useWeekBlockersEditor";

type WeekBlocker = { id: string; text: string };

export function WeekBlockersPanel(props: {
  weekBlockers: WeekBlocker[];
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const qc = useQueryClient();

  const [open, setOpen] = useLocalStorageJson<boolean>(
    "axis_week_blockers_open_v1",
    true
  );

  const {
    editMode,
    draft,
    setDraft,
    saving,
    saveError,
    startEdit,
    cancelEdit,
    save,
  } = useWeekBlockersEditor({
    weekBlockers: props.weekBlockers ?? [],
    queryClient: qc,
    putJSON: props.putJSON,
  });

  return (
    <Panel className="axis-tone axis-tone-risk" title={null as any}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left rounded-xl px-2 py-1 hover:bg-slate-950/30"
      >
        <div>
          <div className="text-sm font-semibold text-slate-100">
            Blockers / Risks (max 3)
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Rule: max 3 (slots).
          </div>
        </div>

        <ChevronDown
          className={[
            "h-4 w-4 text-slate-300 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="mt-3">
          {/* Actions */}
          <div className="mb-3 flex items-center justify-between">
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

          {/* Body */}
          {!editMode ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
              {(props.weekBlockers ?? []).slice(0, 3).map((b) => (
                <li key={b.id}>{b.text}</li>
              ))}
            </ul>
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
                  placeholder={`Blocker ${idx + 1}`}
                />
              ))}

              {saveError && (
                <div className="rounded-md border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-200">
                  {saveError}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
