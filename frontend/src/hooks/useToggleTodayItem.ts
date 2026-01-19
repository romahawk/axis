import { useMutation, useQueryClient } from "@tanstack/react-query";

type TogglePayload = {
  kind: "outcomes" | "actions";
  id: string;
  done: boolean;
};

type TodayItem = {
  id: string;
  text: string;
  done?: boolean;
};

export function useToggleTodayItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ kind, id, done }: TogglePayload): Promise<TodayItem> => {
      const res = await fetch(`/api/v1/views/today/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Toggle failed: ${res.status} ${txt}`);
      }

      return res.json();
    },
    onSuccess: async () => {
      // Dashboard reads Today Top 3 → refresh it
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
