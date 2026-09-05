// esbuild's `define` replaces these `process.env.*` reads with string literals
// at build time — `process` never exists at runtime in the extension.
declare const process: {
  env: {
    LEMMA_API_BASE?: string;
    LEMMA_SUPABASE_URL?: string;
    LEMMA_SUPABASE_ANON_KEY?: string;
  };
};
