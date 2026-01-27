// src/features/review/components/JournalTimeline.tsx
import type { JournalEntry } from "../../../hooks/useJournal";
import { JournalEntryCard } from "./JournalEntryCard";

export function JournalTimeline({
  entries,
  localEditedIds,
  onEdit,
  onDelete,
}: {
  entries: JournalEntry[];
  localEditedIds: Set<string>;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          isLocallyEdited={localEditedIds.has(entry.id)}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry.id)}
        />
      ))}
    </div>
  );
}
