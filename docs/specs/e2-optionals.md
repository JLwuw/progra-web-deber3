# E2 — Selected optional features specification

Read the PRD optional decisions, E2-US6–US9, E2-AC25–30, E2-T08–T11 and DESIGN.md. These documents precede implementation. Core ownership, immutable snapshots, deletion and uncertain-save identity rules remain in force.

## Domain and metadata

Add typed MovieGenre { id, name } metadata to planning candidates (not saved snapshots). A new catalog service reads runtime and genres in a single movie-details request. Unknown/failed metadata is never fabricated. Keep the existing runtime-only API compatible for other callers. Services still establish owner/pending eligibility.

Add pure filterCandidatesByGenre and suggestMovieNight in src/dominio/movieNight.ts. The suggestion receives time, candidates, pause and optional genre id; no network/storage/React. It uses a bounded 0/1 dynamic program with transformed item cost runtime + pause and capacity budget + pause. This is exactly sum(runtime) + pause × (n−1) for nonempty choices. Deduplicate catalog ids, ignore unknown/failed runtimes, maximize occupied time; equal costs prefer fewer movies, then the first stable duration/title/id ordering. Return an explicit validation failure or an ordered snapshot list; no fit returns an empty list. Test exact fit, single film, no fit, duplicates, unknown durations, non-greedy optimal choices, deterministic ties, invalid budget and genre filtering.

Plan my night refreshes the owner’s pending collection and metadata, then replaces the draft only when a nonempty valid suggestion is ready. The UI confirms replacement of a nonempty draft. Auto-planning locks conflicting edits while its request is pending; loading failure/no fit preserves existing selection. Ordinary Find movies remains available. Genre changes affect candidates/suggestions only, with a labeled All genres select and empty explanation. Existing save-time source review is reused. Planning/general feedback MUST remain distinct from save-failure feedback. A no-fit suggestion MUST retain its warning and draft without relabeling an unattempted save as Retry saving; that label is reserved for a failed or uncertain save. Manual draft changes or successful replacement clear obsolete save-failure feedback.

## Database validation — migration 003

Add an immutable PostgreSQL boolean function public.movie_night_fits(movies jsonb, available integer, pause integer, total integer), validating array/nonempty/object shape, unique positive safe catalog identities, nonempty titles, positive whole runtimes, fixed pause, budget range, exact computed total and total ≤ available. Add a CHECK constraint using this function to public.movie_nights. Invalid existing data aborts the migration; nothing is deleted or repaired automatically. New inserts/updates cannot bypass CHECK via normal table/RPC requests. The database verifies declared snapshot runtimes, not TMDB truth. Tests issue direct SQL under ordinary roles, not just domain calls.

## Watched completion — migration 004

Add watched_at timestamptz nullable, initially null for every existing session. Snapshot contents remain immutable. SavedMovieNight exposes watchedAt (null for legacy API responses until migration), validated when present.

Expose public.mark_movie_night_watched(p_night_id uuid) returning the saved row. It MUST be SECURITY DEFINER with empty search_path and fully qualified table/auth references, revoke PUBLIC/anonymous execution, and grant only authenticated execution. The function MUST check auth.uid(), lock the matching owned session row, reject missing/foreign rows, and return an already-completed row without repeating updates. Otherwise it updates only matching owned movie entries to finished and sets watched_at in the same transaction. No TV entries, other owners, grades/comments, saved snapshots or other sessions are mutated; missing collection entries are skipped. Any failure rolls back all progress/completion writes. DELETE remains owner-only; direct UPDATE is not granted. A BEFORE INSERT guard rejects nonnull watched_at so callers cannot forge completion on creation.

A service wrapper authenticates the expected account, invokes RPC, validates owner/id/completion and returns the typed row. Detail shows a prominent one-way Mark as watched button near the top with confirmation, an explicit Planned/Watched status, and disabled completed state, shared mutation pending guard with delete, error/retry and success feedback. History displays watched versus planned status. There is no reverse operation and deletion does not revert progress. Use DESIGN.md controls and tokens, with no new framework.

## Traceability

| Criterion | Verification |
| --- | --- |
| E2-AC25 | Own pure-planner tests, non-greedy/tie/edge cases; UI suggestion flow |
| E2-AC26 | Pure filter/metadata tests, UI filter preserves draft and affects suggestions |
| E2-AC27 | Service/UI completion; isolated PostgreSQL transaction, skipped/deleted entries, unchanged foreign/TV/grades/comments |
| E2-AC28 | Raw SQL rejection of forged totals, unknown/fraction/duplicate/empty/over-budget payload; exact/single valid; legacy failure |
| E2-AC29 | Owner/anonymous denial, no direct UPDATE, forged watched_at denial, idempotent completion and rollback tests |
| E2-AC30 | Confirmation/cancel, pending load, load failure/no-fit preserve draft; existing identity-recovery regressions |

| Ticket | Files |
| --- | --- |
| E2-T08 | src/dominio/movieNight.ts and own suggestion tests; src/hooks/useMovieNight.ts; src/components/MovieNightScreen.tsx and UI tests |
| E2-T09 | src/types/MovieNight.ts; src/services/tmdbService.ts, movieNightService.ts and tests; planner hook/UI |
| E2-T10 | supabase/migrations/004_movie_night_watched.sql; src/services/movieNightService.ts; detail/history components and tests; supabase/tests |
| E2-T11 | supabase/migrations/003_movie_night_fit.sql; supabase/tests; database setup/verification/audit docs |

The SQL migration files implement the contracts above and are reviewable before deployment. No migration is applied to the connected/live database by this task. Local isolated PostgreSQL tests are evidence of SQL behavior, not proof of the deployed Supabase configuration. Record actual results in AUDITORIA.md and leave student browser/live results pending in VERIFICACION.md.
