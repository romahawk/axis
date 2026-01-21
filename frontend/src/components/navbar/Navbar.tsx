// frontend/src/components/navbar/Navbar.tsx
import { useState } from "react";
import { AxisGuideDrawer } from "../axis-guide/AxisGuideDrawer";

export function Navbar() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <header className="h-12 flex items-center justify-between px-4 border-b border-zinc-200/60 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">AXIS</div>
          {/* other nav items */}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-sm"
          >
            AXIS Guide
          </button>

          {/* other right-side actions */}
        </div>
      </header>

      <AxisGuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
