// frontend/src/features/dashboard/panels/NowPanel.tsx
import * as React from "react";
import { Panel } from "../../../components/Panel";
import { ExternalLink, Clock } from "lucide-react";

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
    <Panel className="axis-tone" title="NOW">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <Clock className="h-4 w-4 text-slate-400" />
          <span>{formatNow(now)}</span>
        </div>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs text-slate-300 underline hover:text-white"
        >
          Open Google Calendar
          <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </a>
      </div>
    </Panel>
  );
}
