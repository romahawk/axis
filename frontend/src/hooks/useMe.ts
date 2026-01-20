// frontend/src/hooks/useMe.ts
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../config/api";

type Me = {
  id: string;
  name: string;
  role: string;
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        credentials: "include", // harmless even if you don't use cookies yet
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`GET /api/v1/auth/me failed: ${res.status} ${txt}`);
      }

      return (await res.json()) as Me;
    },
    staleTime: 60_000,
  });
}
