-- Structural guarantees:
--   * every auth user gets a profiles row
--   * every word gets exactly one srs_cards row, created in the same txn as the word
--     (this is why the app never has to mint card ids -- no drift possible)

-- profile on signup ----------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- srs card on word insert -------------------------------------------
create or replace function public.handle_new_word()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.srs_cards (word_id, user_id, due_at)
  values (new.id, new.user_id, now())
  on conflict (word_id) do nothing;
  return new;
end;
$$;

create trigger on_word_created
  after insert on public.words
  for each row execute function public.handle_new_word();

-- one-shot review RPC: advance the card + write the log atomically -----
create or replace function public.apply_review(
  p_card_id       uuid,
  p_grade         smallint,
  p_ease_factor   real,
  p_interval_days integer,
  p_repetitions   integer,
  p_due_at        timestamptz
)
returns public.srs_cards
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_card public.srs_cards;
begin
  select * into v_card from public.srs_cards where id = p_card_id for update;
  if not found then
    raise exception 'card % not found', p_card_id;
  end if;

  insert into public.review_logs
    (card_id, user_id, grade, prev_interval, new_interval, prev_ease, new_ease)
  values
    (v_card.id, v_card.user_id, p_grade, v_card.interval_days, p_interval_days,
     v_card.ease_factor, p_ease_factor);

  update public.srs_cards
     set ease_factor      = p_ease_factor,
         interval_days    = p_interval_days,
         repetitions      = p_repetitions,
         due_at           = p_due_at,
         last_reviewed_at = now()
   where id = p_card_id
   returning * into v_card;

  return v_card;
end;
$$;
