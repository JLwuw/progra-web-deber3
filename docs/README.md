# Documentation map

The current assignment is [details2.md](../details2.md); [details1.md](../details1.md) describes the existing Project 3. This documentation prepares section 1.4.B. E2 is specified, not implemented or verified.

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

All E2 documents are drafts ready for review. `[ASSUMPTION]` means a proposed student decision, not a client-confirmed fact. Refinement decisions are the agent's documented proposals; no student approval or user testing is implied. No application implementation or database execution is included in this documentation task.

The approved English paths are `docs/design/brand-board.html` and `docs/INITIAL-STATE.md`. They correspond to the design board and initial-state deliverables named in Spanish in the assignment. Documentation uses English equivalents for story, acceptance, assumption, and normative formats.

## Scope of the current review

The current review covers Parts A and B only. Parts C and D are future work, not missing deliverables for this checkpoint. Planned implementation and verification are not evidence of completed work.

- **A:** retain `docs/INITIAL-STATE.md` as the initial-state audit. Its creation was not performed in plan mode; do not claim otherwise. Audit the harness separately, including the required importing `CLAUDE.md` if missing.
- **C:** implement E2 by ticket after its documents are committed.
- **D:** add Vitest and run domain tests, implement service-only external access, verify E1 regression behavior, and demonstrate RLS with two accounts.
- **D:** create `docs/VERIFICACION.md` with the student's “actual result”, and `docs/AUDITORIA.md` with criterion status and evidence. Planned checks in the specs are not results.
- **History:** commit documents before corresponding code in the required order. This task does not create commits or rewrite history.
