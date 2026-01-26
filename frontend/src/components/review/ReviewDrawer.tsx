import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ClipboardCheck,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import {
  useCreateDailyCloseout,
  useCreateWeeklyReview,
  useJournalList,
  type JournalEntry,
} from "../../hooks/useJournal";

type Props = {
  open: boolean;
  onClose: () => void;
};

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function splitLinesMax3(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function fmt(ts?: string) {
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

function joinWinsForTextarea(wins?: string[]) {
  return (wins ?? []).slice(0, 3).join("\n");
}

type WeeklyOutcomeDraft = { id: "w1" | "w2" | "w3"; achieved: boolean; note: string };

export function ReviewDrawer({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [tab, setTab] = useState<"daily" | "weekly" | "journal">("daily");

  // Daily form state
  const [winsText, setWinsText] = useState("");
  const [miss, setMiss] = useState("");
  const [fix, setFix] = useState("");

  // Weekly form state (MVP: outcomes w1–w3 + notes)
  const [weeklyOutcomes, setWeeklyOutcomes] = useState<WeeklyOutcomeDraft[]>([
    { id: "w1", achieved: false, note: "" },
    { id: "w2", achieved: false, note: "" },
    { id: "w3", achieved: false, note: "" },
  ]);
  const [weeklyConstraint, setWeeklyConstraint] = useState("");
  const [weeklyDecision, setWeeklyDecision] = useState("");
  const [weeklyNextFocus, setWeeklyNextFocus] = useState("");

  const createDaily = useCreateDailyCloseout();
  const createWeekly = useCreateWeeklyReview();
  const journal = useJournalList({ limit: 50 });

  // --- Local-only journal edits/deletes (kept as-is in your current file)
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<JournalEntry>>>(
    {}
  );
  const [localDeleted, setLocalDeleted] = useState<Set<string>>(() => new Set());

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"daily" | "weekly">("daily");

  // daily draft
  const [editWinsText, setEditWinsText] = useState("");
  const [editMiss, setEditMiss] = useState("");
  const [editFix, setEditFix] = useState("");

  // weekly draft ✅ NEW
  type WeeklyOutcomeDraft = { id: string; achieved: boolean; note: string };

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

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useLockBodyScroll(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  // When opening the drawer, default to Daily (fast path)
  useEffect(() => {
    if (!open) return;
    setTab("daily");
  }, [open]);

  const portalTarget = useMemo(() => (mounted ? document.body : null), [mounted]);
  if (!portalTarget) return null;

  const baseEntries = journal.data?.entries ?? [];
  const mergedEntries: JournalEntry[] = baseEntries
    .map((e) => ({ ...e, ...(localEdits[e.id] ?? {}) }))
    .filter((e) => !localDeleted.has(e.id));

  const hasLocalChanges = Object.keys(localEdits).length > 0 || localDeleted.size > 0;

  async function onSaveDaily() {
    const wins = splitLinesMax3(winsText);
    const cleanedMiss = miss.trim();
    const cleanedFix = fix.trim();

    if (!wins.length && !cleanedMiss && !cleanedFix) return;

    await createDaily.mutateAsync({ wins, miss: cleanedMiss, fix: cleanedFix });

    setWinsText("");
    setMiss("");
    setFix("");

    setTab("journal");
  }

  async function onSaveWeekly() {
    const payload = {
      outcomes: weeklyOutcomes.map((o) => ({
        id: o.id,
        achieved: o.achieved,
        note: o.note.trim(),
      })),
      constraint: weeklyConstraint.trim(),
      decision: weeklyDecision.trim(),
      next_focus: weeklyNextFocus.trim(),
    };

    // Require at least one signal (same philosophy as Daily)
    const anyOutcome = payload.outcomes.some((o) => o.achieved || o.note);
    const anyText = Boolean(payload.constraint || payload.decision || payload.next_focus);
    if (!anyOutcome && !anyText) return;

    await createWeekly.mutateAsync(payload);

    // reset weekly form
    setWeeklyOutcomes([
      { id: "w1", achieved: false, note: "" },
      { id: "w2", achieved: false, note: "" },
      { id: "w3", achieved: false, note: "" },
    ]);
    setWeeklyConstraint("");
    setWeeklyDecision("");
    setWeeklyNextFocus("");

    setTab("journal");
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

    // weekly ✅
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
      const wins = editWinsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);

      const miss2 = editMiss.trim();
      const fix2 = editFix.trim();

      setLocalEdits((prev) => ({
        ...prev,
        [editId]: { wins, miss: miss2, fix: fix2 },
      }));

      setEditId(null);
      return;
    }

    // weekly ✅
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

  function resetLocalChanges() {
    setLocalEdits({});
    setLocalDeleted(new Set());
  }

  const Tabs = (
    <div className="flex items-center gap-2">
      {[
        { key: "daily" as const, label: "Daily" },
        { key: "weekly" as const, label: "Weekly" },
        { key: "journal" as const, label: "Journal" },
      ].map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setTab(t.key)}
          className={[
            "rounded-lg px-3 py-1.5 text-xs border",
            tab === t.key
              ? "border-indigo-400/30 bg-indigo-950/25 text-indigo-100 shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]"
              : "border-slate-800/70 bg-slate-950/30 text-slate-300 hover:text-white",
          ].join(" ")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-[60]",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        className={[
          "absolute inset-0 transition-opacity duration-200 bg-black/65",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onMouseDown={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Review"
        className={[
          "absolute right-0 top-0 h-full w-full sm:w-[520px] md:w-[640px]",
          "bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900/95",
          "text-slate-100 border-l border-indigo-400/20",
          "shadow-[0_0_0_1px_rgba(99,102,241,0.12)_inset,0_25px_60px_rgba(0,0,0,0.55)]",
          "backdrop-blur-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          "outline-none flex flex-col",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 p-4 border-b border-indigo-400/15 bg-slate-950/40">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent" />

          <div className="min-w-0 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-400/20 bg-slate-950/40 shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]">
              <ClipboardCheck className="h-4 w-4 text-indigo-200/90" />
            </div>

            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.22em] text-indigo-200/80">
                Review
              </div>
              <div className="text-base font-semibold text-slate-100 truncate">
                Closeout & Journal
              </div>
              <div className="text-xs text-slate-300/90 truncate">
                Log results fast. Don’t write a novel.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Tabs}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/25 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800/60 transition"
              title="Close"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* DAILY */}
          {tab === "daily" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800/60 bg-slate-950/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Daily Closeout (60 sec)
                </div>
                <div className="mt-1 text-sm text-slate-200">
                  Capture signal. Snapshot is attached automatically.
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 text-xs text-slate-300">
                      Wins (max 3, one per line)
                    </div>
                    <textarea
                      className="w-full min-h-[84px] resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                      value={winsText}
                      onChange={(e) => setWinsText(e.target.value)}
                      placeholder={"1) …\n2) …\n3) …"}
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-slate-300">
                      Miss (1 line)
                    </div>
                    <input
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                      value={miss}
                      onChange={(e) => setMiss(e.target.value)}
                      placeholder="What went wrong or slipped?"
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-slate-300">
                      Fix (tomorrow rule / constraint)
                    </div>
                    <input
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                      value={fix}
                      onChange={(e) => setFix(e.target.value)}
                      placeholder="What changes tomorrow?"
                    />
                  </div>

                  {createDaily.isError && (
                    <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
                      {String(
                        (createDaily.error as any)?.message ?? "Failed to save",
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-500">
                      Tip: log at least one signal.
                    </div>

                    <button
                      type="button"
                      onClick={onSaveDaily}
                      disabled={createDaily.isPending}
                      className={[
                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
                        "border border-indigo-400/25",
                        "bg-indigo-950/25 hover:bg-indigo-900/25",
                        "text-indigo-100",
                        "shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]",
                        createDaily.isPending
                          ? "opacity-60 cursor-not-allowed"
                          : "",
                      ].join(" ")}
                    >
                      {createDaily.isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300/90" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4 text-indigo-200/90" />
                      )}
                      {createDaily.isPending ? "Saving…" : "Save day"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WEEKLY */}
          {tab === "weekly" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800/60 bg-slate-950/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Weekly Review (10 min)
                </div>
                <div className="mt-1 text-sm text-slate-200">
                  Decide what worked, what blocked you, and what changes next
                  week.
                </div>

                <div className="mt-4 space-y-3">
                  <div className="text-xs text-slate-300">Outcomes (w1–w3)</div>

                  {weeklyOutcomes.map((o, idx) => (
                    <div
                      key={o.id}
                      className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-300 uppercase tracking-widest">
                          {o.id}
                        </div>

                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={o.achieved}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setWeeklyOutcomes((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], achieved: checked };
                                return next;
                              });
                            }}
                          />
                          Achieved
                        </label>
                      </div>

                      <input
                        className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        value={o.note}
                        onChange={(e) => {
                          const v = e.target.value;
                          setWeeklyOutcomes((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], note: v };
                            return next;
                          });
                        }}
                        placeholder="Optional note (what happened / why)"
                      />
                    </div>
                  ))}

                  <div>
                    <div className="mb-1 text-xs text-slate-300">
                      Biggest constraint
                    </div>
                    <input
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                      value={weeklyConstraint}
                      onChange={(e) => setWeeklyConstraint(e.target.value)}
                      placeholder="What limited execution most?"
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-slate-300">
                      One decision
                    </div>
                    <input
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                      value={weeklyDecision}
                      onChange={(e) => setWeeklyDecision(e.target.value)}
                      placeholder="What decision changes next week?"
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-slate-300">
                      Next week focus
                    </div>
                    <input
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                      value={weeklyNextFocus}
                      onChange={(e) => setWeeklyNextFocus(e.target.value)}
                      placeholder="Primary focus statement"
                    />
                  </div>

                  {createWeekly.isError && (
                    <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
                      {String(
                        (createWeekly.error as any)?.message ??
                          "Failed to save",
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-500">
                      Tip: don’t over-explain. Log decisions.
                    </div>

                    <button
                      type="button"
                      onClick={onSaveWeekly}
                      disabled={createWeekly.isPending}
                      className={[
                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
                        "border border-indigo-400/25",
                        "bg-indigo-950/25 hover:bg-indigo-900/25",
                        "text-indigo-100",
                        "shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]",
                        createWeekly.isPending
                          ? "opacity-60 cursor-not-allowed"
                          : "",
                      ].join(" ")}
                    >
                      <ClipboardCheck className="h-4 w-4 text-indigo-200/90" />
                      {createWeekly.isPending ? "Saving…" : "Save week"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* JOURNAL (unchanged in this patch) */}
          {tab === "journal" && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    Journal Timeline
                  </div>
                  <div className="text-sm text-slate-300">
                    Latest entries (newest first)
                  </div>

                  {hasLocalChanges && (
                    <div className="mt-2 text-xs text-amber-200">
                      You have LOCAL edits/deletes (not saved to backend yet).
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasLocalChanges && (
                    <button
                      type="button"
                      onClick={resetLocalChanges}
                      className="rounded-lg border border-amber-900/40 bg-amber-950/10 px-3 py-1.5 text-xs text-amber-200 hover:text-white"
                      title="Discard local changes"
                    >
                      Reset local
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => journal.refetch()}
                    className="rounded-lg border border-slate-800/70 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {journal.isLoading ? (
                <div className="text-sm text-slate-500">Loading…</div>
              ) : journal.isError ? (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
                  {String((journal.error as any)?.message ?? "Failed to load")}
                </div>
              ) : (
                <div className="space-y-2">
                  {mergedEntries.map((e) => {
                    const isLocallyEdited = Boolean(localEdits[e.id]);

                    return (
                      <div
                        key={e.id}
                        className="rounded-2xl border border-slate-800/60 bg-slate-950/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={[
                                  "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest border",
                                  e.type === "daily"
                                    ? "border-indigo-400/25 bg-indigo-950/25 text-indigo-100"
                                    : "border-emerald-400/25 bg-emerald-950/20 text-emerald-100",
                                ].join(" ")}
                              >
                                {e.type}
                              </span>

                              {isLocallyEdited && (
                                <span className="rounded-full border border-amber-900/40 bg-amber-950/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-200">
                                  local
                                </span>
                              )}

                              <div className="text-xs text-slate-400 truncate">
                                {fmt(e.created_at)}
                              </div>
                            </div>

                            <div className="mt-2 text-sm text-slate-200">
                              {e.type === "daily"
                                ? (e.wins?.[0] ?? e.miss ?? e.fix ?? "—")
                                : (e.next_focus ??
                                  e.decision ??
                                  e.constraint ??
                                  "—")}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/30 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                              title="Edit entry (local-only for now)"
                              onClick={() => openEdit(e)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/30 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                              title="Delete entry (local-only for now)"
                              onClick={() => setDeleteId(e.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>

                        {e.type === "daily" && (
                          <div className="mt-3 space-y-1 text-xs text-slate-400">
                            {e.wins?.length ? (
                              <div>
                                <span className="text-slate-300">Wins:</span>{" "}
                                {e.wins.join(" · ")}
                              </div>
                            ) : null}
                            {e.miss ? (
                              <div>
                                <span className="text-slate-300">Miss:</span>{" "}
                                {e.miss}
                              </div>
                            ) : null}
                            {e.fix ? (
                              <div>
                                <span className="text-slate-300">Fix:</span>{" "}
                                {e.fix}
                              </div>
                            ) : null}
                          </div>
                        )}

                        {e.type === "weekly" && (
                          <div className="mt-3 space-y-1 text-xs text-slate-400">
                            {e.constraint ? (
                              <div>
                                <span className="text-slate-300">
                                  Constraint:
                                </span>{" "}
                                {e.constraint}
                              </div>
                            ) : null}
                            {e.decision ? (
                              <div>
                                <span className="text-slate-300">
                                  Decision:
                                </span>{" "}
                                {e.decision}
                              </div>
                            ) : null}
                            {e.next_focus ? (
                              <div>
                                <span className="text-slate-300">
                                  Next focus:
                                </span>{" "}
                                {e.next_focus}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!mergedEntries.length && (
                    <div className="text-sm text-slate-500">
                      No entries yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative p-4 border-t border-indigo-400/15 text-xs text-slate-300/90 bg-slate-950/25">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent" />
          Rule: Log signal. Don’t overthink.
        </div>

        {/* Edit / Delete modals (kept as-is) */}
        {editId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setEditId(null)}
            />
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-800/70 bg-slate-950 p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    {editType === "daily"
                      ? "Edit Daily Entry"
                      : "Edit Weekly Entry"}
                  </div>

                  <div className="text-xs text-amber-200 mt-1">
                    Local-only for now. Timestamp stays immutable.
                  </div>
                </div>
                <button
                  className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-2 text-slate-300 hover:text-white"
                  onClick={() => setEditId(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {editType === "daily" ? (
                  <>
                    <div>
                      <div className="mb-1 text-xs text-slate-300">
                        Wins (max 3, one per line)
                      </div>
                      <textarea
                        className="w-full min-h-[84px] resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        value={editWinsText}
                        onChange={(e) => setEditWinsText(e.target.value)}
                      />
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-slate-300">Miss</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        value={editMiss}
                        onChange={(e) => setEditMiss(e.target.value)}
                      />
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-slate-300">Fix</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        value={editFix}
                        onChange={(e) => setEditFix(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-slate-300">
                      Outcomes (editable)
                    </div>

                    {editWeeklyOutcomes.map((o, idx) => (
                      <div
                        key={o.id}
                        className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-slate-300 uppercase tracking-widest">
                            {o.id}
                          </div>

                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={o.achieved}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setEditWeeklyOutcomes((prev) => {
                                  const next = [...prev];
                                  next[idx] = {
                                    ...next[idx],
                                    achieved: checked,
                                  };
                                  return next;
                                });
                              }}
                            />
                            Achieved
                          </label>
                        </div>

                        <input
                          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                          value={o.note}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditWeeklyOutcomes((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], note: v };
                              return next;
                            });
                          }}
                          placeholder="Optional note"
                        />
                      </div>
                    ))}

                    <div>
                      <div className="mb-1 text-xs text-slate-300">
                        Biggest constraint
                      </div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        value={editWeeklyConstraint}
                        onChange={(e) =>
                          setEditWeeklyConstraint(e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-slate-300">
                        One decision
                      </div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        value={editWeeklyDecision}
                        onChange={(e) => setEditWeeklyDecision(e.target.value)}
                      />
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-slate-300">
                        Next week focus
                      </div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        value={editWeeklyNextFocus}
                        onChange={(e) => setEditWeeklyNextFocus(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
                    onClick={() => setEditId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-xl border border-indigo-400/25 bg-indigo-950/25 px-3 py-2 text-xs text-indigo-100 hover:bg-indigo-900/25"
                    onClick={saveEditLocal}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setDeleteId(null)}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-800/70 bg-slate-950 p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-amber-900/40 bg-amber-950/10">
                  <AlertTriangle className="h-4 w-4 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">
                    Delete entry?
                  </div>
                  <div className="mt-1 text-xs text-amber-200">
                    Local-only for now. Backend delete comes next.
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-200 hover:text-white"
                  onClick={confirmDeleteLocal}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    portalTarget,
  );
}
