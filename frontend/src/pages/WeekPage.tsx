import { useWeekView } from "../hooks/useWeekView";

export default function WeekPage() {
  const { data, isLoading, isError, error } = useWeekView();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Week</h1>
        <div className="text-slate-400">Loading…</div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Week</h1>
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
          Failed to load Week view: {String(error)}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Week</h1>
        <div className="text-xs text-slate-400">{data?.week}</div>
      </div>

      {/* Focus */}
      <div className="rounded-xl border border-slate-800 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-200">
          Focus (max 3)
        </div>
        {data?.focus?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
            {data.focus.map((f) => (
              <li key={f.id}>{f.text}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500">Empty</div>
        )}
      </div>

      {/* Commitments + Constraints */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-200">
            Commitments
          </div>
          {data?.commitments?.length ? (
            <ul className="space-y-2 text-sm">
              {data.commitments.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-900 p-3">
                  <div className="text-slate-100">{c.text}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    {c.domain && <span>#{c.domain}</span>}
                    {c.status && <span>· {c.status}</span>}
                    {c.trello?.url && (
                      <a
                        className="text-slate-300 underline hover:text-white"
                        href={c.trello.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Trello
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">Empty</div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-200">
            Constraints
          </div>
          {data?.constraints?.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
              {data.constraints.map((k) => (
                <li key={k.id}>{k.text}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">None</div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-slate-800 p-4">
        <div className="mb-2 text-sm font-semibold text-slate-200">Notes</div>
        <div className="text-sm text-slate-300">{data?.notes ?? "—"}</div>
      </div>
    </section>
  );
}
