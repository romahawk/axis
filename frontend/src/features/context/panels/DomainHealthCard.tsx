import { useState } from "react";
import { Crosshair, Plus, Trash2, Check, X } from "lucide-react";
import { Panel } from "../../../components/Panel";
import { useContextStore } from "../../../stores/contextStore";
import type { DomainStatus } from "../types";

const STATUS_DOT: Record<DomainStatus, string> = {
  green: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]",
  yellow: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]",
  red: "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]",
};

const STATUS_RING: Record<DomainStatus, string> = {
  green: "border-emerald-400/30",
  yellow: "border-amber-400/30",
  red: "border-rose-400/30",
};

const STATUS_OPTIONS: Array<{ value: DomainStatus; label: string }> = [
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
];

export function DomainHealthCard() {
  const domains = useContextStore((s) => s.domains);
  const addDomain = useContextStore((s) => s.addDomain);
  const setDomain = useContextStore((s) => s.setDomain);
  const removeDomain = useContextStore((s) => s.removeDomain);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftStatus, setDraftStatus] = useState<DomainStatus>("green");
  const [draftStep, setDraftStep] = useState("");

  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState<DomainStatus>("green");
  const [newStep, setNewStep] = useState("");

  function startEdit(d: { id: string; name: string; status: DomainStatus; nextStep: string }) {
    setEditingId(d.id);
    setDraftName(d.name);
    setDraftStatus(d.status);
    setDraftStep(d.nextStep);
  }

  function saveEdit() {
    if (!editingId) return;
    setDomain(editingId, {
      name: draftName.trim() || "Untitled",
      status: draftStatus,
      nextStep: draftStep.trim(),
    });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleAdd() {
    if (!newName.trim()) return;
    addDomain({
      name: newName.trim(),
      status: newStatus,
      nextStep: newStep.trim(),
    });
    setNewName("");
    setNewStatus("green");
    setNewStep("");
    setAddMode(false);
  }

  return (
    <Panel className="axis-tone axis-tone-today" title={null as any}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-emerald-300/80" />
          <span className="text-sm font-semibold text-slate-100">
            Domain Health
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {domains.length}/3 fronts
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {domains.length === 0 && !addMode && (
          <div className="py-4 text-center text-xs text-slate-500">
            No active domains tracked. Add up to 3 key fronts.
          </div>
        )}

        {domains.map((d) =>
          editingId === d.id ? (
            <div
              key={d.id}
              className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-950/60 p-3"
            >
              <input
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-600"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Domain name"
              />
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-600"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as DomainStatus)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-slate-600"
                  value={draftStep}
                  onChange={(e) => setDraftStep(e.target.value)}
                  placeholder="Next irreversible step..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-md border border-slate-800 p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-md border border-emerald-900/60 bg-emerald-950/20 p-1.5 text-emerald-300 hover:text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              key={d.id}
              className={`group flex items-start gap-3 rounded-lg border ${STATUS_RING[d.status]} bg-slate-950/40 p-3`}
            >
              <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${STATUS_DOT[d.status]}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-200">
                  {d.name}
                </div>
                {d.nextStep && (
                  <div className="mt-1 text-xs text-slate-400">
                    Next: {d.nextStep}
                  </div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => startEdit(d)}
                  className="rounded-md p-1 text-slate-500 hover:text-slate-200"
                  title="Edit"
                >
                  <Crosshair className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeDomain(d.id)}
                  className="rounded-md p-1 text-slate-500 hover:text-rose-300"
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        )}

        {/* Add new domain */}
        {addMode ? (
          <div className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
            <input
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Domain name (e.g. Trading, SaaS, Health)"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-600"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as DomainStatus)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-slate-600"
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Next irreversible step..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddMode(false)}
                className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="rounded-md border border-emerald-900/60 bg-emerald-950/20 px-2 py-1 text-xs text-emerald-300 hover:text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          domains.length < 3 && (
            <button
              type="button"
              onClick={() => setAddMode(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700/60 py-2 text-xs text-slate-500 hover:border-slate-600 hover:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add domain
            </button>
          )
        )}
      </div>
    </Panel>
  );
}
