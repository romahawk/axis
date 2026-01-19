import React from "react";

export function Panel({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-slate-800 p-4 ${className}`}>
      <div className="mb-3 text-sm font-semibold text-slate-200">{title}</div>
      {children}
    </div>
  );
}
