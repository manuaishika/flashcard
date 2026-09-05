import Link from "next/link";
import type { Word } from "@lemma/shared";
import { createClient } from "@/lib/supabase/server";
import { WordCard } from "@/components/WordCard";

export const dynamic = "force-dynamic";

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const term = q?.trim().replace(/[,()\\*]/g, " ").trim();
  let query = supabase.from("words").select("*").order("created_at", { ascending: false }).limit(100);
  if (term) {
    query = query.or(`text.ilike.%${term}%,user_note.ilike.%${term}%,explanation.ilike.%${term}%`);
  }
  const { data: words } = await query;

  const { count: dueCount } = await supabase
    .from("srs_cards")
    .select("id", { count: "exact", head: true })
    .lte("due_at", new Date().toISOString());

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl text-ink">Vault</h1>
        {dueCount ? (
          <Link href="/app/review" className="text-sm text-accent underline underline-offset-4">
            {dueCount} due for review
          </Link>
        ) : null}
      </div>

      <form className="mt-6">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search words and notes…"
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </form>

      <div className="mt-4">
        {!words || words.length === 0 ? (
          <p className="mt-10 text-sm text-ink-faint">
            {q
              ? "Nothing matches that search."
              : "Nothing saved yet. Install the extension, then select a word while reading and right-click to save it."}
          </p>
        ) : (
          (words as Word[]).map((word) => (
            <WordCard key={word.id} word={word} href={`/app/word/${word.id}`} />
          ))
        )}
      </div>
    </div>
  );
}
