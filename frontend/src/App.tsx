import { useMe } from "./hooks/useMe";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const { data: me, isLoading, isError } = useMe();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="h-14 border-b border-slate-800">
        <div className="mx-auto flex h-full w-full items-center justify-between px-6">
          <div className="font-semibold tracking-wide">Axis</div>
          <div className="text-xs text-slate-400">
            {isLoading && "Loading…"}
            {isError && "API error"}
            {me && `${me.name} · ${me.role}`}
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-56px)] w-full">
        <div className="h-full px-6 py-4">
          <DashboardPage />
        </div>
      </main>
    </div>
  );
}
