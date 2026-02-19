import { useState } from "react";
import {
  Compass,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Panel } from "../../../components/Panel";
import { useContextStore } from "../../../stores/contextStore";

function getQuarterProgress(): { label: string; weekOfQuarter: number; totalWeeks: number } {
  const now = new Date();
  const month = now.getMonth(); // 0-based
  const quarter = Math.floor(month / 3) + 1;
  const year = now.getFullYear();
  const quarterStart = new Date(year, (quarter - 1) * 3, 1);
  const diffMs = now.getTime() - quarterStart.getTime();
  const weekOfQuarter = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  return {
    label: `Q${quarter} ${year}`,
    weekOfQuarter: Math.min(weekOfQuarter, 13),
    totalWeeks: 13,
  };
}

export function StrategicHorizonCard() {
  const quarterGoal = useContextStore((s) => s.quarterGoal);
  const setQuarterGoal = useContextStore((s) => s.setQuarterGoal);
  const launchpadLinks = useContextStore((s) => s.launchpadLinks);
  const addLaunchpadLink = useContextStore((s) => s.addLaunchpadLink);
  const removeLaunchpadLink = useContextStore((s) => s.removeLaunchpadLink);

  const [editGoal, setEditGoal] = useState(false);
  const [draftGoal, setDraftGoal] = useState("");

  const [addLinkMode, setAddLinkMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const quarter = getQuarterProgress();
  const progressPct = Math.round((quarter.weekOfQuarter / quarter.totalWeeks) * 100);

  function startEditGoal() {
    setDraftGoal(quarterGoal);
    setEditGoal(true);
  }

  function saveGoal() {
    setQuarterGoal(draftGoal.trim());
    setEditGoal(false);
  }

  function handleAddLink() {
    if (!newLabel.trim() || !newUrl.trim()) return;
    addLaunchpadLink({ label: newLabel.trim(), url: newUrl.trim() });
    setNewLabel("");
    setNewUrl("");
    setAddLinkMode(false);
  }

  return (
    <Panel className="axis-tone axis-tone-context" title={null as any}>
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-amber-300/80" />
        <span className="text-sm font-semibold text-slate-100">
          Strategic Horizon
        </span>
      </div>

      {/* Quarter Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{quarter.label}</span>
          <span className="tabular-nums text-slate-500">
            Week {quarter.weekOfQuarter}/{quarter.totalWeeks}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
          <div
            className="h-full rounded-full bg-amber-400/70 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Quarter Goal */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            Quarter Goal
          </span>
          {!editGoal && (
            <button
              type="button"
              onClick={startEditGoal}
              className="rounded-md p-1 text-slate-500 hover:text-slate-200"
              title="Edit goal"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
        {editGoal ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-600"
              value={draftGoal}
              onChange={(e) => setDraftGoal(e.target.value)}
              placeholder="One sentence quarter goal..."
              autoFocus
            />
            <button
              type="button"
              onClick={() => setEditGoal(false)}
              className="rounded-md border border-slate-800 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={saveGoal}
              className="rounded-md border border-amber-900/60 bg-amber-950/20 p-1.5 text-amber-300 hover:text-white"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : quarterGoal ? (
          <div className="mt-1 text-sm text-slate-200">{quarterGoal}</div>
        ) : (
          <div className="mt-1 text-xs text-slate-500">
            No quarter goal set.{" "}
            <button
              type="button"
              onClick={startEditGoal}
              className="text-slate-400 underline hover:text-white"
            >
              Set one
            </button>
          </div>
        )}
      </div>

      {/* Launchpad Links */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            Launchpad
          </span>
          <span className="text-[10px] text-slate-600">
            {launchpadLinks.length}/8
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {launchpadLinks.map((link) => (
            <div
              key={link.id}
              className="group flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center gap-1.5 truncate text-xs text-slate-300 hover:text-white"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                <span className="truncate">{link.label}</span>
              </a>
              <button
                type="button"
                onClick={() => removeLaunchpadLink(link.id)}
                className="flex-shrink-0 rounded p-0.5 text-slate-600 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {addLinkMode ? (
          <div className="mt-2 space-y-2 rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
            <input
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-slate-600"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Notion, TradingView)"
              autoFocus
            />
            <input
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-slate-600"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddLinkMode(false)}
                className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLink}
                disabled={!newLabel.trim() || !newUrl.trim()}
                className="rounded-md border border-amber-900/60 bg-amber-950/20 px-2 py-1 text-xs text-amber-300 hover:text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          launchpadLinks.length < 8 && (
            <button
              type="button"
              onClick={() => setAddLinkMode(true)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700/60 py-2 text-xs text-slate-500 hover:border-slate-600 hover:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add link
            </button>
          )
        )}
      </div>
    </Panel>
  );
}
