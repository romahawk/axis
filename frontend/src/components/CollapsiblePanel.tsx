import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useLocalStorageJson } from "../hooks/useLocalStorageJson";

export function CollapsiblePanel({
  title,
  subtitle,
  storageKey,
  rightSlot,
  defaultOpen = true,
  className = "",
  headerClassName = "",
  children,
}: {
  title: string;
  subtitle?: string;
  storageKey: string;
  rightSlot?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useLocalStorageJson<boolean>(storageKey, defaultOpen);

  return (
    <div className={className}>
      <div
        className={[
          "flex items-start justify-between gap-3",
          "cursor-pointer select-none",
          headerClassName,
        ].join(" ")}
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ChevronDown
              className={[
                "h-4 w-4 text-slate-300 transition-transform",
                open ? "rotate-0" : "-rotate-90",
              ].join(" ")}
            />
            <div className="text-sm font-semibold text-slate-100 truncate">
              {title}
            </div>
          </div>
          {subtitle ? (
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
          ) : null}
        </div>

        {/* Right-side controls (buttons etc.) */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {rightSlot}
        </div>
      </div>

      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
