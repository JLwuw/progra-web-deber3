
begin;

do $$ begin
CREATE TYPE public.media_type AS ENUM (
    'movie',
    'tv'
);
exception when duplicate_object then null; end $$;

do $$ begin
CREATE TYPE public.watch_state AS ENUM (
    'plan_to_watch',
    'watching',
    'finished'
);
exception when duplicate_object then null; end $$;

create table if not exists public.my_listing (
    id serial primary key,
    user_id uuid not null references auth.users(id),
    tmdb_id bigint not null,
    title text not null,
    poster_url text not null,
    media_type public.media_type not null,
    watch_state public.watch_state not null,
    user_grade int check (user_grade between 1 and 5),
    comment text,
    created_at timestamptz default now()
);


alter table public.my_listing enable row level security;

drop policy if exists "User only read their own lists" on public.my_listing;
create policy "User only read their own lists"
on public.my_listing
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "User only create listings for themselves" on public.my_listing;
create policy "User only create listings for themselves"
on public.my_listing
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can only edit their own listings" on public.my_listing;
create policy "Users can only edit their own listings"
on public.my_listing
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can only remove their own listings" on public.my_listing;
create policy "Users can only remove their own listings"
on public.my_listing
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists my_listing_owner_id_idx on public.my_listing (user_id, id);

commit;
