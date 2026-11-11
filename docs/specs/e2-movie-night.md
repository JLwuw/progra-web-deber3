# E2 — Movie Night epic specification

Status: implemented locally against this contract; the new migration and live acceptance checks remain pending. Sources: [PRD](../prd/mi-cartelera-personal.md), [stories](../backlog/e2-stories.md), [refinement](../backlog/e2-refinement.md), [tickets](../backlog/e2-tickets.md). Interface contract: [e2-interface.md](e2-interface.md). All paths beginning src/ are relative to mi-cartelera-personal/; supabase/ and docs/ paths are relative to the repository root.

## Boundaries and normative criteria

MUST means required; MUST NOT means prohibited. Existing E1 behavior remains the regression baseline, with known defects recorded separately.

- **E2-AC01:** navigation and content MUST require authentication; MUST NOT expose a prior user's draft or sessions.
- **E2-AC02:** available time MUST be an integer in the inclusive interval 30–600; MUST NOT accept blanks, coercible nonsense, fractions, or out-of-range input.
- **E2-AC03:** candidates MUST be distinct movies owned by the current user in plan_to_watch; MUST NOT include TV or another user's entries.
- **E2-AC04:** initial fitting results MUST include movies with runtime at most the full budget and sort by runtime, title, then catalog identity; MUST NOT offer an individually oversized movie as addable.
- **E2-AC05:** absent/nonpositive/noninteger runtime MUST appear with a reason; MUST NOT be addable or treated as zero minutes.
- **E2-AC06:** loading and retrieval failure MUST be distinguishable, retryable, and independent per result where possible; MUST NOT discard successful results because another request fails.
- **E2-AC07:** empty pending collection and no fitting known movies MUST have distinct explanations; MUST NOT hide unknown-runtime explanations.
- **E2-AC08:** empty selection MUST total zero; one movie MUST have no break.
- **E2-AC09:** n movies MUST have max(n−1, 0) ten-minute breaks; exact fit MUST be valid.
- **E2-AC10:** add checks MUST include the next required break; MUST NOT change the draft on rejection.
- **E2-AC11:** removing a movie MUST preserve remaining order and recalculate totals and breaks.
- **E2-AC12:** one movie identity MUST NOT occur twice within a session.
- **E2-AC13:** an invalid or reduced budget MUST preserve the visible draft and allow removal; MUST NOT allow additions/saving while invalid or over budget.
- **E2-AC14:** saving MUST require at least one movie and a trimmed name of 1–80 characters; MUST NOT save an empty plan.
- **E2-AC15:** saving MUST persist one complete ordered snapshot and display its detail; MUST NOT update E1 viewing state.
- **E2-AC16:** pending saves MUST prevent concurrent submission; failures MUST preserve the draft; MUST NOT expose partial sessions or create another session when retrying the same unchanged draft after an ambiguous response.
- **E2-AC17:** before insertion, services MUST refresh collection eligibility and selected runtimes; changed or unavailable data MUST require review; MUST NOT silently change and save the selection.
- **E2-AC18:** the same eligible movie MUST be permitted in separate sessions.
- **E2-AC19:** saved sessions MUST show name, saved timestamp, total and newest-first ordering with a stable id tie-break; empty history MUST be explicit.
- **E2-AC20:** details MUST use saved order and snapshots, including budget/total/remaining; MUST NOT require TMDB or offer saved-content editing/scheduled viewing dates; owner deletion follows E2-AC23.
- **E2-AC21:** database RLS and privileges MUST isolate sessions; MUST NOT grant cross-account or anonymous reads/writes.
- **E2-AC22:** reload/logout/account change MUST discard draft state and restore only the signed-in owner's saved data; MUST NOT break E1 workflows.

## Domain contracts — src/dominio/movieNight.ts

E1 repair prerequisite: [e1-repairs.md](e1-repairs.md) provides the repaired camelCase Media model, auth subscription service, catalog service, and Vitest runner. Reuse these rather than repeating completed cleanup.

Domain code MUST be pure, typed without any, deterministic, and free of network, storage, React, dates generated internally, or Supabase imports.

- `validateAvailableMinutes(raw)` returns a discriminated valid integer result or a validation reason. Check empty/text input before numeric conversion.
- `normalizeRuntime(value: unknown)` returns a positive integer runtime or an unavailable reason. Do not trust an asserted external response type.
- `calculateSession(availableMinutes, durations, pauseMinutes)` receives the budget, an ordered list of known-or-missing durations, and the pause as arguments. It returns validity, movie minutes, break minutes, total minutes, remaining minutes, and fits. Invalid input returns an explicit reason; missing duration never becomes zero. Available time uses the client range; pause must be a nonnegative integer. Production callers supply 10.
- For valid values: movie minutes is the sum of durations; break minutes is pauseMinutes × max(movie count − 1, 0); total is their sum; remaining is available − total; fits is total ≤ available. An empty selection fits arithmetically but is not saveable. Negative remaining time is retained for explaining an over-budget draft.
- `canAddMovie(budget, selectedMovies, candidate, pauseMinutes)` rejects missing runtime, duplicate catalog identity, invalid budget, or excessive resulting total; otherwise returns the new calculation without mutating inputs.
- `getEligibleMovies(listings)` filters owned service-provided entries to movie/plan_to_watch and deduplicates by movie catalog identity. Services, not domain code, establish authenticated ownership. Duplicate source entries choose the smallest listing id as a deterministic representative.
- `sortCandidates(movies)` orders runtime-known entries by runtime ascending, English title comparison, and numeric catalog id; unknown/failed entries are a separate title/id ordered group. Use an explicit comparator, not request completion order.
- Session naming validation trims outer spaces and counts Unicode code points to align with database character limits; accept 1–80. Unknown movie metadata, empty selection, and invalid budget make save validation fail.

### Required unit examples

| Case | Inputs | Expected |
| --- | --- | --- |
| Exact fit | 200; [90, 100]; pause 10 | total 200, remaining 0, fits |
| One movie | 120; [90]; pause 10 | break 0, remaining 30 |
| Empty draft | 120; []; pause 10 | total 0, remaining 120, cannot save |
| Next break exceeds | 200; [90, 101]; pause 10 | total 201, remaining −1, cannot add second |
| Unknown duration | 120; [null]; pause 10 | invalid runtime; no invented total |
| Invalid runtime | 0, −1, 1.5, text, missing | unavailable runtime |
| Budget boundaries | 30 / 600 | accepted |
| Invalid budget | 29 / 601 / 30.5 / blank / text | validation failure |
| Removal | 300; [80, 90, 100] → [80, 100] | breaks 20 → 10; total 290 → 190 |
| Duplicate candidate | same catalog id already selected | rejected, input selection unchanged |

## Data model and persistence decision

Keep public.my_listing and its policies unchanged. Store each saved plan as one row in a new public.movie_nights table, with an ordered JSON snapshot array. This intentionally uses a single atomic insert instead of a multi-request parent/child save, preventing partially saved plans. This is a documented model choice, not an instruction to redesign E1.

Fields: id (client-generated UUID and retry identity), user_id (authenticated owner), name (trimmed), available_minutes, pause_minutes (always 10), total_minutes, movies (ordered snapshots), created_at (database timestamp).

Each snapshot has tmdbId (positive integer), title (nonempty string), posterUrl (string or null), and runtimeMinutes (positive integer). Movie type is implicit: E2 stores movies only. Snapshots deliberately have no foreign key to my_listing, so deleting a collection entry cannot delete historical plans. The array order is viewing order. TypeScript domain names are camelCase; services map them to snake_case database fields.

### Proposed migration and RLS

Implement in `supabase/migrations/001_movie_nights.sql` during E2-T02, after confirming the deployed schema. The matching SQL file now exists; it has not been applied by the agent. Use the existing bootstrap script only for a fresh E1 database. Run migrations once in order; do not pretend the bootstrap is an upgrade system.

```sql
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
```

The original 001 migration has no UPDATE/DELETE grants or policies. The user-requested deletion extension below adds owner-only DELETE in 002; UPDATE remains prohibited. Other users cannot overwrite a UUID owned by someone else; duplicate ids fail insertion. 001 exposes select/insert; after 002, authenticated owners may also delete their own sessions. Privileged administrative roles are not frontend credentials.

Required checks above enforce basic structure/ranges and owner isolation. This migration does **not** validate every nested snapshot, re-query catalog eligibility, or reproduce the total/fit function in SQL. Such database-level fit validation is explicitly optional in details2.md. Do not claim this design rejects an owner forging their own payload by bypassing the service; the mandatory domain/service path enforces those rules, and RLS prevents cross-user access independently.

Before application: inspect existing table names/permissions and test on an isolated database with two accounts. Verify anonymous denial, foreign-owner insert denial, foreign read invisibility, and update/delete denial. Rollback before real usage can drop the new table and index transactionally, without changing E1; after real usage, a destructive rollback requires a data-preservation plan. This document authorizes no production execution or data deletion.

## Types and services

- `src/types/MovieNight.ts`: draft, movie snapshot, saved session, candidate loading/ready/unknown/error states, validation result unions. Validate external and database payloads at service boundaries; nullable poster metadata stays explicit.
- `src/services/tmdbService.ts`: add runtime-only movie lookup, validate its payload, accept AbortSignal, distinguish failed response from missing runtime. Reuse the existing detail service where appropriate without changing E1 detail behavior. Move existing search networking/parsing here; components must not call TMDB directly.
- `src/services/authService.ts`: expose auth-change subscription and cleanup; App must not import the Supabase client. Reset account-scoped state when owner changes.
- `src/services/movieNightService.ts`: obtain current owner via auth service, load own eligible movies via listing service, orchestrate independent runtime requests and retries, build typed candidates, and expose saved create/list/detail methods. Use bounded concurrency and cleanup guards; an old user's result must not update the new user's screen.
- Before save, re-read current owner/collection and selected runtimes. If identity, eligibility, or runtime differs, return a review-required result instead of inserting. Retain/remap the draft visibly; do not silently replace totals. Re-run pure validation only after current values are reviewed. This is a best-effort service refresh, not an atomic lock on external TMDB or concurrent collection changes; strict transactional eligibility would require additional database validation.
- Creation inserts one full row with a UUID generated once per unchanged draft. A retry first queries that id through RLS; an existing matching saved payload is returned. A conflict is reread and compared, never overwritten. A rejected or missing insert preserves the draft. If a draft changes after an ambiguous save, resolve the old request outcome before issuing a new identity.
- Listing uses descending created_at/id order and bounded pages, with a load-more path. Detail loads by id under RLS and uses the saved payload alone. Derive remaining minutes from saved budget and total; keep unknown/deleted original posters readable with a fallback.
- No service may change my_listing when saving a night. No component imports Supabase, calls fetch, or constructs TMDB URLs. Environment configuration uses only the existing public client variables; no literal keys or service_role.

## Components and integration

Use `MovieNightScreen.tsx` for planning, `MovieNightSummary.tsx` for totals/selection, `SavedMovieNightsScreen.tsx` for history, and `MovieNightDetailScreen.tsx` for immutable detail. A `useMovieNight.ts` hook coordinates service calls, pending state, retries, cancellation, draft identity, and account cleanup. Components consume domain results rather than reimplement arithmetic.

Extend App's existing view state and Navbar with protected Movie Night/history navigation. Do not replace existing navigation or remove E1 screens. The interface spec references DESIGN.md for all visual decisions. No new UI library or global restyling is required.

## Criterion → verification

U = domain unit test, S = service/integration test, B = browser check, DB = actual database check. These are planned evidence locations, not passed results. Browser obtained results belong to the student in docs/VERIFICACION.md; all final statuses belong to docs/AUDITORIA.md.

| Criterion | Planned verification |
| --- | --- |
| E2-AC01 | B: signed-out navigation/direct attempts; DB: anonymous select/insert denied |
| E2-AC02 | U: blank/text/fraction/29/30/600/601; B: visible input feedback |
| E2-AC03 | U/S: owned eligible deduplication; B: mixed movie/TV/status list |
| E2-AC04 | U: 90/100/101 against 100, title/id ties; B: ordering |
| E2-AC05 | U/S: missing/zero/negative/fraction runtime; B: reason and blocked add |
| E2-AC06 | S: loading, per-item failure/retry, cancellation; B: partial success |
| E2-AC07 | B: empty collection, no fit, unknown-only collection |
| E2-AC08 | U: empty and single-film calculations; B: total/remaining |
| E2-AC09 | U: exact fit with pause; B: valid save at zero remaining |
| E2-AC10 | U: next-film break overflow; B: unchanged draft and reason |
| E2-AC11 | U: removal/order immutability; B: remove middle/last |
| E2-AC12 | U/S: duplicate catalog ids; B: repeated add |
| E2-AC13 | U/B: lower/invalid budget, retained selection and blocked save |
| E2-AC14 | U/B: empty selection; trimmed 0/1/80/81-character names |
| E2-AC15 | S/DB/B: atomic save, complete detail, unchanged E1 statuses |
| E2-AC16 | S: pending guard, rejection, timeout/idempotent retry; B: preserved draft |
| E2-AC17 | S/B: changed owner/status/deletion/runtime before save; review required |
| E2-AC18 | DB/B: same movie in two sessions succeeds |
| E2-AC19 | S/B: newest-first paging, stable ties, empty saved list |
| E2-AC20 | DB/B: delete/change original entry then open saved snapshot without TMDB |
| E2-AC21 | DB: accounts A/B plus anonymous, direct select/insert/update/delete probes |
| E2-AC22 | B/S: logout/reload/account switch; E1 login/search/add/edit/delete/details/filter/counters regression |
| DES-01–08 | B: design checklist from DESIGN.md plus source boundary/token review |

## Ticket → files

Paths below identify ticket ownership; existing E1 infrastructure was reused where the ticket checkpoint notes it. Add focused service/component tests only where they verify behavior; do not create tests that merely mirror markup.

| Ticket | Target files |
| --- | --- |
| E2-T01 | mi-cartelera-personal/package.json, package-lock.json, vite.config.ts; src/dominio/movieNight.ts, movieNight.test.ts; src/types/MovieNight.ts |
| E2-T02 | supabase/migrations/001_movie_nights.sql; src/services/movieNightService.ts and persistence tests; docs/VERIFICACION.md database evidence when executed |
| E2-T03 | src/services/tmdbService.ts, authService.ts, movieNightService.ts and focused service tests; src/components/SearchScreen.tsx; src/App.tsx |
| E2-T04 | src/hooks/useMovieNight.ts; src/components/MovieNightScreen.tsx, MovieNightSummary.tsx, Navbar.tsx; src/App.tsx; src/index.css only if a reusable pattern is missing |
| E2-T05 | src/components/SavedMovieNightsScreen.tsx, MovieNightDetailScreen.tsx; src/hooks/useMovieNight.ts; src/services/movieNightService.ts; src/App.tsx, Navbar.tsx |
| E2-T06 | docs/VERIFICACION.md, docs/AUDITORIA.md; evidence artifacts if collected; focused test corrections tied to observed defects |

## Delivery and limitations

Commit harness/baseline work separately, then PRD → backlog → specs/design before implementation tickets, then verification/audit. Do not claim the existing initial-state audit was produced in plan mode if it was not. No migration, tests, browser results, or security checks in this spec have been executed merely by writing it.


## Implementation notes

E2-T01–T05 now have local code and automated tests. E1 service cleanup/test infrastructure was reused. Source changes are recorded by the [implementation audit](../AUDITORIA.md); manual results belong in [verification](../VERIFICACION.md).

Source-refresh changes are presented before mutating the selected draft. “Accept updated draft” explicitly applies the new durations/removals, updates the matching candidate cards, and requires a second save. Unknown save outcomes lock manual name/budget/selection editing. Explicit source review keeps the same UUID; retry checks for an existing matching submitted attempt before current-payload validation or source refresh. The actual committed snapshot wins, including a late original or intermediate attempt. All transport exceptions or invalid responses after issuing an insert are treated as uncertain. Known database rejections preserve a normal editable draft.

History requests use bounded offset pages and advance by actual returned row count, allowing a lower server cap. An empty follow-up page ends loading; overlapping rows are deduplicated in the UI. This is not a transactional snapshot of concurrent activity in other tabs. Drafts live only while the planner is mounted; leaving the planner, reloading, or ending/changing the authenticated session discards them. No draft is placed in browser storage.


## Audit repair contract — E2-F01 and E2-F02

- Initial-load progress and completion MUST merge with newer per-movie retry/review results. Each full refresh establishes a generation; each individual retry has its own request owner. An older result MUST NOT overwrite a newer result within the same generation. Explicitly accepted removals MUST remain removed until a new full refresh.
- An uncertain save MUST pin its UUID until a saved outcome is recovered. Explicit source review may refresh durations or remove unavailable selections without releasing that identity; manual name/budget/movie edits remain locked. The service accepts the already-submitted snapshots for this identity as recovery evidence, and may recover whichever matching attempt actually committed. It MUST NOT overwrite a stored snapshot or accept a foreign/unrecognized identity/payload.
- Recovery lookup MUST remain available even if reviewed sources leave an empty or over-budget selection. A new write still requires full current validation. Missing rows alone do not justify creating a different UUID while an earlier write may still commit. Multiple candidate payloads under one pinned UUID remain protected by its unique constraint; if an earlier payload wins the race, show that actual saved snapshot.
- Candidate loading/review and save recovery require regressions covering overlapping batch progress, overlapping retries, late original insert completion, and unavailable selections. These are local fixes; the existing SQL migration is unchanged.


## User-requested deletion and pagination extension — E2-T07

E2-AC23 MUST permit owner-only deletion from saved detail after confirmation. Cancellation MUST NOT write. Pending deletion MUST prevent duplicate requests. The service MUST filter by owner/id, verify one returned deleted row, and report failure without hiding the plan. Success MUST return to newly loaded history. Collection entries, their notes/ratings and other nights MUST NOT be mutated. Contents of saved snapshots remain uneditable.

E2-AC24 MUST request an exact count for owner-filtered history, advance offsets by returned row count, and use that count to determine whether more results exist. If count metadata is unavailable, preserve the conservative empty-page fallback. The footer MUST remain visible through loading, error/retry and completion, retaining existing results. Completion shows disabled “All sessions loaded”.

Implement deleteSavedMovieNight in services/movieNightService.ts and the action in MovieNightDetailScreen.tsx; update history pagination in the service and SavedMovieNightsScreen.tsx. Use DESIGN.md’s existing destructive buttons and feedback. Tests MUST cover confirmed/cancelled/pending/failed deletion, zero affected rows, owner scoping and pagination loading/completion/retry/server caps.

Additive migration supabase/migrations/002_movie_night_deletion.sql (apply after 001, even if 001 was applied already):

```sql
begin;
grant delete on table public.movie_nights to authenticated;
create policy movie_nights_delete_own
  on public.movie_nights for delete to authenticated
  using ((select auth.uid()) = user_id);
commit;
```

| Criterion | Verification |
| --- | --- |
| E2-AC23 | Service/UI regression tests plus live A/B and anonymous deletion probes; verify E1 collection unchanged |
| E2-AC24 | Service exact-count/capped-page cases and UI loading/completion/retry tests |

| Ticket | Files |
| --- | --- |
| E2-T07 | supabase/migrations/002_movie_night_deletion.sql; src/services/movieNightService.ts and tests; src/components/MovieNightDetailScreen.tsx, SavedMovieNightsScreen.tsx and UI tests; related product/verification docs |
