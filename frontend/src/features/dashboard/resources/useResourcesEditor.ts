// frontend/src/features/dashboard/resources/useResourcesEditor.ts
import * as React from "react";
import type { QueryClient } from "@tanstack/react-query";

import { putJSON } from "../api/putJSON";
import type { ResourceSection } from "../types";

export function useResourcesEditor(params: {
  serverResources: ResourceSection[];
  queryClient: QueryClient;
}) {
  const { serverResources, queryClient } = params;

  const [editMode, setEditMode] = React.useState(false);
  const [draft, setDraft] = React.useState<ResourceSection[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Keep draft synced when server data changes (matches previous behavior)
  React.useEffect(() => {
    setDraft(serverResources as ResourceSection[]);
  }, [serverResources]);

  function resetDraftFromServer() {
    setSaveError(null);
    setDraft(JSON.parse(JSON.stringify(serverResources)) as ResourceSection[]);
  }

  function startEdit() {
    resetDraftFromServer();
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    resetDraftFromServer();
  }

  async function save() {
    setSaving(true);
    setSaveError(null);

    try {
      await putJSON("/api/v1/resources", { sections: draft });
      setEditMode(false);
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return {
    editMode,
    setEditMode,
    draft,
    setDraft,
    saving,
    saveError,
    startEdit,
    cancelEdit,
    save,
  };
}
