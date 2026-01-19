import { Panel } from "../../../components/Panel";

export function AnchorsPanel({ anchors }: { anchors: Record<string, boolean> }) {
  return (
    <Panel title="Anchors (weekly, binary)">
      <ul className="space-y-2 text-sm">
        {Object.entries(anchors ?? {}).map(([k, v]) => (
          <li key={k} className="flex items-center justify-between">
            <span className="text-slate-200">{k}</span>
            <span className={v ? "text-emerald-300" : "text-slate-500"}>
              {v ? "ON" : "OFF"}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
