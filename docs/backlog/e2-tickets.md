# E2 — Tickets

Status: E2-T01–T05 are implemented locally; E2-T02/T04/T05 still require live/database/browser acceptance before their full Definition of Done is met. E2-T06 has verification/audit worksheets; student results remain pending. E1 prerequisites are tracked separately in [E1 repairs](../specs/e1-repairs.md); reuse completed test infrastructure and service cleanup rather than rebuilding them. Read the PRD, refinement, stories, epic spec, interface spec, and DESIGN.md before implementing. Dependencies give implementation order, not permission to bypass the spec.

## Shared Definition of Done

The ticket's criteria are implemented and mapped to evidence; relevant tests pass; npm test and npm run build run from the application folder; no any or hardcoded credentials are introduced; no component calls Supabase or TMDB; meaningful regression checks preserve E1 behavior; documentation matches the delivered behavior. Unverified browser/RLS results must stay unverified. A failing baseline check is recorded and fixed in the responsible ticket, not described as passing. Record each change after its spec in git; do not rewrite history to imply prior specification.

## E2-T01 — Domain rules and executable tests

- **Type:** technical enabler / test infrastructure.
- **Dependencies:** none; documentation baseline committed first.
- **Work:** establish Vitest and the test script; implement pure validation, runtime normalization, totals, next-add fit, eligibility/deduplication, and deterministic ordering in src/dominio/.
- **Criteria:** E2-AC02–05, E2-AC08–14 arithmetic/input portions; E2-AC18 reuse rule.
- **DoD:** shared DoD plus exact fit, one film, unknown runtime, invalid time, removal, duplicate selection, and next-break tests; network-free domain tests.

## E2-T02 — Session persistence and ownership

- **Type:** database/service feature.
- **Dependencies:** E2-T01.
- **Work:** implement the migration specified in the epic spec, snapshot model, typed session service, atomic/idempotent creation, list and detail retrieval, owner isolation.
- **Criteria:** E2-AC15/16/18–21 persistence/security portions.
- **DoD:** shared DoD plus database apply/rollback procedure documented, CRUD denial tests for non-owners and anonymous access, snapshot survival after E1 deletion, and no change to existing E1 schema/policies. Live two-account evidence is required before claiming security acceptance.

## E2-T03 — Eligible movie loading through services

- **Type:** service feature / bounded integration cleanup.
- **Dependencies:** E2-T01.
- **Work:** add planner service orchestration and runtime and genre catalog retrieval (extended by E2-T09); deduplicate pending movies; distinguish unknown runtime from request failure; support cancellation and retry. Move the existing search fetch/response mapping into tmdbService without changing E1 search behavior; expose auth subscriptions via authService so App does not use the Supabase client directly.
- **Criteria:** E2-AC03–07, E2-AC17 revalidation, E2-AC22 service-boundary regression.
- **DoD:** shared DoD plus service tests for partial failures, stale/cancelled requests, source eligibility changes and duration changes; no external-client or fetch calls in components, including App and the existing search screen.

## E2-T04 — Authenticated planner interface

- **Type:** user-facing feature.
- **Dependencies:** E2-T01, E2-T03.
- **Work:** add protected Movie Night navigation and the budget, results, selection, removal, and live summary experience according to the interface spec.
- **Criteria:** E2-AC01–13; DES-01–08 as applicable.
- **DoD:** shared DoD plus keyboard-operable planning, loading/error/empty states, stable totals and budget changes; verify existing navigation remains available. Saving is integrated in E2-T05, with no misleading success placeholder here.

## E2-T05 — Save and consult sessions

- **Type:** user-facing feature.
- **Dependencies:** E2-T02, E2-T04.
- **Work:** named save with final source refresh/review, retry and pending state; saved list/detail; clear account-bound drafts; implement snapshot rendering without catalog dependency.
- **Criteria:** E2-AC14–22; DES-01–08 as applicable.
- **DoD:** shared DoD plus successful save/reload/detail flow, failed-save draft retention, changed-source review, retry with stable draft identity, and no E1 watch-state updates.

## E2-T06 — Acceptance verification and audit

- **Type:** quality / documentation.
- **Dependencies:** E2-T05.
- **Work:** run full domain/service checks, browser acceptance and design scenarios, E1 regressions, and two-account isolation probes; create docs/VERIFICACION.md and docs/AUDITORIA.md.
- **Criteria:** E2-AC01–22 and DES-01–08.
- **DoD:** shared DoD plus the student fills “actual result” for browser checks; audit marks every criterion meets / does not meet / unverified with evidence. Security probes include attempts to insert under another owner and update/delete a foreign session, not only hidden UI. Existing E1 defects are separated from introduced regressions.

## Non-goals

E2-T08–T11 explicitly select automatic planning, genre filtering, watched completion and database fit validation. Public deployment, social/calendar features, rewriting E1 and repairing unrelated E1 debt remain outside scope. These tickets do not certify Part A compliance.


## Implementation checkpoint

| Ticket | Local implementation/evidence | Remaining acceptance |
| --- | --- | --- |
| E2-T01 | Pure domain rules and unit tests; existing Vitest runner reused | None for the local domain scope |
| E2-T02 | Snapshot schema/RLS migration and persistence/idempotency tests | Apply 001_movie_nights.sql; verify live isolation with two accounts |
| E2-T03 | Runtime/genre TMDB service under E2-T09, bounded concurrency, partial error/retry and cancellation tests | Real catalog/collection smoke test |
| E2-T04 | Authenticated planner and timing/selection DOM tests | Browser viewport, keyboard and accessibility checks |
| E2-T05 | Named save/review/retry, history/detail, account reset and immutable snapshots | Real save/reload/deletion-history flows after migration |
| E2-T06 | VERIFICACION.md and AUDITORIA.md prepared with local evidence | Student fills actual browser results; live RLS evidence and final audit update |

No application commit or database deployment is created automatically by writing this checkpoint. The previously committed PRD/backlog/specs precede the E2 implementation.


Audit repairs E2-F01/F02 are fixed locally: retry/batch updates use per-movie request ownership and overrides; uncertain saves retain their UUID and recover matching submitted attempts through source review. Regression tests pass. The database migration is unchanged; live/browser acceptance remains pending.


## E2-T07 — Delete owned sessions and repair history pagination feedback

- **Type:** user-requested feature / usability fix.
- **Dependencies:** E2-T02, E2-T05.
- **Criteria:** E2-AC23/24, DES-04/05/07.
- **Work:** confirmed owner-only detail deletion via service and additive migration 002; exact-count history and persistent loading/retry/completion footer.
- **DoD:** shared DoD; deletion cancellation/pending/error/zero-row/owner tests and pagination count/cap/loading/completion/retry tests pass. Live deletion isolation requires 002 and two test accounts. E1 collection data and other sessions remain unchanged.


## E2-T08 — Pure automatic planner and Plan my night UI

- **Type:** optional domain/UI feature. **Dependencies:** E2-T01, E2-T03, E2-T09.
- **Criteria:** E2-AC25/30; DES-01–07.
- **DoD:** deterministic optimal bounded suggestion function and own unit tests; fresh metadata, safe replacement, no-fit/failure preservation and UI regression tests; full checks pass. No automatic save.

## E2-T09 — Genre metadata and filter

- **Type:** optional service/UI feature. **Dependencies:** E2-T03, E2-T04.
- **Criteria:** E2-AC26; DES-01–07.
- **DoD:** typed genre metadata through services, All genres/default and missing-metadata handling, existing draft retained, filter and suggestion tests; full checks pass.

## E2-T10 — Atomic watched-session completion

- **Type:** optional database/service/UI feature. **Dependencies:** E2-T02, E2-T05, E2-T11.
- **Criteria:** E2-AC27/29; DES-04/05/07.
- **DoD:** migration 004, authenticated owner-only transactional completion, idempotent retry and direct-write restrictions; service/UI and isolated PostgreSQL rollback/isolation tests pass; live application/RLS/browser evidence remains separately pending.

## E2-T11 — Database fit enforcement

- **Type:** optional database integrity feature. **Dependencies:** E2-T02.
- **Criteria:** E2-AC28, E2-AC09.
- **DoD:** migration 003 validates actual saved JSON durations/breaks and total on every write, rejects invalid legacy data without deleting it, tests raw SQL bypass/edge cases in isolated PostgreSQL, documents migration/rollback and limitations. Existing migrations are not rewritten.


## Current optional-feature checkpoint

E2-T07–T11 have local implementation and automated evidence. T08 provides the pure optimizer and safe replacement; T09 adds combined runtime/genre metadata and filtering; T10 provides the prominent one-way watched action and atomic RPC; T11 enforces snapshot fit in migration 003. Migration 004 adds completion. Live migration state, two-account security and detailed browser/design acceptance remain unverified. See [audit](../AUDITORIA.md) and [verification](../VERIFICACION.md). Save-warning isolation is covered by E2-F04's regression under T08/T05.
