# Documentation map

The current assignment is [details2.md](../details2.md); [details1.md](../details1.md) describes the existing Project 3. Parts A–B document the baseline and contract. E2 has local implementation, automated evidence and three student verification batches covering browser/security/design outcomes. Exact deployed migration versions and specific unreported subcases remain undocumented; see [the latest audit](AUDITORIA.md#student-verification-batch-3--november-11-2026) for evidence limits. Selected optional features include automatic planning, genre filtering, explicit watched completion and database fit validation.

E1 requirements and historical remediation evidence are consolidated in the [canonical E1 repair document](specs/e1-repairs.md). Current E2/Part D results remain in the implementation audit.

## Read in this order

1. [Initial-state audit](INITIAL-STATE.md): historical baseline of E1, including known defects and verification limits.
2. [Full-product PRD](prd/mi-cartelera-personal.md): E1 and E2, business rules, assumptions, and open questions. No implementation details.
3. [Epic index](backlog/epics.md): boundaries and status.
4. [E2 stories and acceptance criteria](backlog/e2-stories.md): independently valuable stories and GIVEN / WHEN / THEN scenarios.
5. [Refinement record](backlog/e2-refinement.md): client facts, proposed edge cases, accepted/rejected treatment, and rationale.
6. [Tickets](backlog/e2-tickets.md): types, dependencies, Definition of Done, and delivery order.
7. [Epic spec](specs/e2-movie-night.md) and [selected optional-feature spec](specs/e2-optionals.md): domain contracts, migrations/RLS, services, traceability and verification plan for E2-AC01–30.
8. [Interface spec](specs/e2-interface.md): behavior and screen states; references [DESIGN.md](../DESIGN.md) without duplicating visual values.
9. [Design guide](../DESIGN.md) and [brand board](design/brand-board.html): existing Bootstrap-based identity and identified design criteria.

## Scope and evidence discipline

E2 requirements and their implementation remain reviewable; local automated evidence does not replace live acceptance. `[ASSUMPTION]` means a proposed student decision, not a client-confirmed fact. Refinement decisions are the agent's documented proposals; no student approval or user testing is implied. Application implementation and disposable local database tests are recorded in the audit. No deployed database execution is implied by documentation updates.

The approved English paths are `docs/design/brand-board.html` and `docs/INITIAL-STATE.md`. They correspond to the design board and initial-state deliverables named in Spanish in the assignment. Documentation uses English equivalents for story, acceptance, assumption, and normative formats.

## Implementation and acceptance checkpoint

The current checkpoint includes local Part C implementation, automated Part D checks and three student verification batches dated November 11, 2026, using Opera locally. Read [verification](VERIFICACION.md) and [the latest audit checkpoint](AUDITORIA.md#student-verification-batch-3--november-11-2026) for reported outcomes and remaining evidence limits. All AC01–30 rows have student results; this does not independently certify unreported subcases.

- **A:** retain `docs/INITIAL-STATE.md` as the initial-state audit. Its creation was not performed in plan mode; do not claim otherwise. CLAUDE.md imports AGENTS.md; the local review gate is activated, and formatter execution/trust limits are documented separately.
- **C:** E2 implementation is present by ticket; apply any unapplied migrations 001–004 in order before live acceptance; do not replay already-applied migrations.
- **D:** Vitest/domain/service/DOM tests and service-only access are implemented; student reports include browser flows, user/anonymous isolation and direct-write checks. Agent checks remain distinct from student observations.
- **D:** `docs/VERIFICACION.md` and `docs/AUDITORIA.md` record the student's results, Narrator on Windows, reported contrast ratios and any unreported details.
- **History:** commit documents before corresponding code in the required order. This task does not create commits or rewrite history.
- **Rubric process exception:** core and optional implementation commits grouped multiple tickets, so one commit per ticket is not demonstrated. See [the root disclosure](../README.md#historical-process-exceptions); original history is preserved.


## Part D verification status

The [earlier Part D audit](AUDITORIA.md#part-d--quality-and-verification-current-checkpoint) records the seven quality requirements and automated baseline. The [latest student checkpoint](AUDITORIA.md#student-verification-batch-3--november-11-2026) supersedes earlier missing-results statements: all worksheet criteria have reported outcomes, including isolation, completion retries, Narrator and two contrast measurements. Specific unreported subcases remain identified. The literal early Git sequence does not meet the requested order because the first PRD predates the initial-state audit; later E2/optional specs correctly precede their code. History is retained without rewriting it.

Independent adversarial review is an additional selected development bonus: [spec](specs/adversarial-review.md), E2-US10 / AC31–33 / T12. The original four product optionals remain selected. Its results are recorded separately from the earlier Part D checkpoint; local review does not complete pending student/live acceptance.
