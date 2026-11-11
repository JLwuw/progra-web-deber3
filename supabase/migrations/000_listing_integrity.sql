-- Apply after schema.sql on fresh installs, or on the existing Project 3 schema.
-- This transaction intentionally stops instead of deleting legacy duplicate data.
begin;
lock table public.my_listing in share row exclusive mode;
do $$
begin
  if exists (
    select 1 from public.my_listing
    group by user_id, media_type, tmdb_id having count(*) > 1
  ) then
    raise exception 'Duplicate titles exist. Review them using supabase/README.md before retrying; no rows were deleted.';
  end if;
end $$;
create unique index if not exists my_listing_owner_title_unique
  on public.my_listing (user_id, media_type, tmdb_id);
create index if not exists my_listing_owner_id_idx
  on public.my_listing (user_id, id);
-- NOT VALID retains legacy rows for review while protecting new/updated rows.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_listing_title_nonempty' and conrelid = 'public.my_listing'::regclass) then
    alter table public.my_listing add constraint my_listing_title_nonempty
      check (length(btrim(title)) > 0) not valid;
  end if;
end $$;
commit;
