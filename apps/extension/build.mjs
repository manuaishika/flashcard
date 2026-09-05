import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "dist");
const watch = process.argv.includes("--watch");

// The web app / API origin the extension talks to.
const API_BASE = process.env.LEMMA_API_BASE || "http://localhost:3000";
// Public Supabase creds (same NEXT_PUBLIC_* values the web app uses) — used
// only to refresh an expired access token directly against Supabase.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Static assets
cpSync(resolve(here, "src/popup/popup.html"), resolve(out, "popup.html"));
for (const icon of ["icon16.png", "icon48.png", "icon128.png"]) {
  cpSync(resolve(here, "public", icon), resolve(out, icon));
}

// manifest.json with the API origin patched into externally_connectable + host_permissions
const manifest = JSON.parse(readFileSync(resolve(here, "manifest.json"), "utf8"));
const originPattern = new URL(API_BASE).origin + "/*";
manifest.externally_connectable = { matches: [originPattern] };
if (!manifest.host_permissions.includes(originPattern)) {
  manifest.host_permissions.push(originPattern);
}
writeFileSync(resolve(out, "manifest.json"), JSON.stringify(manifest, null, 2));

/** @type {esbuild.BuildOptions} */
const common = {
  bundle: true,
  format: "esm",
  target: "chrome116",
  sourcemap: watch ? "inline" : false,
  define: {
    "process.env.LEMMA_API_BASE": JSON.stringify(API_BASE),
    "process.env.LEMMA_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
    "process.env.LEMMA_SUPABASE_ANON_KEY": JSON.stringify(SUPABASE_ANON_KEY),
  },
  logLevel: "info",
};

const entries = {
  "background.js": "src/background.ts",
  "content.js": "src/content.ts",
  "popup.js": "src/popup/popup.ts",
};

const contexts = await Promise.all(
  Object.entries(entries).map(([outfile, entry]) =>
    esbuild.context({ ...common, entryPoints: [resolve(here, entry)], outfile: resolve(out, outfile) }),
  ),
);

if (watch) {
  await Promise.all(contexts.map((c) => c.watch()));
  console.log(`[lemma] watching — API base ${API_BASE}`);
} else {
  await Promise.all(
    contexts.map(async (c) => {
      await c.rebuild();
      await c.dispose();
    }),
  );
  console.log(`[lemma] built dist/ — API base ${API_BASE}`);
}
