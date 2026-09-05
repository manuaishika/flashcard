import { NextResponse } from "next/server";
import { CORS_HEADERS, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

// Semantic clustering (embeddings + k-means + Claude-named clusters) is a
// follow-up pass. These endpoints exist so the client contract is stable.

export async function GET(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from("clusters")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ clusters: [] }, { headers: CORS_HEADERS });
  return NextResponse.json({ clusters: data ?? [] }, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;
  return NextResponse.json(
    { error: "clustering not implemented yet", clusters: [] },
    { status: 501, headers: CORS_HEADERS },
  );
}
