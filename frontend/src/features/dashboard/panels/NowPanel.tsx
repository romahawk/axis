// frontend/src/features/dashboard/panels/NowPanel.tsx
import * as React from "react";
import { Panel } from "../../../components/Panel";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatNow(d: Date) {
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const month = d.toLocaleDateString(undefined, { month: "short" });
  const day = pad2(d.getDate());
  const year = d.getFullYear();
  const hours = pad2(d.getHours());
  const minutes = pad2(d.getMinutes());
  return `${weekday}, ${month} ${day} · ${hours}:${minutes} · ${year}`;
}

/**
 * NOW = time anchoring only.
 * - updates on minute boundary
 * - no state persisted
 */
export function NowPanel() {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    // Update on minute boundary to avoid jitter.
    const tick = () => setNow(new Date());
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    let intervalId: number | null = null;

    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, []);

  const calendarUrl = "https://calendar.google.com/calendar/u/0/r/agenda";

  return (
    <Panel title="NOW">
      <div className="space-y-2">
        <div className="text-sm text-slate-200">{formatNow(now)}</div>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs text-slate-300 underline hover:text-white"
        >
          Open Google Calendar
          <span aria-hidden>↗</span>
        </a>
      </div>
    </Panel>
  );
}
