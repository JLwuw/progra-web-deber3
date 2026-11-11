# E2 — Tickets

Status: all tickets are TODO; documentation only. Read the PRD, refinement, stories, epic spec, interface spec, and DESIGN.md before implementing. Dependencies give implementation order, not permission to bypass the spec.

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
- **Work:** add planner service orchestration and runtime-only catalog retrieval; deduplicate pending movies; distinguish unknown runtime from request failure; support cancellation and retry. Move the existing search fetch/response mapping into tmdbService without changing E1 search behavior; expose auth subscriptions via authService so App does not use the Supabase client directly.
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
- **DoD:** shared DoD plus the student fills “resultado obtenido” for browser checks; audit marks every criterion cumple/no cumple/sin verificar with evidence. Security probes include attempts to insert under another owner and update/delete a foreign session, not only hidden UI. Existing E1 defects are separated from introduced regressions.

## Non-goals

These tickets do not select optional optimizer/genre/completion/deployment work, rewrite E1, repair every old E1 defect, or claim that Part A's process has already been satisfied.
