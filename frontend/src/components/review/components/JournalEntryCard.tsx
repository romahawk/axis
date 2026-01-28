import { Pencil, Trash2 } from "lucide-react";
import type { JournalEntry } from "../../../hooks/useJournal";
import { fmt } from "../state/useReviewState";

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

            <div className="text-xs text-slate-400 truncate">
              {fmt(entry.created_at)}
            </div>
          </div>

          <div className="mt-2 text-sm text-slate-200">
            {entry.type === "daily"
              ? (entry.wins?.[0] ?? entry.miss ?? entry.fix ?? "—")
              : (entry.next_focus ?? entry.decision ?? entry.constraint ?? "—")}
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
          {entry.constraint ? (
            <div>
              <span className="text-slate-300">Constraint:</span>{" "}
              {entry.constraint}
            </div>
          ) : null}
          {entry.decision ? (
            <div>
              <span className="text-slate-300">Decision:</span> {entry.decision}
            </div>
          ) : null}
          {entry.next_focus ? (
            <div>
              <span className="text-slate-300">Next focus:</span>{" "}
              {entry.next_focus}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
