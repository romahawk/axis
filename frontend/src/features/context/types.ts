// frontend/src/features/context/types.ts

export type DomainStatus = "green" | "yellow" | "red";

export interface CapitalSnapshot {
  pnl: string;
  riskRemaining: string;
  notes: string;
}

export interface Domain {
  id: string;
  name: string;
  status: DomainStatus;
  nextStep: string;
}

export interface LaunchpadLink {
  id: string;
  label: string;
  url: string;
}

export type SignalHealth = "green" | "yellow" | "red";

export interface ExecutionSignals {
  outcomesHealth: SignalHealth;
  outcomesFilled: number;
  outcomesTotal: number;
  todayHealth: SignalHealth;
  todayDone: number;
  todayTotal: number;
  blockersCount: number;
  blockersHealth: SignalHealth;
  activeProjectsCount: number;
  overallStatus: SignalHealth;
}
