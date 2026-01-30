// frontend/src/features/dashboard/projectsRouter/useProjectsRouter.ts
import * as React from "react";
import type { QueryClient } from "@tanstack/react-query";

type Link = { label: string; url: string };
type Project = { key: string; name: string; is_active?: boolean; links: Link[] };

export function useProjectsRouter(params: {
  projects: Project[];
  queryClient: QueryClient;
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const { projects, queryClient, putJSON } = params;

  const [editingProjectKey, setEditingProjectKey] = React.useState<string | null>(
    null
  );
  const [projectDraft, setProjectDraft] = React.useState<Project | null>(null);
  const [projectSaving, setProjectSaving] = React.useState(false);
  const [projectSaveError, setProjectSaveError] = React.useState<string | null>(
    null
  );

  const activeProjects = projects.filter((p) => p.is_active);
  const inactiveProjects = projects.filter((p) => !p.is_active);
  const activeCount = activeProjects.length;

  // Display order: actives first, then inactives, preserving relative order in each segment.
  const sortedProjects = [...activeProjects, ...inactiveProjects];

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
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setProjectSaveError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setProjectSaving(false);
    }
  }

  async function saveProjectDraft() {
    if (!projectDraft) return;

    const trimmedName = (projectDraft.name ?? "").trim();
    if (!trimmedName) {
      setProjectSaveError("Project name cannot be empty");
      return;
    }

    const normalizedDraft: Project = { ...projectDraft, name: trimmedName };

    const nextProjects = projects.map((p) =>
      p.key === normalizedDraft.key ? normalizedDraft : p
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
      name: "New Project",
      is_active: false,
      links: [],
    };

    const nextProjects = [...projects, newProject];

    saveProjects(nextProjects)
      .then(() => {
        setEditingProjectKey(key);
        setProjectDraft(JSON.parse(JSON.stringify(newProject)) as Project);
      })
      .catch(() => {
        // error already set
      });
  }

  async function deleteProject(key: string) {
    setProjectSaveError(null);

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

  /**
   * Reorder projects as displayed in the router.
   * Rules:
   * - Active projects always stay in the active segment (top).
   * - Inactive projects reorder within the inactive segment.
   * - Cross-segment drop snaps to boundary:
   *   - active -> before first inactive
   *   - inactive -> after last active
   */
  async function reorderProjects(dragKey: string, dropKey: string) {
    if (projectSaving) return;
    if (dragKey === dropKey) return;

    const byKey = new Map(sortedProjects.map((p) => [p.key, p] as const));
    const drag = byKey.get(dragKey);
    if (!drag) return;

    const activeKeys = sortedProjects.filter((p) => p.is_active).map((p) => p.key);
    const inactiveKeys = sortedProjects
      .filter((p) => !p.is_active)
      .map((p) => p.key);

    const isDragActive = !!drag.is_active;
    const inActiveSegment = new Set(activeKeys);

    const srcList = isDragActive ? activeKeys : inactiveKeys;
    const srcIndex = srcList.indexOf(dragKey);
    if (srcIndex < 0) return;

    // Remove from its segment list first
    const nextList = [...srcList];
    nextList.splice(srcIndex, 1);

    const dropIsInSameSegment = isDragActive
      ? inActiveSegment.has(dropKey)
      : !inActiveSegment.has(dropKey);

    let toIndex: number;
    if (dropIsInSameSegment) {
      const dropIndex = nextList.indexOf(dropKey);
      if (dropIndex < 0) return;
      toIndex = dropIndex;
    } else {
      // Cross segment: snap to boundary.
      toIndex = isDragActive ? nextList.length : 0;
    }

    nextList.splice(toIndex, 0, dragKey);

    const nextActiveKeys = isDragActive ? nextList : activeKeys;
    const nextInactiveKeys = isDragActive ? inactiveKeys : nextList;

    const nextOrderKeys = [...nextActiveKeys, ...nextInactiveKeys];

    // Build ordered project array from current canonical projects prop.
    const currentByKey = new Map(projects.map((p) => [p.key, p] as const));
    const nextProjects = nextOrderKeys
      .map((k) => currentByKey.get(k))
      .filter(Boolean) as Project[];

    try {
      await saveProjects(nextProjects);
    } catch {
      // error already set
    }
  }

  return {
    // derived
    activeCount,
    inactiveProjects,
    sortedProjects,

    // state
    editingProjectKey,
    projectDraft,
    projectSaving,
    projectSaveError,

    // state setters used by UI
    setProjectDraft,
    setProjectSaveError,

    // actions
    startEditProject,
    cancelEditProject,
    saveProjectDraft,
    toggleActive,
    promoteToActive,
    addNewProject,
    deleteProject,
    reorderProjects,
  };
}
