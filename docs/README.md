# Documentation map

The current assignment is [details2.md](../details2.md); [details1.md](../details1.md) describes the existing Project 3. Parts A–B document the baseline and contract. E2 now has local implementation and automated evidence; the new migration and live/manual acceptance are still pending.

Current E1 repair status: [remediation and verification](E1-REPAIRS.md), governed by the [repair spec](specs/e1-repairs.md).

## Read in this order

1. [Initial-state audit](INITIAL-STATE.md): historical baseline of E1, including known defects and verification limits.
2. [Full-product PRD](prd/mi-cartelera-personal.md): E1 and E2, business rules, assumptions, and open questions. No implementation details.
3. [Epic index](backlog/epics.md): boundaries and status.
4. [E2 stories and acceptance criteria](backlog/e2-stories.md): independently valuable stories and GIVEN / WHEN / THEN scenarios.
5. [Refinement record](backlog/e2-refinement.md): client facts, proposed edge cases, accepted/rejected treatment, and rationale.
6. [Tickets](backlog/e2-tickets.md): types, dependencies, Definition of Done, and delivery order.
7. [Epic spec](specs/e2-movie-night.md): domain contracts, persistence, proposed migration and RLS, services, traceability, and verification plan.
8. [Interface spec](specs/e2-interface.md): behavior and screen states; references [DESIGN.md](../DESIGN.md) without duplicating visual values.
9. [Design guide](../DESIGN.md) and [brand board](design/brand-board.html): existing Bootstrap-based identity and identified design criteria.

## Scope and evidence discipline

E2 requirements and their implementation remain reviewable; local automated evidence does not replace live acceptance. `[ASSUMPTION]` means a proposed student decision, not a client-confirmed fact. Refinement decisions are the agent's documented proposals; no student approval or user testing is implied. No application implementation or database execution is included in this documentation task.

The approved English paths are `docs/design/brand-board.html` and `docs/INITIAL-STATE.md`. They correspond to the design board and initial-state deliverables named in Spanish in the assignment. Documentation uses English equivalents for story, acceptance, assumption, and normative formats.

## Implementation and acceptance checkpoint

The current checkpoint includes local Part C implementation and the automated portion of Part D. Read [verification](VERIFICACION.md) and [implementation audit](AUDITORIA.md) for actual local evidence. Student browser observations, live migration/RLS tests and final acceptance remain pending.

- **A:** retain `docs/INITIAL-STATE.md` as the initial-state audit. Its creation was not performed in plan mode; do not claim otherwise. Audit the harness separately, including the required importing `CLAUDE.md` if missing.
- **C:** E2 implementation is present by ticket; apply the new E2 migration before live persistence acceptance.
- **D:** Vitest/domain/service/DOM tests and service-only access are implemented; live RLS and browser verification remain pending.
- **D:** `docs/VERIFICACION.md` and `docs/AUDITORIA.md` now record planned manual checks and actual local evidence. The student must still fill the browser “actual result” column.
- **History:** commit documents before corresponding code in the required order. This task does not create commits or rewrite history.
