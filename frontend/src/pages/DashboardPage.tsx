import { useQueryClient } from "@tanstack/react-query";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Panel } from "../components/Panel";
import { NowPanel } from "../features/dashboard/panels/NowPanel";
import { InboxPanel } from "../features/dashboard/panels/InboxPanel";

import { useDashboardView } from "../hooks/useDashboardView";
import { useToggleTodayItem } from "../hooks/useToggleTodayItem";
import { useLocalStorageJson } from "../hooks/useLocalStorageJson";

import { putJSON } from "../features/dashboard/api/putJSON";
import { ResourcesPanel } from "../features/dashboard/resources/ResourcesPanel";
import { WeeklyResourceDock } from "../features/dashboard/resources/WeeklyResourceDock";

import type { Link, ResourceSection } from "../features/dashboard/types";

import { WeekOutcomesPanel } from "../features/dashboard/weekOutcomes/WeekOutcomesPanel";
import { WeekBlockersPanel } from "../features/dashboard/blockers/WeekBlockersPanel";
import { TodayTop3Panel } from "../features/dashboard/todayTop3/TodayTop3Panel";
import { ProjectsRouterPanel } from "../features/dashboard/projectsRouter/ProjectsRouterPanel";

type Project = {
  key: string;
  name: string;
  is_active?: boolean;
  links: Link[];
};

type WeekOutcome = { id: string; text: string };
type WeekBlocker = { id: string; text: string };
type TodayTop3Item = { id: string; text: string; done?: boolean };

function getExecutionSpaceUrl(project: Project): string | null {
  const exec = project.links.find(
    (l) => l.label?.trim() === "Execution space" && l.url?.trim()
  );
  if (exec) return exec.url;

  const trello = project.links.find(
    (l) => l.label?.toLowerCase() === "trello" && l.url?.trim()
  );
  return trello?.url ?? null;
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardView();
  const toggleToday = useToggleTodayItem();
  const qc = useQueryClient();

  const [leftCollapsed, setLeftCollapsed] = useLocalStorageJson<boolean>(
    "axis_left_collapsed_v1",
    false
  );

  if (isLoading) return <div className="text-slate-400">Loading…</div>;

  if (isError) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        Failed to load dashboard: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  const projects = (data.projects ?? []) as Project[];
  const resources = (data.resources ?? []) as ResourceSection[];

  const weekOutcomes = (data.week.outcomes ?? []) as WeekOutcome[];
  const weekBlockers = (data.week.blockers ?? []) as WeekBlocker[];
  const todayTop3 = (data.today.top3 ?? []) as TodayTop3Item[];

  const activeProjects = projects.filter((p) => p.is_active).slice(0, 3);

  async function sendToToday(text: string) {
    const cleaned = (text ?? "").trim();
    if (!cleaned) return;

    const slots = todayTop3.slice(0, 3).map((i) => (i.text ?? "—").trim());
    while (slots.length < 3) slots.push("—");

    let idx = slots.findIndex((t) => t === "—" || t === "" || t === "-");
    if (idx === -1) idx = 2;
    slots[idx] = cleaned;

    await putJSON("/api/v1/today/top3", { items: slots });
    await qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div
      className="grid h-full grid-cols-1 gap-4"
      style={{
        gridTemplateColumns: leftCollapsed ? "72px 1fr 360px" : "320px 1fr 360px",
      }}
    >
      {/* LEFT — Dock */}
      <aside className="h-full overflow-y-auto pr-1">
        <div className="relative rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-950/70 to-slate-950/40 p-3">
          <button
            type="button"
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="absolute right-2 top-2 rounded-md border border-slate-800/70 bg-slate-950/40 p-1.5 text-slate-300 hover:text-white"
          >
            {leftCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          {!leftCollapsed ? (
            <div className="space-y-4 pt-8">
              <WeeklyResourceDock resources={resources} />
              <div className="h-px bg-slate-800/60" />
              <ProjectsRouterPanel projects={projects} putJSON={putJSON} />
            </div>
          ) : (
            <div className="pt-8 text-[10px] uppercase tracking-widest text-slate-500">
              Dock
            </div>
          )}
        </div>
      </aside>

      {/* CENTER */}
      <main className="h-full overflow-y-auto pr-1">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-400">THIS WEEK</div>
            <div className="text-xl font-semibold">{data.week.week_id}</div>
          </div>

          <WeekOutcomesPanel weekOutcomes={weekOutcomes} putJSON={putJSON} />

          <Panel title="Active Projects (max 3)" className="axis-tone axis-tone-focus">
            {activeProjects.length ? (
              <ul className="space-y-2 text-sm">
                {activeProjects.map((p) => {
                  const execUrl = getExecutionSpaceUrl(p);

                  return (
                    <li
                      key={p.key}
                      className="rounded-lg border border-slate-900 p-3"
                    >
                      <div className="font-semibold text-slate-100">
                        {p.name?.trim() || "Untitled project"}
                      </div>

                      {execUrl && (
                        <a
                          href={execUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs text-slate-300 underline hover:text-white"
                        >
                          Execution space
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">
                No active projects selected
              </div>
            )}
          </Panel>

          <TodayTop3Panel
            date={data.today.date}
            todayTop3={todayTop3}
            putJSON={putJSON}
            toggleToday={toggleToday}
          />

          <WeekBlockersPanel weekBlockers={weekBlockers} putJSON={putJSON} />
          <ResourcesPanel resources={resources} />
        </div>
      </main>

      {/* RIGHT */}
      <aside className="h-full overflow-y-auto pr-1">
        <div className="space-y-4">
          <NowPanel />
          <InboxPanel onSendToToday={sendToToday} />
        </div>
      </aside>
    </div>
  );
}
