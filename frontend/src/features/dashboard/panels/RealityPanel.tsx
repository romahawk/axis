import { Panel } from "../../../components/Panel";

export type Commitment = { id: string; text: string; day?: string };

export function RealityPanel({ commitments }: { commitments: Commitment[] }) {
  return (
    <Panel title="Time Reality (read-only)">
      {commitments?.length ? (
        <ul className="space-y-2 text-sm text-slate-200">
          {commitments.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-900 p-3">
              <div>{c.text}</div>
              {c.day && <div className="mt-1 text-xs text-slate-400">{c.day}</div>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-slate-500">Empty</div>
      )}
    </Panel>
  );
}
