import { useState } from "react";
import { useInboxView } from "../hooks/useInboxView";
import { useCreateInboxItem } from "../hooks/useCreateInboxItem";
import { useDeleteInboxItem } from "../hooks/useDeleteInboxItem";

function fmt(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function InboxPage() {
  const { data, isLoading, isError, error } = useInboxView();
  const create = useCreateInboxItem();
  const del = useDeleteInboxItem();

  const [text, setText] = useState("");

  async function onAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;

    await create.mutateAsync({ text: trimmed, source: "manual" });
    setText("");
  }

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

      {/* Create */}
      <div className="rounded-xl border border-slate-800 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-200">
          Capture (POST v0)
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Capture a thought, task, or idea…"
          className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700"
          rows={3}
        />

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={onAdd}
            disabled={create.isPending || !text.trim()}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {create.isPending ? "Saving…" : "Add to Inbox"}
          </button>

          {create.isError && (
            <div className="text-sm text-red-300">
              Failed: {String(create.error)}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-slate-800 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-200">Items</div>

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

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
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

                  <button
                    onClick={() => del.mutate(it.id)}
                    disabled={del.isPending}
                    className="ml-auto rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-50"
                    title="Delete this inbox item"
                  >
                    {del.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {del.isError && (
          <div className="mt-3 text-sm text-red-300">
            Delete failed: {String(del.error)}
          </div>
        )}
      </div>
    </section>
  );
}
