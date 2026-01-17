import { useInboxView } from "../hooks/useInboxView";

function fmt(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function InboxPage() {
  const { data, isLoading, isError, error } = useInboxView();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <div className="text-slate-400">Loading…</div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
          Failed to load Inbox: {String(error)}
        </div>
      </section>
    );
  }

  const items = data?.items ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <div className="text-xs text-slate-400">{items.length} items</div>
      </div>

      <div className="rounded-xl border border-slate-800 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-200">
          Capture (read-only v0)
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-slate-500">Empty</div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="rounded-lg border border-slate-900 p-3"
              >
                <div className="text-slate-100">{it.text}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                  {it.source && <span>· {it.source}</span>}
                  {it.created_at && <span>· {fmt(it.created_at)}</span>}
                  {it.link?.url && (
                    <a
                      className="text-slate-300 underline hover:text-white"
                      href={it.link.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {it.link.title ?? "Link"}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
