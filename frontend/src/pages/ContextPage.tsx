import { ExecutionStatusCard } from "../features/context/panels/ExecutionStatusCard";
import { DomainHealthCard } from "../features/context/panels/DomainHealthCard";
import { CapitalSnapshotCard } from "../features/context/panels/CapitalSnapshotCard";
import { StrategicHorizonCard } from "../features/context/panels/StrategicHorizonCard";

export default function ContextPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <div className="text-xs text-slate-400">CONTEXT</div>
        <div className="text-xl font-semibold text-slate-100">
          Command Center
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Signal-based overview across all active fronts. Manual inputs persist
          locally.
        </div>
      </div>

      <ExecutionStatusCard />
      <DomainHealthCard />
      <CapitalSnapshotCard />
      <StrategicHorizonCard />
    </div>
  );
}
