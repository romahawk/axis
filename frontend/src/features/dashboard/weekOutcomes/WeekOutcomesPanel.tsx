import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Panel } from "../../../components/Panel";
import { useLocalStorageJson } from "../../../hooks/useLocalStorageJson";

type WeekOutcome = { id: string; text: string };

type LifeArea =
  | "career"
  | "ai_leverage"
  | "education"
  | "health"
  | "family"
  | "finance"
  | "admin"
  | "none";

const AREA_LABEL: Record<LifeArea, string> = {
  career: "Career",
  ai_leverage: "AI × Leverage",
  education: "Education",
  health: "Health",
  family: "Family",
  finance: "Finance",
  admin: "Admin",
  none: "—",
};

const AREA_OPTIONS: Array<{ value: LifeArea; label: string }> = [
  { value: "career", label: "Career" },
  { value: "ai_leverage", label: "AI × Leverage" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "family", label: "Family" },
  { value: "finance", label: "Finance" },
  { value: "admin", label: "Admin" },
  { value: "none", label: "—" },
];

const AREA_PILL_CLASS: Record<LifeArea, string> = {
  career: "border-indigo-400/25 bg-indigo-950/25 text-indigo-100",
  ai_leverage: "border-cyan-400/25 bg-cyan-950/20 text-cyan-100",
  education: "border-violet-400/25 bg-violet-950/20 text-violet-100",
  health: "border-emerald-400/25 bg-emerald-950/20 text-emerald-100",
  family: "border-pink-400/25 bg-pink-950/20 text-pink-100",
  finance: "border-amber-400/25 bg-amber-950/20 text-amber-100",
  admin: "border-slate-400/20 bg-slate-950/30 text-slate-200",
  none: "border-slate-800/70 bg-slate-950/30 text-slate-400",
};

function AreaPill({ area }: { area: LifeArea }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
        AREA_PILL_CLASS[area],
      ].join(" ")}
      title={AREA_LABEL[area]}
    >
      {AREA_LABEL[area]}
    </span>
  );
}

function parseBracketTag(input: string): { area: LifeArea | null; text: string } {
  const s = (input ?? "").trim();
  const m = s.match(/^\[([a-z_]+)\]\s*(.*)$/i);
  if (!m) return { area: null, text: s };

  const raw = (m[1] ?? "").toLowerCase() as LifeArea;
  const text = (m[2] ?? "").trim();

  if (!AREA_PILL_CLASS[raw]) return { area: null, text: s };
  return { area: raw, text };
}

function parseLegacyPrefix(input: string): { area: LifeArea | null; text: string } {
  const s = (input ?? "").trim();
  const lower = s.toLowerCase();

  const prefixes: Array<{ area: LifeArea; keys: string[] }> = [
    { area: "career", keys: ["income/career:", "career:", "job:", "job search:"] },
    { area: "ai_leverage", keys: ["ai/leverage:", "ai × leverage:", "ai x leverage:"] },
    { area: "education", keys: ["education:", "learning:", "study:"] },
    { area: "health", keys: ["health/stability:", "health:", "fitness:"] },
    { area: "family", keys: ["family:", "kids:", "home:"] },
    { area: "finance", keys: ["finance:", "money:", "investing:"] },
    { area: "admin", keys: ["admin:", "bureaucracy:", "paperwork:"] },
  ];

  for (const p of prefixes) {
    for (const k of p.keys) {
      if (lower.startsWith(k)) return { area: p.area, text: s.slice(k.length).trim() };
    }
  }

  return { area: null, text: s };
}

function inferAreaFromSlot(id: string): LifeArea {
  if (id === "w1") return "career";
  if (id === "w2") return "ai_leverage";
  if (id === "w3") return "health";
  return "none";
}

function normalizeOutcome(id: string, rawText: string): { id: string; area: LifeArea; text: string } {
  const t1 = parseBracketTag(rawText);
  if (t1.area) return { id, area: t1.area, text: t1.text };

  const t2 = parseLegacyPrefix(rawText);
  if (t2.area) return { id, area: t2.area, text: t2.text };

  return { id, area: inferAreaFromSlot(id), text: (rawText ?? "").trim() };
}

function encodeOutcome(area: LifeArea, text: string): string {
  const t = (text ?? "").trim();
  if (!t) return "—";
  if (area === "none") return t;
  return `[${area}] ${t}`;
}

export function WeekOutcomesPanel({
  weekOutcomes,
  putJSON,
}: {
  weekOutcomes: WeekOutcome[];
  putJSON: <T>(url: string, body: unknown) => Promise<T>;
}) {
  const [open, setOpen] = useLocalStorageJson<boolean>("axis_week_outcomes_open_v1", true);

  /**
   * Local override to avoid “not saved” feeling when parent data
   * doesn’t refetch immediately after PUT.
   */
  const [override, setOverride] = useState<Array<{ id: string; area: LifeArea; text: string }> | null>(
    null
  );

  const normalizedFromProps = useMemo(() => {
    return (weekOutcomes ?? []).slice(0, 3).map((o) => normalizeOutcome(o.id, o.text ?? ""));
  }, [weekOutcomes]);

  // If server props change (e.g., after refresh), clear override.
  useEffect(() => {
    setOverride(null);
  }, [weekOutcomes]);

  const normalized = override ?? normalizedFromProps;

  const filled = useMemo(() => {
    return normalized.filter((o) => (o.text ?? "").trim() && o.text !== "—").length;
  }, [normalized]);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Array<{ id: string; area: LifeArea; text: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!editMode) setDraft(normalized);
  }, [normalized, editMode]);

  function startEdit() {
    setSaveError(null);
    setDraft(normalized);
    setEditMode(true);
  }

  function cancelEdit() {
    setSaveError(null);
    setDraft(normalized);
    setEditMode(false);
  }

  async function saveEdit() {
    setSaveError(null);
    setSaving(true);

    try {
      // Backend expects: { outcomes: [...] }
      const outcomes = draft.slice(0, 3).map((d) => encodeOutcome(d.area, d.text));

      await putJSON("/api/v1/week/outcomes", { outcomes });

      // Optimistic display: immediately reflect saved values even if parent doesn't refetch yet.
      setOverride(draft.slice(0, 3));

      // Optional: allow parent/dashboard to refetch if it listens.
      window.dispatchEvent(new CustomEvent("axis:week-outcomes-updated"));

      setEditMode(false);
    } catch (e: any) {
      setSaveError(String(e?.message ?? "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  function getISOWeekKey(d = new Date()): string {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  async function closeWeek() {
    // 1) seed weekly closeout from current visible outcomes (clean text, no tags)
    const week_id = getISOWeekKey();
    const seed = {
      week_id,
      created_at: new Date().toISOString(),
      outcomes: normalized.slice(0, 3).map((o) => (o.text || "—").trim()),
    };
    try {
      localStorage.setItem("axis_week_closeout_seed_v1", JSON.stringify(seed));
    } catch {}

    // 2) clear weekly outcomes on dashboard (backend expects { outcomes: [...] })
    try {
      await putJSON("/api/v1/week/outcomes", { outcomes: ["—", "—", "—"] });
      // optional: optimistic UI can also clear override here if you keep override state
      window.dispatchEvent(new CustomEvent("axis:week-outcomes-updated"));
    } catch (e) {
      // even if clear fails, still open weekly closeout (user can proceed)
    }

    // 3) open ReviewDrawer on Weekly tab
    window.dispatchEvent(
      new CustomEvent("axis:request-open-review", {
        detail: { tab: "weekly" },
      }),
    );
  }


  return (
    <Panel className="axis-tone axis-tone-focus" title={null as any}>
      {/* Header (collapse only) */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left rounded-xl px-2 py-1 hover:bg-slate-950/30"
      >
        <div>
          <div className="text-sm font-semibold text-slate-100">Top 3 Outcomes (weekly)</div>
          <div className="mt-1 text-xs text-slate-400">
            Rule: exactly 3. {filled}/3 set.
          </div>
        </div>

        <ChevronDown
          className={[
            "h-4 w-4 text-slate-300 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="mt-3">
          {/* Content */}
          {!editMode ? (
            <div className="space-y-2">
              {normalized.map((o) => (
                <div key={o.id} className="rounded-lg border border-slate-900 p-3 text-sm text-slate-200">
                  <div className="flex items-center gap-2">
                    <AreaPill area={o.area} />
                    <span className="text-xs text-slate-500 uppercase tracking-widest">{o.id}</span>
                  </div>

                  <div className="mt-2 text-sm text-slate-200">{o.text || "—"}</div>
                </div>
              ))}

              <div className="mt-3 text-xs text-slate-500">
                Tip: labels are inferred (w1/w2/w3) or parsed from tags/prefixes.
              </div>

              {/* Bottom action bar (moved down) */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeWeek}
                  className="rounded-md border border-emerald-900/60 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200 hover:text-white"
                >
                  Close week
                </button>

                <button
                  type="button"
                  onClick={startEdit}
                  className="rounded-md border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
                >
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {draft.slice(0, 3).map((d, idx) => (
                <div key={d.id} className="grid grid-cols-[170px_1fr] gap-2">
                  <select
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-slate-600"
                    value={d.area}
                    onChange={(e) => {
                      const nextArea = e.target.value as LifeArea;
                      setDraft((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], area: nextArea };
                        return next;
                      });
                    }}
                  >
                    {AREA_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <input
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                    value={d.text}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], text: e.target.value };
                        return next;
                      })
                    }
                    placeholder={`Outcome ${idx + 1}`}
                  />
                </div>
              ))}

              {saveError && (
                <div className="rounded-md border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-200">
                  {saveError}
                </div>
              )}

              {/* Bottom action bar (already down) */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-md border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="rounded-md border border-indigo-400/25 bg-indigo-950/25 px-3 py-2 text-xs text-indigo-100 hover:text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
