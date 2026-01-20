// frontend/src/features/dashboard/resources/WeeklyResourceDock.tsx
import { Panel } from "../../../components/Panel";
import type { ResourceSection } from "../types";

export function WeeklyResourceDock(props: { resources: ResourceSection[] }) {
  const resources = props.resources ?? [];

  // Flatten sections into a single list for routing speed
  const links = resources.flatMap((section) =>
    (section.links ?? []).map((l) => ({
      section: section.title,
      label: l.label,
      url: l.url,
    }))
  );

  return (
    <Panel title="THIS WEEK" className="bg-slate-950/20 border-slate-800/80">
      {links.length ? (
        <div className="space-y-1">
          {links.map((l) => (
            <a
              key={`${l.section}:${l.label}:${l.url}`}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between rounded-md border border-slate-900 bg-slate-950/40 px-2 py-1.5 text-xs text-slate-300 hover:text-white"
              title={`${l.section} • ${l.label}`}
            >
              <span className="truncate">{l.label}</span>
              <span className="ml-2 text-slate-500 group-hover:text-slate-300" aria-hidden>
                ↗
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-500">
          No weekly resources yet. Add them in <span className="text-slate-300">Resources (this week)</span>.
        </div>
      )}
    </Panel>
  );
}
