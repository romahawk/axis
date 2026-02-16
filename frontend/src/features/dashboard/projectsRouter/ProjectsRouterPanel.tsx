// frontend/src/features/dashboard/projectsRouter/ProjectsRouterPanel.tsx
import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown as ChevronDownSmall,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

import { Panel } from "../../../components/Panel";
import { useProjectsRouter } from "./useProjectsRouter";

type Link = { label: string; url: string };
type Project = { key: string; name: string; is_active?: boolean; links: Link[] };

function displayProjectName(p: Project) {
  const n = (p.name ?? "").trim();
  return n.length ? n : "Untitled project";
}

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
    reorderProjects,
    moveProjectByOffset,
  } = useProjectsRouter({
    projects: props.projects ?? [],
    queryClient: qc,
    putJSON: props.putJSON,
  });

  // Active projects expanded by default; preserve manual expansions.
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  // Drag + drop ordering (HTML5 DnD)
  const [draggingKey, setDraggingKey] = React.useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    const activeKeys = new Set(
      sortedProjects.filter((p) => p.is_active).map((p) => p.key)
    );
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      activeKeys.forEach((key) => {
        if (!next.has(key)) {
          next.add(key);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [sortedProjects]);

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }

  function onDragStart(e: React.DragEvent, key: string) {
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "move";
    setDraggingKey(key);
  }

  function onDragOver(e: React.DragEvent, key: string) {
    // Required to allow drop.
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverKey(key);
  }

  async function onDrop(e: React.DragEvent, dropKey: string) {
    e.preventDefault();
    const dragKey = e.dataTransfer.getData("text/plain");
    setDragOverKey(null);
    setDraggingKey(null);
    if (!dragKey) return;
    await reorderProjects(dragKey, dropKey);
  }

  function onDragEnd() {
    setDragOverKey(null);
    setDraggingKey(null);
  }

  return (
    <Panel
      title="Projects (router)"
      className="border-0 bg-transparent p-0 shadow-none"
    >
      {/* Speed controls */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Active: <span className="text-slate-200">{activeCount}</span>/3
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
            onClick={addNewProject}
            disabled={projectSaving}
            title="Add new project"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </button>
        </div>

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
              {displayProjectName(p)}
            </option>
          ))}
        </select>

        {projectSaveError && (
          <div className="rounded-md border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-200">
            {projectSaveError}
          </div>
        )}
      </div>

      {/* Projects list */}
      <ul className="space-y-2">
        {sortedProjects.map((p) => {
          const isEditing = editingProjectKey === p.key;
          const isActive = !!p.is_active;
          const isExpanded = expanded.has(p.key);
          const segmentKeys = isActive
            ? sortedProjects.filter((sp) => sp.is_active).map((sp) => sp.key)
            : sortedProjects.filter((sp) => !sp.is_active).map((sp) => sp.key);
          const segmentIndex = segmentKeys.indexOf(p.key);
          const canMoveUp = segmentIndex > 0;
          const canMoveDown =
            segmentIndex >= 0 && segmentIndex < segmentKeys.length - 1;

          return (
            <li
              key={p.key}
              onDragOver={(e) => onDragOver(e, p.key)}
              onDragEnter={() => setDragOverKey(p.key)}
              onDragLeave={() =>
                setDragOverKey((prev) => (prev === p.key ? null : prev))
              }
              onDrop={(e) => onDrop(e, p.key)}
              onDragEnd={onDragEnd}
              className={[
                "rounded-lg border",
                isActive
                  ? "border-emerald-900/60 bg-emerald-950/20"
                  : "border-slate-900 bg-slate-950/10",
                !isActive ? "opacity-60" : "opacity-100",
                draggingKey === p.key ? "ring-1 ring-slate-600" : "",
                dragOverKey === p.key && draggingKey !== p.key
                  ? "ring-1 ring-slate-500"
                  : "",
              ].join(" ")}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 p-3">
                <div
                  className="mt-0.5 select-none text-slate-500"
                  title="Drag to reorder"
                  aria-hidden="true"
                  draggable={!isEditing && !projectSaving}
                  onDragStart={(e) => onDragStart(e, p.key)}
                >
                  <GripVertical className="h-4 w-4" />
                </div>

                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => toggleExpanded(p.key)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}

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
                        displayProjectName(p)
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-1 text-xs text-slate-500">{p.key}</div>
                  ) : null}
                </button>

                {/* Actions */}
                {!isEditing ? (
                  <div className="flex flex-col items-end gap-2">
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

                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => moveProjectByOffset(p.key, -1)}
                        disabled={!canMoveUp || projectSaving}
                        aria-label={`Move ${displayProjectName(p)} up`}
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => moveProjectByOffset(p.key, 1)}
                        disabled={!canMoveDown || projectSaving}
                        aria-label={`Move ${displayProjectName(p)} down`}
                        title="Move down"
                      >
                        <ChevronDownSmall className="h-3.5 w-3.5" />
                      </button>

                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                        onClick={() => startEditProject(p)}
                        disabled={projectSaving}
                        aria-label={`Edit ${displayProjectName(p)}`}
                        title="Edit project"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                        onClick={() => {
                          const ok = window.confirm(`Delete project "${p.name}"?`);
                          if (!ok) return;
                          deleteProject(p.key);
                        }}
                        disabled={projectSaving}
                        aria-label={`Delete ${displayProjectName(p)}`}
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

              {/* Expanded content */}
              {isExpanded ? (
                <div className="px-3 pb-3">
                  {!isEditing ? (
                    <div className="space-y-1">
                      {p.links.length ? (
                        p.links.map((l) => (
                          <a
                            key={l.url + l.label}
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center justify-between rounded-md border border-slate-900 bg-slate-950/40 px-2 py-1.5 text-xs text-slate-300 hover:text-white"
                            title={`${displayProjectName(p)} • ${l.label}`}
                          >
                            <span className="truncate">{l.label}</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                          </a>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500">
                          No links yet. Edit project to add.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(projectDraft?.links ?? []).map((l, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                        >
                          <input
                            className="min-w-0 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
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
                            className="min-w-0 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-slate-600"
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
                            className="inline-flex w-full items-center justify-center rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white md:w-auto"
                            onClick={() =>
                              setProjectDraft((d) => {
                                if (!d) return d;
                                const links = d.links.filter((_, i) => i !== idx);
                                return { ...d, links };
                              })
                            }
                            type="button"
                            aria-label="Remove link"
                            title="Remove link"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                        onClick={() =>
                          setProjectDraft((d) => {
                            if (!d) return d;
                            return { ...d, links: [...d.links, { label: "", url: "" }] };
                          })
                        }
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add link
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 text-xs text-slate-500">
        Routing first. Active projects are visually prioritized.
      </div>
    </Panel>
  );
}
