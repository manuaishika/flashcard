// Injected at build time by build.mjs via esbuild `define`.
export const API_BASE = process.env.LEMMA_API_BASE || "http://localhost:3000";
export const SUPABASE_URL = process.env.LEMMA_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.LEMMA_SUPABASE_ANON_KEY || "";
