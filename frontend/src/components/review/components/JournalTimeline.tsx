import type { JournalEntry } from "../../../hooks/useJournal";
import { JournalEntryCard } from "./JournalEntryCard";

export function JournalTimeline({
  entries,
  onEdit,
  onDelete,
  isBusy,
}: {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  isBusy?: boolean;
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          isBusy={isBusy}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry.id)}
        />
      ))}
    </div>
  );
}
