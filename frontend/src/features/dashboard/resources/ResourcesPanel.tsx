import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

import { Panel } from "../../../components/Panel";
import type { ResourceSection } from "../types";
import { useLocalStorageJson } from "../../../hooks/useLocalStorageJson";
import { useResourcesEditor } from "./useResourcesEditor";

export function ResourcesPanel(props: { resources: ResourceSection[] }) {
  const qc = useQueryClient();

  const [open, setOpen] = useLocalStorageJson<boolean>(
    "axis_resources_open_v1",
    true
  );

  const resources = props.resources ?? [];

  const {
    editMode,
    draft,
    setDraft,
    saving,
    saveError,
    startEdit,
    cancelEdit,
    save,
  } = useResourcesEditor({
    serverResources: resources,
    queryClient: qc,
  });

  return (
    <Panel className="bg-slate-950/20 border-slate-800/80" title={null as any}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left rounded-xl px-2 py-1 hover:bg-slate-950/30"
      >
        <div>
          <div className="text-sm font-semibold text-slate-100">
            Resources (this week)
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Rule: weekly scoped, curated.
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
          {/* Actions */}
          <div className="mb-3 flex items-center justify-between">
            {!editMode ? (
              <button
                className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                onClick={startEdit}
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          {!editMode ? (
            resources.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {resources.map((s) => (
                  <div key={s.title} className="rounded-lg border border-slate-900 p-3">
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.links.map((l) => (
                        <a
                          key={l.url + l.label}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-900 bg-slate-950/20 p-3 text-sm text-slate-400">
                No resources yet. Open <span className="text-slate-200">Edit</span> to add your first section.
              </div>
            )
          ) : (
            <div className="space-y-4">
              {draft.map((s, sIdx) => (
                <div key={sIdx} className="rounded-lg border border-slate-900 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-slate-600"
                      value={s.title}
                      onChange={(e) =>
                        setDraft((prev) => {
                          const next = [...prev];
                          next[sIdx] = { ...next[sIdx], title: e.target.value };
                          return next;
                        })
                      }
                    />
                    <button
                      className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                      onClick={() =>
                        setDraft((prev) => prev.filter((_, i) => i !== sIdx))
                      }
                      type="button"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {s.links.map((l, lIdx) => (
                      <div key={lIdx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input
                          className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
                          value={l.label}
                          placeholder="Label"
                          onChange={(e) =>
                            setDraft((prev) => {
                              const next = [...prev];
                              const links = [...next[sIdx].links];
                              links[lIdx] = {
                                ...links[lIdx],
                                label: e.target.value,
                              };
                              next[sIdx] = { ...next[sIdx], links };
                              return next;
                            })
                          }
                        />
                        <input
                          className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
                          value={l.url}
                          placeholder="https://..."
                          onChange={(e) =>
                            setDraft((prev) => {
                              const next = [...prev];
                              const links = [...next[sIdx].links];
                              links[lIdx] = {
                                ...links[lIdx],
                                url: e.target.value,
                              };
                              next[sIdx] = { ...next[sIdx], links };
                              return next;
                            })
                          }
                        />
                        <button
                          className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                          onClick={() =>
                            setDraft((prev) => {
                              const next = [...prev];
                              const links = next[sIdx].links.filter(
                                (_, i) => i !== lIdx
                              );
                              next[sIdx] = { ...next[sIdx], links };
                              return next;
                            })
                          }
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                      onClick={() =>
                        setDraft((prev) => {
                          const next = [...prev];
                          next[sIdx] = {
                            ...next[sIdx],
                            links: [...next[sIdx].links, { label: "", url: "" }],
                          };
                          return next;
                        })
                      }
                      type="button"
                    >
                      + Add link
                    </button>
                  </div>
                </div>
              ))}

              <button
                className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                onClick={() =>
                  setDraft((prev) => [...prev, { title: "New", links: [] }])
                }
                type="button"
              >
                + Add section
              </button>

              {saveError && (
                <div className="rounded-md border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-200">
                  {saveError}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
