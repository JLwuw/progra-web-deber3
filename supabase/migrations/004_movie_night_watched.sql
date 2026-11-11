-- Completion is an owner-authorized, atomic, one-way operation.
begin;
alter table public.movie_nights add column watched_at timestamptz;
create function public.reject_precompleted_movie_night() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.watched_at is not null then raise exception 'Save a planned session before marking it watched.' using errcode = '23514'; end if;
  return new;
end $$;
create trigger movie_nights_planned_insert before insert on public.movie_nights
for each row execute function public.reject_precompleted_movie_night();

create function public.mark_movie_night_watched(p_night_id uuid)
returns public.movie_nights language plpgsql security definer set search_path = '' as $$
declare
  current_owner uuid := auth.uid();
  night public.movie_nights;
begin
  if current_owner is null then raise exception 'Sign in to continue.' using errcode = '42501'; end if;
  select * into night from public.movie_nights
    where id = p_night_id and user_id = current_owner for update;
  if not found then raise exception 'Session not found or inaccessible.' using errcode = '42501'; end if;
  if night.watched_at is not null then return night; end if;
  update public.my_listing set watch_state = 'finished'
    where user_id = current_owner and media_type = 'movie'
      and tmdb_id in (select (value->>'tmdbId')::bigint from jsonb_array_elements(night.movies));
  update public.movie_nights set watched_at = now() where id = night.id returning * into night;
  return night;
end $$;
revoke all on function public.mark_movie_night_watched(uuid) from public, anon;
grant execute on function public.mark_movie_night_watched(uuid) to authenticated;
commit;
