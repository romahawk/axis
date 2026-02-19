import { Folder, FolderOpen } from "lucide-react";
import { Panel } from "../../components/Panel";

type Project = {
  key: string;
  name: string;
  is_active?: boolean;
};

interface ProjectLibraryProps {
  projects: Project[];
  selectedProjectKey: string | null;
  onSelectProject: (key: string | null) => void;
}

export function ProjectLibrary({
  projects,
  selectedProjectKey,
  onSelectProject,
}: ProjectLibraryProps) {
  const activeProjects = projects.filter((p) => p.is_active);
  const inactiveProjects = projects.filter((p) => !p.is_active);

  return (
    <Panel title="Project Library" className="axis-tone axis-tone-ganntify">
      <div className="space-y-1">
        {/* "All" filter */}
        <button
          type="button"
          onClick={() => onSelectProject(null)}
          className={[
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
            selectedProjectKey === null
              ? "bg-slate-800/50 text-slate-100"
              : "text-slate-400 hover:text-slate-200",
          ].join(" ")}
        >
          <Folder className="h-3.5 w-3.5" />
          All Projects
        </button>

        {/* Active section */}
        {activeProjects.length > 0 && (
          <>
            <div className="mt-3 mb-1 text-[10px] uppercase tracking-widest text-emerald-400/70">
              Active
            </div>
            {activeProjects.map((p) => {
              const isSelected = selectedProjectKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    onSelectProject(isSelected ? null : p.key)
                  }
                  className={[
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-emerald-950/40 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.15)_inset]"
                      : "text-slate-200 hover:bg-slate-800/30 hover:text-slate-100",
                  ].join(" ")}
                >
                  <FolderOpen className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="truncate">
                    {(p.name ?? "").trim() || "Untitled"}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {/* Inactive section */}
        {inactiveProjects.length > 0 && (
          <>
            <div className="mt-3 mb-1 text-[10px] uppercase tracking-widest text-slate-500">
              Inactive
            </div>
            {inactiveProjects.map((p) => {
              const isSelected = selectedProjectKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    onSelectProject(isSelected ? null : p.key)
                  }
                  className={[
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs opacity-50 transition-colors",
                    isSelected
                      ? "bg-slate-800/40 text-slate-200 opacity-100"
                      : "text-slate-400 hover:text-slate-300 hover:opacity-70",
                  ].join(" ")}
                >
                  <Folder className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {(p.name ?? "").trim() || "Untitled"}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {projects.length === 0 && (
          <div className="py-4 text-center text-xs text-slate-500">
            No projects found.
          </div>
        )}
      </div>
    </Panel>
  );
}
