-- Row-level security: a user can only ever touch their own rows.

alter table public.profiles       enable row level security;
alter table public.words          enable row level security;
alter table public.srs_cards      enable row level security;
alter table public.review_logs    enable row level security;
alter table public.word_embeddings enable row level security;
alter table public.clusters       enable row level security;
alter table public.word_clusters  enable row level security;

-- profiles (keyed on id) --------------------------------------------
create policy "profiles: self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: self write"  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- helper: same policy shape for every user_id-scoped table
do $$
declare
  t text;
begin
  foreach t in array array[
    'words', 'srs_cards', 'review_logs', 'word_embeddings', 'clusters'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      t || '_self_select', t);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      t || '_self_insert', t);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_self_update', t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      t || '_self_delete', t);
  end loop;
end $$;

-- word_clusters: authorize through the parent word
create policy "word_clusters: self select" on public.word_clusters for select
  using (exists (select 1 from public.words w where w.id = word_id and w.user_id = auth.uid()));
create policy "word_clusters: self insert" on public.word_clusters for insert
  with check (exists (select 1 from public.words w where w.id = word_id and w.user_id = auth.uid()));
create policy "word_clusters: self delete" on public.word_clusters for delete
  using (exists (select 1 from public.words w where w.id = word_id and w.user_id = auth.uid()));
