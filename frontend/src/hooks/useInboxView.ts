import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "../lib/api";

export type InboxItem = {
  id: string;
  text: string;
  created_at: string; // ISO timestamp
  source?: "manual" | "import";
  link?: { url: string; title?: string };
};

export type InboxView = {
  items: InboxItem[];
};

export function useInboxView() {
  return useQuery({
    queryKey: ["inboxView"],
    queryFn: () => fetchJSON<InboxView>("/api/v1/views/inbox"),
  });
}
