// frontend/src/features/dashboard/todayTop3/useTodayTop3Editor.ts
import * as React from "react";
import type { QueryClient } from "@tanstack/react-query";

type TodayTop3Item = { id: string; text: string; done?: boolean };

function normalizeSlotText(s: string): string {
  const t = (s ?? "").trim();
  return t.length ? t : "—";
}

export function useTodayTop3Editor(params: {
  todayTop3: TodayTop3Item[];
  queryClient: QueryClient;
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const { todayTop3, queryClient, putJSON } = params;

  const [editMode, setEditMode] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(["—", "—", "—"]);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Keep draft synced when server data changes (matches current DashboardPage behavior)
  React.useEffect(() => {
    const texts = (todayTop3 ?? []).slice(0, 3).map((t) => t.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
  }, [todayTop3]);

  function startEdit() {
    setSaveError(null);
    const texts = (todayTop3 ?? []).slice(0, 3).map((t) => t.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
    setEditMode(true);
  }

  function cancelEdit() {
    setSaveError(null);
    setEditMode(false);
    const texts = (todayTop3 ?? []).slice(0, 3).map((t) => t.text);
    while (texts.length < 3) texts.push("—");
    setDraft(texts);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);

    try {
      const payload = draft.slice(0, 3).map(normalizeSlotText);
      await putJSON("/api/v1/today/top3", { items: payload });
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
