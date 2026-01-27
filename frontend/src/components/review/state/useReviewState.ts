// src/features/review/state/useReviewState.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { JournalEntry } from "../../../hooks/useJournal";
import type { LocalEditsMap, ReviewTab, WeeklyOutcomeDraft } from "../types";

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

export function splitLinesMax3(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function fmt(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}, ${hh}:${mi}`;
}

export function useReviewState(open: boolean) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [tab, setTab] = useState<ReviewTab>("daily");

  // Local-only journal edits/deletes (persist across tabs)
  const [localEdits, setLocalEdits] = useState<LocalEditsMap>({});
  const [localDeleted, setLocalDeleted] = useState<Set<string>>(() => new Set());

  const hasLocalChanges =
    Object.keys(localEdits).length > 0 || localDeleted.size > 0;

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"daily" | "weekly">("daily");

  // Daily edit draft
  const [editWinsText, setEditWinsText] = useState("");
  const [editMiss, setEditMiss] = useState("");
  const [editFix, setEditFix] = useState("");

  // Weekly edit draft
  const [editWeeklyOutcomes, setEditWeeklyOutcomes] = useState<
    WeeklyOutcomeDraft[]
  >([
    { id: "w1", achieved: false, note: "" },
    { id: "w2", achieved: false, note: "" },
    { id: "w3", achieved: false, note: "" },
  ]);
  const [editWeeklyConstraint, setEditWeeklyConstraint] = useState("");
  const [editWeeklyDecision, setEditWeeklyDecision] = useState("");
  const [editWeeklyNextFocus, setEditWeeklyNextFocus] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  // When opening drawer, default to daily (fast path)
  useEffect(() => {
    if (!open) return;
    setTab("daily");
  }, [open]);

  const portalTarget = useMemo(() => (mounted ? document.body : null), [mounted]);

  function resetLocalChanges() {
    setLocalEdits({});
    setLocalDeleted(new Set());
  }

  function openEdit(entry: JournalEntry) {
    setEditId(entry.id);
    setEditType(entry.type);

    if (entry.type === "daily") {
      setEditWinsText((entry.wins ?? []).slice(0, 3).join("\n"));
      setEditMiss(entry.miss ?? "");
      setEditFix(entry.fix ?? "");
      return;
    }

    setEditWeeklyOutcomes(
      (
        entry.outcomes ?? [
          { id: "w1", achieved: false, note: "" },
          { id: "w2", achieved: false, note: "" },
          { id: "w3", achieved: false, note: "" },
        ]
      ).map((o) => ({
        id: o.id,
        achieved: !!o.achieved,
        note: (o.note ?? "").toString(),
      })),
    );

    setEditWeeklyConstraint(entry.constraint ?? "");
    setEditWeeklyDecision(entry.decision ?? "");
    setEditWeeklyNextFocus(entry.next_focus ?? "");
  }

  function saveEditLocal() {
    if (!editId) return;

    if (editType === "daily") {
      const wins = splitLinesMax3(editWinsText);
      const miss2 = editMiss.trim();
      const fix2 = editFix.trim();

      setLocalEdits((prev) => ({
        ...prev,
        [editId]: { wins, miss: miss2, fix: fix2 },
      }));

      setEditId(null);
      return;
    }

    const outcomes = (editWeeklyOutcomes ?? []).map((o) => ({
      id: o.id,
      achieved: !!o.achieved,
      note: (o.note ?? "").trim(),
    }));

    setLocalEdits((prev) => ({
      ...prev,
      [editId]: {
        outcomes,
        constraint: editWeeklyConstraint.trim(),
        decision: editWeeklyDecision.trim(),
        next_focus: editWeeklyNextFocus.trim(),
      },
    }));

    setEditId(null);
  }

  function confirmDeleteLocal() {
    if (!deleteId) return;
    setLocalDeleted((prev) => {
      const n = new Set(prev);
      n.add(deleteId);
      return n;
    });
    setDeleteId(null);
  }

  return {
    // shell
    panelRef,
    tab,
    setTab,
    portalTarget,

    // local journal state
    localEdits,
    localDeleted,
    hasLocalChanges,
    resetLocalChanges,

    // edit modal state
    editId,
    setEditId,
    editType,
    editWinsText,
    setEditWinsText,
    editMiss,
    setEditMiss,
    editFix,
    setEditFix,

    editWeeklyOutcomes,
    setEditWeeklyOutcomes,
    editWeeklyConstraint,
    setEditWeeklyConstraint,
    editWeeklyDecision,
    setEditWeeklyDecision,
    editWeeklyNextFocus,
    setEditWeeklyNextFocus,

    openEdit,
    saveEditLocal,

    // delete confirm state
    deleteId,
    setDeleteId,
    confirmDeleteLocal,
  };
}
