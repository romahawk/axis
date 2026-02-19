// frontend/src/hooks/useExecutionSignals.ts
import { useMemo } from "react";
import { useDashboardView } from "./useDashboardView";
import type { ExecutionSignals, SignalHealth } from "../features/context/types";

function healthFromRatio(done: number, total: number): SignalHealth {
  if (total === 0) return "yellow";
  const ratio = done / total;
  if (ratio >= 0.66) return "green";
  if (ratio >= 0.33) return "yellow";
  return "red";
}

function blockersHealth(count: number): SignalHealth {
  if (count === 0) return "green";
  if (count <= 2) return "yellow";
  return "red";
}

function worstOf(...statuses: SignalHealth[]): SignalHealth {
  if (statuses.includes("red")) return "red";
  if (statuses.includes("yellow")) return "yellow";
  return "green";
}

export function useExecutionSignals(): {
  signals: ExecutionSignals | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
} {
  const { data, isLoading, isError, error, refetch } = useDashboardView();

  const signals = useMemo<ExecutionSignals | null>(() => {
    if (!data) return null;

    const outcomes = data.week.outcomes ?? [];
    const outcomesFilled = outcomes.filter(
      (o) => (o.text ?? "").trim() && o.text !== "---"
    ).length;
    const outcomesTotal = 3;

    const today = data.today.top3 ?? [];
    const todayDone = today.filter((t) => t.done).length;
    const todayTotal = today.filter(
      (t) => (t.text ?? "").trim() && t.text !== "---"
    ).length;

    const blockers = data.week.blockers ?? [];

    const projects = data.projects ?? [];
    const activeProjectsCount = projects.filter(
      (p: any) => p.is_active
    ).length;

    const oh = healthFromRatio(outcomesFilled, outcomesTotal);
    const th = healthFromRatio(todayDone, Math.max(todayTotal, 1));
    const bh = blockersHealth(blockers.length);

    return {
      outcomesHealth: oh,
      outcomesFilled,
      outcomesTotal,
      todayHealth: th,
      todayDone,
      todayTotal,
      blockersCount: blockers.length,
      blockersHealth: bh,
      activeProjectsCount,
      overallStatus: worstOf(oh, th, bh),
    };
  }, [data]);

  return { signals, isLoading, isError, error, refetch };
}
