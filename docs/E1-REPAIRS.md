# E1 — Remediation and verification

Source: [historical initial-state audit](INITIAL-STATE.md). Governing contract: [E1 repair spec](specs/e1-repairs.md). This is implementation/repair evidence, not the final E2 verification or audit deliverable. Movie Night is not implemented by this work.

## Defects and potential inconsistencies checklist

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

## Related risk and debt treatment

- **Configuration:** lazy Supabase initialization validates URL/public-key presence without displaying values; missing TMDB configuration gives the same controlled request failure in search/details. Tests bypass project environment files. No environment file was inspected or modified.
- **Authentication feedback:** pending registration without a session explains email confirmation; logout failures are visible and authenticated navigation remains usable.
- **Duplicate titles:** service lookup and pending guards prevent ordinary repeat additions; the migration adds database uniqueness. The user reports the migration applied; deployed definitions and race enforcement have not been independently inspected. Existing duplicates are preserved for manual review, not automatically removed.
- **Database setup:** repeatable bootstrap for the documented base schema; ordered, non-destructive repair migration with owner/page index and duplicate preflight. See [database instructions](../supabase/README.md). SQL has been reviewed locally. On November 11, 2026, the user confirmed applying the migration; the agent did not execute it or independently inspect the deployed schema.
- **Data model:** nullable DB fields are explicit in domain types. API/database payloads are parsed before rendering. Empty legacy posters are represented as absent artwork. No arbitrary note-length limit or account-deletion cascade is introduced.
- **Collection volume:** read requests use bounded, ordered pages rather than a single backend-limited query. Existing filters and summary counts use the complete loaded collection. Very large collections still load into browser memory; server-filtered/paged UI is future optimization.
- **Styling:** Bootstrap 5.3.3 is bundled locally before the existing overrides. The existing visual tokens are preserved. Associated labels, loading/error semantics, pending controls and poster alternatives are corrected. Browser contrast/assistive-technology compliance has not been certified by DOM tests.
- **Repository operations:** root environment-file ignore rules, actual setup/verification instructions, test runner and CI workflow are present. The workflow is prepared locally; no hosted CI result is claimed. CLAUDE.md imports AGENTS.md.
- **Diagnostics:** search debug logging is removed; user-facing errors explain retry. No unsolicited analytics or external monitoring is added.

## Local checks

- npm test: **passed**, 26 tests across 3 files, including strict test-source type checking.
- npm run build: **passed**, strict application type checking and production bundling, including local Bootstrap 5.3.3.
- npm run lint: **passed**, no warnings, including search effect dependency checks.
- git diff --check, local documentation-link review, and source checks for explicit any/component client calls: **passed**.

These results were collected locally on November 11, 2026; hosted CI and live-service results remain unverified.

## External/manual work still unverified

Independent inspection of the applied Supabase schema/policies, two-account isolation probes, fresh real-account registration/confirmation, live TMDB requests, production deployment, screenshots, full keyboard/assistive-technology/browser viewport checks, dependency advisory review beyond install output, and production smoke tests have not been performed. Follow the database verification procedure with ordinary test accounts; source-level ownership checks are not proof of RLS.

In-memory navigation, account recovery/deletion, optional collection sorting, public hosting, scheduled viewing and operational telemetry remain outside the repair scope. Existing E1 features are patched, not replaced by E2. No history is rewritten. Documentation and implementation are committed only after the repair audit and validation.


## Pre-commit audit of the complete E1 repair change

Reviewed the repair contract, all modified/new application modules, shared CSS against its original rules, type/test/build configuration, dependency lockfile, CI workflow, bootstrap/migration SQL, and related documentation. No Movie Night functionality was introduced.

Findings corrected during this audit:

1. Collection retrieval stopped on a short page, which could truncate data under a lower backend row cap. It now advances by returned rows and continues until an empty page; a capped-page regression covers this behavior.
2. Batched sign-out and sign-in to the same account could reuse the prior mounted view. A session identity version forces a fresh account subtree even when those events are batched; regression coverage confirms the old collection view disappears.
3. Synchronous auth subscription initialization failures could bypass session recovery. Initialization now catches both subscription and restoration failures and offers retry; regression coverage exercises the synchronous failure.
4. Whitespace-only personal comments were normalized to null during reads. Reading now preserves the original comment text; explicit user clearing still sends null.
5. Test configuration relied on a supposedly empty temporary directory to avoid environment-file loading. Environment-file loading is now disabled explicitly, and test environment/global stubs are cleaned up after every test.

Additional coverage exercises duplicate preflight rejection, concurrent unique-index conflicts, encoded catalog queries and cancellation signals. All 26 tests, application/test type checks, build, lint, local-link and diff checks pass. No unresolved blocking issue was found in the reviewed repair changes. Database migration application is user-confirmed, not independently verified; live RLS, browser accessibility, hosted CI and real-service flows remain explicitly unverified.
