import { useMutation, useQueryClient } from "@tanstack/react-query";

function apiBase(): string {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (base ?? "").replace(/\/$/, "");
}

function toApiUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  const base = apiBase();
  return base ? `${base}${path}` : path;
}

type ToggleArgs = {
  kind: "outcomes" | "actions"; // UI contract; we use "outcomes" for Top3
  id: string;
  done: boolean;
};

export function useToggleTodayItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: ToggleArgs) => {
      // Canonical endpoint (v1)
      const res = await fetch(toApiUrl(`/api/v1/today/top3/${args.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ done: args.done }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to toggle item ${args.id}`);
      }

      return res.json();
    },

    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["today"] });
    },
  });
}
