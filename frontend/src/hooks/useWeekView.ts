import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "../lib/api";

export type WeekFocus = { id: string; text: string };
export type WeekConstraint = { id: string; text: string };

export type WeekCommitment = {
  id: string;
  text: string;
  domain?: string;
  status?: "planned" | "doing" | "done" | "blocked";
  trello?: { url: string; title?: string };
};

export type WeekView = {
  week: string;
  focus: WeekFocus[];          // max 3
  commitments: WeekCommitment[];
  constraints: WeekConstraint[];
  notes?: string;
};

export function useWeekView(week?: string) {
  const qs = week ? `?week=${encodeURIComponent(week)}` : "";
  return useQuery({
    queryKey: ["weekView", week ?? "current"],
    queryFn: () => fetchJSON<WeekView>(`/api/v1/views/week${qs}`),
  });
}
