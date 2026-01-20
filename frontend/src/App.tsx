import { useMe } from "./hooks/useMe";
import DashboardPage from "./pages/DashboardPage";
import { Cpu, CircleDot } from "lucide-react";

export default function App() {
  const { data: me, isLoading, isError } = useMe();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md border border-slate-800/70 bg-slate-950/40 shadow-[0_0_0_1px_rgba(99,102,241,0.12)_inset]">
              <Cpu className="h-4 w-4 text-slate-200" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-slate-100">
                Axis
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                control
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CircleDot className="h-3.5 w-3.5 text-indigo-400/70" />
            {isLoading && "Loading…"}
            {isError && "API error"}
            {me && `${me.name} · ${me.role}`}
          </div>
        </div>
        {/* subtle glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </header>

      <main className="h-[calc(100vh-56px)] w-full">
        <div className="h-full px-6 py-4">
          <DashboardPage />
        </div>
      </main>
    </div>
  );
}
