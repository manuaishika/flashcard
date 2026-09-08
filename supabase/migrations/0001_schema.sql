-- Lemma core schema: 7 tables.
-- Philosophy note: `words.explanation` is disposable scaffolding;
-- `words.user_note` is the artifact.

create extension if not exists vector with schema extensions;

-- 1. profiles -------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- 2. words --------------------------------------------------------------
create table public.words (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  text                  text not null,
  entry_type            text not null default 'term' check (entry_type in ('term', 'note')),
  sentence              text,
  page_title            text,
  source_url            text,
  explanation           text,
  dictionary_definition text,
  user_note             text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index words_user_created_idx on public.words (user_id, created_at desc);
create index words_user_lower_text_idx on public.words (user_id, lower(text));

-- 3. srs_cards --------------------------------------------------------
create table public.srs_cards (
  id               uuid primary key default gen_random_uuid(),
  word_id          uuid not null unique references public.words (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  ease_factor      real not null default 2.5,
  interval_days    integer not null default 0,
  repetitions      integer not null default 0,
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz
);
create index srs_cards_due_idx on public.srs_cards (user_id, due_at);

-- 4. review_logs ---------------------------------------------------
create table public.review_logs (
  id            uuid primary key default gen_random_uuid(),
  card_id       uuid not null references public.srs_cards (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  grade         smallint not null check (grade between 0 and 3),
  prev_interval integer not null,
  new_interval  integer not null,
  prev_ease     real not null,
  new_ease      real not null,
  reviewed_at   timestamptz not null default now()
);
create index review_logs_card_idx on public.review_logs (card_id, reviewed_at desc);

-- 5. word_embeddings (populated in a later pass) ------------------
create table public.word_embeddings (
  word_id    uuid primary key references public.words (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  embedding  extensions.vector(1536) not null,
  model      text not null,
  created_at timestamptz not null default now()
);

-- 6. clusters (later pass) -------------------------------------
create table public.clusters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  centroid   extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. word_clusters (later pass) ------------------------------
create table public.word_clusters (
  word_id    uuid not null references public.words (id) on delete cascade,
  cluster_id uuid not null references public.clusters (id) on delete cascade,
  distance   real,
  primary key (word_id, cluster_id)
);

-- keep words.updated_at honest
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger words_touch_updated_at
  before update on public.words
  for each row execute function public.touch_updated_at();
