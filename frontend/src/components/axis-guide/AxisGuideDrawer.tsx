import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AxisGuideContent } from "./AxisGuideContent";

type AxisGuideDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

export function AxisGuideDrawer({ open, onClose }: AxisGuideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useLockBodyScroll(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  const portalTarget = useMemo(() => (mounted ? document.body : null), [mounted]);
  if (!portalTarget) return null;

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        className={[
          "absolute inset-0 transition-opacity duration-200",
          "bg-black/70",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onMouseDown={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="AXIS Guide"
        className={[
          "absolute right-0 top-0 h-full w-full sm:w-[520px] md:w-[640px]",
          // sci-fi glass + depth
          "bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900/95",
          "text-slate-100",
          "border-l border-indigo-400/20",
          "shadow-[0_0_0_1px_rgba(99,102,241,0.12)_inset,0_25px_60px_rgba(0,0,0,0.55)]",
          "backdrop-blur-xl",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          "outline-none",
          "flex flex-col",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 p-4 border-b border-indigo-400/15 bg-slate-950/40">
          {/* subtle neon line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent" />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-indigo-200/80">
              Reference
            </div>
            <div className="text-base font-semibold text-slate-100 truncate">
              AXIS Guide
            </div>
            <div className="text-xs text-slate-300/90 truncate">
              How to use AXIS to execute under complexity
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={[
              "px-3 py-1.5 rounded-lg text-sm",
              "border border-indigo-400/25",
              "bg-slate-900/50 hover:bg-slate-800/60",
              "text-slate-100",
              "shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]",
              "transition",
            ].join(" ")}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <AxisGuideContent
            onJump={(id: string) => {
              const el = document.getElementById(id);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>

        {/* Footer */}
        <div className="relative p-4 border-t border-indigo-400/15 text-xs text-slate-300/90 bg-slate-950/25">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent" />
          Rule: Reference only. Don’t turn AXIS into reading.
        </div>
      </div>
    </div>,
    portalTarget
  );
}
