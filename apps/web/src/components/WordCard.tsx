import Link from "next/link";
import type { Word } from "@lemma/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * The note is the artifact: full contrast, accent border. The explanation is
 * scaffolding: small, muted, below. Dictionary gloss is tucked into a <details>.
 */
export function WordCard({ word, href }: { word: Word; href?: string }) {
  const title = (
    <span className="font-serif text-2xl text-ink">
      {word.text}
      {word.entry_type === "note" && (
        <span className="ml-2 align-middle text-xs uppercase tracking-wide text-ink-faint">note</span>
      )}
    </span>
  );

  return (
    <article className="border-b border-line py-6">
      <div className="flex items-baseline justify-between gap-4">
        {href ? (
          <Link href={href} className="hover:underline underline-offset-4">
            {title}
          </Link>
        ) : (
          title
        )}
        <time className="shrink-0 text-xs text-ink-faint">{formatDate(word.created_at)}</time>
      </div>

      {word.user_note ? (
        <p className="note-artifact mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">
          {word.user_note}
        </p>
      ) : (
        <p className="mt-4 text-sm italic text-ink-faint">No understanding written yet.</p>
      )}

      {word.explanation && (
        <p className="explanation-scaffold mt-4">{word.explanation}</p>
      )}

      {word.sentence && (
        <p className="mt-3 text-sm text-ink-faint">
          &ldquo;…{word.sentence}…&rdquo;
          {word.source_url && (
            <>
              {" "}
              <a
                href={word.source_url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {word.page_title || "source"}
              </a>
            </>
          )}
        </p>
      )}

      {word.dictionary_definition && (
        <details className="mt-3 text-sm text-ink-faint">
          <summary className="cursor-pointer select-none">Dictionary</summary>
          <p className="mt-1">{word.dictionary_definition}</p>
        </details>
      )}
    </article>
  );
}
