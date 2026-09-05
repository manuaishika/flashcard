import Anthropic from "@anthropic-ai/sdk";
import type { ExplainInput, ExplainResult } from "@lemma/shared";

// Cost-effective default; override with LEMMA_EXPLAIN_MODEL.
const MODEL = process.env.LEMMA_EXPLAIN_MODEL || "claude-haiku-4-5";

const anthropic = new Anthropic();

/**
 * A context-aware explanation: what the word means *as used in this passage /
 * domain*, not a generic dictionary gloss. Recessive scaffolding — the user's
 * own note is the artifact — so keep it to ~2 sentences.
 */
async function claudeExplanation(input: ExplainInput): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const context = [
    input.sentence && `Sentence: "${input.sentence}"`,
    input.page_title && `Page: ${input.page_title}`,
    input.source_url && `URL: ${input.source_url}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 220,
      system:
        "You explain a word or phrase as it is used in a specific passage. " +
        "Give the sense that fits this context and domain, not a general dictionary definition. " +
        "Two sentences maximum. Plain, direct language. No preamble, no quotes around the word.",
      messages: [
        {
          role: "user",
          content: `Word or phrase: ${input.text}\n${context || "(no surrounding context provided)"}`,
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    console.error("claudeExplanation failed:", err);
    return null;
  }
}

/** Generic dictionary gloss, kept only as a fallback reference. */
async function dictionaryDefinition(text: string): Promise<string | null> {
  const head = text.trim().split(/\s+/)[0];
  if (!head || head.length < 2) return null;
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(head)}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      meanings?: Array<{ definitions?: Array<{ definition?: string }> }>;
    }>;
    return data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? null;
  } catch {
    return null;
  }
}

export async function explain(input: ExplainInput): Promise<ExplainResult> {
  const [explanation, dictionary_definition] = await Promise.all([
    claudeExplanation(input),
    dictionaryDefinition(input.text),
  ]);
  return { explanation, dictionary_definition };
}
