import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postJSON } from "../features/dashboard/api/postJSON";

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

function apiBase(): string {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (base ?? "").replace(/\/$/, "");
}

function toApiUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  const base = apiBase();
  return base ? `${base}${path}` : path;
}

async function requestJSON<T>(
  url: string,
  init: RequestInit & { json?: any } = {},
): Promise<T> {
  const { json, ...rest } = init;

  const res = await fetch(toApiUrl(url), {
    credentials: "include",
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers ?? {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
    ...rest,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${rest.method ?? "GET"} ${url} failed (${res.status})`);
  }

  // DELETE may return 204 with empty body
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

async function getJSON<T>(url: string): Promise<T> {
  return requestJSON<T>(url, { method: "GET" });
}

export function useJournalList(params?: { limit?: number; type?: "daily" | "weekly" }) {
  const limit = params?.limit ?? 50;
  const type = params?.type;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (type) qs.set("type", type);

  return useQuery({
    queryKey: ["journal", { limit, type }],
    queryFn: async () =>
      getJSON<{ entries: JournalEntry[] }>(`/api/v1/journal?${qs.toString()}`),
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
      return await requestJSON<JournalEntry>(`/api/v1/journal/${args.id}`, {
        method: "PATCH",
        json: args.payload,
      });
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
      await requestJSON<void>(`/api/v1/journal/${id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}
