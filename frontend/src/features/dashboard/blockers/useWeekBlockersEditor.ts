// frontend/src/features/dashboard/blockers/useWeekBlockersEditor.ts
import * as React from "react";
import type { QueryClient } from "@tanstack/react-query";

type WeekBlocker = { id: string; text: string };

function normalizeSlotText(s: string): string {
  const t = (s ?? "").trim();
  return t.length ? t : "—";
}

export function useWeekBlockersEditor(params: {
  weekBlockers: WeekBlocker[];
  queryClient: QueryClient;
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const { weekBlockers, queryClient, putJSON } = params;

  const [editMode, setEditMode] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(["—", "—", "—"]);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Keep draft synced when server data changes (matches previous behavior in DashboardPage)
  React.useEffect(() => {
    const texts = (weekBlockers ?? []).slice(0, 3).map((b) => b.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
  }, [weekBlockers]);

  function startEdit() {
    setSaveError(null);
    const texts = (weekBlockers ?? []).slice(0, 3).map((b) => b.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
    setEditMode(true);
  }

  function cancelEdit() {
    setSaveError(null);
    setEditMode(false);
    const texts = (weekBlockers ?? []).slice(0, 3).map((b) => b.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = draft.slice(0, 3).map(normalizeSlotText);
      await putJSON("/api/v1/week/blockers", { blockers: payload });
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
    draft,
    setDraft,
    saving,
    saveError,
    startEdit,
    cancelEdit,
    save,
  };
}
