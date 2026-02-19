import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Panel } from "../../components/Panel";
import { useGanntifyStore } from "../../stores/ganntifyStore";
import { useWeekRange, weekIdToLabel, getCurrentWeekId, compareWeekIds } from "../../hooks/useWeekRange";
import type { GanntifyRow, RowStatus } from "./types";
import { STATUS_BAR_COLORS, STATUS_DOT_GLOW, STATUS_COLORS } from "./types";

type Project = {
  key: string;
  name: string;
  is_active?: boolean;
};

type Outcome = { id: string; text: string };

interface GanttGridProps {
  projects: Project[];
  outcomes: Outcome[];
  selectedProjectKey: string | null;
  isLocked: boolean;
  onSelectRow: (row: GanntifyRow) => void;
  selectedRowId: string | null;
}

export function GanttGrid({
  projects,
  outcomes,
  selectedProjectKey,
  isLocked,
  onSelectRow,
  selectedRowId,
}: GanttGridProps) {
  const rows = useGanntifyStore((s) => s.rows);
  const addRow = useGanntifyStore((s) => s.addRow);
  const weeks = useWeekRange(12);
  const currentWeek = getCurrentWeekId();

  const [addingForProject, setAddingForProject] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState("");
  const [newStartWeek, setNewStartWeek] = useState(currentWeek);
  const [newEndWeek, setNewEndWeek] = useState(currentWeek);
  const [newOutcomeId, setNewOutcomeId] = useState("");

  // Filter active projects, then further filter by selected
  const activeProjects = projects.filter((p) => p.is_active);
  const visibleProjects = selectedProjectKey
    ? activeProjects.filter((p) => p.key === selectedProjectKey)
    : activeProjects;

  // Group rows by project
  const rowsByProject = new Map<string, GanntifyRow[]>();
  for (const row of rows) {
    const existing = rowsByProject.get(row.projectKey) ?? [];
    existing.push(row);
    rowsByProject.set(row.projectKey, existing);
  }

  // Build outcome lookup
  const outcomeMap = new Map(outcomes.map((o) => [o.id, o.text]));

  function handleAddRow(projectKey: string) {
    if (!newFeature.trim()) return;
    addRow({
      projectKey,
      feature: newFeature.trim(),
      startWeek: newStartWeek,
      endWeek: newEndWeek,
      status: "planned" as RowStatus,
      linkedOutcomeId: newOutcomeId,
      artifact: { type: "", url: "" },
    });
    setNewFeature("");
    setNewOutcomeId("");
    setAddingForProject(null);
  }

  function getBarSpan(row: GanntifyRow): { start: number; span: number } {
    const startIdx = weeks.findIndex(
      (w) => compareWeekIds(w, row.startWeek) >= 0
    );
    const endIdx = weeks.findIndex(
      (w) => compareWeekIds(w, row.endWeek) >= 0
    );

    const effectiveStart = startIdx === -1
      ? (compareWeekIds(row.startWeek, weeks[0]) < 0 ? 0 : weeks.length)
      : startIdx;

    const effectiveEnd = endIdx === -1
      ? weeks.length - 1
      : endIdx;

    if (effectiveStart >= weeks.length) return { start: 0, span: 0 };

    return {
      start: effectiveStart,
      span: Math.max(1, effectiveEnd - effectiveStart + 1),
    };
  }

  return (
    <Panel title="" className="axis-tone axis-tone-ganntify overflow-x-auto">
      {/* Week header row */}
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `180px repeat(${weeks.length}, minmax(56px, 1fr))`,
        }}
      >
        <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-slate-500">
          Feature
        </div>
        {weeks.map((w) => {
          const isCurrent = w === currentWeek;
          return (
            <div
              key={w}
              className={[
                "px-1 py-1 text-center text-[10px] font-medium",
                isCurrent
                  ? "rounded-t-md bg-amber-900/20 text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.2)_inset]"
                  : "text-slate-500",
              ].join(" ")}
            >
              {weekIdToLabel(w)}
            </div>
          );
        })}
      </div>

      {/* Projects + rows */}
      {visibleProjects.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No active projects. Activate projects in the Dashboard.
        </div>
      ) : (
        visibleProjects.map((project) => {
          const projectRows = rowsByProject.get(project.key) ?? [];

          return (
            <div key={project.key} className="mt-3">
              {/* Project name header */}
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-semibold text-slate-200">
                    {(project.name ?? "").trim() || "Untitled"}
                  </span>
                </div>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() =>
                      setAddingForProject(
                        addingForProject === project.key ? null : project.key
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-slate-800/70 px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    <Plus className="h-3 w-3" />
                    Row
                  </button>
                )}
              </div>

              {/* Add row form */}
              {addingForProject === project.key && !isLocked && (
                <div className="mx-2 mb-2 rounded-md border border-slate-800/60 bg-slate-950/50 p-2 space-y-2">
                  <input
                    autoFocus
                    placeholder="Feature name"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newStartWeek}
                      onChange={(e) => setNewStartWeek(e.target.value)}
                      className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none"
                    >
                      {weeks.map((w) => (
                        <option key={w} value={w}>
                          {weekIdToLabel(w)} start
                        </option>
                      ))}
                    </select>
                    <select
                      value={newEndWeek}
                      onChange={(e) => setNewEndWeek(e.target.value)}
                      className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none"
                    >
                      {weeks.map((w) => (
                        <option key={w} value={w}>
                          {weekIdToLabel(w)} end
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={newOutcomeId}
                    onChange={(e) => setNewOutcomeId(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none"
                  >
                    <option value="">Link to outcome...</option>
                    {outcomes.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.text}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingForProject(null)}
                      className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRow(project.key)}
                      disabled={!newFeature.trim()}
                      className="rounded-md border border-slate-800 bg-slate-800/40 px-2 py-1 text-xs text-slate-200 hover:text-white disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Rows */}
              {projectRows.length === 0 ? (
                <div className="px-2 py-2 text-[10px] text-slate-500">
                  No commitments yet
                </div>
              ) : (
                projectRows.map((row) => {
                  const { start, span } = getBarSpan(row);
                  const hasValidOutcome =
                    row.linkedOutcomeId && outcomeMap.has(row.linkedOutcomeId);
                  const barColors = STATUS_BAR_COLORS[row.status];
                  const dotColor = STATUS_COLORS[row.status];
                  const dotGlow = STATUS_DOT_GLOW[row.status];
                  const isSelected = selectedRowId === row.id;

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => onSelectRow(row)}
                      className={[
                        "grid w-full gap-px text-left transition-colors",
                        isSelected
                          ? "bg-slate-800/20"
                          : "hover:bg-slate-800/10",
                      ].join(" ")}
                      style={{
                        gridTemplateColumns: `180px repeat(${weeks.length}, minmax(56px, 1fr))`,
                      }}
                    >
                      {/* Feature label */}
                      <div className="flex items-center gap-1.5 px-2 py-1.5 min-w-0">
                        <div
                          className={[
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            dotColor,
                            dotGlow,
                          ].join(" ")}
                        />
                        <span className="truncate text-xs text-slate-300">
                          {row.feature}
                        </span>
                        {!hasValidOutcome && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-rose-400" />
                        )}
                      </div>

                      {/* Week cells with bar */}
                      {weeks.map((w, i) => {
                        const isCurrent = w === currentWeek;
                        const inBar = i >= start && i < start + span && span > 0;
                        const isBarStart = i === start && span > 0;
                        const isBarEnd = i === start + span - 1 && span > 0;

                        return (
                          <div
                            key={w}
                            className={[
                              "relative h-7",
                              isCurrent ? "bg-amber-900/5" : "",
                            ].join(" ")}
                          >
                            {inBar && (
                              <div
                                className={[
                                  "absolute inset-y-1 inset-x-0 border",
                                  barColors,
                                  isBarStart ? "ml-1 rounded-l-md" : "",
                                  isBarEnd ? "mr-1 rounded-r-md" : "",
                                ].join(" ")}
                              />
                            )}
                          </div>
                        );
                      })}
                    </button>
                  );
                })
              )}

              {/* Separator */}
              <div className="mx-2 mt-1 h-px bg-slate-800/40" />
            </div>
          );
        })
      )}
    </Panel>
  );
}
