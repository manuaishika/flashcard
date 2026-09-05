# Lemma

A personal semantic memory system for the words you meet while reading.

Capture a word in context → get a short explanation of how it's used *here* →
write what it means to you. **That note is the artifact.** Spaced review (SM-2)
brings it back before you forget it.

> Formerly the "Word Vault" browser extension. Same idea, now a full stack:
> a Chrome extension for capture, a web app for the vault + review, and a
> Supabase backend so it syncs across devices.

## Monorepo layout

```
apps/extension     Chrome MV3 extension (TypeScript, esbuild). Capture + save.
apps/web           Next.js 15 app router. Dashboard, review, and the API.
packages/shared    @lemma/shared — SM-2 algorithm, domain + API types, text helpers.
supabase/          Postgres schema, triggers, RLS (7 tables).
```

## Quick start

Prerequisites: Node 20+, pnpm 9+ (`npm i -g pnpm`), a Supabase project, an
Anthropic API key. Full walkthrough: [`docs/SETUP.md`](docs/SETUP.md).

```bash
pnpm install
cp .env.example .env            # fill in Supabase + Anthropic keys
pnpm --filter @lemma/shared build

# apply the database schema (Supabase CLI, or paste supabase/migrations/*.sql
# into the SQL editor in order)
pnpm supabase link --project-ref <ref>
pnpm db:push

pnpm web                        # http://localhost:3000
LEMMA_API_BASE=http://localhost:3000 pnpm --filter @lemma/extension build
# then load apps/extension/dist as an unpacked extension at chrome://extensions
```

## What works today (core loop)

- Right-click capture of a word + its sentence + page title + URL
- Context-aware explanation (Claude) with a dictionary fallback, shown recessively
- Save to Supabase; the vault lists everything, newest first
- Word detail page with an inline note editor
- SM-2 review: Again / Hard / Good / Easy, ease + interval compounding, logged

## Not built yet (schema is ready for it)

Re-encounter detection (underline saved words as you browse), semantic
clustering (embeddings + k-means + Claude-named clusters), daily digest email,
offline capture queue, Chrome Web Store packaging.

## Scripts

| Command | What |
|---|---|
| `pnpm dev` | turbo `dev` across packages |
| `pnpm web` | web app only, port 3000 |
| `pnpm build` | build everything |
| `pnpm test` | run tests (SM-2 suite) |
| `pnpm typecheck` | type-check everything |
| `pnpm db:push` / `pnpm db:reset` | apply / reset the Supabase schema |
