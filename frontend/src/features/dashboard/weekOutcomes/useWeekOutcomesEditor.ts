// frontend/src/features/dashboard/weekOutcomes/useWeekOutcomesEditor.ts
import * as React from "react";
import type { QueryClient } from "@tanstack/react-query";

type WeekOutcome = { id: string; text: string };

function normalizeSlotText(s: string): string {
  const t = (s ?? "").trim();
  return t.length ? t : "—";
}

export function useWeekOutcomesEditor(params: {
  weekOutcomes: WeekOutcome[];
  queryClient: QueryClient;
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const { weekOutcomes, queryClient, putJSON } = params;

  const [editMode, setEditMode] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(["—", "—", "—"]);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Keep draft synced when server data changes (matches previous behavior in DashboardPage)
  React.useEffect(() => {
    const texts = (weekOutcomes ?? []).slice(0, 3).map((o) => o.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
  }, [weekOutcomes]);

  function startEdit() {
    setSaveError(null);
    const texts = (weekOutcomes ?? []).slice(0, 3).map((o) => o.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
    setEditMode(true);
  }

  function cancelEdit() {
    setSaveError(null);
    setEditMode(false);
    const texts = (weekOutcomes ?? []).slice(0, 3).map((o) => o.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);

    try {
      const payload = draft.slice(0, 3).map(normalizeSlotText);
      await putJSON("/api/v1/week/outcomes", { outcomes: payload });
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
