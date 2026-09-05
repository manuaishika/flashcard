import type { DueCard, SrsCard, Word } from "@lemma/shared";
import { createClient } from "@/lib/supabase/server";
import { ReviewSession } from "@/components/ReviewSession";

export const dynamic = "force-dynamic";

type Row = SrsCard & { word: Word | null };

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("srs_cards")
    .select("*, word:words(*)")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(50);

  const due: DueCard[] = ((data ?? []) as Row[])
    .filter((row): row is Row & { word: Word } => row.word !== null)
    .map(({ word, ...card }) => ({ card, word }));

  return <ReviewSession initial={due} />;
}
