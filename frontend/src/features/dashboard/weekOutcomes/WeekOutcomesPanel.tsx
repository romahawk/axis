import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

import { Panel } from "../../../components/Panel";
import { useLocalStorageJson } from "../../../hooks/useLocalStorageJson";

type WeekOutcome = { id: string; text: string };

type LifeArea =
  | "career"
  | "ai_leverage"
  | "health"
  | "family"
  | "finance"
  | "admin"
  | "none";

const AREA_LABEL: Record<LifeArea, string> = {
  career: "Career",
  ai_leverage: "AI × Leverage",
  health: "Health",
  family: "Family",
  finance: "Finance",
  admin: "Admin",
  none: "—",
};

const AREA_PILL_CLASS: Record<LifeArea, string> = {
  career: "border-indigo-400/25 bg-indigo-950/25 text-indigo-100",
  ai_leverage: "border-cyan-400/25 bg-cyan-950/20 text-cyan-100",
  health: "border-emerald-400/25 bg-emerald-950/20 text-emerald-100",
  family: "border-pink-400/25 bg-pink-950/20 text-pink-100",
  finance: "border-amber-400/25 bg-amber-950/20 text-amber-100",
  admin: "border-slate-400/20 bg-slate-950/30 text-slate-200",
  none: "border-slate-800/70 bg-slate-950/30 text-slate-400",
};

function parseBracketTag(input: string): { area: LifeArea | null; text: string } {
  const s = (input ?? "").trim();
  // matches: [career] text...
  const m = s.match(/^\[([a-z_]+)\]\s*(.*)$/i);
  if (!m) return { area: null, text: s };
  const raw = m[1]?.toLowerCase();
  const text = (m[2] ?? "").trim();

  const allowed: LifeArea[] = [
    "career",
    "ai_leverage",
    "health",
    "family",
    "finance",
    "admin",
    "none",
  ];
  if (allowed.includes(raw as LifeArea)) return { area: raw as LifeArea, text };
  return { area: null, text: s };
}

function parseLegacyPrefix(input: string): { area: LifeArea | null; text: string } {
  const s = (input ?? "").trim();

  const lower = s.toLowerCase();

  const prefixes: Array<{ area: LifeArea; keys: string[] }> = [
    { area: "career", keys: ["income/career:", "career:", "job:", "job search:"] },
    { area: "ai_leverage", keys: ["ai/leverage:", "ai × leverage:", "ai x leverage:"] },
    { area: "health", keys: ["health/stability:", "health:", "fitness:"] },
    { area: "family", keys: ["family:", "kids:", "home:"] },
    { area: "finance", keys: ["finance:", "money:", "investing:"] },
    { area: "admin", keys: ["admin:", "bureaucracy:", "paperwork:"] },
  ];

  for (const p of prefixes) {
    for (const k of p.keys) {
      if (lower.startsWith(k)) {
        return { area: p.area, text: s.slice(k.length).trim() };
      }
    }
  }

  return { area: null, text: s };
}

function inferAreaFromSlot(id: string): LifeArea {
  // AXIS default 3-area model: w1 career, w2 ai, w3 health
  if (id === "w1") return "career";
  if (id === "w2") return "ai_leverage";
  if (id === "w3") return "health";
  return "none";
}

function normalizeOutcome(id: string, rawText: string): { area: LifeArea; text: string } {
  const t1 = parseBracketTag(rawText);
  if (t1.area) return { area: t1.area, text: t1.text };

  const t2 = parseLegacyPrefix(rawText);
  if (t2.area) return { area: t2.area, text: t2.text };

  // Default by slot if nothing specified
  return { area: inferAreaFromSlot(id), text: (rawText ?? "").trim() };
}

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

export function WeekOutcomesPanel({ weekOutcomes }: { weekOutcomes: WeekOutcome[] }) {
  const [open, setOpen] = useLocalStorageJson<boolean>(
    "axis_week_outcomes_open_v1",
    true
  );

  const normalized = useMemo(() => {
    return (weekOutcomes ?? []).slice(0, 3).map((o) => {
      const n = normalizeOutcome(o.id, o.text ?? "");
      return { id: o.id, area: n.area, text: n.text };
    });
  }, [weekOutcomes]);

  const filled = useMemo(() => {
    return normalized.filter((o) => (o.text ?? "").trim() && o.text !== "—").length;
  }, [normalized]);

  return (
    <Panel className="axis-tone axis-tone-focus" title={null as any}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left rounded-xl px-2 py-1 hover:bg-slate-950/30"
      >
        <div>
          <div className="text-sm font-semibold text-slate-100">
            Top 3 Outcomes (weekly)
          </div>
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
          <div className="space-y-2">
            {normalized.map((o) => (
              <div
                key={o.id}
                className="rounded-lg border border-slate-900 p-3 text-sm text-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AreaPill area={o.area} />
                      <span className="text-xs text-slate-500 uppercase tracking-widest">
                        {o.id}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-200">
                      {o.text || "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Tip: labels are inferred (w1/w2/w3) or parsed from tags/prefixes.
          </div>
        </div>
      )}
    </Panel>
  );
}
