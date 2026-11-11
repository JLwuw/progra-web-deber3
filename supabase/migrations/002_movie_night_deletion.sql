-- Apply after 001_movie_nights.sql. This adds owner deletion without enabling edits.
begin;
grant delete on table public.movie_nights to authenticated;
create policy movie_nights_delete_own
  on public.movie_nights for delete to authenticated
  using ((select auth.uid()) = user_id);
commit;
