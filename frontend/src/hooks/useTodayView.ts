import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "../lib/api";

export type TodayOutcome = { id: string; text: string; done: boolean };
export type TodayAction = { id: string; text: string; done: boolean };
export type TodayBlocker = { id: string; text: string };

export type TodayView = {
  date: string;
  outcomes: TodayOutcome[];
  actions: TodayAction[];
  blockers: TodayBlocker[];
};

export function useTodayView() {
  return useQuery({
    queryKey: ["todayView"],
    queryFn: () => fetchJSON<TodayView>("/api/v1/views/today"),
  });
}
