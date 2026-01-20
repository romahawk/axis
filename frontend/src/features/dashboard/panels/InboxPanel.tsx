// frontend/src/features/dashboard/panels/InboxPanel.tsx
import * as React from "react";
import { Panel } from "../../../components/Panel";
import { useLocalStorageJson } from "../../../hooks/useLocalStorageJson";

type InboxItem = {
  id: string;
  text: string;
  createdAt: string; // ISO
};

const STORAGE_KEY = "axis_inbox_v1";
const OPEN_KEY = "axis_inbox_open_v1";
const MAX_ITEMS = 20;

function uid() {
  // good enough for client-only IDs
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeText(raw: string) {
  // Keep multi-line, trim outer whitespace
  return (raw ?? "").trim();
}

export function InboxPanel(props: {
  onSendToToday: (text: string) => Promise<void> | void;
  
}) {
  const [items, setItems] = useLocalStorageJson<InboxItem[]>(STORAGE_KEY, []);
  const [isOpen, setIsOpen] = useLocalStorageJson<boolean>(OPEN_KEY, true);
  const [draft, setDraft] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const visibleItems = (items ?? []).slice(0, MAX_ITEMS);

  function addItem() {
    const text = normalizeText(draft);
    if (!text.length) return;

    const it: InboxItem = {
      id: uid(),
      text,
      createdAt: new Date().toISOString(),
    };

    setItems([it, ...(items ?? [])]);
    setDraft("");

    // If user is capturing, auto-open so the item is visible immediately.
    if (!isOpen) setIsOpen(true);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev ?? []).filter((x) => x.id !== id));
  }

  async function send(id: string, target: "today" | "week") {
    const it = (items ?? []).find((x) => x.id === id);
    if (!it) return;
    if (busyId) return;

    setBusyId(id);
    try {
      if (target === "today") await props.onSendToToday(it.text);
      else 
      // Buffer behavior: remove after successful send.
      removeItem(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Panel title="Inbox">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Buffer: capture now, decide later.
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            {isOpen ? "Hide" : `Show (${(items ?? []).length})`}
          </button>
        </div>

        <div>
          <textarea
            className="min-h-[96px] w-full resize-none rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            placeholder="Dump thoughts, tasks, links…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <div className="mt-1 text-xs text-slate-500">
            Enter = save · Shift+Enter = newline
          </div>
        </div>

        {isOpen ? (
          visibleItems.length ? (
            <div className="max-h-[calc(100vh-320px)] space-y-2 overflow-y-auto pr-1">
              {visibleItems.map((it) => (
                <div
                  key={it.id}
                  className="rounded-lg border border-slate-900 bg-slate-950/40 p-3"
                >
                  <div className="whitespace-pre-wrap text-sm text-slate-200">
                    {it.text}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-50"
                      onClick={() => send(it.id, "today")}
                      disabled={busyId === it.id}
                      title="Send to Today"
                    >
                      ➕ Today
                    </button>
                    <button
                      className="ml-auto rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-50"
                      onClick={() => removeItem(it.id)}
                      disabled={busyId === it.id}
                      title="Dismiss"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Inbox is empty</div>
          )
        ) : (
          <div className="text-xs text-slate-500">
            Hidden. {(items ?? []).length} item(s) buffered.
          </div>
        )}
      </div>
    </Panel>
  );
}
