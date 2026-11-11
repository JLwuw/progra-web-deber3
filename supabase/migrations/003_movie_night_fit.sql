-- Validate snapshots and their arithmetic even when clients bypass the planner.
begin;
create function public.movie_night_fits(movies jsonb, budget integer, pause integer, declared_total integer)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  movie jsonb;
  ids numeric[] := '{}';
  movie_id numeric;
  runtime numeric;
  total numeric := 0;
  count_movies integer := 0;
begin
  if movies is null or jsonb_typeof(movies) <> 'array' or budget is null
     or budget not between 30 and 600 or pause is distinct from 10 or declared_total is null then return false; end if;
  for movie in select value from jsonb_array_elements(movies) loop
    if jsonb_typeof(movie) <> 'object'
       or jsonb_typeof(movie->'tmdbId') is distinct from 'number'
       or jsonb_typeof(movie->'runtimeMinutes') is distinct from 'number'
       or jsonb_typeof(movie->'title') is distinct from 'string'
       or length(btrim(movie->>'title')) = 0
       or not (movie ? 'posterUrl')
       or jsonb_typeof(movie->'posterUrl') not in ('null', 'string') then return false; end if;
    movie_id := (movie->>'tmdbId')::numeric;
    runtime := (movie->>'runtimeMinutes')::numeric;
    if movie_id <= 0 or movie_id > 9007199254740991 or trunc(movie_id) <> movie_id
       or movie_id = any(ids) or runtime <= 0 or runtime > 9007199254740991 or trunc(runtime) <> runtime then return false; end if;
    ids := array_append(ids, movie_id);
    total := total + runtime;
    count_movies := count_movies + 1;
  end loop;
  total := total + pause * greatest(count_movies - 1, 0);
  return count_movies > 0 and total = declared_total and total <= budget;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end $$;
alter table public.movie_nights add constraint movie_nights_fit
  check (public.movie_night_fits(movies, available_minutes, pause_minutes, total_minutes));
commit;
