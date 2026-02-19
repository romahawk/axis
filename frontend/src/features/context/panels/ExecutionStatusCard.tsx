import { Activity, RefreshCw } from "lucide-react";
import { Panel } from "../../../components/Panel";
import { useExecutionSignals } from "../../../hooks/useExecutionSignals";
import type { SignalHealth } from "../types";

const STATUS_DOT: Record<SignalHealth, string> = {
  green: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]",
  yellow: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]",
  red: "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]",
};

const STATUS_LABEL: Record<SignalHealth, string> = {
  green: "On Track",
  yellow: "Needs Attention",
  red: "At Risk",
};

const STATUS_BAR_BG: Record<SignalHealth, string> = {
  green: "bg-emerald-400/80",
  yellow: "bg-amber-400/80",
  red: "bg-rose-400/80",
};

function ProgressBar({
  done,
  total,
  health,
}: {
  done: number;
  total: number;
  health: SignalHealth;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={`h-full rounded-full transition-all ${STATUS_BAR_BG[health]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-400">
        {done}/{total}
      </span>
    </div>
  );
}

function StatusDot({ health }: { health: SignalHealth }) {
  return <div className={`h-2 w-2 rounded-full ${STATUS_DOT[health]}`} />;
}

export function ExecutionStatusCard() {
  const { signals, isLoading, isError, error, refetch } = useExecutionSignals();

  if (isLoading) {
    return (
      <Panel className="axis-tone" title="Execution Status">
        <div className="flex items-center gap-2 py-6 text-xs text-slate-500">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Loading execution data...
        </div>
      </Panel>
    );
  }

  if (isError || !signals) {
    return (
      <Panel className="axis-tone" title="Execution Status">
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
          <div>Failed to load: {String(error ?? "Unknown error")}</div>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-md border border-red-800/60 bg-red-950/30 px-2 py-1 text-xs text-red-100 hover:text-white"
          >
            Retry
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="axis-tone axis-tone-focus" title={null as any}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-300/80" />
          <span className="text-sm font-semibold text-slate-100">
            Execution Status
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot health={signals.overallStatus} />
          <span className="text-xs text-slate-400">
            {STATUS_LABEL[signals.overallStatus]}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {/* Outcomes */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-slate-400">Weekly Outcomes</span>
            <StatusDot health={signals.outcomesHealth} />
          </div>
          <ProgressBar
            done={signals.outcomesFilled}
            total={signals.outcomesTotal}
            health={signals.outcomesHealth}
          />
        </div>

        {/* Today */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-slate-400">Today Top 3</span>
            <StatusDot health={signals.todayHealth} />
          </div>
          <ProgressBar
            done={signals.todayDone}
            total={signals.todayTotal}
            health={signals.todayHealth}
          />
        </div>

        {/* Blockers */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2">
          <span className="text-xs text-slate-400">Active Blockers</span>
          <div className="flex items-center gap-2">
            <StatusDot health={signals.blockersHealth} />
            <span className="text-sm font-medium tabular-nums text-slate-200">
              {signals.blockersCount}
            </span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2">
          <span className="text-xs text-slate-400">Active Projects</span>
          <span className="text-sm font-medium tabular-nums text-slate-200">
            {signals.activeProjectsCount}
          </span>
        </div>
      </div>
    </Panel>
  );
}
