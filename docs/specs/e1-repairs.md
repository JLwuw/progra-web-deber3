# E1 — Repair specification and historical verification

Canonical E1 repair document: requirements and recorded repair evidence. Source: [historical initial-state audit](../INITIAL-STATE.md), sections “Defects and potential inconsistencies” and related risks. The original repair contract was committed in 4314a47 before repair implementation 5ff2b16; the evidence sections below were recorded after implementation and do not claim to precede it. Preserve the existing design according to [DESIGN.md](../../DESIGN.md) and the original collection workflows; Movie Night is governed by the separate E2 specs.

This is the single canonical E1 repair document. It consolidates docs/specs/e1-repairs.md (the contract) and the former docs/E1-REPAIRS.md (the implementation report, briefly moved to docs/specs/E1-REPAIRS.md). The eight E1-R requirements remain the governing contract; historical test results below are evidence, not additional requirements.

## Reconciliation decisions

- The two originals describe the same repair effort at different stages. Keep requirements, implementation evidence and outstanding verification clearly labeled within this document.
- Clarify E1-R05: Supabase configuration is checked at startup; TMDB configuration is checked by the catalog service when requested. Neither path displays configuration values. This resolves the older generic startup wording without adding a new product feature.
- Preserve all eight requirement identifiers, all 20 defect-checklist entries, and all five pre-commit findings. Map requirements to evidence below.
- Preserve the historical 26-test E1 checkpoint. Current combined E1/E2 test counts and Part D acceptance belong in AUDITORIA.md; student browser observations belong in VERIFICACION.md. Historical local success does not certify current live services or RLS.

## Required repairs

- E1-R01: Editing MUST initialize the existing status and preserve it unless changed; clearing rating/comment MUST send explicit null. Personal fields alone are updated. Ratings are optional integers 1–5, assignable in any status; zero in the existing editor clears the rating. Empty comments clear the comment.
- E1-R02: Search MUST refresh on category change, repeat submission, retry and page change. Requests MUST cancel/ignore obsolete results. Show all returned results with page navigation, release year, unavailable-year fallback and accessible poster fallback. Empty search results MUST be distinct from request failure. Add errors MUST NOT hide results.
- E1-R03: Auth initialization errors MUST leave loading and offer retry. Auth subscription MUST live in a service; ownership changes MUST reset all mounted personal state, including a batched sign-out/sign-in to the same account. Registration MUST explain email confirmation when no session is returned. Logout errors MUST be visible.
- E1-R04: Collection requests MUST be cancellable/ignored after cleanup, and fetch in bounded pages so existing filters/counts operate over the complete returned collection rather than a silently truncated first page. Short pages caused by server caps MUST NOT terminate retrieval; advance by the number actually returned and stop only on an empty page. Delete MUST block repeated pending operations and verify a returned row. Loading failure and mutation failure MUST be separate.
- E1-R05: TypeScript MUST use strict checking, no any, camelCase domain fields, explicit nullable values, and validated boundary mapping to snake_case DB fields. Components MUST NOT call Supabase or TMDB directly. Missing or invalid Supabase configuration MUST produce a recoverable startup explanation without exposing values; missing TMDB configuration MUST produce a controlled service error when catalog information is requested.
- E1-R06: Labels MUST identify controls; errors/statuses MUST have semantics; posters MUST have descriptive alternatives. Retain current colors/layout. Bootstrap MUST be bundled locally rather than depend on runtime CDN access.
- E1-R07: New additions of the same owner/type/catalog identity MUST be rejected with an understandable message. Existing duplicates MUST NOT be deleted automatically. Add a non-destructive migration with owner index and duplicate preflight; abort with instructions if legacy duplicates prevent uniqueness. Keep current RLS and verify separately with live accounts.
- E1-R08: Existing feature contracts, real repository paths, migration instructions, ignore rules and repair verification MUST be documented. The historical initial-state audit MUST remain intact, with a link to current remediation results. Tests MUST cover edit payload, category/request lifecycle, boundary validation and affected-row failure.

## Existing behavior retained

New entries default to Plan to Watch. Collection state/rating/date filters, totals, removal confirmation, title details and the 1–5 personal scale remain. Account deletion is outside current scope; existing restrictive owner references remain, avoiding unrequested automatic deletion. No new comment-length limit is imposed on existing data. Missing poster metadata is allowed and rendered with a fallback. Title identity includes media type because movie and TV catalog IDs can overlap.

## Deferred limitations, not code defects to conceal

Deployment, actual two-account RLS verification, external credentials/advisories, production smoke tests, measured browser accessibility/contrast and screenshots require external/manual evidence. Optional rating/date sorting and hosting remain optional. URL routing, account deletion/recovery, telemetry and offline support are not introduced by this repair. The user reports that the repair migration has been applied; the agent has not independently inspected the deployed database. Existing history cannot be rewritten to pretend old features had prior specs.

## Verification

Run npm test, npm run build and npm run lint from mi-cartelera-personal. Add regression tests with mocked services/requests for preserved status and null clearing, missing runtime-independent catalog metadata, search refresh and stale responses, initialization failures/account changes, delete failure/pending state. Record actual local results and external limits in this document; keep later E2/Part D evidence in [AUDITORIA.md](../AUDITORIA.md) and student browser results in [VERIFICACION.md](../VERIFICACION.md). Changes to schema require SQL review and a separate two-account live test before claiming deployed enforcement.


## Requirement-to-evidence map

| Contract | Recorded repair evidence |
| --- | --- |
| E1-R01 | Preserved editor state, explicit null-clearing payloads and personal-field mapping |
| E1-R02 | Category/page/retry refresh, stale-response cancellation, full results, year/poster fallback and independent add errors |
| E1-R03 | Startup recovery, service-owned auth subscription, account reset, registration confirmation and logout errors |
| E1-R04 | Bounded complete collection retrieval, cancellation, pending deletion and affected-row checks |
| E1-R05 | Strict typed boundaries, camelCase mapping, no explicit any and service-only external access |
| E1-R06 | Local Bootstrap, existing visual tokens, labels/status/error semantics and poster alternatives; full browser accessibility remains unverified |
| E1-R07 | Duplicate preflight/service conflict checks and migration 000 uniqueness; user-reported deployment is not independent enforcement evidence |
| E1-R08 | Setup, migration instructions, ignored configuration, prior contract and retained historical baseline |

## Historical E1 implementation and verification evidence

The following checklist and audit describe the E1-only repair checkpoint on November 11, 2026. Its **26 tests across three files** were the suite at that checkpoint, not the size of the current E1+E2 suite. See [the current audit](../AUDITORIA.md) for the latest 113-test Part D result and [the student worksheet](../VERIFICACION.md) for remaining browser/live evidence. Later E2 changes are not E1 repair requirements. Historical test and deployment limits are preserved below.

### Defects and potential inconsistencies checklist

| Initial finding | Repair | Evidence / remaining limit |
| --- | --- | --- |
| Edit resets viewing status | Initialize from saved state; update personal fields only | Editor regression verifies a Finished entry remains Finished while editing |
| Clearing rating/comment omits values | Send explicit null; optional nullable domain values | Editor and payload serialization tests |
| Search category/repeated query does not refresh | Category, submitted query, retry counter and page drive retrieval | Search interaction regression |
| Release/first-air year omitted | Typed catalog parsing and year/fallback on cards | TV parser and rendered-year tests |
| Missing/broken posters | Shared MediaPoster fallback and descriptive alternative | Missing-source and image-failure regression |
| Stale/overlapping search responses | AbortController cleanup and aborted-response guards | Late-old-category response regression |
| Empty results treated as errors | Separate no-results status | Empty-search regression |
| Insert failure hides search results | Per-title pending/success/error, independent retry | Failed-add retry regression |
| Only five search results, no paging | Display returned page with Previous/Next and page status | Category/page interaction regression |
| Session lookup error ignored, infinite loading | Throw service errors, render recoverable error and retry | Startup failure/retry regression |
| Account change retains private UI state | Session subscription in service; keyed account subtree resets all screen state | Account switch, sign-out, stale-initial-session regressions |
| Collection requests lack cleanup | Abort/ignore after screen cleanup | Service receives cancellation signal; pending state guards inspected |
| Delete repeated or falsely succeeds on zero rows | Pending per-entry guard; return-row verification; independent mutation error | Pending/failed delete and zero-row service tests |
| Spanish/unrelated fallback messages | English authentication/edit feedback and associated labels | Auth confirmation regression and source review |
| Domain fields/variables use snake_case | CamelCase domain model and UI; snake_case remains at DB/API boundary | Strict type checks and boundary tests |
| Explicit any and unchecked response assertions | Unknown-value parsing, strict TypeScript for app and test sources | tsc build/test checks; no explicit any in authored source |
| App directly subscribes to Supabase | Subscription and cleanup exported by authService | Session lifecycle regressions; no client calls in components |
| Search networking lives in component | Catalog request/parser in tmdbService | Components call services; request behavior mocked in regressions |
| Documented client/path mismatch | Canonical src/lib/supabase.ts, legacy path re-export, corrected root paths in AGENTS and README | Source and local-link review |
| Missing specifications and unsettled E1 policies | Repair contract plus explicit PRD repair decisions | Specs exist before repair edits; original historical sequence cannot be retroactively changed |

### Related risk and debt treatment

- **Configuration:** lazy Supabase initialization validates URL/public-key presence without displaying values; missing TMDB configuration gives the same controlled request failure in search/details. Tests bypass project environment files. No environment file was inspected or modified.
- **Authentication feedback:** pending registration without a session explains email confirmation; logout failures are visible and authenticated navigation remains usable.
- **Duplicate titles:** service lookup and pending guards prevent ordinary repeat additions; the migration adds database uniqueness. The user reports the migration applied; deployed definitions and race enforcement have not been independently inspected. Existing duplicates are preserved for manual review, not automatically removed.
- **Database setup:** repeatable bootstrap for the documented base schema; ordered, non-destructive repair migration with owner/page index and duplicate preflight. See [database instructions](../../supabase/README.md). SQL has been reviewed locally. On November 11, 2026, the user confirmed applying the migration; the agent did not execute it or independently inspect the deployed schema.
- **Data model:** nullable DB fields are explicit in domain types. API/database payloads are parsed before rendering. Empty legacy posters are represented as absent artwork. No arbitrary note-length limit or account-deletion cascade is introduced.
- **Collection volume:** read requests use bounded, ordered pages rather than a single backend-limited query. Existing filters and summary counts use the complete loaded collection. Very large collections still load into browser memory; server-filtered/paged UI is future optimization.
- **Styling:** Bootstrap 5.3.3 is bundled locally before the existing overrides. The existing visual tokens are preserved. Associated labels, loading/error semantics, pending controls and poster alternatives are corrected. Browser contrast/assistive-technology compliance has not been certified by DOM tests.
- **Repository operations:** root environment-file ignore rules, actual setup/verification instructions, test runner and CI workflow are present. The workflow is prepared locally; no hosted CI result is claimed. CLAUDE.md imports AGENTS.md.
- **Diagnostics:** search debug logging is removed; user-facing errors explain retry. No unsolicited analytics or external monitoring is added.

### Local checks

- npm test: **passed**, 26 tests across 3 files, including strict test-source type checking.
- npm run build: **passed**, strict application type checking and production bundling, including local Bootstrap 5.3.3.
- npm run lint: **passed**, no warnings, including search effect dependency checks.
- git diff --check, local documentation-link review, and source checks for explicit any/component client calls: **passed**.

These results were collected locally on November 11, 2026; hosted CI and live-service results remain unverified.

### External/manual work still unverified

Independent inspection of the applied Supabase schema/policies, two-account isolation probes, fresh real-account registration/confirmation, live TMDB requests, production deployment, screenshots, full keyboard/assistive-technology/browser viewport checks, dependency advisory review beyond install output, and production smoke tests have not been performed. Follow the database verification procedure with ordinary test accounts; source-level ownership checks are not proof of RLS.

In-memory navigation, account recovery/deletion, optional collection sorting, public hosting, scheduled viewing and operational telemetry remain outside the repair scope. Existing E1 features are patched, not replaced by E2. No history is rewritten. Documentation and implementation are committed only after the repair audit and validation.


### Pre-commit audit of the complete E1 repair change

Reviewed the repair contract, all modified/new application modules, shared CSS against its original rules, type/test/build configuration, dependency lockfile, CI workflow, bootstrap/migration SQL, and related documentation. No Movie Night functionality was introduced.

Findings corrected during this audit:

1. Collection retrieval stopped on a short page, which could truncate data under a lower backend row cap. It now advances by returned rows and continues until an empty page; a capped-page regression covers this behavior.
2. Batched sign-out and sign-in to the same account could reuse the prior mounted view. A session identity version forces a fresh account subtree even when those events are batched; regression coverage confirms the old collection view disappears.
3. Synchronous auth subscription initialization failures could bypass session recovery. Initialization now catches both subscription and restoration failures and offers retry; regression coverage exercises the synchronous failure.
4. Whitespace-only personal comments were normalized to null during reads. Reading now preserves the original comment text; explicit user clearing still sends null.
5. Test configuration relied on a supposedly empty temporary directory to avoid environment-file loading. Environment-file loading is now disabled explicitly, and test environment/global stubs are cleaned up after every test.

Additional coverage exercises duplicate preflight rejection, concurrent unique-index conflicts, encoded catalog queries and cancellation signals. All 26 tests, application/test type checks, build, lint, local-link and diff checks pass. No unresolved blocking issue was found in the reviewed repair changes. Database migration application is user-confirmed, not independently verified; live RLS, browser accessibility, hosted CI and real-service flows remain explicitly unverified.
