import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "../lib/api";

export type DashboardPayload = {
  week: {
    week_id: string;
    mode: "LOCKED IN" | "OFF" | string;
    outcomes: { id: string; text: string }[];
    active_projects: { id: string; key?: string; focus?: string; url?: string }[];
    blockers: { id: string; text: string }[];
    anchors: Record<string, boolean>;
  };
  today: {
    date: string;
    top3: { id: string; text: string; done?: boolean }[];
  };
  reality: {
    commitments: { id: string; text: string; day?: string }[];
  };
  projects: {
    key: string;
    name: string;
    links: { label: string; url: string }[];
  }[];
  resources: {
    title: string;
    links: { label: string; url: string }[];
  }[];
  drift: Record<string, boolean>;
};

export function useDashboardView() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchJSON<DashboardPayload>("/api/v1/views/dashboard"),
    refetchOnWindowFocus: false,
  });
}
