import { useState } from "react";
import {
  X,
  ArrowRight,
  Link2,
  Package,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Panel } from "../../components/Panel";
import { useGanntifyStore } from "../../stores/ganntifyStore";
import type { GanntifyRow, RowStatus } from "./types";
import { canTransition, STATUS_COLORS, STATUS_DOT_GLOW } from "./types";

type Outcome = { id: string; text: string };

interface RowAuditPanelProps {
  row: GanntifyRow;
  outcomes: Outcome[];
  isLocked: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<RowStatus, string> = {
  planned: "Planned",
  active: "Active",
  shipped: "Shipped",
  stalled: "Stalled",
};

const POSSIBLE_TRANSITIONS: Record<RowStatus, RowStatus[]> = {
  planned: ["active", "stalled"],
  active: ["shipped", "stalled"],
  shipped: [],
  stalled: [],
};

export function RowAuditPanel({
  row,
  outcomes,
  isLocked,
  onClose,
}: RowAuditPanelProps) {
  const updateRowStatus = useGanntifyStore((s) => s.updateRowStatus);
  const setArtifact = useGanntifyStore((s) => s.setArtifact);
  const removeRow = useGanntifyStore((s) => s.removeRow);

  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [artifactType, setArtifactType] = useState(row.artifact.type);
  const [artifactUrl, setArtifactUrl] = useState(row.artifact.url);

  const outcomeText =
    outcomes.find((o) => o.id === row.linkedOutcomeId)?.text ?? null;

  const possibleNext = POSSIBLE_TRANSITIONS[row.status];

  function handleTransition(to: RowStatus) {
    setTransitionError(null);
    const err = updateRowStatus(row.id, to);
    if (err) setTransitionError(err);
  }

  function handleSaveArtifact() {
    setArtifact(row.id, { type: artifactType.trim(), url: artifactUrl.trim() });
  }

  function handleDelete() {
    const ok = window.confirm(
      `Delete commitment "${row.feature}"? This cannot be undone.`
    );
    if (!ok) return;
    removeRow(row.id);
    onClose();
  }

  return (
    <Panel title="" className="axis-tone axis-tone-ganntify">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100 truncate">
            {row.feature}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
            <div
              className={[
                "h-2 w-2 rounded-full",
                STATUS_COLORS[row.status],
                STATUS_DOT_GLOW[row.status],
              ].join(" ")}
            />
            <span className="uppercase tracking-widest text-slate-400">
              {STATUS_LABELS[row.status]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Linked Outcome */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
          Linked Outcome
        </div>
        {outcomeText ? (
          <div className="flex items-start gap-2 rounded-md border border-slate-800/60 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-300">
            <Link2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-cyan-400" />
            {outcomeText}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-md border border-rose-900/40 bg-rose-950/10 px-2 py-1.5 text-xs text-rose-300">
            <AlertCircle className="h-3.5 w-3.5" />
            No linked outcome (INVALID ROW)
          </div>
        )}
      </div>

      {/* Artifact */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
          Artifact
        </div>
        {isLocked ? (
          row.artifact.url ? (
            <a
              href={row.artifact.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-cyan-300 underline hover:text-cyan-200"
            >
              <Package className="h-3.5 w-3.5" />
              {row.artifact.type || "Link"}: {row.artifact.url}
            </a>
          ) : (
            <div className="text-xs text-slate-500">No artifact set</div>
          )
        ) : (
          <div className="space-y-1.5">
            <input
              placeholder="Type (e.g. PR, Figma, Doc)"
              value={artifactType}
              onChange={(e) => setArtifactType(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
            />
            <input
              placeholder="https://..."
              value={artifactUrl}
              onChange={(e) => setArtifactUrl(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
            />
            <button
              type="button"
              onClick={handleSaveArtifact}
              className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
            >
              Save Artifact
            </button>
          </div>
        )}
      </div>

      {/* Status Transitions */}
      {possibleNext.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
            Transition
          </div>
          <div className="flex flex-wrap gap-2">
            {possibleNext.map((next) => {
              const allowed = canTransition(row.status, next);
              return (
                <button
                  key={next}
                  type="button"
                  onClick={() => handleTransition(next)}
                  disabled={!allowed || (isLocked && next !== "shipped")}
                  className={[
                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors",
                    next === "shipped"
                      ? "border-cyan-800/50 text-cyan-300 hover:bg-cyan-950/30"
                      : next === "stalled"
                        ? "border-rose-800/50 text-rose-300 hover:bg-rose-950/30"
                        : "border-emerald-800/50 text-emerald-300 hover:bg-emerald-950/30",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                  ].join(" ")}
                >
                  <ArrowRight className="h-3 w-3" />
                  {STATUS_LABELS[next]}
                </button>
              );
            })}
          </div>
          {transitionError && (
            <div className="mt-1.5 text-xs text-rose-300">{transitionError}</div>
          )}
        </div>
      )}

      {/* Delete (planning mode only) */}
      {!isLocked && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1 rounded-md border border-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-950/20"
          >
            <Trash2 className="h-3 w-3" />
            Delete Row
          </button>
        </div>
      )}

      {/* Audit Trail */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
          Audit Trail
        </div>
        {row.auditTrail.length === 0 ? (
          <div className="text-xs text-slate-500">No events</div>
        ) : (
          <div className="space-y-2">
            {[...row.auditTrail].reverse().map((evt, i) => (
              <div
                key={`${evt.ts}-${i}`}
                className="flex items-start gap-2 text-[11px]"
              >
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                <div className="min-w-0">
                  <div className="text-slate-300">
                    {evt.event.replace(/_/g, " ")}
                    {evt.from && evt.to && (
                      <span className="text-slate-500">
                        {" "}
                        {evt.from} &rarr; {evt.to}
                      </span>
                    )}
                  </div>
                  {evt.meta && (
                    <div className="text-slate-500 truncate">{evt.meta}</div>
                  )}
                  <div className="text-slate-600">
                    {new Date(evt.ts).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
