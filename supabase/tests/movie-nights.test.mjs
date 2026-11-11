import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Standalone disposable cluster. Never reads project environment or contacts Supabase.
test("movie-night database invariants and atomic owner-only completion", () => {
  const dir = mkdtempSync(join(tmpdir(), "movie-night-db-"));
  const data = join(dir, "data");
  let started = false;
  const run = (command, args) =>
    execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  const sql = (text) =>
    run("psql", [
      "-X",
      "-q",
      "-A",
      "-t",
      "-v",
      "ON_ERROR_STOP=1",
      "-h",
      dir,
      "-p",
      "55439",
      "-U",
      "test_admin",
      "-d",
      "postgres",
      "-c",
      text,
    ]).trim();
  const file = (name) =>
    readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
  const owner = "11111111-1111-1111-1111-111111111111";
  const other = "22222222-2222-2222-2222-222222222222";
  const night = "33333333-3333-3333-3333-333333333333";
  const movie = (id, minutes) => ({
    tmdbId: id,
    title: `Movie ${id}`,
    posterUrl: null,
    runtimeMinutes: minutes,
  });
  const auth = (query, id = owner) =>
    sql(`set role authenticated; set request.jwt.claim.sub='${id}'; ${query}`);
  const insert = (movies, total = 100, budget = 100, extra = "") =>
    `insert into public.movie_nights(id,user_id,name,available_minutes,total_minutes,movies${extra ? ",watched_at" : ""}) values ('${night}','${owner}','Night',${budget},${total},'${JSON.stringify(movies)}'${extra ? `,${extra}` : ""})`;
  try {
    run("initdb", [
      "-D",
      data,
      "-U",
      "test_admin",
      "--auth=trust",
      "--no-locale",
    ]);
    try {
      run("pg_ctl", [
        "-D",
        data,
        "-l",
        join(dir, "log"),
        "-o",
        `-F -h '' -k ${dir} -p 55439`,
        "-w",
        "start",
      ]);
      started = true;
    } catch (error) {
      throw new Error(readFileSync(join(dir, "log"), "utf8"), { cause: error });
    }
    sql(
      `create role authenticated; create role anon; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon; insert into auth.users values ('${owner}'),('${other}');`,
    );
    sql(file("schema.sql"));
    for (const name of [
      "000_listing_integrity.sql",
      "001_movie_nights.sql",
      "002_movie_night_deletion.sql",
    ])
      sql(file(`migrations/${name}`));
    // Invalid legacy data makes the constraint migration fail without deleting rows.
    auth(insert([movie(1, 110)]));
    assert.throws(() => sql(file("migrations/003_movie_night_fit.sql")));
    assert.equal(sql("select count(*) from public.movie_nights"), "1");
    sql("delete from public.movie_nights");
    sql(file("migrations/003_movie_night_fit.sql"));
    sql(file("migrations/004_movie_night_watched.sql"));
    for (const [movies, total, budget] of [
      [[], 100, 100],
      [[movie(1, 110)], 100, 100],
      [[movie(1, 50), movie(1, 40)], 100, 100],
      [[movie(1, 90)], 100, 100],
      [[movie(1, 50.5)], 50, 100],
      [[movie(1, null)], 100, 100],
      [[movie(1, 50), movie(2, 50)], 110, 100],
    ]) {
      assert.throws(() => auth(insert(movies, total, budget)));
    }
    assert.throws(() => auth(insert([movie(1, 100)], 100, 100, "now()")));
    for (const invalid of [
      movie(0, 100),
      movie(1, "100"),
      { ...movie(1, 100), title: " " },
      { ...movie(1, 100), posterUrl: 42 },
    ]) {
      assert.throws(() => auth(insert([invalid])));
    }
    auth(insert([movie(1, 100)])); // single-film exact fit
    assert.throws(() =>
      sql("update public.movie_nights set available_minutes=90"),
    );
    auth(`delete from public.movie_nights where id='${night}'`);
    auth(insert([movie(1, 40), movie(2, 50)])); // multi-film exact fit with break
    assert.throws(() =>
      auth(`update public.movie_nights set name='Bypass' where id='${night}'`),
    );
    assert.throws(() =>
      auth(`select public.mark_movie_night_watched('${night}')`, other),
    );
    assert.throws(() =>
      sql(`set role anon; select public.mark_movie_night_watched('${night}')`),
    );
    assert.throws(() =>
      auth(`select public.mark_movie_night_watched('${night}')`, ""),
    );
    sql(
      `insert into public.my_listing(user_id,tmdb_id,title,poster_url,media_type,watch_state,user_grade,comment) values ('${owner}',1,'Own','','movie','watching',4,'Keep'),('${owner}',1,'TV','','tv','plan_to_watch',null,null),('${other}',1,'Foreign','','movie','plan_to_watch',null,null);`,
    );
    // Failure after E1 writes rolls back both tables.
    sql(
      `create function public.test_fail_completion() returns trigger language plpgsql as $$ begin raise exception 'Injected failure'; end $$; create trigger test_failure before update on public.movie_nights for each row execute function public.test_fail_completion();`,
    );
    assert.throws(() =>
      auth(`select public.mark_movie_night_watched('${night}')`),
    );
    assert.equal(
      sql(
        `select watch_state from public.my_listing where user_id='${owner}' and media_type='movie'`,
      ),
      "watching",
    );
    assert.equal(
      sql(`select watched_at is null from public.movie_nights`),
      "t",
    );
    sql("drop trigger test_failure on public.movie_nights");
    auth(`select public.mark_movie_night_watched('${night}')`);
    assert.equal(
      sql(
        `select watch_state || ':' || user_grade || ':' || comment from public.my_listing where user_id='${owner}' and media_type='movie'`,
      ),
      "finished:4:Keep",
    );
    assert.equal(
      sql(
        `select count(*) from public.my_listing where watch_state='plan_to_watch'`,
      ),
      "2",
    );
    assert.equal(
      sql("select watched_at is not null from public.movie_nights"),
      "t",
    );
    assert.equal(sql("select count(*) from public.my_listing"), "3"); // missing movie was not recreated
    const timestamp = sql("select watched_at from public.movie_nights");
    sql(
      `update public.my_listing set watch_state='plan_to_watch' where user_id='${owner}' and media_type='movie'`,
    );
    auth(`select public.mark_movie_night_watched('${night}')`);
    assert.equal(sql("select watched_at from public.movie_nights"), timestamp);
    assert.equal(
      sql(
        `select watch_state from public.my_listing where user_id='${owner}' and media_type='movie'`,
      ),
      "plan_to_watch",
    );
  } finally {
    if (started) run("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
    rmSync(dir, { recursive: true, force: true });
  }
});
