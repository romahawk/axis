// frontend/src/features/dashboard/resources/WeeklyResourceDock.tsx
import { Panel } from "../../../components/Panel";
import type { ResourceSection } from "../types";
import { ExternalLink } from "lucide-react";

type DockLink = { section: string; label: string; url: string };

/**
 * THIS WEEK dock: read-only, one-click external routing.
 * Mirrors the existing "Resources (this week)" data (no new editor, no new API).
 */
export function WeeklyResourceDock(props: { resources: ResourceSection[] }) {
  const resources = props.resources ?? [];

  const links: DockLink[] = resources.flatMap((section) =>
    (section.links ?? []).map((l) => ({
      section: section.title,
      label: l.label,
      url: l.url,
    }))
  );

  return (
    <Panel title="THIS WEEK" className="border-0 bg-transparent p-0 shadow-none">
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
              <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
            </a>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-500">
          No weekly resources yet. Add them in{" "}
          <span className="text-slate-300">Resources (this week)</span>.
        </div>
      )}
    </Panel>
  );
}
