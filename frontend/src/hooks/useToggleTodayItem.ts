import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchJSON } from "../lib/api";

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
      return patchJSON<{ id: string; text: string; done: boolean }>(
        `/api/v1/today/top3/${args.id}`,
        { done: args.done }
      );
    },

    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["today"] });
    },
  });
}
