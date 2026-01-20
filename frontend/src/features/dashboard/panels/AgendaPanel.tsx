// frontend/src/features/dashboard/panels/AgendaPanel.tsx
import { Panel } from "../../../components/Panel";

/**
 * Read-only agenda view.
 *
 * Sprint 2 constraint: no backend + no OAuth work.
 * So we use a Google Calendar embed.
 */
export function AgendaPanel() {
  const calendarLink = "https://calendar.google.com/calendar/u/0/r/agenda";
  // This embed works when user is signed in (same browser). If iframe is blocked,
  // the user still has the link.
  const embedSrc =
    "https://calendar.google.com/calendar/u/0/embed?mode=AGENDA&showTitle=0&showNav=0&showDate=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0";

  return (
    <Panel title="Agenda (read-only)">
      <div className="space-y-2">
        <div className="rounded-lg border border-slate-900 bg-slate-950">
          <iframe
            title="Google Calendar Agenda"
            src={embedSrc}
            className="h-[360px] w-full rounded-lg"
            loading="lazy"
          />
        </div>
        <a
          href={calendarLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs text-slate-300 underline hover:text-white"
        >
          Open in Google Calendar
          <span aria-hidden>↗</span>
        </a>
        <div className="text-xs text-slate-500">
          Read-only. Edit events in Google Calendar.
        </div>
      </div>
    </Panel>
  );
}
