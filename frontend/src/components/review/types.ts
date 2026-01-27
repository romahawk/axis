// src/features/review/types.ts
import type { JournalEntry } from "../../hooks/useJournal";

export type ReviewTab = "daily" | "weekly" | "journal";

export type WeeklyOutcomeDraft = { id: string; achieved: boolean; note: string };

export type LocalEditsMap = Record<string, Partial<JournalEntry>>;
