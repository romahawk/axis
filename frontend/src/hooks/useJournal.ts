import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postJSON } from "../features/dashboard/api/postJSON";

export type JournalEntry = {
  id: string;
  type: "daily" | "weekly";
  created_at: string;
  date?: string;
  week_id?: string;

  wins?: string[];
  miss?: string;
  fix?: string;

  // keep it loose for MVP
  snapshot?: any;
};

export function useJournalList(params?: { limit?: number; type?: "daily" | "weekly" }) {
  const limit = params?.limit ?? 50;
  const type = params?.type;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (type) qs.set("type", type);

  return useQuery({
    queryKey: ["journal", { limit, type }],
    queryFn: async () => {
      const res = await fetch(`/api/v1/journal?${qs.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `GET /api/v1/journal failed (${res.status})`);
      }
      return (await res.json()) as { entries: JournalEntry[] };
    },
  });
}

export function useCreateDailyCloseout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { wins: string[]; miss: string; fix: string }) => {
      return await postJSON<JournalEntry>("/api/v1/journal/daily", payload);
    },
    onSuccess: async () => {
      // refresh any journal lists
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}
