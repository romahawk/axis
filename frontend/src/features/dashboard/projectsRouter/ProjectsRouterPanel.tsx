// frontend/src/features/dashboard/projectsRouter/ProjectsRouterPanel.tsx
import { useQueryClient } from "@tanstack/react-query";

import { Panel } from "../../../components/Panel";
import { useProjectsRouter } from "./useProjectsRouter";

type Link = { label: string; url: string };
type Project = { key: string; name: string; is_active?: boolean; links: Link[] };

export function ProjectsRouterPanel(props: {
  projects: Project[];
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const qc = useQueryClient();

  const {
    activeCount,
    inactiveProjects,
    sortedProjects,

    editingProjectKey,
    projectDraft,
    projectSaving,
    projectSaveError,

    setProjectDraft,

    startEditProject,
    cancelEditProject,
    saveProjectDraft,
    toggleActive,
    promoteToActive,
    addNewProject,
    deleteProject,
  } = useProjectsRouter({
    projects: props.projects ?? [],
    queryClient: qc,
    putJSON: props.putJSON,
  });

  return (
    <Panel title="Projects (router)" className="bg-slate-950/40 border-slate-800/80">
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
                            d ? { ...d, name: e.target.value } : d
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
                          const ok = window.confirm(`Delete project "${p.name}"?`);
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
                      <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input
                          className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
                          value={l.label}
                          placeholder="Label"
                          onChange={(e) =>
                            setProjectDraft((d) => {
                              if (!d) return d;
                              const links = [...d.links];
                              links[idx] = { ...links[idx], label: e.target.value };
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
                              links[idx] = { ...links[idx], url: e.target.value };
                              return { ...d, links };
                            })
                          }
                        />
                        <button
                          className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                          onClick={() =>
                            setProjectDraft((d) => {
                              if (!d) return d;
                              const links = d.links.filter((_, i) => i !== idx);
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
                          return { ...d, links: [...d.links, { label: "", url: "" }] };
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
        Active projects are highlighted and mirrored into the Center column (max 3).
      </div>
    </Panel>
  );
}
