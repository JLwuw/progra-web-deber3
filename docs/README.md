# Documentation map

The current assignment is [details2.md](../details2.md); [details1.md](../details1.md) describes the existing Project 3. Parts A–B document the baseline and contract. E2 now has local implementation and automated evidence; the deployed migration state and live/manual acceptance are still unverified. Selected optional features include automatic planning, genre filtering, explicit watched completion and database fit validation.

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

The current checkpoint includes local Part C implementation and the automated portion of Part D. Read [verification](VERIFICACION.md) and [implementation audit](AUDITORIA.md) for actual local evidence. Student browser observations, live migration/RLS tests and final acceptance remain pending.

- **A:** retain `docs/INITIAL-STATE.md` as the initial-state audit. Its creation was not performed in plan mode; do not claim otherwise. Audit the harness separately, including the required importing `CLAUDE.md` if missing.
- **C:** E2 implementation is present by ticket; apply any unapplied migrations 001–004 in order before live acceptance; do not replay already-applied migrations.
- **D:** Vitest/domain/service/DOM tests and service-only access are implemented; live RLS and browser verification remain pending.
- **D:** `docs/VERIFICACION.md` and `docs/AUDITORIA.md` now record planned manual checks and actual local evidence. The student must still fill the browser “actual result” column.
- **History:** commit documents before corresponding code in the required order. This task does not create commits or rewrite history.


## Part D verification status

The [current Part D audit](AUDITORIA.md#part-d--quality-and-verification-current-checkpoint) checks all seven mandatory quality/verification requirements and all E2/design criteria. Local domain tests, TypeScript/service boundaries, credential-pattern scan, build, lint and isolated SQL regression pass. The student reports browser workflows checked, but detailed actual-result cells and two-account isolation remain pending. The literal early Git sequence does not meet the requested order because the first PRD predates the initial-state audit; later E2/optional specs correctly precede their code. History is retained without rewriting it.

Independent adversarial review is an additional selected development bonus: [spec](specs/adversarial-review.md), E2-US10 / AC31–33 / T12. The original four product optionals remain selected. Its results are recorded separately from the earlier Part D checkpoint; local review does not complete pending student/live acceptance.
