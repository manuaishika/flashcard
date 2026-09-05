import { NextResponse } from "next/server";
import type { ExplainInput } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";
import { explain } from "@/lib/explain";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  let body: ExplainInput;
  try {
    body = (await req.json()) as ExplainInput;
  } catch {
    return badRequest("invalid json");
  }
  if (!body.text || typeof body.text !== "string") return badRequest("text is required");

  const result = await explain({
    text: body.text.slice(0, 400),
    sentence: body.sentence?.slice(0, 1000) ?? null,
    page_title: body.page_title?.slice(0, 300) ?? null,
    source_url: body.source_url ?? null,
  });

  return NextResponse.json(result, { headers: CORS_HEADERS });
}
