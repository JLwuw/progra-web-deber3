# Epic index

Owner deletion and persistent history pagination are tracked by E2-US5, E2-AC23/24 and E2-T07; migration 002 is required for deletion.

Source: [full-product PRD](../prd/mi-cartelera-personal.md). Current assignment: [details2.md](../../details2.md).

## E1 — Personal collection

Status: already built, with known gaps and unverified behavior recorded in [INITIAL-STATE.md](../INITIAL-STATE.md). Authentication, catalog search, private collection CRUD, ratings/comments, and title details form the existing product. Keep its functioning workflows intact. This index does not retroactively certify completion or invent historical specs.

## E2 — Movie Night

Status: implemented locally; migration application and live/manual acceptance remain pending. Let an authenticated user choose a time budget, build a fitting session from their own pending movies, save it, and consult it later.

- [Stories and acceptance criteria](e2-stories.md)
- [Refinement and assumptions](e2-refinement.md)
- [Tickets and Definition of Done](e2-tickets.md)
- [Epic technical spec](../specs/e2-movie-night.md)
- [Interface spec](../specs/e2-interface.md)
- [Design criteria](../../DESIGN.md#verifiable-design-criteria)

Traceability uses E2-US identifiers for stories, E2-AC for acceptance criteria, E2-T for tickets, and DES for design criteria. Verification remains planned until evidence is recorded by the student.


## Selected optional E2 extensions

The user selected four extensions from details2.md §1.5: automatic planning, movie-genre filtering, explicit watched-session completion, and database fit validation. These extend E2 rather than replace E1. Read [optional-feature specification](../specs/e2-optionals.md), stories E2-US6–US9, criteria E2-AC25–30 and tickets E2-T08–T11 before implementing. User terminology “gender” means movie genre.

## Selected development-quality bonus

Independent adversarial review before every commit is tracked by E2-US10, E2-AC31–33 and E2-T12. See [review spec](../specs/adversarial-review.md). This extends the development workflow; it adds no Movie Night interface or social/deployment feature.
