# E2 — Implementation audit

Audit date: November 11, 2026. Scope: local E2 implementation against details2.md, the stories, epic/interface specs and DESIGN.md. E1 was preserved and its regressions were rerun. No optional optimizer, genre filter, completion action, sharing, calendar, or deployment feature was added.

## Audit conclusion

**Both reproduced state-management defects are now fixed locally.** The original audit retained failing regression tests; the subsequent requested patch fixes both issues and adds interleaving/recovery coverage. Live database/browser evidence is still incomplete, so final acceptance remains pending.

Reviewed sources: details2.md sections 1.3–1.5; the full-product PRD and S1–S12; all five E2 stories and 24 acceptance criteria; the refinement log, epic index, six tickets and their Definition of Done; epic/interface specs; DESIGN.md and DES-01–08; the implementation, migration, tests and git history. Approved English paths/formats are accepted equivalents, not findings. Optional features are not treated as missing required work.

## Findings

### E2-F02 — High at discovery; fixed locally: uncertain-save identity could be abandoned

- **Contract:** S10, refinement R26, E2-AC16, E2-T02/T05, and the epic service rule requiring the old request outcome to be resolved before issuing a new identity.
- **Source at discovery (line numbers before the patch):** [useMovieNight.ts](../mi-cartelera-personal/src/hooks/useMovieNight.ts), lines 198–200 clear `uncertain` for a review response; `acceptReview` calls `edit`, which clears `id.current` at line 102. The next save generates a fresh UUID at line 186. The service can return review after a missing-row lookup and a changed source without positively resolving an earlier uncertain write.
- **Reproduction:** first save loses its response; unchanged retry returns a source-change review; accept that review and save again. The third call uses a different UUID from the original uncertain save.
- **Observed at discovery:** the new hook regression fails because the recovered workflow changes identity. A real duplicate database row was not reproduced; the risk is that the original write may still commit after the retry's earlier read reported no row, and the replacement UUID no longer supplies uniqueness protection.
- **Implemented repair:** the UUID remains pinned while uncertain, including through explicit source review. Manual name/budget/movie changes remain locked. Recovery compares the existing snapshot with previously attempted payloads for that same identity, so a late original or intermediate write can be recovered without overwriting it or creating a second session. Recovery lookup runs before validating a reviewed empty/over-budget payload; a new insert still requires complete validation. Tests cover late unique conflicts, intermediate committed attempts, empty selections, and unrelated identities.

### E2-F01 — Medium at discovery; fixed locally: successful duration retry could be overwritten

- **Contract:** E2-AC06, E2-US1, E2-T03/T04, and the service/interface requirements for independent retries, retained successful results and stale-response protection.
- **Source at discovery (line numbers before the patch):** [useMovieNight.ts](../mi-cartelera-personal/src/hooks/useMovieNight.ts), lines 68–74 replace the whole candidate array from the initial loader. `retryMovie` independently updates one candidate under the same generation. The loader retains its earlier error for that movie.
- **Reproduction:** movie A fails while movie B is still loading; retry A and receive a valid runtime; then B finishes and the initial loader emits its original array containing A's old error.
- **Observed at discovery:** A changes from `ready` back to `error`; its Add action disappears despite a successful retry. The new hook regression fails with expected `ready`, received `error`.
- **Implemented repair:** each full refresh creates a generation with per-movie overrides. Batch progress/completion merges those overrides. Per-movie request ownership cancels/ignores superseded retries; accepted review updates and removals also override stale batch data. Tests cover both batch completion/progress, overlapping retries, refreshed generations and accepted review metadata.

## Acceptance gaps — separate from code defects

- **Database evidence:** application of 001_movie_nights.sql is not confirmed or independently inspected. The earlier user migration confirmation concerned E1's 000 migration. Real save/reload, historical snapshots after E1 deletion, and two-account/anonymous read/insert/update/delete probes remain pending. This prevents accepting E2-AC15/18–21 and the full E2-T02/T05 DoD. The SQL matches the spec, but source policy definitions and mocked owner filters are not a live RLS demonstration.
- **Browser evidence:** the student actual-result column remains pending throughout VERIFICACION.md. Real keyboard/focus, responsive/zoom, contrast, assistive announcements and E1 browser regressions are not demonstrated. DOM tests do not complete the E2-T04/T06 DoD or DES-02–05/07–08 acceptance.
- **History:** the original contract documents precede E2 implementation. The final delivery groups the follow-up contract, implementation, and verification records into ordered commits; inspect git log for their identities. Existing history is not rewritten.

## Evidence and limits

The post-patch run contains **98 passing tests across 7 files**, including the 26 E1 regressions, both original audit regressions, seven additional interleaving/recovery cases, and eight deletion/pagination cases. The original audit run had 81 passing tests and 2 failing probes; those failures are retained above as historical findings, not current results. npm test now passes. npm test includes strict type checking for test sources; npm run build includes strict application checks. Build and lint pass. The E2 migration is prepared, not applied by the agent. The user’s prior migration confirmation applies to E1’s 000 migration, not this new 001 migration.

Status “meets” below describes the locally reviewed implementation and automated evidence for that criterion, not a claim of observed live-browser/database acceptance. “Does not meet” identifies a reproduced contract defect; “unverified” identifies criteria whose essential persistence/security/browser evidence is still missing. No criterion is claimed fully live-verified. The student must complete the [browser worksheet](VERIFICACION.md) and rerun this audit before final acceptance.

Test locations are under mi-cartelera-personal/src/: dominio/movieNight.test.ts, services/movieNightService.test.ts, components/movieNight.test.tsx, App.test.tsx, the retained E1 repairs.test files, and hooks/e2-audit-regressions.test.tsx (the repaired audit cases and added interleavings).

| Criterion | Status | Evidence and remaining limitation |
| --- | --- | --- |
| E2-AC01 | unverified | App.test.tsx: signed-out gate and account reset; actual RLS pending |
| E2-AC02 | meets | dominio/movieNight.test.ts: invalid/boundary budget cases |
| E2-AC03 | unverified | movieNightService.test.ts: owned pending filtering, deduplication, partial results; live collection pending |
| E2-AC04 | meets | dominio/movieNight.test.ts: duration/title/identity sorting and exact single fit |
| E2-AC05 | meets | Domain invalid-runtime cases and unavailable candidate DOM test |
| E2-AC06 | meets | E2-F01 fixed: per-movie overrides/request ownership survive stale batch progress and completion; regressions pass |
| E2-AC07 | meets | movieNight.test.tsx: empty collection versus no-fit states |
| E2-AC08 | meets | Domain empty/single totals and DOM removal to empty |
| E2-AC09 | meets | Domain 90+100+10=200 and exact-fit save DOM test |
| E2-AC10 | meets | Domain next-break overflow and disabled-add DOM test |
| E2-AC11 | meets | Domain removal/order test and summary focus handling; real keyboard check pending |
| E2-AC12 | meets | Domain duplicate identity rejection and per-candidate already-included explanation |
| E2-AC13 | meets | DOM budget reduction preserves selection and blocks save |
| E2-AC14 | meets | Domain name/code-point bounds and disabled empty-plan/name controls |
| E2-AC15 | unverified | Service single-insert snapshot and UI save/detail tests; real migration/save/status check pending |
| E2-AC16 | meets | E2-F02 fixed: pinned UUID survives review; known committed attempts are recovered, including late original/intermediate writes; regressions pass |
| E2-AC17 | meets | Service removed/status/runtime/unknown source cases; explicit accept-and-save-again DOM test |
| E2-AC18 | unverified | Service distinct IDs with same pending movie; live database acceptance pending |
| E2-AC19 | unverified | Service owner/order/page tests and history DOM rendering; live history/reload pending |
| E2-AC20 | unverified | Saved detail without TMDB/collection service calls and content-immutable DOM test; live deletion-history proof pending |
| E2-AC21 | unverified | 001 select/insert plus 002 owner-delete RLS, with UPDATE still prohibited; owner guard/filter tests; no live two-account proof |
| E2-AC22 | unverified | App account-change/reset tests and all E1 regression tests; real reload/persisted-history check pending |
| E2-AC23 | unverified | Owner-filtered deletion/affected-row service and confirmation/pending/error UI tests pass; live 002 ownership checks pending |
| E2-AC24 | meets | Exact-count and short-server-cap service cases; persistent pagination loading/completion/retry UI tests pass |
| DES-01 | meets | Existing Bootstrap dependency and shared surface/token/classes reused |
| DES-02 | unverified | Source patterns match guide; rendered browser comparison pending |
| DES-03 | unverified | Responsive Bootstrap columns and long-name wrapping present; viewport/zoom observation pending |
| DES-04 | unverified | Native labeled controls and remove-focus target present; complete keyboard/assistive review pending |
| DES-05 | unverified | Status/alert regions and disabled reasons present; assistive-technology observation pending |
| DES-06 | meets | Existing reduced-motion CSS retained; E2 adds no essential animation |
| DES-07 | unverified | All existing E1 tests retained and passing; actual browser regression pending |
| DES-08 | unverified | Existing palette reused; actual rendered contrast ratios have not been measured |

## Implementation review

- The fit rule is pure and isolated in src/dominio/movieNight.ts. The budget, runtime list and pause are explicit arguments; there are no React/network/database imports in that module.
- Components and the hook call services. Only services use Supabase or TMDB; runtime requests use bounded concurrency and cancellation guards. Missing runtimes are not counted as zero, and per-movie retry/review overrides prevent older batch updates from replacing newer results (E2-F01 fixed).
- The save path validates name, positive runtimes, uniqueness and fit, refreshes source eligibility/durations, requires explicit review of changes, and writes one complete ordered snapshot. It never updates my_listing.
- Save recovery checks a matching existing UUID before consulting changed sources. Concurrent UUID conflicts are reread and compared; transport/invalid post-write responses pin the UUID through recovery and source review; previously attempted snapshots can be recovered if they win the insert race (E2-F02 fixed). No existing snapshot is overwritten.
- Saved plans have no collection-entry foreign key and are rendered without catalog calls. RLS ownership policies and restricted grants are present in SQL, but their deployed behavior is not proven by service mocks.
- Authenticated navigation includes planner/history; the E1 identity-version reset unmounts old private state. Drafts are not persisted in browser storage.
- History is paged in stable created_at/id order, advancing by returned count. Concurrent inserts in other tabs are not a transactionally frozen history; overlapping entries are deduplicated locally.

## Ticket assessment

| Ticket | Audit assessment |
| --- | --- |
| E2-T01 | Local domain scope meets the contract: pure function, explicit inputs and required boundary tests |
| E2-T02 | Persistence/RLS definitions present; E2-F02 recovery integration fixed locally; live isolation/deployment evidence missing |
| E2-T03 | E2-F01 fixed locally; independent retry/stale-response regressions pass; live catalog smoke test pending |
| E2-T04 | Planner exists; E2-F01 fixed locally; browser/keyboard/accessibility DoD pending |
| E2-T05 | E2-F02 fixed locally with late-write recovery tests; real persistence/historical detail checks pending |
| E2-T06 | Audit and worksheets exist, tests pass, but mandatory student/browser/security evidence remains incomplete |

## Checks performed in this audit

| Check | Actual result |
| --- | --- |
| npm test | Passed: 98 tests, including both audit regressions; strict test-source type checking passed |
| npm run build | Passed, including strict application type checking |
| npm run lint | Passed without warnings |
| Source architecture review | Pure timing domain; components/hooks use services; no explicit any found |
| Migration/spec comparison | SQL matches the approved epic spec exactly apart from its explanatory header |
| Local documentation links / git diff --check | Passed |
| Live Supabase/TMDB/browser checks | Not performed; no environment file read or modified |

The original audit assertions remain intact and now pass. Additional regressions exercise the fixes without bypassing or weakening the original cases. The patch changes hooks/services/recovery messaging only; the SQL migration is unchanged.

## Required next verification

E2-F01/F02 are fixed locally. Apply or confirm supabase/migrations/001_movie_nights.sql and 002_movie_night_deletion.sql, then run the real save/reload/detail flow and two-account/anonymous RLS probes. Complete the student’s actual-result column, browser viewport/keyboard checks and measured contrast/assistive review. There is no hosted CI, production deployment or live acceptance claim in this audit. No environment file was read or modified.


## User-requested follow-up: session deletion and history pagination

The earlier no-deletion requirement is superseded by the user’s request. Session contents remain immutable; owners may delete their saved session from detail after confirmation. Migration 002 adds authenticated DELETE with owner-only RLS; 001 is not modified. Cancellation sends no request, pending deletion blocks repeats, errors preserve detail, and success reloads Saved Nights. Service tests verify owner/id filtering and zero-row failure; UI tests verify confirmation, pending success and retry.

History now requests an exact owner-filtered total. It no longer offers an active load-more action solely because the prior page was nonempty. Existing results remain visible; the footer shows loading, retry, load more, or disabled “All sessions loaded”. Tests cover server caps, completion and retry. Live deletion policy verification and browser results remain pending.


## Final local review before commit

Reviewed the final planner, retry/recovery transitions, immutable-content detail and owner deletion, exact-count history footer, additive migrations, all 24 acceptance criteria, and test/source/document consistency. All 98 tests, strict type checks, build, lint, local links and diff checks pass. No new blocking implementation issue was found. Environment files were not read. Live migration application, two-account RLS, real-browser accessibility and student observations remain unverified and are not certified by this commit.
