import { Pencil, Trash2 } from "lucide-react";
import type { JournalEntry } from "../../../hooks/useJournal";
import { fmt } from "../state/useReviewState";

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

const AREA_LABEL: Record<LifeArea, string> = {
  career: "Career",
  ai_leverage: "AI × Leverage",
  education: "Education",
  health: "Health",
  family: "Family",
  finance: "Finance",
  admin: "Admin",
  none: "Unlabeled",
};

const AREA_PILL_CLASS: Record<LifeArea, string> = {
  career: "border-indigo-400/25 bg-indigo-950/25 text-indigo-100",
  ai_leverage: "border-cyan-400/25 bg-cyan-950/20 text-cyan-100",
  education: "border-violet-400/25 bg-violet-950/20 text-violet-100",
  health: "border-emerald-400/25 bg-emerald-950/20 text-emerald-100",
  family: "border-pink-400/25 bg-pink-950/20 text-pink-100",
  finance: "border-amber-400/25 bg-amber-950/20 text-amber-100",
  admin: "border-slate-400/20 bg-slate-950/30 text-slate-200",
  none: "border-slate-800/70 bg-slate-950/30 text-slate-400",
};

function AreaPill({ area }: { area: LifeArea }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
        AREA_PILL_CLASS[area],
      ].join(" ")}
      title={AREA_LABEL[area]}
    >
      {AREA_LABEL[area]}
    </span>
  );
}

/* ======================
   Snapshot → area
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

  for (const a of areas) counts[a] = (counts[a] ?? 0) + 1;

  return (
    (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as LifeArea) ||
    "none"
  );
}

function getEntryArea(entry: JournalEntry): LifeArea {
  // Weekly entries do not yet store area in a reliable way
  if (entry.type !== "daily") return "none";
  if (typeof entry.created_at !== "string") return "none";

  const ymd = entry.created_at.slice(0, 10);
  const map = readSnapshotsMap();
  const snap = map[ymd];

  if (!snap?.tasks?.length) return "none";

  const areas = snap.tasks.map((t) => (t.area ?? "none") as LifeArea);
  return dominantArea(areas);
}

/* ======================
   Component
====================== */

export function JournalEntryCard({
  entry,
  onEdit,
  onDelete,
  onOpen,
  isBusy,
}: {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
  onOpen?: () => void;
  isBusy?: boolean;
}) {
  const clickable = Boolean(onOpen);
  const area = getEntryArea(entry);

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : -1}
      onClick={clickable ? onOpen : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.();
              }
            }
          : undefined
      }
      className={[
        "rounded-2xl border border-slate-800/60 bg-slate-950/20 p-4",
        clickable ? "cursor-pointer hover:border-slate-700/70" : "",
      ].join(" ")}
      title={clickable ? "Open entry" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {/* Entry type pill */}
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest border",
                entry.type === "daily"
                  ? "border-indigo-400/25 bg-indigo-950/25 text-indigo-100"
                  : "border-emerald-400/25 bg-emerald-950/20 text-emerald-100",
              ].join(" ")}
            >
              {entry.type}
            </span>

            {/* ✅ Area pill preview (daily derived from snapshot map) */}
            <AreaPill area={area} />

            <div className="text-xs text-slate-400 truncate">
              {fmt(entry.created_at)}
            </div>
          </div>

          <div className="mt-2 text-sm text-slate-200">
            {entry.type === "daily"
              ? entry.wins?.[0] ?? entry.miss ?? entry.fix ?? "—"
              : (entry as any).next_focus ??
                (entry as any).decision ??
                (entry as any).constraint ??
                "—"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            className={[
              "inline-flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/30 px-2.5 py-1 text-xs text-slate-300 hover:text-white",
              isBusy ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
            title="Edit entry"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>

          <button
            type="button"
            disabled={isBusy}
            className={[
              "inline-flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/30 px-2.5 py-1 text-xs text-slate-300 hover:text-white",
              isBusy ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
            title="Delete entry"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Optional detail preview (kept from prior version) */}
      {entry.type === "daily" && (
        <div className="mt-3 space-y-1 text-xs text-slate-400">
          {entry.wins?.length ? (
            <div>
              <span className="text-slate-300">Wins:</span>{" "}
              {entry.wins.join(" · ")}
            </div>
          ) : null}
          {entry.miss ? (
            <div>
              <span className="text-slate-300">Miss:</span> {entry.miss}
            </div>
          ) : null}
          {entry.fix ? (
            <div>
              <span className="text-slate-300">Fix:</span> {entry.fix}
            </div>
          ) : null}
        </div>
      )}

      {entry.type === "weekly" && (
        <div className="mt-3 space-y-1 text-xs text-slate-400">
          {(entry as any).constraint ? (
            <div>
              <span className="text-slate-300">Constraint:</span>{" "}
              {(entry as any).constraint}
            </div>
          ) : null}
          {(entry as any).decision ? (
            <div>
              <span className="text-slate-300">Decision:</span>{" "}
              {(entry as any).decision}
            </div>
          ) : null}
          {(entry as any).next_focus ? (
            <div>
              <span className="text-slate-300">Next focus:</span>{" "}
              {(entry as any).next_focus}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
