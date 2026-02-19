import { useState } from "react";
import { DollarSign, Pencil, Check, X } from "lucide-react";
import { Panel } from "../../../components/Panel";
import { useContextStore } from "../../../stores/contextStore";

export function CapitalSnapshotCard() {
  const capital = useContextStore((s) => s.capitalSnapshot);
  const setCapital = useContextStore((s) => s.setCapitalSnapshot);

  const [editMode, setEditMode] = useState(false);
  const [draftPnl, setDraftPnl] = useState("");
  const [draftRisk, setDraftRisk] = useState("");
  const [draftNotes, setDraftNotes] = useState("");

  const isEmpty = !capital.pnl && !capital.riskRemaining && !capital.notes;

  function startEdit() {
    setDraftPnl(capital.pnl);
    setDraftRisk(capital.riskRemaining);
    setDraftNotes(capital.notes);
    setEditMode(true);
  }

  function save() {
    setCapital({
      pnl: draftPnl.trim(),
      riskRemaining: draftRisk.trim(),
      notes: draftNotes.trim(),
    });
    setEditMode(false);
  }

  function cancel() {
    setEditMode(false);
  }

  return (
    <Panel className="axis-tone axis-tone-week" title={null as any}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-cyan-300/80" />
          <span className="text-sm font-semibold text-slate-100">
            Capital Snapshot
          </span>
        </div>
        {!editMode && (
          <button
            type="button"
            onClick={startEdit}
            className="rounded-md p-1 text-slate-500 hover:text-slate-200"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editMode ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              PnL / Capital Status
            </label>
            <input
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={draftPnl}
              onChange={(e) => setDraftPnl(e.target.value)}
              placeholder="e.g. +$2,400 MTD, 68% win rate"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Risk Remaining
            </label>
            <input
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={draftRisk}
              onChange={(e) => setDraftRisk(e.target.value)}
              placeholder="e.g. 1.2% daily risk budget left"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Notes</label>
            <textarea
              className="w-full resize-none rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              rows={2}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder="Key context, edge notes, mental state..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              className="rounded-md border border-slate-800 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-md border border-cyan-900/60 bg-cyan-950/20 p-1.5 text-cyan-300 hover:text-white"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="mt-4 py-4 text-center">
          <div className="text-xs text-slate-500">
            No capital data entered yet.
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="mt-2 rounded-md border border-slate-800 px-3 py-1 text-xs text-slate-400 hover:text-white"
          >
            Add snapshot
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {capital.pnl && (
            <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                PnL
              </div>
              <div className="mt-0.5 text-sm font-medium text-slate-200">
                {capital.pnl}
              </div>
            </div>
          )}
          {capital.riskRemaining && (
            <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Risk Remaining
              </div>
              <div className="mt-0.5 text-sm font-medium text-slate-200">
                {capital.riskRemaining}
              </div>
            </div>
          )}
          {capital.notes && (
            <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Notes
              </div>
              <div className="mt-0.5 text-sm text-slate-300">
                {capital.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
