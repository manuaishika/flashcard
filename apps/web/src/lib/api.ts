import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";

export type ApiContext = { supabase: SupabaseClient; user: User };

/**
 * Resolve the caller for a route handler. Accepts either the session cookie
 * (web app) or `Authorization: Bearer <access_token>` (the extension).
 * Returns a 401 Response when there is no valid user.
 */
export async function requireUser(req: Request): Promise<ApiContext | NextResponse> {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        cookies: { getAll: () => [], setAll: () => {} },
      },
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return unauthorized();
    return { supabase, user: data.user };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return unauthorized();
  return { supabase, user: data.user };
}

export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function isResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}

// Permissive CORS for the extension origin (chrome-extension://...).
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type",
};

export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
