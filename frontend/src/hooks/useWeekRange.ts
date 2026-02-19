import { useMemo } from "react";

/**
 * Returns the ISO week number and year for a given date.
 * ISO week: Monday is the first day, week 1 contains January 4th.
 */
function getISOWeekYear(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { year: date.getUTCFullYear(), week };
}

/** Format as "2026-W08" */
export function toWeekId(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Parse "2026-W08" => { year: 2026, week: 8 } */
export function parseWeekId(id: string): { year: number; week: number } | null {
  const m = id.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return null;
  return { year: parseInt(m[1], 10), week: parseInt(m[2], 10) };
}

/** Short display label: "W8" */
export function weekIdToLabel(id: string): string {
  const parsed = parseWeekId(id);
  if (!parsed) return id;
  return `W${parsed.week}`;
}

/** Get current ISO week id */
export function getCurrentWeekId(): string {
  const { year, week } = getISOWeekYear(new Date());
  return toWeekId(year, week);
}

/** Advance a week id by N weeks. Handles year boundaries. */
function advanceWeekId(id: string, n: number): string {
  const parsed = parseWeekId(id);
  if (!parsed) return id;

  // Get the Monday of the parsed week, then advance by n * 7 days
  const jan4 = new Date(Date.UTC(parsed.year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime());
  monday.setUTCDate(monday.getUTCDate() - dayOfWeek + 1 + (parsed.week - 1) * 7);
  monday.setUTCDate(monday.getUTCDate() + n * 7);

  const { year, week } = getISOWeekYear(monday);
  return toWeekId(year, week);
}

/** Compare two week ids. Returns -1, 0, or 1. */
export function compareWeekIds(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Hook that returns an array of `count` week IDs starting from the current week.
 * Default count = 8 (current + 7 forward).
 */
export function useWeekRange(count = 8): string[] {
  return useMemo(() => {
    const start = getCurrentWeekId();
    return Array.from({ length: count }, (_, i) => advanceWeekId(start, i));
  }, [count]);
}
