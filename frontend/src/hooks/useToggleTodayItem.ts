import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchJSON } from "../lib/api";
import type { TodayView } from "./useTodayView";

type Kind = "outcomes" | "actions";

export function useToggleTodayItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { kind: Kind; id: string; done: boolean }) => {
      return patchJSON(`/api/v1/views/today/${args.kind}/${args.id}`, {
        done: args.done,
      });
    },

    onMutate: async ({ kind, id, done }) => {
      await qc.cancelQueries({ queryKey: ["todayView"] });

      const prev = qc.getQueryData<TodayView>(["todayView"]);

      if (prev) {
        qc.setQueryData<TodayView>(["todayView"], {
          ...prev,
          [kind]: prev[kind].map((it) => (it.id === id ? { ...it, done } : it)),
        });
      }

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["todayView"], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["todayView"] });
    },
  });
}
