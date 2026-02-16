import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteJSON, fetchJSON, patchJSON, postJSON } from "../lib/api";

export type JournalEntry = {
  id: string;
  type: "daily" | "weekly";
  created_at: string;
  date?: string;
  week_id?: string;

  // daily
  wins?: string[];
  miss?: string;
  fix?: string;

  // weekly
  outcomes?: { id: string; achieved: boolean; note?: string }[];
  constraint?: string;
  decision?: string;
  next_focus?: string;

  snapshot?: any;
};

export type UpdateJournalEntryPayload =
  | {
      type: "daily";
      wins: string[];
      miss: string;
      fix: string;
    }
  | {
      type: "weekly";
      outcomes: { id: string; achieved: boolean; note: string }[];
      constraint: string;
      decision: string;
      next_focus: string;
    };

export function useJournalList(params?: { limit?: number; type?: "daily" | "weekly" }) {
  const limit = params?.limit ?? 50;
  const type = params?.type;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (type) qs.set("type", type);

  return useQuery({
    queryKey: ["journal", { limit, type }],
    queryFn: async () =>
      fetchJSON<{ entries: JournalEntry[] }>(`/api/v1/journal?${qs.toString()}`),
  });
}

export function useCreateDailyCloseout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { wins: string[]; miss: string; fix: string }) => {
      return await postJSON<JournalEntry>("/api/v1/journal/daily", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useCreateWeeklyReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      outcomes: { id: string; achieved: boolean; note: string }[];
      constraint: string;
      decision: string;
      next_focus: string;
    }) => {
      return await postJSON<JournalEntry>("/api/v1/journal/weekly", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; payload: UpdateJournalEntryPayload }) => {
      return await patchJSON<JournalEntry>(`/api/v1/journal/${args.id}`, args.payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteJSON<void>(`/api/v1/journal/${id}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}
