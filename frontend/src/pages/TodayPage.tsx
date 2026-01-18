import CheckList from "../components/CheckList";
import { useTodayView } from "../hooks/useTodayView";
import { useToggleTodayItem } from "../hooks/useToggleTodayItem";

export default function TodayPage() {
  const { data, isLoading, isError, error } = useTodayView();
  const toggle = useToggleTodayItem();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Today</h1>
        <div className="text-slate-400">Loading…</div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Today</h1>
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
          Failed to load Today view: {String(error)}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Today</h1>
        <div className="text-xs text-slate-400">{data?.date}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CheckList
          title="Outcomes (max 3)"
          items={data?.outcomes ?? []}
          onToggle={(id, nextDone) =>
            toggle.mutate({ kind: "outcomes", id, done: nextDone })
          }
        />

        <CheckList
          title="Actions"
          items={data?.actions ?? []}
          onToggle={(id, nextDone) =>
            toggle.mutate({ kind: "actions", id, done: nextDone })
          }
        />
      </div>

      <div className="rounded-xl border border-slate-800 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-200">Blockers</div>
        {data?.blockers?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
            {data.blockers.map((b) => (
              <li key={b.id}>{b.text}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500">None</div>
        )}
      </div>
    </section>
  );
}
