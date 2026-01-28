// frontend/src/App.tsx
import { useEffect, useState } from "react";
import { BookOpen, Cpu, CircleDot, ClipboardCheck } from "lucide-react";

import { useMe } from "./hooks/useMe";
import DashboardPage from "./pages/DashboardPage";
import { AxisGuideDrawer } from "./components/axis-guide/AxisGuideDrawer";
import { ReviewDrawer } from "./components/review/ReviewDrawer";

export default function App() {
  const { data: me, isLoading, isError } = useMe();

  const [guideOpen, setGuideOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  // ✅ Auto-open Review drawer after "Close day" confirmation
  useEffect(() => {
    const onRequestOpenReview = () => {
      setReviewOpen(true);
    };

    const onDayClosed = () => {
      // Fallback: ensure Review opens even if request event isn’t emitted/handled.
      setReviewOpen(true);
    };

    window.addEventListener(
      "axis:request-open-review",
      onRequestOpenReview as EventListener,
    );
    window.addEventListener("axis:day-closed", onDayClosed as EventListener);

    return () => {
      window.removeEventListener(
        "axis:request-open-review",
        onRequestOpenReview as EventListener,
      );
      window.removeEventListener("axis:day-closed", onDayClosed as EventListener);
    };
  }, []);

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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset] hover:bg-slate-950/60"
              aria-label="Open Review"
              title="Review"
            >
              <ClipboardCheck className="h-3.5 w-3.5 text-slate-300" />
              Review
            </button>

            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset] hover:bg-slate-950/60"
              aria-label="Open AXIS Guide"
              title="AXIS Guide"
            >
              <BookOpen className="h-3.5 w-3.5 text-slate-300" />
              AXIS Guide
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CircleDot className="h-3.5 w-3.5 text-indigo-400/70" />
              {isLoading && "Loading…"}
              {isError && "API error"}
              {me && `${me.name} · ${me.role}`}
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </header>

      <main className="h-[calc(100vh-56px)] w-full">
        <div className="h-full px-6 py-4">
          <DashboardPage />
        </div>
      </main>

      <AxisGuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} />
      <ReviewDrawer open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
