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

export function useToggleTodayItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(
        toApiUrl(`/api/v1/views/today/top3/${itemId}`),
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to toggle today item");
      }

      return res.json();
    },

    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["today"] });
    },
  });
}
