-- E2-T02: apply after 000_listing_integrity.sql. Existing E1 tables/policies are unchanged.
begin;

create table public.movie_nights (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null check (
    name = btrim(name) and char_length(name) between 1 and 80
  ),
  available_minutes integer not null check (available_minutes between 30 and 600),
  pause_minutes integer not null default 10 check (pause_minutes = 10),
  total_minutes integer not null check (total_minutes > 0),
  movies jsonb not null check (
    jsonb_typeof(movies) = 'array' and jsonb_array_length(movies) > 0
  ),
  created_at timestamptz not null default now()
);

create index movie_nights_owner_created_idx
  on public.movie_nights (user_id, created_at desc, id desc);

alter table public.movie_nights enable row level security;

revoke all on table public.movie_nights from anon, authenticated;
grant select, insert on table public.movie_nights to authenticated;

create policy movie_nights_select_own
  on public.movie_nights for select to authenticated
  using ((select auth.uid()) = user_id);

create policy movie_nights_insert_own
  on public.movie_nights for insert to authenticated
  with check ((select auth.uid()) = user_id);

commit;
