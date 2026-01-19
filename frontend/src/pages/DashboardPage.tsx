import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import CheckList from "../components/CheckList";
import { useDashboardView } from "../hooks/useDashboardView";
import { useToggleTodayItem } from "../hooks/useToggleTodayItem";

async function putJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PUT ${url} failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}

function Panel({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-slate-800 p-4 ${className}`}>
      <div className="mb-3 text-sm font-semibold text-slate-200">{title}</div>
      {children}
    </div>
  );
}

type Link = { label: string; url: string };
type Project = { key: string; name: string; is_active?: boolean; links: Link[] };
type ResourceSection = { title: string; links: Link[] };

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useDashboardView();
  const toggleToday = useToggleTodayItem();

  // -----------------------------
  // Projects editor state
  // -----------------------------
  const [editingProjectKey, setEditingProjectKey] = React.useState<string | null>(
    null
  );
  const [projectDraft, setProjectDraft] = React.useState<Project | null>(null);
  const [projectSaving, setProjectSaving] = React.useState(false);
  const [projectSaveError, setProjectSaveError] = React.useState<string | null>(
    null
  );

  // -----------------------------
  // Resources editor state
  // -----------------------------
  const [resourcesEditMode, setResourcesEditMode] = React.useState(false);
  const [resourcesDraft, setResourcesDraft] = React.useState<ResourceSection[]>(
    []
  );
  const [resourcesSaving, setResourcesSaving] = React.useState(false);
  const [resourcesSaveError, setResourcesSaveError] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (data?.resources) setResourcesDraft(data.resources as ResourceSection[]);
  }, [data?.resources]);

  if (isLoading) return <div className="text-slate-400">Loading…</div>;

  if (isError) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        Failed to load dashboard: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  const projects = (data.projects ?? []) as Project[];
  const resources = (data.resources ?? []) as ResourceSection[];

  const activeProjects = projects.filter((p) => p.is_active);
  const inactiveProjects = projects.filter((p) => !p.is_active);
  const activeCount = activeProjects.length;

  const sortedProjects = [...activeProjects, ...inactiveProjects];

  // -----------------------------
  // Helpers
  // -----------------------------
  function startEditProject(p: Project) {
    setProjectSaveError(null);
    setEditingProjectKey(p.key);
    setProjectDraft(JSON.parse(JSON.stringify(p)) as Project);
  }

  function cancelEditProject() {
    setProjectSaveError(null);
    setEditingProjectKey(null);
    setProjectDraft(null);
  }

  async function saveProjects(nextProjects: Project[]) {
    setProjectSaving(true);
    setProjectSaveError(null);
    try {
      await putJSON("/api/v1/projects", { projects: nextProjects });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setProjectSaveError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setProjectSaving(false);
    }
  }

  async function saveProjectDraft() {
    if (!projectDraft) return;

    const nextProjects = projects.map((p) =>
      p.key === projectDraft.key ? projectDraft : p
    );

    try {
      await saveProjects(nextProjects);
      cancelEditProject();
    } catch {
      // error already set
    }
  }

  async function toggleActive(key: string, nextActive: boolean) {
    const currentActive = projects.filter((p) => p.is_active).length;

    if (nextActive && currentActive >= 3) {
      setProjectSaveError("Max 3 active projects allowed");
      return;
    }

    const nextProjects = projects.map((p) =>
      p.key === key ? { ...p, is_active: nextActive } : p
    );

    try {
      await saveProjects(nextProjects);
    } catch {
      // error already set
    }
  }

  async function promoteToActive(key: string) {
    await toggleActive(key, true);
  }

  function addNewProject() {
    setProjectSaveError(null);

    const key = `project_${Date.now().toString(36)}`;
    const newProject: Project = {
      key,
      name: "New Project", // IMPORTANT: must be non-empty, otherwise backend drops it
      is_active: false,
      links: [],
    };

    const nextProjects = [...projects, newProject];

    saveProjects(nextProjects)
      .then(() => {
        // Open editor immediately so you rename + add links
        setEditingProjectKey(key);
        setProjectDraft(newProject);
      })
      .catch(() => {
        // error already set
      });
  }

  async function deleteProject(key: string) {
  setProjectSaveError(null);

  // If currently editing this project, close editor
  if (editingProjectKey === key) {
    cancelEditProject();
  }

  const nextProjects = projects.filter((p) => p.key !== key);

  try {
    await saveProjects(nextProjects);
  } catch {
    // error already set
  }
}

  function resetResourcesDraftFromServer() {
    setResourcesSaveError(null);
    setResourcesDraft(JSON.parse(JSON.stringify(resources)) as ResourceSection[]);
  }

  async function saveResourcesDraft() {
    setResourcesSaving(true);
    setResourcesSaveError(null);

    try {
      await putJSON("/api/v1/resources", { sections: resourcesDraft });
      setResourcesEditMode(false);
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setResourcesSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setResourcesSaving(false);
    }
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_360px]">
      {/* LEFT — Projects router */}
      <aside className="h-full overflow-y-auto pr-1">
        <Panel
          title="Projects (router)"
          className="bg-slate-950/40 border-slate-800/80"
        >
          {/* Top controls */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Active: <span className="text-slate-200">{activeCount}</span>/3
              </div>
              <button
                className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                onClick={addNewProject}
                disabled={projectSaving}
              >
                + Add project
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-slate-600"
                value=""
                onChange={(e) => {
                  const k = e.target.value;
                  if (!k) return;
                  promoteToActive(k);
                  // reset select back to placeholder
                  e.currentTarget.value = "";
                }}
                disabled={projectSaving || inactiveProjects.length === 0}
              >
                <option value="" disabled>
                  Add to Active…
                </option>
                {inactiveProjects.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name || p.key}
                  </option>
                ))}
              </select>
            </div>

            {projectSaveError && (
              <div className="rounded-md border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-200">
                {projectSaveError}
              </div>
            )}
          </div>

          {/* Projects list */}
          <ul className="space-y-3 text-sm">
            {sortedProjects.map((p) => {
              const isEditing = editingProjectKey === p.key;
              const isActive = !!p.is_active;

              return (
                <li
                  key={p.key}
                  className={[
                    "rounded-lg border p-3",
                    isActive
                      ? "border-emerald-900/60 bg-emerald-950/20"
                      : "border-slate-900",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-100">
                        {isEditing ? (
                          <input
                            autoFocus
                            className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-slate-600"
                            value={projectDraft?.name ?? ""}
                            placeholder="Project name"
                            onChange={(e) =>
                              setProjectDraft((d) =>
                                d ? { ...d, name: e.target.value } : d,
                              )
                            }
                          />
                        ) : (
                          p.name
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{p.key}</div>
                    </div>

                    {!isEditing ? (
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <button
                            className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                            onClick={() => startEditProject(p)}
                            disabled={projectSaving}
                          >
                            Edit
                          </button>

                          <button
                            className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                            onClick={() => {
                              const ok = window.confirm(
                                `Delete project "${p.name}"?`,
                              );
                              if (!ok) return;
                              deleteProject(p.key);
                            }}
                            disabled={projectSaving}
                            title="Delete project"
                          >
                            Delete
                          </button>
                        </div>

                        <button
                          className={[
                            "rounded-md border px-2 py-1 text-xs hover:text-white",
                            isActive
                              ? "border-emerald-900/60 text-emerald-200"
                              : "border-slate-800 text-slate-300",
                          ].join(" ")}
                          onClick={() => toggleActive(p.key, !isActive)}
                          disabled={projectSaving}
                          title="Toggle active (max 3)"
                        >
                          {isActive ? "Active" : "Inactive"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                          onClick={cancelEditProject}
                          disabled={projectSaving}
                        >
                          Cancel
                        </button>
                        <button
                          className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                          onClick={saveProjectDraft}
                          disabled={projectSaving}
                        >
                          {projectSaving ? "Saving…" : "Save"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  <div className="mt-3 space-y-2">
                    {!isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {p.links.map((l) => (
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
                    ) : (
                      <div className="space-y-2">
                        {(projectDraft?.links ?? []).map((l, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-[1fr_1fr_auto] gap-2"
                          >
                            <input
                              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
                              value={l.label}
                              placeholder="Label"
                              onChange={(e) =>
                                setProjectDraft((d) => {
                                  if (!d) return d;
                                  const links = [...d.links];
                                  links[idx] = {
                                    ...links[idx],
                                    label: e.target.value,
                                  };
                                  return { ...d, links };
                                })
                              }
                            />
                            <input
                              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
                              value={l.url}
                              placeholder="https://..."
                              onChange={(e) =>
                                setProjectDraft((d) => {
                                  if (!d) return d;
                                  const links = [...d.links];
                                  links[idx] = {
                                    ...links[idx],
                                    url: e.target.value,
                                  };
                                  return { ...d, links };
                                })
                              }
                            />
                            <button
                              className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                              onClick={() =>
                                setProjectDraft((d) => {
                                  if (!d) return d;
                                  const links = d.links.filter(
                                    (_, i) => i !== idx,
                                  );
                                  return { ...d, links };
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
                            setProjectDraft((d) => {
                              if (!d) return d;
                              return {
                                ...d,
                                links: [...d.links, { label: "", url: "" }],
                              };
                            })
                          }
                          type="button"
                        >
                          + Add link
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 text-xs text-slate-500">
            Active projects are highlighted and mirrored into the Center column
            (max 3).
          </div>
        </Panel>
      </aside>

      {/* CENTER — Weekly Execution Spine */}
      <main className="h-full overflow-y-auto pr-1">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-400">THIS WEEK</div>
              <div className="text-xl font-semibold">{data.week.week_id}</div>
            </div>
            <div className="text-xs text-slate-400">MODE: {data.week.mode}</div>
          </div>

          <Panel title="Top 3 Outcomes (weekly)">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-200">
              {data.week.outcomes.slice(0, 3).map((o) => (
                <li key={o.id}>{o.text}</li>
              ))}
            </ol>
          </Panel>

          <Panel title="Active Projects (max 3)">
            {data.week.active_projects.length ? (
              <ul className="space-y-2 text-sm">
                {data.week.active_projects.slice(0, 3).map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-slate-900 p-3"
                  >
                    <div className="text-slate-100">{p.key ?? "Project"}</div>
                    {p.focus && (
                      <div className="mt-1 text-xs text-slate-400">
                        {p.focus}
                      </div>
                    )}
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-slate-300 underline hover:text-white"
                      >
                        Execution space
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">
                No active projects selected
              </div>
            )}
          </Panel>

          <CheckList
            title={`Today — Top 3 (${data.today.date})`}
            items={data.today.top3}
            onToggle={(id, nextDone) =>
              toggleToday.mutate({ kind: "outcomes", id, done: nextDone })
            }
          />

          <Panel title="Blockers / Risks (max 3)">
            {data.week.blockers.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
                {data.week.blockers.slice(0, 3).map((b) => (
                  <li key={b.id}>{b.text}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">None</div>
            )}
          </Panel>

          {/* Resources (this week) */}
          <Panel
            title="Resources (this week)"
            className="bg-slate-950/20 border-slate-800/80"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Rule: weekly scoped, curated.
              </div>

              {!resourcesEditMode ? (
                <button
                  className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                  onClick={() => {
                    resetResourcesDraftFromServer();
                    setResourcesEditMode(true);
                  }}
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                    onClick={() => {
                      setResourcesEditMode(false);
                      resetResourcesDraftFromServer();
                    }}
                    disabled={resourcesSaving}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                    onClick={saveResourcesDraft}
                    disabled={resourcesSaving}
                  >
                    {resourcesSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {!resourcesEditMode ? (
              <div className="grid gap-3 md:grid-cols-3">
                {resources.map((s) => (
                  <div
                    key={s.title}
                    className="rounded-lg border border-slate-900 p-3"
                  >
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
              <div className="space-y-4">
                {resourcesDraft.map((s, sIdx) => (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-slate-900 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-slate-600"
                        value={s.title}
                        onChange={(e) =>
                          setResourcesDraft((prev) => {
                            const next = [...prev];
                            next[sIdx] = {
                              ...next[sIdx],
                              title: e.target.value,
                            };
                            return next;
                          })
                        }
                      />
                      <button
                        className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                        onClick={() =>
                          setResourcesDraft((prev) =>
                            prev.filter((_, i) => i !== sIdx),
                          )
                        }
                        type="button"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {s.links.map((l, lIdx) => (
                        <div
                          key={lIdx}
                          className="grid grid-cols-[1fr_1fr_auto] gap-2"
                        >
                          <input
                            className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
                            value={l.label}
                            placeholder="Label"
                            onChange={(e) =>
                              setResourcesDraft((prev) => {
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
                              setResourcesDraft((prev) => {
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
                              setResourcesDraft((prev) => {
                                const next = [...prev];
                                const links = next[sIdx].links.filter(
                                  (_, i) => i !== lIdx,
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
                          setResourcesDraft((prev) => {
                            const next = [...prev];
                            next[sIdx] = {
                              ...next[sIdx],
                              links: [
                                ...next[sIdx].links,
                                { label: "", url: "" },
                              ],
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
                    setResourcesDraft((prev) => [
                      ...prev,
                      { title: "New", links: [] },
                    ])
                  }
                  type="button"
                >
                  + Add section
                </button>

                {resourcesSaveError && (
                  <div className="rounded-md border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-200">
                    {resourcesSaveError}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      </main>

      {/* RIGHT — Reality & Drift */}
      <aside className="h-full overflow-y-auto pr-1">
        <div className="space-y-4">
          <Panel title="Time Reality (read-only)">
            {data.reality.commitments.length ? (
              <ul className="space-y-2 text-sm text-slate-200">
                {data.reality.commitments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-slate-900 p-3"
                  >
                    <div>{c.text}</div>
                    {c.day && (
                      <div className="mt-1 text-xs text-slate-400">{c.day}</div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">Empty</div>
            )}
          </Panel>

          <Panel title="Anchors (weekly, binary)">
            <ul className="space-y-2 text-sm">
              {Object.entries(data.week.anchors ?? {}).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between">
                  <span className="text-slate-200">{k}</span>
                  <span className={v ? "text-emerald-300" : "text-slate-500"}>
                    {v ? "ON" : "OFF"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Drift (auto-check)">
            <ul className="space-y-2 text-sm">
              {Object.entries(data.drift).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between">
                  <span className="text-slate-200">{k}</span>
                  <span className={v ? "text-red-300" : "text-slate-500"}>
                    {v ? "TRIGGERED" : "OK"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </aside>
    </div>
  );
}
