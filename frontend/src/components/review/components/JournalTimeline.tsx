import * as React from "react";
import { JournalEntryCard } from "./JournalEntryCard";
import type { JournalEntry } from "../../../hooks/useJournal";

/* ======================
   Life Areas (canonical)
====================== */
type LifeArea =
  | "career"
  | "ai_leverage"
  | "education"
  | "health"
  | "family"
  | "finance"
  | "admin"
  | "none";

const AREA_OPTIONS: Array<{ value: LifeArea | "all"; label: string }> = [
  { value: "all", label: "All areas" },
  { value: "career", label: "Career" },
  { value: "ai_leverage", label: "AI × Leverage" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "family", label: "Family" },
  { value: "finance", label: "Finance" },
  { value: "admin", label: "Admin" },
  { value: "none", label: "Unlabeled" },
];

/* ======================
   Snapshot reading
====================== */

const CLOSED_DAY_SNAPSHOTS_MAP_KEY = "axis_closed_day_snapshots_map_v1";

type ClosedDaySnapshot = {
  date: string;
  closed_at?: string;
  tasks: Array<{ id: string; text: string; done: boolean; area: LifeArea }>;
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

/* ======================
   Area inference
====================== */

function dominantArea(areas: LifeArea[]): LifeArea {
  const counts: Record<LifeArea, number> = {
    career: 0,
    ai_leverage: 0,
    education: 0,
    health: 0,
    family: 0,
    finance: 0,
    admin: 0,
    none: 0,
  };

  areas.forEach((a) => (counts[a] = (counts[a] ?? 0) + 1));

  return (
    (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as LifeArea) ||
    "none"
  );
}

function getDailyEntryArea(entry: JournalEntry): LifeArea {
  if (!entry.created_at) return "none";

  const ymd = entry.created_at.slice(0, 10);
  const map = readSnapshotsMap();
  const snap = map[ymd];

  if (!snap?.tasks?.length) return "none";

  return dominantArea(snap.tasks.map((t) => t.area ?? "none"));
}

/* ======================
   Component
====================== */

export function JournalTimeline({
  entries,
  onOpen,
  onEdit,
  onDelete,
  isBusy,
}: {
  entries: JournalEntry[];
  onOpen: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  isBusy?: boolean;
}) {
  const [typeFilter, setTypeFilter] = React.useState<
    "all" | "daily" | "weekly"
  >("all");

  const [areaFilter, setAreaFilter] = React.useState<LifeArea | "all">("all");

  const enriched = React.useMemo(() => {
    return entries.map((entry) => {
      const area =
        entry.type === "daily" ? getDailyEntryArea(entry) : "none";

      return { entry, area };
    });
  }, [entries]);

  const filtered = React.useMemo(() => {
    return enriched.filter(({ entry, area }) => {
      if (typeFilter !== "all" && entry.type !== typeFilter) return false;
      if (areaFilter !== "all" && area !== areaFilter) return false;
      return true;
    });
  }, [enriched, typeFilter, areaFilter]);

  const counts = React.useMemo(() => {
    return {
      total: entries.length,
      daily: entries.filter((e) => e.type === "daily").length,
      weekly: entries.filter((e) => e.type === "weekly").length,
    };
  }, [entries]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/60 bg-slate-950/20 p-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Filters
          </div>

          <select
            className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-slate-600"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | "daily" | "weekly")
            }
          >
            <option value="all">All ({counts.total})</option>
            <option value="daily">Daily ({counts.daily})</option>
            <option value="weekly">Weekly ({counts.weekly})</option>
          </select>

          <select
            className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-slate-600"
            value={areaFilter}
            onChange={(e) =>
              setAreaFilter(e.target.value as LifeArea | "all")
            }
          >
            {AREA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
            onClick={() => {
              setTypeFilter("all");
              setAreaFilter("all");
            }}
          >
            Reset
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Showing{" "}
          <span className="text-slate-300">{filtered.length}</span> /{" "}
          <span className="text-slate-300">{entries.length}</span>
        </div>
      </div>

      {/* Timeline */}
      {filtered.length ? (
        filtered.map(({ entry }) => (
          <JournalEntryCard
            key={entry.id}
            entry={entry}
            isBusy={isBusy}
            onOpen={() => onOpen(entry)}
            onEdit={() => onEdit(entry)}
            onDelete={() => onDelete(entry.id)}
          />
        ))
      ) : (
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/30 p-4 text-sm text-slate-400">
          No entries match the selected filters.
        </div>
      )}
    </div>
  );
}
