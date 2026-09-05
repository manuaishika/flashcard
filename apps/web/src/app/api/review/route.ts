import { NextResponse } from "next/server";
import { GRADES, review, type Grade, type ReviewInput } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  let body: ReviewInput;
  try {
    body = (await req.json()) as ReviewInput;
  } catch {
    return badRequest("invalid json");
  }
  if (!body.card_id) return badRequest("card_id is required");
  if (!GRADES.includes(body.grade as Grade)) return badRequest("grade must be 0-3");

  const { data: card, error: cardErr } = await ctx.supabase
    .from("srs_cards")
    .select("*")
    .eq("id", body.card_id)
    .single();
  if (cardErr || !card) {
    return NextResponse.json({ error: "card not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const outcome = review(
    {
      easeFactor: card.ease_factor,
      intervalDays: card.interval_days,
      repetitions: card.repetitions,
    },
    body.grade as Grade,
  );

  // apply_review advances the card and writes the review_log in one transaction.
  const { data: updated, error } = await ctx.supabase.rpc("apply_review", {
    p_card_id: body.card_id,
    p_grade: body.grade,
    p_ease_factor: outcome.easeFactor,
    p_interval_days: outcome.intervalDays,
    p_repetitions: outcome.repetitions,
    p_due_at: outcome.dueAt.toISOString(),
  });

  if (error) return badRequest(error.message);
  return NextResponse.json({ card: updated }, { headers: CORS_HEADERS });
}
