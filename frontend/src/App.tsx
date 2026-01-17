import { Navigate, Route, Routes, Link } from "react-router-dom";
import TodayPage from "./pages/TodayPage";
import WeekPage from "./pages/WeekPage";
import InboxPage from "./pages/InboxPage";
import { useMe } from "./hooks/useMe";

export default function App() {
  const { data: me, isLoading, isError } = useMe();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="font-semibold tracking-wide">Axis</div>

          <div className="flex items-center gap-6">
            <nav className="flex gap-4 text-sm">
              <Link to="/today" className="text-slate-300 hover:text-white">
                Today
              </Link>
              <Link to="/week" className="text-slate-300 hover:text-white">
                Week
              </Link>
              <Link to="/inbox" className="text-slate-300 hover:text-white">
                Inbox
              </Link>
            </nav>

            <div className="text-xs text-slate-400">
              {isLoading && "Loading…"}
              {isError && "API error"}
              {me && `${me.name} · ${me.role}`}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/inbox" element={<InboxPage />} />
        </Routes>
      </main>
    </div>
  );
}
