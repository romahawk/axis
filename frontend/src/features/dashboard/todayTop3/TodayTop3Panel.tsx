import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import CheckList from "../../../components/CheckList";
import { Panel } from "../../../components/Panel";
import { useLocalStorageJson } from "../../../hooks/useLocalStorageJson";
import { useTodayTop3Editor } from "./useTodayTop3Editor";

type TodayTop3Item = { id: string; text: string; done?: boolean };

type ToggleToday = {
  mutate: (args: {
    kind: "outcomes" | "actions";
    id: string;
    done: boolean;
  }) => void;
};

const HIDE_CHECKED_KEY = "axis_today_hide_checked_v1";
const EOD_ENABLED_KEY = "axis_today_eod_enabled_v1";

// Immediate “last close” snapshot (used by Daily form)
const CLOSED_DAY_SNAPSHOT_KEY = "axis_closed_day_snapshot_v1";

// ✅ Persistent map used by Journal entry view modal
const CLOSED_DAY_SNAPSHOTS_MAP_KEY = "axis_closed_day_snapshots_map_v1";

function clamp3(items: TodayTop3Item[]) {
  return (items ?? []).slice(0, 3);
}

type ClosedDaySnapshot = {
  date: string; // YYYY-MM-DD
  closed_at: string;
  tasks: Array<{ id: string; text: string; done: boolean }>;
};

function readSnapshotsMap(): Record<string, ClosedDaySnapshot> {
  try {
    const raw = localStorage.getItem(CLOSED_DAY_SNAPSHOTS_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ClosedDaySnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSnapshotsMap(next: Record<string, ClosedDaySnapshot>) {
  try {
    localStorage.setItem(CLOSED_DAY_SNAPSHOTS_MAP_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

// Keep map bounded (prevents localStorage bloat)
function pruneMap(map: Record<string, ClosedDaySnapshot>, keepLast = 45) {
  const keys = Object.keys(map).sort(); // YYYY-MM-DD sorts lexicographically
  if (keys.length <= keepLast) return map;

  const toDrop = keys.slice(0, keys.length - keepLast);
  const next = { ...map };
  for (const k of toDrop) delete next[k];
  return next;
}

export function TodayTop3Panel(props: {
  date: string;
  todayTop3: TodayTop3Item[];
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
  toggleToday: ToggleToday;
}) {
  const qc = useQueryClient();

  const [hideChecked, setHideChecked] = useLocalStorageJson<boolean>(
    HIDE_CHECKED_KEY,
    false,
  );

  const [eodEnabled, setEodEnabled] = useLocalStorageJson<boolean>(
    EOD_ENABLED_KEY,
    false,
  );

  const items = clamp3(props.todayTop3 ?? []);
  const doneCount = items.filter((i: TodayTop3Item) => Boolean(i.done)).length;
  const pct = Math.round((doneCount / 3) * 100);
  const isCompleted = doneCount === 3;

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

  // ✅ AUTO-HIDE checked items only once when completion happens
  const prevCompletedRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    const wasCompleted = prevCompletedRef.current;
    if (!wasCompleted && isCompleted) {
      if (!hideChecked) setHideChecked(true);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted, hideChecked, setHideChecked]);

  const visibleItems = hideChecked ? items.filter((i) => !i.done) : items;

  async function closeDay() {
    const snapshot: ClosedDaySnapshot = {
      date: props.date,
      closed_at: new Date().toISOString(),
      tasks: items.map((t) => ({
        id: t.id,
        text: t.text,
        done: Boolean(t.done),
      })),
    };

    // 1) Save “last snapshot” (Daily form uses this)
    try {
      localStorage.setItem(CLOSED_DAY_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore
    }

    // 2) Save date-indexed snapshot map (Journal view uses this)
    const map = readSnapshotsMap();
    const next = pruneMap({ ...map, [snapshot.date]: snapshot }, 45);
    writeSnapshotsMap(next);

    // Reset Today
    await props.putJSON("/api/v1/today/top3", { items: ["—", "—", "—"] });
    await qc.invalidateQueries({ queryKey: ["dashboard"] });

    // Signal UI
    window.dispatchEvent(new CustomEvent("axis:day-closed", { detail: snapshot }));
  }

  return (
    <Panel
      title={`Today — Top 3 (${props.date})`}
      className={`axis-tone axis-tone-today ${isCompleted ? "border-emerald-900/60" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="text-xs text-slate-500">
            Rule: 3 slots. Execute first. Edit only when needed.
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2 w-40 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-emerald-500/50"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-slate-400">{pct}%</div>

            {isCompleted ? (
              <span className="rounded-full border border-emerald-900/60 bg-emerald-950/30 px-2 py-0.5 text-xs text-emerald-200">
                Day completed
              </span>
            ) : eodEnabled ? (
              <span className="rounded-full border border-amber-900/50 bg-amber-950/20 px-2 py-0.5 text-xs text-amber-200">
                EOD
              </span>
            ) : null}
          </div>
        </div>

        {!editMode ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-800 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300">
              EXECUTE
            </span>

            <button
              type="button"
              className={[
                "rounded-md border px-2 py-1 text-xs hover:text-white",
                eodEnabled
                  ? "border-amber-900/50 bg-amber-950/10 text-amber-200"
                  : "border-slate-800 text-slate-300",
              ].join(" ")}
              onClick={() => setEodEnabled(!eodEnabled)}
              title="Toggle end-of-day mode"
            >
              {eodEnabled ? "EOD: On" : "EOD: Off"}
            </button>

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

      {!editMode && eodEnabled && !isCompleted && (
        <div className="mb-3 rounded-lg border border-amber-900/40 bg-amber-950/10 p-2 text-xs text-amber-200">
          End-of-day check: finish one item or consciously park it.
        </div>
      )}

      {!editMode ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
              onClick={() => setHideChecked(!hideChecked)}
            >
              {hideChecked ? "Show checked" : "Hide checked"}
            </button>

            {isCompleted && (
              <button
                type="button"
                className="rounded-md border border-emerald-900/60 bg-emerald-950/20 px-2 py-1 text-xs text-emerald-200 hover:text-white"
                onClick={closeDay}
              >
                Close day
              </button>
            )}
          </div>

          <CheckList
            title=""
            items={visibleItems}
            onToggle={(id: string, nextDone: boolean) =>
              props.toggleToday.mutate({
                kind: "outcomes",
                id,
                done: nextDone,
              })
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {draft.slice(0, 3).map((v: string, idx: number) => (
            <input
              key={idx}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={v}
              onChange={(e) =>
                setDraft((prev: string[]) => {
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
