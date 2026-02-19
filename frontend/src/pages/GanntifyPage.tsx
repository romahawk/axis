import { useState } from "react";
import { Lock } from "lucide-react";
import { useDashboardView } from "../hooks/useDashboardView";
import { useGanntifyStore } from "../stores/ganntifyStore";
import { ProjectLibrary } from "../features/ganntify/ProjectLibrary";
import { GanttGrid } from "../features/ganntify/GanttGrid";
import { RowAuditPanel } from "../features/ganntify/RowAuditPanel";
import type { GanntifyRow } from "../features/ganntify/types";

type Project = {
  key: string;
  name: string;
  is_active?: boolean;
  links: { label: string; url: string }[];
};

export default function GanntifyPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardView();
  const rows = useGanntifyStore((s) => s.rows);

  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(
    null
  );
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  if (isLoading) return <div className="text-slate-400">Loading...</div>;

  if (isError) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        <div>Failed to load data: {String(error)}</div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="mt-3 rounded-md border border-red-800/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-100 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFetching ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const projects = (data.projects ?? []) as Project[];
  const outcomes = data.week.outcomes ?? [];
  const isLocked = data.week.mode === "LOCKED IN";

  const selectedRow =
    selectedRowId ? rows.find((r) => r.id === selectedRowId) ?? null : null;

  function handleSelectRow(row: GanntifyRow) {
    setSelectedRowId(selectedRowId === row.id ? null : row.id);
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">GANNTIFY</div>
          <div className="text-xl font-semibold text-slate-100">
            Commitment Grid
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Weekly project commitments tied to outcomes. 12-week horizon.
          </div>
        </div>
        {isLocked && (
          <div className="flex items-center gap-1.5 rounded-md border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-[10px] uppercase tracking-widest text-amber-300">
            <Lock className="h-3 w-3" />
            Locked
          </div>
        )}
      </div>

      {/* 3-column layout */}
      <div
        className={[
          "grid grid-cols-1 gap-4 xl:h-[calc(100vh-160px)]",
          selectedRow
            ? "xl:grid-cols-[220px_minmax(0,1fr)_300px]"
            : "xl:grid-cols-[220px_minmax(0,1fr)]",
        ].join(" ")}
      >
        {/* LEFT - Project Library */}
        <aside className="xl:h-full xl:overflow-y-auto">
          <ProjectLibrary
            projects={projects}
            selectedProjectKey={selectedProjectKey}
            onSelectProject={setSelectedProjectKey}
          />
        </aside>

        {/* CENTER - Gantt Grid */}
        <main className="xl:h-full xl:overflow-auto">
          <GanttGrid
            projects={projects}
            outcomes={outcomes}
            selectedProjectKey={selectedProjectKey}
            isLocked={isLocked}
            onSelectRow={handleSelectRow}
            selectedRowId={selectedRowId}
          />
        </main>

        {/* RIGHT - Row Audit (conditional) */}
        {selectedRow && (
          <aside className="xl:h-full xl:overflow-y-auto">
            <RowAuditPanel
              key={selectedRow.id}
              row={selectedRow}
              outcomes={outcomes}
              isLocked={isLocked}
              onClose={() => setSelectedRowId(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
