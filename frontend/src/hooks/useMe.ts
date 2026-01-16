import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "../lib/api";

export type Me = {
  id: string;
  name: string;
  role: string;
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetchJSON<Me>("/api/v1/auth/me"),
  });
}
