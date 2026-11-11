# E2 — Implementation audit

## Current audit — selected optional features and visual follow-up

Audit date: November 11, 2026. Scope: the four selected details2.md §1.5 features and the subsequent disabled/loading-style and completion-button changes, including their effects on base E2/E1. Reviewed the PRD, epic, nine stories, 30 criteria, refinement, eleven tickets/DoD, core/optional/interface specs, DESIGN.md, brand board, migrations 000–004, services/domain/hooks/components, automated checks and current git status. This section is the current conclusion; the records below it describe earlier checkpoints.

**Conclusion: E2-F03 and E2-F04 are fixed locally; no high-severity functional or security defect was reproduced.** Documentation now includes all four selected optional features consistently. Planning/general feedback is separate from save failure, and a permanent regression covers the corrected label. The delivery now commits requirements/design before implementation, then records audit/verification. No live migrations were applied. Live acceptance remains pending.

### E2-F03 — P2 at discovery, fixed locally: current documents contradict selected scope

- **Sources at discovery:** [interface spec](specs/e2-interface.md), line 24 explicitly says there is no completion action, while its optional-controls section requires one. [Tickets](backlog/e2-tickets.md), line 59 excludes optimizer/genre/completion work even though T08–T11 now select it. Refinement R24/R25 retain the original rejection/deferral without explicit supersession links. E2-AC29 still describes an unchecked check instead of the requested completion button.
- **Impact:** a reviewer or implementing agent can follow incompatible contracts. This conflicts with the shared DoD that documentation match delivered behavior. The old audit introduction also describes only five stories, 24 criteria and no optional features; it is retained below as historical evidence, not the current scope.
- **Required correction:** reconcile current rules in place, mark prior decisions as superseded and link their replacements, update completion terminology, and keep historical audit checkpoints clearly identified. Preserve the important distinction: saving changes no progress; explicitly confirming completion does.
- **Implemented correction:** interface and epic specs, stories, refinement R24/R25, ticket scope/checkpoints and documentation map now state the selected scope and completion-button behavior consistently. The original exclusions are explicitly superseded; historical audit results stay labeled as historical.

### E2-F04 — P3 at discovery, fixed locally: a suggestion warning is treated as a failed save

- **Sources at discovery (pre-patch line numbers):** [useMovieNight.ts](../mi-cartelera-personal/src/hooks/useMovieNight.ts), lines 111–116 put no-fit suggestion feedback in the shared error state; [MovieNightScreen.tsx](../mi-cartelera-personal/src/components/MovieNightScreen.tsx), lines 287–291 use any such error to label the save button Retry saving.
- **Reproduction:** create a valid named draft without saving; refresh via Plan my night when the refreshed collection has no fitting candidates. The prior draft stays, a no-fit explanation appears, and the action reads Retry saving even though saveMovieNight has never been called. A temporary DOM audit probe reproduced this exactly.
- **Impact:** misleading operation feedback; no data loss or duplicate write was observed. The preserved draft still uses normal source review when actually saved.
- **Required correction:** distinguish planning/general feedback from save failure/recovery state. Only a failed or uncertain save should offer Retry saving; retain the suggestion warning and draft. Add a focused regression for this transition.
- **Implemented correction:** useMovieNight now exposes separate saveError and general error feedback. Only saveError or uncertain recovery produces Retry saving. Manual draft edits, source-review acceptance and successful automatic replacement clear obsolete save errors. The permanent DOM regression verifies retained warning/selection and Save Night after no fit, Retry saving after a real rejected save, and reset to Save Night after an edit.

### Criterion review and evidence

| Criterion / ticket | Local result | Evidence and remaining limits |
| --- | --- | --- |
| E2-AC25 / T08 | meets locally | Dedicated pure-planner tests; independent exhaustive comparison across 120 generated eight-movie collections found identical optimal occupied time and minimum movie counts; deterministic sorting, deduplication, invalid/unknown durations, exact/single/no-fit cases reviewed |
| E2-AC26 / T09 | meets locally | Runtime and genre share one catalog request; owner/pending eligibility remains in services; pure filter and DOM suggestion/filter flow preserve selected movies; missing genres match All genres only |
| E2-AC27 / T10 | meets locally | Confirm/cancel/pending/error/retry UI tests; SQL completes only matching owned movie entries and preserves TV/foreign entries/grades/comments; missing entries skipped; injected failure rolls both tables back |
| E2-AC28 / T11 | meets locally | Actual PostgreSQL migrations reject malformed/empty/duplicate/fractional/unknown/over-budget/wrong-total snapshots and invalid updates; exact-fit saves accepted; invalid legacy data stops migration without deletion |
| E2-AC29 / T10 | meets locally; F03 fixed | SQL denies foreign/anonymous/unsigned completion, direct updates and forged initial completion; idempotency preserves timestamp and does not reapply progress; prominent button guards concurrent deletion and stays disabled after completion |
| E2-AC30 / T08 | meets locally; F04 fixed | Cancellation/no-fit/collection failure retain selection; auto-planning locks conflicting edits and reuses save-time source review; no automatic save |
| DES-01 / disabled-style request | meets source review | Shared dark disabled field selectors override Bootstrap specificity; disabled button variables retain variant styling; completion action is at least 48px high near the top; brand board/specs reflect these choices |
| DES-02–08 / full live acceptance | unverified beyond local evidence | User reported that the visual result looks fine; this is limited subjective approval, not measured contrast, keyboard/assistive-technology or viewport evidence. Student verification worksheet remains authoritative |
| E2-AC01–24 / regression baseline | no new failure reproduced | Existing service/domain/DOM/auth/E1 regression suite passes; original retry/review/save-identity protections remain in place. Live RLS/browser checks remain separate |

Post-fix rerun results: **113 maintained Vitest tests across eight files passed**, including TypeScript checks; **production build passed; lint passed; git diff --check passed**. A separate disposable PostgreSQL 17.11 cluster applied the real schema/migrations and passed the database regression. Two temporary audit probes also passed: one independent exhaustive planner comparison and one confirming the F04 mislabel. Those probes were removed after the audit; the permanent F04 regression now verifies the corrected behavior and is included in the 113 maintained tests. The PostgreSQL result is retained from the immediately preceding audit because SQL was unchanged by these fixes.

### Verification limits and process

- No deployed Supabase schema, public HTTP RPC response, real catalog or two-account live result was inspected. SQL tests use synthetic auth identities/roles and cannot certify the deployed environment. Migrations 003/004 must be applied and exercised there before live acceptance.
- Source/DOM checks do not render CSS. The recent visual approval does not fill the remaining detailed browser/accessibility checklist automatically.
- The new pure test titled “deduplicates and excludes unknown, failed and invalid runtimes” has no error-status fixture; the multi-genre test uses only single-genre fixtures. These are narrow coverage gaps, not reproduced function defects. Direct catalog-fetch parsing, simultaneous RPC callers and lost-response completion are not end-to-end tested; existing SQL idempotency/locking and mocked service validation provide partial evidence.
- Delivery order: requirements/design commit 4f379a7 precedes the implementation commit, followed by this audit/verification record. Existing history was not rewritten.
- No environment files or secrets were read, no live migrations were applied, and product changes in this follow-up were limited to save-feedback isolation and its regression. No direct external-client access or any type was introduced in the reviewed components.

## Historical audit checkpoints

The following records preserve the base implementation and subsequent extensions as they were reviewed. Their scope/count statements are historical; use the current audit above for this working tree.

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


## Selected optional E2 features — local audit

Added E2-US6–US9, E2-AC25–30, E2-T08–T11 and e2-optionals.md before implementing these extensions. Saving remains independent of the new explicit completion operation.

| Criteria | Status | Evidence and limits |
| --- | --- | --- |
| E2-AC25 | meets locally | Own pure suggestion tests: exact/single/no fit, non-greedy optimum, duplicates, unknown/invalid runtime, stable ties, fewer-movie preference, input preservation |
| E2-AC26 | meets locally | Candidate metadata service test, pure filtering and DOM filter-to-suggestion flow preserving selection |
| E2-AC27 | meets locally | RPC response validation, confirmed/cancelled/failed/pending/retry DOM flow; PostgreSQL verifies matching movie changes, missing-title skip, preserved TV/foreign/grade/comment data, transaction rollback |
| E2-AC28 | meets locally | Real PostgreSQL applies schema/migrations; direct invalid/overbudget/duplicate/fraction/unknown/wrong-total writes rejected; single/multiple exact fits accepted; invalid legacy migration fails without deleting rows |
| E2-AC29 | meets locally | Real PostgreSQL rejects foreign/anonymous/unsigned completion, direct updates and forged initial completion; repeated completion preserves original timestamp and does not reapply progress |
| E2-AC30 | meets locally | DOM checks confirmation/cancellation, pending locks, load failure and no-fit selection preservation; prior uncertain-save regressions retained |

Automated evidence: 112 Vitest tests passed; production build and lint passed. The isolated PostgreSQL regression passed against PostgreSQL 17.11 using synthetic auth/roles, actual migrations and raw SQL. No deployed database or browser acceptance is claimed. Student checks for optional features remain pending in VERIFICACION.md. Migration 003 checks supplied runtime truth only; external catalog correctness and concurrent collection eligibility are still service concerns.

Visual follow-up: shared disabled input/select and button variant styles now override Bootstrap defaults. Saved detail replaces the checkbox with a large completion button and explicit status panel above session metadata. Completion cancellation/failure/pending/retry tests were adapted and all 112 tests, build and lint passed. DESIGN.md, brand board and interface specs reflect the change; rendered-browser verification remains pending.
