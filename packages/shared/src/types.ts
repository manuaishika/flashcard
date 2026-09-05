// Shared domain + API types for Lemma. Imported by @lemma/web and @lemma/extension.

export type EntryType = "term" | "note";

/**
 * Review grades, lowest-to-highest recall quality.
 * 0 Again — failed, 1 Hard, 2 Good, 3 Easy.
 */
export type Grade = 0 | 1 | 2 | 3;

export const GRADES: readonly Grade[] = [0, 1, 2, 3] as const;

export const GRADE_LABELS: Record<Grade, string> = {
  0: "Again",
  1: "Hard",
  2: "Good",
  3: "Easy",
};

export interface Word {
  id: string;
  user_id: string;
  text: string;
  entry_type: EntryType;
  sentence: string | null;
  page_title: string | null;
  source_url: string | null;
  /** Context-aware explanation from Claude. Recessive scaffolding, not the artifact. */
  explanation: string | null;
  /** Generic dictionary gloss, kept as a fallback reference. */
  dictionary_definition: string | null;
  /** The user's own understanding. This is the artifact. */
  user_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SrsCard {
  id: string;
  word_id: string;
  user_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at: string | null;
}

export interface ReviewLog {
  id: string;
  card_id: string;
  user_id: string;
  grade: Grade;
  prev_interval: number;
  new_interval: number;
  prev_ease: number;
  new_ease: number;
  reviewed_at: string;
}

/** A due card joined with its word, as returned by GET /api/review/due. */
export interface DueCard {
  card: SrsCard;
  word: Word;
}

// --- API payloads ---------------------------------------------------------

export interface CreateWordInput {
  text: string;
  entry_type: EntryType;
  sentence?: string | null;
  page_title?: string | null;
  source_url?: string | null;
  explanation?: string | null;
  dictionary_definition?: string | null;
  user_note?: string | null;
}

export interface UpdateWordInput {
  user_note?: string | null;
  entry_type?: EntryType;
  explanation?: string | null;
  dictionary_definition?: string | null;
}

export interface ExplainInput {
  text: string;
  sentence?: string | null;
  page_title?: string | null;
  source_url?: string | null;
}

export interface ExplainResult {
  explanation: string | null;
  dictionary_definition: string | null;
}

export interface ReviewInput {
  card_id: string;
  grade: Grade;
}

/** text -> minimal record, for the re-encounter lookup (built out in a later pass). */
export type VaultLookup = Record<string, { id: string; user_note: string | null }>;
