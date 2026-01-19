import { Panel } from "../../../components/Panel";

export function DriftPanel({ drift }: { drift: Record<string, boolean> }) {
  return (
    <Panel title="Drift (auto-check)">
      <ul className="space-y-2 text-sm">
        {Object.entries(drift ?? {}).map(([k, v]) => (
          <li key={k} className="flex items-center justify-between">
            <span className="text-slate-200">{k}</span>
            <span className={v ? "text-red-300" : "text-slate-500"}>
              {v ? "TRIGGERED" : "OK"}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
