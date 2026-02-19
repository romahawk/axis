// frontend/src/stores/contextStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CapitalSnapshot, Domain, LaunchpadLink } from "../features/context/types";

interface ContextState {
  capitalSnapshot: CapitalSnapshot;
  domains: Domain[];
  launchpadLinks: LaunchpadLink[];
  quarterGoal: string;

  setCapitalSnapshot: (update: Partial<CapitalSnapshot>) => void;
  setDomain: (id: string, update: Partial<Omit<Domain, "id">>) => void;
  addDomain: (domain: Omit<Domain, "id">) => void;
  removeDomain: (id: string) => void;
  setLaunchpadLink: (id: string, update: Partial<Omit<LaunchpadLink, "id">>) => void;
  addLaunchpadLink: (link: Omit<LaunchpadLink, "id">) => void;
  removeLaunchpadLink: (id: string) => void;
  setQuarterGoal: (goal: string) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const useContextStore = create<ContextState>()(
  persist(
    (set) => ({
      capitalSnapshot: { pnl: "", riskRemaining: "", notes: "" },
      domains: [],
      launchpadLinks: [],
      quarterGoal: "",

      setCapitalSnapshot: (update) =>
        set((s) => ({
          capitalSnapshot: { ...s.capitalSnapshot, ...update },
        })),

      setDomain: (id, update) =>
        set((s) => ({
          domains: s.domains.map((d) => (d.id === id ? { ...d, ...update } : d)),
        })),

      addDomain: (domain) =>
        set((s) => {
          if (s.domains.length >= 3) return s;
          return { domains: [...s.domains, { ...domain, id: generateId() }] };
        }),

      removeDomain: (id) =>
        set((s) => ({
          domains: s.domains.filter((d) => d.id !== id),
        })),

      setLaunchpadLink: (id, update) =>
        set((s) => ({
          launchpadLinks: s.launchpadLinks.map((l) =>
            l.id === id ? { ...l, ...update } : l
          ),
        })),

      addLaunchpadLink: (link) =>
        set((s) => {
          if (s.launchpadLinks.length >= 8) return s;
          return {
            launchpadLinks: [...s.launchpadLinks, { ...link, id: generateId() }],
          };
        }),

      removeLaunchpadLink: (id) =>
        set((s) => ({
          launchpadLinks: s.launchpadLinks.filter((l) => l.id !== id),
        })),

      setQuarterGoal: (goal) => set({ quarterGoal: goal }),
    }),
    {
      name: "axis_context_v1",
    }
  )
);
