# Initial Project State — Mi Cartelera Personal

Audit date: November 11, 2026.

## Audit scope and confidence

This audit compares the current repository with `instrucciones.md`, the project conventions in `AGENTS.md`, and `docs/prd/mi-cartelera-personal.md`. It covers application source, configuration, the SQL setup script, documentation, and local build and lint results. It records the existing state; no application fixes were made as part of this audit.

Features described as implemented have a corresponding code path. They have not been verified end to end against live accounts, TMDB, or a deployed database. Environment files were neither read nor modified. Actual credentials, deployed policies, email settings, hosting, and production behavior remain unverified. This is not a dependency vulnerability assessment.

## Overall assessment

The project is a substantial initial implementation rather than a starter template. It contains authentication, movie and TV search, personal collection creation/read/update/delete, detailed title information, status summaries, and collection filters. Database ownership policies are included in the repository.

It is not yet demonstrably complete against the assignment. Editing can unintentionally reset viewing progress, existing ratings and comments cannot reliably be cleared, search results omit the required year, and changing the search category does not trigger a new search. Automated tests and live isolation verification are missing. A successful build does not resolve these functional gaps.

## Current stack and organization

- Frontend: React 19 with TypeScript, built with Vite 8 and the React Vite plugin. `package.json` declares React `^19.2.8`, TypeScript `~6.0.2`, and Vite `^8.3.0`; the local build reports Vite 8.3.4.
- Authentication and persistence: Supabase JavaScript client, declared as `^2.118.0`, using email/password authentication and a PostgreSQL-backed personal collection.
- External catalog: TMDB movie/TV search and detail requests using browser `fetch`; images are loaded from TMDB's image host.
- Styling: Bootstrap 5.3.3 loaded from a CDN in `index.html`, plus custom CSS with responsive layouts, focus styling, and reduced-motion support.
- Tooling: npm with a tracked lockfile, Oxlint, and Prettier. Scripts exist for development, build, lint, formatting, and preview. Vitest is stated in `AGENTS.md` but is not declared or configured in the application.
- Navigation: in-memory React state in `src/App.tsx`; there are no URL-based routes. Reloading returns to the initial search view, and browser history does not represent internal screens.
- Source layout: `mi-cartelera-personal/src/` contains screen/card components, domain types, services, and `lib/supabaseClient.ts`.
- Database setup: `supabase/schema.sql` is at the repository root. There is no migration directory or migration history.
- Documentation: the README and `docs/` are at the repository root, rather than inside the application folder as described in `AGENTS.md`. The PRD exists; no feature specifications, backlog, design material, or `DESIGN.md` were found in the inspected file inventory.

## What the application does now

### Authentication and access

`AuthScreen.tsx` provides login and registration modes with email/password fields, required-field checks, a minimum password length, pending submission state, and error messages. `authService.ts` wraps registration, login, logout, and session lookup.

`App.tsx` restores the saved session and subscribes to authentication changes. Without a session, only authentication is rendered. Every implemented signed-in view includes navigation with logout. A successful explicit logout clears the selected title and resets navigation.

Registration has no success or email-confirmation guidance. If the account requires confirmation before login, the user can remain on the registration screen without an explanation. Logout failures are logged to the console rather than shown to the user.

### Catalog search and adding titles

`SearchScreen.tsx` supports separate movie and TV search categories, manual query submission, loading feedback, errors, and retry. It takes only the first five results from the returned page and does not offer pagination. Result cards display title, poster, TMDB identifier, and an add action; they do not display release year.

Adding calls the collection service with the current user's identifier and defaults the viewing status to `plan_to_watch`. A browser alert reports success. No duplicate check or pending state prevents repeated additions.

### Personal collection

`listingService.ts` implements collection reads, inserts, updates, and deletes. Reads request all accessible rows ordered by ascending identifier and rely on database policies for ownership isolation.

`ListingScreen.tsx` displays saved title cards, status and rating, loading/error/retry feedback, and separate empty-collection and no-filter-match messages. Users can open details, edit a title, or remove it after browser confirmation. Successful removal updates the local list.

The collection supports status, exact-rating/unrated, and date-added range filters. Date boundaries use the browser's local time. Status counters summarize the entire loaded collection, independently of the current filters. User-selectable sorting by rating or date is not implemented; filtering by those values is not equivalent to sorting.

### Editing and details

`ListingEditScreen.tsx` provides status, optional integer rating from 1 to 5, and comment editing, with pending/error feedback. Returning from a successful save reloads the collection through the list screen.

`ListingDetailScreen.tsx` combines saved personal information with live TMDB information: synopsis, genres, public rating/vote count, dates, runtime or season/episode counts, production status, and up to ten cast members. It supports cancellation of detail requests on cleanup, retry, and several missing-information fallbacks. Saved personal information remains rendered if the external detail request fails.

### Persistence and ownership controls

`supabase/schema.sql` defines movie/TV and viewing-status enums, a personal listing with a user reference, a 1–5 rating constraint, optional comment, and creation timestamp. It enables row-level security and supplies authenticated select, insert, update, and delete policies tied to the current user's identity. The update policy checks both the existing owner and the resulting owner.

This is the correct direction for the required ownership model. The repository does not prove that this script has been applied to the actual database, that deployed definitions match it, or that isolation has been tested with two accounts. No privileged service-role key usage or literal credential was observed in the inspected application source; environment contents were deliberately excluded.

## Coverage against the project brief

| Requirement | Repository evidence | Assessment |
| --- | --- | --- |
| Registration, login, logout, protected content | Authentication service, auth screen, session gate, shared navbar | Implemented in source; live session behavior unverified |
| Movie/TV search with poster, title, year, loading, and errors | Search screen and result cards | Partial: year missing; category-change defect |
| Add search results to a personal collection | Add handler and insert service | Implemented; duplicates and repeat submissions uncontrolled |
| Read, update, and delete personal entries | Collection service and collection/edit screens | Present; update defects affect correctness |
| Three fixed viewing states | Domain union and database enum | Present; edit form initializes the wrong state |
| Personal rating and comment | Edit/detail screens and database fields | Present; clearing saved values is defective |
| Expanded title details with synopsis, cast, and personal information | Detail screen and TMDB detail service | Implemented in source; live retrieval unverified |
| Actual per-user isolation | SQL ownership policies | Defined locally; deployed enforcement and two-account test pending |
| Optional status filtering and counters | Collection screen | Implemented in source |
| Optional rating/date sorting | Fixed identifier ordering only | Not implemented |
| Optional hosted application | No deployment configuration or public app link found | Unverified |
| Delivery README and incremental history | Setup README and multiple commits | Partial: README lacks product overview and screenshots |

## Defects and potential inconsistencies

### High priority: editing can change or retain unintended values

- **Viewing progress resets on edit.** `ListingEditScreen.tsx` initializes `watchState` to `plan_to_watch`, regardless of the saved value. Opening a Watching or Finished title and saving only a comment also changes its status to Plan to Watch.
- **Clearing a rating or comment does not explicitly clear the saved value.** The form converts rating zero and an empty comment to `undefined`. These properties are omitted from the serialized update rather than sent as explicit empty database values, so an existing rating/comment can remain. The displayed instruction “0 for empty” therefore promises behavior the update does not implement.

### Medium priority: search correctness and completeness

- The search effect reads `searchType` but does not include it in its dependencies. Switching Movies/TV Shows does not refresh results; resubmitting an unchanged query also leaves the search state unchanged. Users may keep seeing the previous category until a query changes or retry occurs. Oxlint reports this dependency issue.
- Result parsing and cards omit the release/first-air year required by the assignment.
- A missing poster path is concatenated into an image URL ending in `null`; there is no placeholder or image-error fallback.
- Search requests have no cancellation or stale-response guard. Overlapping requests can overwrite newer results, for example when changing a query or retrying during a pending request.
- No-result searches are reported as errors rather than a distinct empty state. Search failures and insert failures share the same error state; an add failure hides results and offers a search retry rather than an add retry.
- Search silently truncates to five results and has no next-page control. This limits discovery even when the title exists elsewhere in the returned results.

### Medium priority: session and data lifecycle

- `getCurrentSession()` ignores the session lookup error, and the initial session-loading promise has no rejection handler. A rejection could leave the app on its loading screen.
- The auth listener replaces the session but does not clear the selected title or current view when identity changes. Explicit logout does clear them, but session loss or a cross-tab account change can leave stale in-memory selection state. Database policies may still protect writes, but the UI state needs independent handling.
- Collection loading has no cancellation or stale-response guard. Delete has no per-entry pending state and does not verify an affected-row count; a zero-row delete can appear successful locally.

### Conventions and product consistency

- Most visible text is English, but authentication includes “Contraseña,” and some error fallbacks are Spanish. The edit fallback refers to creating a “tripulante,” an unrelated domain concept.
- TypeScript variables such as `saved_session`, `new_listing`, and `cleaned_results` do not follow the stated camelCase convention. Database-shaped domain fields also use snake_case directly throughout the UI.
- `SearchScreen.tsx` uses an explicit `any` in a catch clause, violating the project rule.
- Database CRUD is correctly isolated in services. However, `App.tsx` subscribes directly through the Supabase client rather than an auth-service wrapper. Search requests and response conversion also live in a screen, while detail requests use a service; external access is organized inconsistently.
- `AGENTS.md` names `src/lib/supabase.ts`; the actual module is `src/lib/supabaseClient.ts`. Documentation paths and migration locations also differ from the stated structure.
- Existing features have no corresponding files in `docs/specs/`, despite the convention requiring a spec before feature implementation. Several current behaviors, such as default status, confirmation before removal, and filters beyond status, are absent from the PRD or still listed as open decisions. Current behavior should inform product decisions without being treated as an approved requirement automatically.

## Risks and pending technical debt

### Security and configuration

- **Access isolation depends on deployed policies.** Collection reads intentionally have no explicit owner filter; this is valid only when database ownership policies are correctly installed. Verify with two accounts, including direct attempts to read, insert, update, transfer ownership, and delete another user's entries. A frontend filter alone would not prove isolation.
- **Browser configuration is public.** The TMDB key is included in browser requests and all `VITE_` configuration is client-delivered. Environment variables avoid hardcoding but do not make browser values secret. Continue using only the intended public Supabase key; any requirement to keep a catalog credential secret would need a different access arrangement.
- Supabase configuration is asserted as strings without a presence check. Missing or invalid configuration has no dedicated startup explanation. TMDB details check for a missing key, while search does not.
- The application ignore file excludes `.env` and `*.local`, but does not comprehensively cover other environment-file variants. No root ignore policy exists. This is a preventive repository-policy gap, not evidence of a leaked credential.
- Actual deployed permissions, credentials, dependency advisories, and external account settings have not been audited.

### Data integrity and schema maintenance

- No unique constraint prevents duplicate `(user, media type, catalog title)` entries. Both repeated clicks and independent requests can create duplicates. Whether duplicates should be allowed remains a product decision.
- The SQL file is a setup script rather than a repeatable migration system. Types and policies are created unconditionally, so rerunning it produces already-exists errors even though table creation uses `if not exists`. Existing installations have no documented upgrade procedure.
- Nullable database fields do not match the domain model: `user_grade` and `comment` permit null in SQL but are represented only as optional values in `Media`. Service responses are asserted as `Media` without validation or generated database types.
- TypeScript strict checking is not enabled in the app configuration. Unsafe assumptions, explicit `any`, and unchecked external responses can survive a successful build.
- The owner reference has no explicit account-deletion cascade, and the schema defines no product policy for deleting an account and its collection. Account deletion is not an initial requirement, but the lifecycle remains unresolved.
- No explicit owner index, pagination, or bounded collection reads are defined. All filtering and counters operate on the returned collection in memory; larger lists can become slow or incomplete if the backend limits returned rows.
- Ratings have a database constraint and enums restrict status/type, which are useful integrity protections. Comment length and nonempty title/poster validation are not defined at the database level.

### Usability, accessibility, and operations

- Several authentication/search/edit labels are not programmatically associated with their controls; the edit poster lacks alternative text. Some errors lack alert semantics. Accessibility needs a browser and assistive-technology review before claiming conformance.
- Custom CSS includes responsive and reduced-motion behavior, but no visual/browser checks were performed. CSS presence does not establish mobile usability or contrast compliance.
- Bootstrap depends on an external CDN and its stylesheet link has no integrity metadata. The build does not bundle that stylesheet, so layout depends on its availability at runtime.
- Navigation cannot be bookmarked or restored by URL. This is a usability limitation rather than an explicit assignment failure.
- Search logs external results to the console; errors are handled inconsistently across screens, and there is no documented operational monitoring or support procedure.
- No CI workflow, automated test suite, deployment configuration, or production smoke-test evidence was found. The README provides setup instructions but omits a product description, screenshots, verification commands, and a published-app link.
- The README references an environment example, but its contents/existence were not verified because environment files were excluded from inspection. Setup reproducibility has not been tested from a fresh checkout.

## Verification performed

All commands below were run from `mi-cartelera-personal/` during this audit:

| Command | Result | Meaning |
| --- | --- | --- |
| `npm run build` | Passed | TypeScript compilation and Vite production bundling succeed locally |
| `npm run lint` | Exited successfully with one warning | Missing `searchType` dependency in the search effect remains unresolved |
| `npm test` | Failed: missing `test` script | No automated test result is available; this is missing test infrastructure, not a failing assertion |

No live registration, catalog search, persisted CRUD, cross-account access, deployment, or browser accessibility tests were performed. No environment file was inspected. The multiple commits visible in recent history support incremental development, but do not establish functional acceptance.

## Recommended order for follow-up

1. Document the affected behaviors in feature specs, then fix edit status initialization and explicit clearing of personal values. Add regression coverage for preserving progress and clearing saved data.
2. Fix search category dependencies and request lifecycle; include release year and missing-poster handling. Separate empty search, search failure, and add failure feedback.
3. Apply or compare the intended schema with the deployed database and verify isolation using two accounts. Record the results and introduce a repeatable migration process.
4. Establish Vitest and the required test command, prioritize meaningful service/edit/search regression tests, and add a repeatable verification workflow.
5. Resolve product decisions on duplicates, rating rules, and account lifecycle; align nullable types, validation, and database constraints with those decisions.
6. Improve session failure handling, configuration feedback, accessibility, and submission state. Evaluate pagination and URL navigation based on expected use.
7. Align repository documentation with actual paths, add the missing specs/backlog/design documentation, and complete the delivery README and any chosen optional deployment work.
