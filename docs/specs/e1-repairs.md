# E1 — Initial implementation repair specification

Source: docs/INITIAL-STATE.md, sections “Defects and potential inconsistencies” and related risks. This specification precedes repair code. Preserve the existing design according to DESIGN.md and the original collection workflows; do not implement Movie Night here.

## Required repairs

- E1-R01: Editing MUST initialize the existing status and preserve it unless changed; clearing rating/comment MUST send explicit null. Personal fields alone are updated. Ratings are optional integers 1–5, assignable in any status; zero in the existing editor clears the rating. Empty comments clear the comment.
- E1-R02: Search MUST refresh on category change, repeat submission, retry and page change. Requests MUST cancel/ignore obsolete results. Show all returned results with page navigation, release year, unavailable-year fallback and accessible poster fallback. Empty search results MUST be distinct from request failure. Add errors MUST NOT hide results.
- E1-R03: Auth initialization errors MUST leave loading and offer retry. Auth subscription MUST live in a service; ownership changes MUST reset all mounted personal state, including a batched sign-out/sign-in to the same account. Registration MUST explain email confirmation when no session is returned. Logout errors MUST be visible.
- E1-R04: Collection requests MUST be cancellable/ignored after cleanup, and fetch in bounded pages so existing filters/counts operate over the complete returned collection rather than a silently truncated first page. Short pages caused by server caps MUST NOT terminate retrieval; advance by the number actually returned and stop only on an empty page. Delete MUST block repeated pending operations and verify a returned row. Loading failure and mutation failure MUST be separate.
- E1-R05: TypeScript MUST use strict checking, no any, camelCase domain fields, explicit nullable values, and validated boundary mapping to snake_case DB fields. Components MUST NOT call Supabase or TMDB directly. Configuration validation MUST produce a recoverable startup explanation without exposing values.
- E1-R06: Labels MUST identify controls; errors/statuses MUST have semantics; posters MUST have descriptive alternatives. Retain current colors/layout. Bootstrap MUST be bundled locally rather than depend on runtime CDN access.
- E1-R07: New additions of the same owner/type/catalog identity MUST be rejected with an understandable message. Existing duplicates MUST NOT be deleted automatically. Add a non-destructive migration with owner index and duplicate preflight; abort with instructions if legacy duplicates prevent uniqueness. Keep current RLS and verify separately with live accounts.
- E1-R08: Existing feature contracts, real repository paths, migration instructions, ignore rules and repair verification MUST be documented. The historical initial-state audit MUST remain intact, with a link to current remediation results. Tests MUST cover edit payload, category/request lifecycle, boundary validation and affected-row failure.

## Existing behavior retained

New entries default to Plan to Watch. Collection state/rating/date filters, totals, removal confirmation, title details and the 1–5 personal scale remain. Account deletion is outside current scope; existing restrictive owner references remain, avoiding unrequested automatic deletion. No new comment-length limit is imposed on existing data. Missing poster metadata is allowed and rendered with a fallback. Title identity includes media type because movie and TV catalog IDs can overlap.

## Deferred limitations, not code defects to conceal

Deployment, actual two-account RLS verification, external credentials/advisories, production smoke tests, measured browser accessibility/contrast and screenshots require external/manual evidence. Optional rating/date sorting and hosting remain optional. URL routing, account deletion/recovery, telemetry and offline support are not introduced by this repair. The user reports that the repair migration has been applied; the agent has not independently inspected the deployed database. Existing history cannot be rewritten to pretend old features had prior specs.

## Verification

Run npm test, npm run build and npm run lint from mi-cartelera-personal. Add regression tests with mocked services/requests for preserved status and null clearing, missing runtime-independent catalog metadata, search refresh and stale responses, initialization failures/account changes, delete failure/pending state. Record actual local results and external limits in docs/E1-REPAIRS.md. Changes to schema require SQL review and a separate two-account live test before claiming deployed enforcement.
