import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteJSON } from "../lib/api";
import type { InboxView } from "./useInboxView";

export function useDeleteInboxItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJSON<{ ok: boolean; deleted: string }>(`/api/v1/views/inbox/${id}`),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["inboxView"] });
      const prev = qc.getQueryData<InboxView>(["inboxView"]);

      if (prev) {
        qc.setQueryData<InboxView>(["inboxView"], {
          items: prev.items.filter((it) => it.id !== id),
        });
      }

      return { prev };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["inboxView"], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["inboxView"] });
    },
  });
}
