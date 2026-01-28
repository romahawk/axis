import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

import { Panel } from "../../../components/Panel";
import { useLocalStorageJson } from "../../../hooks/useLocalStorageJson";

type WeekOutcome = { id: string; text: string };

export function WeekOutcomesPanel({
  weekOutcomes,
}: {
  weekOutcomes: WeekOutcome[];
}) {
  const [open, setOpen] = useLocalStorageJson<boolean>(
    "axis_week_outcomes_open_v1",
    true
  );

  const filled = useMemo(
    () => (weekOutcomes ?? []).filter((o) => (o.text ?? "").trim() && o.text !== "—").length,
    [weekOutcomes]
  );

  // NOTE:
  // This component is only responsible for wrapping + collapsing.
  // The existing edit/set logic should already exist in your current file.
  // If your current WeekOutcomesPanel includes SET/Edit buttons and input logic,
  // keep that code inside the {open && (...)} section below.
  //
  // For now, this version preserves display, and you can reinsert your existing controls.

  return (
    <Panel
      className="axis-tone axis-tone-focus"
      title={null as any}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <div className="text-sm font-semibold text-slate-100">
            Top 3 Outcomes (weekly)
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Rule: exactly 3. {filled}/3 set.
          </div>
        </div>

        <ChevronDown
          className={[
            "h-4 w-4 text-slate-300 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="mt-3">
          {/* Replace this block with your existing WeekOutcomesPanel body (inputs, SET/Edit, etc.) */}
          <div className="space-y-2">
            {weekOutcomes?.slice(0, 3).map((o) => (
              <div
                key={o.id}
                className="rounded-lg border border-slate-900 p-3 text-sm text-slate-200"
              >
                <span className="text-slate-400">{o.id}: </span>
                {o.text || "—"}
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
