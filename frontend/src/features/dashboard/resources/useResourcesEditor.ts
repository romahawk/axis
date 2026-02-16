// frontend/src/features/dashboard/resources/useResourcesEditor.ts
import * as React from "react";
import type { QueryClient } from "@tanstack/react-query";

import { putJSON } from "../api/putJSON";
import type { ResourceSection } from "../types";

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validateAndNormalizeResources(
  sections: ResourceSection[]
): { ok: true; sections: ResourceSection[] } | { ok: false; error: string } {
  const normalized: ResourceSection[] = [];

  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const title = (section.title ?? "").trim();

    if (!title) {
      return { ok: false, error: `Section ${i + 1}: title is required.` };
    }

    const links = (section.links ?? [])
      .map((link) => ({
        label: (link.label ?? "").trim(),
        url: (link.url ?? "").trim(),
      }))
      .filter((link) => link.label || link.url);

    for (let j = 0; j < links.length; j += 1) {
      const link = links[j];

      if (!link.label || !link.url) {
        return {
          ok: false,
          error: `Section ${i + 1}, link ${j + 1}: label and URL are required.`,
        };
      }

      if (!isHttpUrl(link.url)) {
        return {
          ok: false,
          error: `Section ${i + 1}, link ${j + 1}: URL must start with http:// or https://.`,
        };
      }
    }

    normalized.push({ title, links });
  }

  return { ok: true, sections: normalized };
}

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
      const validated = validateAndNormalizeResources(draft);
      if (!validated.ok) {
        setSaveError(validated.error);
        return;
      }

      await putJSON("/api/v1/resources", { sections: validated.sections });
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
