// frontend/src/components/axis-guide/AxisGuideContentData.ts

export type AxisGuideSection = {
  id: string;
  title: string;
  body: Array<
    | { type: "p"; text: string }
    | { type: "h"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "quote"; text: string }
  >;
};

export const AXIS_GUIDE_TITLE = "AXIS — Execution Guide";
export const AXIS_GUIDE_SUBTITLE = "Execute under complexity";

export const AXIS_GUIDE_SECTIONS: AxisGuideSection[] = [
  {
    id: "daily-start",
    title: "1. Daily Start Ritual (5 min)",
    body: [
      { type: "h", text: "Purpose" },
      { type: "p", text: "Align today with this week. Prevent reactive work." },

      { type: "h", text: "Protocol" },
      {
        type: "ul",
        items: [
          "Read Weekly Top 3 (do not edit)",
          "Select Today — Top 3 (exactly 3 tasks)",
          "Each task maps to a Weekly Outcome",
          "≥1 task must feel uncomfortable",
          "Order matters: (1) hardest / identity-defining (2) primary needle-mover (3) support",
        ],
      },

      { type: "h", text: "Execution rule" },
      { type: "ul", items: ["Start with Slot 1", "Do not rearrange unless something breaks"] },

      { type: "h", text: "Stop condition" },
      { type: "p", text: "Once set → close AXIS and execute." },
    ],
  },
  {
    id: "daily-shutdown",
    title: "2. Daily Shutdown Ritual (5 min)",
    body: [
      { type: "h", text: "Purpose" },
      { type: "p", text: "Close the day cleanly. No mental carryover." },

      { type: "h", text: "Protocol" },
      { type: "ul", items: ["Mark reality (done / not done)", "Log friction (optional, 1 line)", "Dump loose thoughts into Inbox"] },

      { type: "h", text: "Rule" },
      { type: "p", text: "Do not plan tomorrow." },
    ],
  },
  {
    id: "weekly-review",
    title: "3. Weekly Review (30–45 min)",
    body: [
      { type: "h", text: "Purpose" },
      { type: "p", text: "Adjust constraints, not effort." },

      { type: "h", text: "Protocol" },
      {
        type: "ul",
        items: [
          "Review Weekly Outcomes (done / not done)",
          "Identify failure mode: time / scope / energy / clarity",
          "Process Inbox: promote (rare) or delete",
          "Analyze recurring blockers",
          "Define exactly 3 new Weekly Outcomes",
          "Select max 1 Active Project",
          "Explicitly decide what will NOT be worked on",
        ],
      },

      { type: "h", text: "Calibration rule" },
      { type: "ul", items: ["Too easy → underscoped", "No progress → too many fronts or vague outcomes"] },
    ],
  },
  {
    id: "blocked-avoided",
    title: "4. Blocked / Avoided Detection",
    body: [
      { type: "h", text: "Purpose" },
      { type: "p", text: "Detect silent self-sabotage early." },

      { type: "h", text: "Signals" },
      { type: "ul", items: ["Rewriting tasks repeatedly", "Switching projects mid-week", "Tool usage without artifacts", "“Busy” days with no output"] },

      { type: "h", text: "AXIS response" },
      { type: "ul", items: ["Add blocker explicitly", "Reduce scope", "Introduce constraint (time cap, lock, freeze)"] },

      { type: "h", text: "Rule" },
      { type: "p", text: "Avoidance = system failure, not personal failure." },
    ],
  },
  {
    id: "decision-insight",
    title: "5. Decision & Insight Log",
    body: [
      { type: "h", text: "Purpose" },
      { type: "p", text: "Capture learning without journaling." },

      { type: "h", text: "Include" },
      { type: "ul", items: ["Direction-changing decisions", "Reusable insights", "Execution patterns"] },

      { type: "h", text: "Exclude" },
      { type: "ul", items: ["Emotions", "Narratives", "Long reflections"] },

      { type: "h", text: "Format" },
      { type: "p", text: "Short. Factual. Reusable." },
      { type: "quote", text: "Large tasks stall unless broken into 90–120 min artifacts." },
    ],
  },
  {
    id: "principles",
    title: "AXIS Core Principles",
    body: [
      {
        type: "ul",
        items: [
          "Fewer things, done deeply, beats many done partially",
          "Constraints create clarity",
          "Output > planning",
          "If AXIS feels comfortable, something is wrong",
        ],
      },
    ],
  },
];
