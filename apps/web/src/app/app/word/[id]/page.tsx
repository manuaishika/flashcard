import Link from "next/link";
import { notFound } from "next/navigation";
import type { SrsCard, Word } from "@lemma/shared";
import { createClient } from "@/lib/supabase/server";
import { NoteEditor } from "@/components/NoteEditor";
import { DeleteWordButton } from "@/components/DeleteWordButton";

export const dynamic = "force-dynamic";

export default async function WordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: word } = await supabase.from("words").select("*").eq("id", id).single();
  if (!word) notFound();
  const w = word as Word;

  const { data: card } = await supabase
    .from("srs_cards")
    .select("*")
    .eq("word_id", id)
    .single<SrsCard>();

  return (
    <div>
      <Link href="/app" className="text-sm text-ink-soft underline underline-offset-4">
        ← Vault
      </Link>

      <h1 className="mt-5 font-serif text-4xl text-ink">{w.text}</h1>
      {w.sentence && (
        <p className="mt-3 text-sm text-ink-faint">
          &ldquo;…{w.sentence}…&rdquo;
          {w.source_url && (
            <>
              {" — "}
              <a href={w.source_url} target="_blank" rel="noreferrer" className="underline">
                {w.page_title || w.source_url}
              </a>
            </>
          )}
        </p>
      )}

      <NoteEditor word={w} />

      {w.explanation && (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-wide text-ink-faint">
            How it&rsquo;s used here
          </h2>
          <p className="explanation-scaffold mt-2">{w.explanation}</p>
        </section>
      )}

      {w.dictionary_definition && (
        <section className="mt-6">
          <h2 className="text-xs uppercase tracking-wide text-ink-faint">Dictionary</h2>
          <p className="mt-2 text-sm text-ink-faint">{w.dictionary_definition}</p>
        </section>
      )}

      <section className="mt-10 flex items-center justify-between border-t border-line pt-4 text-sm text-ink-faint">
        <span>
          {card
            ? `Review: ${card.repetitions} reps · ease ${card.ease_factor.toFixed(2)} · next ${new Date(
                card.due_at,
              ).toLocaleDateString()}`
            : "No review card"}
        </span>
        <DeleteWordButton id={w.id} />
      </section>
    </div>
  );
}
