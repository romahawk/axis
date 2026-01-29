import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Panel } from "../../../components/Panel";
import { useLocalStorageJson } from "../../../hooks/useLocalStorageJson";
import { useTodayTop3Editor } from "./useTodayTop3Editor";

/* =======================
   Types
======================= */

type TodayTop3Item = { id: string; text: string; done?: boolean };

type ToggleToday = {
  mutate: (args: {
    kind: "outcomes" | "actions";
    id: string;
    done: boolean;
  }) => void;
};

type LifeArea =
  | "career"
  | "ai_leverage"
  | "health"
  | "family"
  | "finance"
  | "admin"
  | "education"
  | "none";

/* =======================
   Constants
======================= */

const HIDE_CHECKED_KEY = "axis_today_hide_checked_v1";
const EOD_ENABLED_KEY = "axis_today_eod_enabled_v1";

const CLOSED_DAY_SNAPSHOT_KEY = "axis_closed_day_snapshot_v1";
const CLOSED_DAY_SNAPSHOTS_MAP_KEY = "axis_closed_day_snapshots_map_v1";

/* =======================
   Area config
======================= */

const AREA_OPTIONS: Array<{ value: LifeArea; label: string }> = [
  { value: "career", label: "Career" },
  { value: "ai_leverage", label: "AI × Leverage" },
  { value: "health", label: "Health" },
  { value: "family", label: "Family" },
  { value: "finance", label: "Finance" },
  { value: "admin", label: "Admin" },
  { value: "education", label: "Education" },
  { value: "none", label: "—" },
];

const AREA_PILL_CLASS: Record<LifeArea, string> = {
  career: "border-indigo-400/25 bg-indigo-950/25 text-indigo-100",
  ai_leverage: "border-cyan-400/25 bg-cyan-950/20 text-cyan-100",
  health: "border-emerald-400/25 bg-emerald-950/20 text-emerald-100",
  family: "border-pink-400/25 bg-pink-950/20 text-pink-100",
  finance: "border-amber-400/25 bg-amber-950/20 text-amber-100",
  admin: "border-slate-400/20 bg-slate-950/30 text-slate-200",
  education: "border-violet-400/25 bg-violet-950/20 text-violet-100",
  none: "border-slate-800/70 bg-slate-950/30 text-slate-400",
};

/* =======================
   Helpers
======================= */

function clamp3(items: TodayTop3Item[]) {
  return (items ?? []).slice(0, 3);
}

function parseBracketTag(input: string): { area: LifeArea; text: string } {
  const s = (input ?? "").trim();
  const m = s.match(/^\[([a-z_]+)\]\s*(.*)$/i);
  if (!m) return { area: "none", text: s };

  const raw = (m[1] ?? "").toLowerCase() as LifeArea;
  const text = (m[2] ?? "").trim();

  if (!AREA_PILL_CLASS[raw]) return { area: "none", text: s };
  return { area: raw, text };
}

function encodeBracketTag(area: LifeArea, text: string) {
  const t = (text ?? "").trim();
  if (!t) return "";
  return area === "none" ? t : `[${area}] ${t}`;
}

function AreaPill({ area }: { area: LifeArea }) {
  const label =
    AREA_OPTIONS.find((o) => o.value === area)?.label ?? "—";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
        AREA_PILL_CLASS[area],
      ].join(" ")}
    >
      {label}
    </span>
  );
}

/* =======================
   Snapshot helpers
======================= */

type ClosedDaySnapshot = {
  date: string;
  closed_at: string;
  tasks: Array<{
    id: string;
    text: string;
    done: boolean;
    area: LifeArea;
  }>;
};

function readSnapshotsMap(): Record<string, ClosedDaySnapshot> {
  try {
    const raw = localStorage.getItem(CLOSED_DAY_SNAPSHOTS_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSnapshotsMap(next: Record<string, ClosedDaySnapshot>) {
  try {
    localStorage.setItem(
      CLOSED_DAY_SNAPSHOTS_MAP_KEY,
      JSON.stringify(next),
    );
  } catch {}
}

function pruneMap(
  map: Record<string, ClosedDaySnapshot>,
  keepLast = 45,
) {
  const keys = Object.keys(map).sort();
  if (keys.length <= keepLast) return map;

  const toDrop = keys.slice(0, keys.length - keepLast);
  const next = { ...map };
  for (const k of toDrop) delete next[k];
  return next;
}

/* =======================
   Component
======================= */

export function TodayTop3Panel(props: {
  date: string;
  todayTop3: TodayTop3Item[];
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
  toggleToday: ToggleToday;
}) {
  const qc = useQueryClient();

  const [hideChecked, setHideChecked] =
    useLocalStorageJson<boolean>(HIDE_CHECKED_KEY, false);
  const [eodEnabled, setEodEnabled] =
    useLocalStorageJson<boolean>(EOD_ENABLED_KEY, false);

  const items = clamp3(props.todayTop3 ?? []);
  const doneCount = items.filter((i) => Boolean(i.done)).length;
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

  // Auto-hide checked once
  const prevCompletedRef = React.useRef(false);
  React.useEffect(() => {
    if (!prevCompletedRef.current && isCompleted && !hideChecked) {
      setHideChecked(true);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted, hideChecked, setHideChecked]);

  const visibleItems = hideChecked
    ? items.filter((i) => !i.done)
    : items;

  async function closeDay() {
    const snapshot: ClosedDaySnapshot = {
      date: props.date,
      closed_at: new Date().toISOString(),
      tasks: items.map((t) => {
        const parsed = parseBracketTag(t.text ?? "");
        return {
          id: t.id,
          text: parsed.text || "—",
          area: parsed.area,
          done: Boolean(t.done),
        };
      }),
    };

    try {
      localStorage.setItem(
        CLOSED_DAY_SNAPSHOT_KEY,
        JSON.stringify(snapshot),
      );
    } catch {}

    const map = readSnapshotsMap();
    writeSnapshotsMap(pruneMap({ ...map, [snapshot.date]: snapshot }));

    await props.putJSON("/api/v1/today/top3", {
      items: ["—", "—", "—"],
    });
    await qc.invalidateQueries({ queryKey: ["dashboard"] });

    window.dispatchEvent(
      new CustomEvent("axis:day-closed", { detail: snapshot }),
    );
  }

  return (
    <Panel
      title={`Today — Top 3 (${props.date})`}
      className={`axis-tone axis-tone-today ${
        isCompleted ? "border-emerald-900/60" : ""
      }`}
    >
      {/* Header */}
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

        {!editMode && (
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
            >
              {eodEnabled ? "EOD: On" : "EOD: Off"}
            </button>

            <button
              type="button"
              className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
              onClick={startEdit}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Body */}
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

          <div className="space-y-2">
            {visibleItems.map((it) => {
              const parsed = parseBracketTag(it.text ?? "");
              return (
                <label
                  key={it.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-900 bg-slate-950/20 p-3"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(it.done)}
                    onChange={(e) =>
                      props.toggleToday.mutate({
                        kind: "outcomes",
                        id: it.id,
                        done: e.target.checked,
                      })
                    }
                    className="mt-1"
                  />

                  <div className="min-w-0">
                    <AreaPill area={parsed.area} />
                    <div className="mt-1 text-sm text-slate-200">
                      {parsed.text || "—"}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {draft.slice(0, 3).map((v, idx) => {
            const parsed = parseBracketTag(v);
            return (
              <div key={idx} className="grid grid-cols-[150px_1fr] gap-2">
                <select
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200"
                  value={parsed.area}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const next = [...prev];
                      next[idx] = encodeBracketTag(
                        e.target.value as LifeArea,
                        parsed.text,
                      );
                      return next;
                    })
                  }
                >
                  {AREA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <input
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  value={parsed.text}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const next = [...prev];
                      next[idx] = encodeBracketTag(
                        parsed.area,
                        e.target.value,
                      );
                      return next;
                    })
                  }
                  placeholder={`Today task ${idx + 1}`}
                />
              </div>
            );
          })}

          {saveError && (
            <div className="rounded-md border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-200">
              {saveError}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              className="rounded-md border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:text-white"
              disabled={saving}
              onClick={cancelEdit}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md border border-emerald-900/60 bg-emerald-950/20 px-3 py-1 text-xs text-emerald-200 hover:text-white"
              disabled={saving}
              onClick={save}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
