import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJSON } from "../lib/api";
import type { InboxItem, InboxView } from "./useInboxView";

type InboxCreate = {
  text: string;
  source?: "manual" | "import";
  link?: { url: string; title?: string };
};

export function useCreateInboxItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: InboxCreate) =>
      postJSON<InboxItem>("/api/v1/views/inbox", payload),

    onSuccess: (created) => {
      qc.setQueryData<InboxView>(["inboxView"], (prev) => {
        const items = prev?.items ?? [];
        return { items: [created, ...items] };
      });
    },
  });
}
