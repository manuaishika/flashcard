import { NextResponse } from "next/server";
import type { UpdateWordInput } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;
  const { id } = await params;

  let body: UpdateWordInput;
  try {
    body = (await req.json()) as UpdateWordInput;
  } catch {
    return badRequest("invalid json");
  }

  const patch: Record<string, unknown> = {};
  for (const key of ["user_note", "entry_type", "explanation", "dictionary_definition"] as const) {
    if (key in body) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) return badRequest("no updatable fields");

  const { data, error } = await ctx.supabase
    .from("words")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return badRequest(error.message);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
  return NextResponse.json({ word: data }, { headers: CORS_HEADERS });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;
  const { id } = await params;

  const { error } = await ctx.supabase.from("words").delete().eq("id", id);
  if (error) return badRequest(error.message);
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
