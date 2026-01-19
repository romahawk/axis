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
      name: "New Project",
      is_active: false,
      links: [],
    };

    const nextProjects = [...projects, newProject];

    saveProjects(nextProjects)
      .then(() => {
        setEditingProjectKey(key);
        setProjectDraft(newProject);
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
  };
}
