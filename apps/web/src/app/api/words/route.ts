import { NextResponse } from "next/server";
import { classifyEntryType, normalizeSelection, type CreateWordInput } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const cursor = url.searchParams.get("cursor");

  let query = ctx.supabase
    .from("words")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (q) query = query.or(`text.ilike.%${q}%,user_note.ilike.%${q}%,explanation.ilike.%${q}%`);
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) return badRequest(error.message);

  const nextCursor = data.length === PAGE_SIZE ? data[data.length - 1]!.created_at : null;
  return NextResponse.json({ words: data, nextCursor }, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  let body: CreateWordInput;
  try {
    body = (await req.json()) as CreateWordInput;
  } catch {
    return badRequest("invalid json");
  }

  const text = normalizeSelection(body.text ?? "");
  if (!text) return badRequest("text is required");

  const entry_type = body.entry_type ?? classifyEntryType(text);

  const { data, error } = await ctx.supabase
    .from("words")
    .insert({
      user_id: ctx.user.id,
      text,
      entry_type,
      sentence: body.sentence ?? null,
      page_title: body.page_title ?? null,
      source_url: body.source_url ?? null,
      explanation: body.explanation ?? null,
      dictionary_definition: body.dictionary_definition ?? null,
      user_note: body.user_note ?? null,
    })
    .select("*")
    .single();

  if (error) return badRequest(error.message);
  // The on_word_created trigger has already created the SRS card.
  return NextResponse.json({ word: data }, { status: 201, headers: CORS_HEADERS });
}
