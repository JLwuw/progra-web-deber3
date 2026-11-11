# E2 — Refinement record

Status: agent-authored refinement draft, not a transcript of student approval. Accepted means included in this proposed documentation baseline; the student may revise it through updated criteria and specs. Source facts are in details2.md. Assumption identifiers refer to the PRD.

## Client decisions preserved

Integer available minutes from 30 to 600; own pending movies only; 10 minutes between movies; exact fit allowed; duration from TMDB; unknown duration prevents adding and requires an explanation; saving does not change viewing state. These are requirements, not assumptions.

## Proposed edge cases and decisions

| ID | Case proposed in refinement | Disposition | Reason and resulting requirement |
| --- | --- | --- | --- |
| R01 | Same movie in different sessions | Accept, S1 | Alternative plans are useful; allow reuse, E2-AC18 |
| R02 | Same movie twice in one draft | Reject duplicate inclusion, S1 | Prevent accidental double counting, E2-AC12 |
| R03 | Unspecified result order | Accept deterministic duration/title/identity order, S2 | Easier comparison and repeatable results, E2-AC04 |
| R04 | Editing/deleting saved plans | Editing rejected; deletion now accepted by explicit user request | S3 revised: owner-only confirmed deletion from detail; snapshot contents stay immutable, E2-AC20/23 |
| R05 | Delete a collection entry used by a saved session | Accept preserving historical plan, S4 | Do not destroy a previously saved plan; E1 deletion remains unchanged, E2-AC20 |
| R06 | Name and viewing date | Accept required trimmed name and saved timestamp; reject scheduled date, S5 | Distinguish plans without calendar scope, E2-AC14/19/20 |
| R07 | Empty session or blank name | Reject saving, S5/S6 | Empty plans have no viewing value, E2-AC14 |
| R08 | Exact budget and one movie | Accept | Client explicitly includes exact fit and excludes endpoint breaks, E2-AC08/09 |
| R09 | Unknown, zero, negative, fractional runtime | Accept unavailable treatment, S8 | Only trustworthy whole minutes support the budget, E2-AC05 |
| R10 | Catalog failure for one movie | Accept partial results and retry, S8 | Failure is not missing metadata; valid results stay usable, E2-AC06 |
| R11 | Reorder selected movies | Reject extra reorder controls, S6 | Addition order is enough; removal preserves it, E2-AC11 |
| R12 | Lower budget below current total | Accept retained but invalid draft, S7 | Avoid silent loss; block adding/saving and allow removal, E2-AC13 |
| R13 | Blank, decimal, text, or out-of-range budget | Reject as valid input, S7 | Enforce client format/range and explicit feedback, E2-AC02 |
| R14 | Runtime or eligibility changes before saving | Accept refresh-and-review, S4 | Do not silently save a different or invalid plan, E2-AC17 |
| R15 | Movie changes after saving | Accept immutable historical durations/title/order, S4 | Saved plans must remain understandable, E2-AC20 |
| R16 | Double click or concurrent save | Accept pending-state guard, S10 | Prevent concurrent duplicate submissions and partial plans, E2-AC16 |
| R17 | Reload, logout, or account change during planning | Reject draft persistence, S10 | Avoid account leakage and unrequested recovery scope, E2-AC22 |
| R18 | No pending movies versus none fitting | Accept separate explanations | Give actionable feedback rather than an unexplained empty list, E2-AC07 |
| R19 | Unknown duration entries disappear from results | Reject hiding them, S9 | The client requires an explanation, E2-AC05/07 |
| R20 | Next movie fits alone but not with the next break | Reject adding it | Breaks count in the remaining budget, E2-AC10 |
| R21 | Duplicate entries already present in E1 | Accept planner deduplication only, S12 | Avoid rewriting E1 collection behavior, E2-AC03/12 |
| R22 | Saved-list sorting or empty list unspecified | Accept newest first and clear empty state, S11 | Recent plans are easiest to recover, E2-AC19 |
| R23 | Unauthorized direct reads/writes | Reject access | Required real ownership isolation, E2-AC21 |
| R24 | Automatic fill, genre filter, mark completed | Original exclusion superseded by explicit user selection | E2-US6–US8, E2-AC25–27/29/30 and [optional spec](../specs/e2-optionals.md) now select these features. Saving still changes no progress; separate confirmed completion does. |
| R25 | Backend repeats the full time-budget calculation | Original deferral superseded by explicit user selection | E2-US9, E2-AC28, E2-T11 and [optional spec](../specs/e2-optionals.md) now require database fit enforcement; RLS remains mandatory. |
| R26 | Ambiguous retry after a lost save response | Accept idempotent draft identity, S10 | A retry should recover the same completed plan, not silently duplicate it; supports E2-AC16 |
| R27 | Leave the planner for another screen before saving | Accept discarding the mounted draft, S10 | Keep the documented in-memory draft lifecycle; saved plans remain available in history. Navigating away is not a background save. |

## User-requested extension

- Saved-session deletion is required from the detail page, with confirmation, pending/error handling and owner-only RLS. The original no-deletion decision is superseded, not silently bypassed.
- History uses an exact row count to distinguish exhausted results from additional pages; the footer remains visible while loading, on error, and after completion. A short server-capped page alone does not prove exhaustion.

## Student review and change control

The requested implementation follows S1–S12, including immutable plans, name requirements, and deletion behavior. Amend these working decisions through the documents before changing code. Changes must propagate PRD → criteria → tickets/specs before code. New edge cases must be added here with a decision and reason; rejected scope should not be implemented silently.


## Optional-feature refinement

| Case | Decision and rationale | Criteria |
| --- | --- | --- |
| “gender” versus genre | Interpret as movie genre, matching details2.md; no demographic filtering | E2-AC26 |
| Several valid combinations | Maximize occupied minutes, then fewer movies, then stable sorted input; reproducible and no unnecessary breaks | E2-AC25 |
| Existing selection when suggesting | Replace only after confirmation; failed/empty suggestion preserves draft | E2-AC30 |
| Unknown duration/genre | Never invent durations; missing genre matches only All genres; partial catalog failures remain retryable | E2-AC25/26 |
| Watched contradicts earlier no-state-change rule | Saving still changes no progress; a separate explicit completion action deliberately updates owned movie progress atomically | E2-AC27 |
| Deleted titles in a saved session | Skip missing entries; do not recreate deleted collection content | E2-AC27 |
| Overlapping sessions and repeated completion | Only the chosen session is marked; retries of a completed session do not reapply changes or affect re-added titles | E2-AC29 |
| Undo watched completion | Reject undo in this release: original per-movie states are not recoverable from a completed plan | E2-AC29 |
| Caller supplies fake totals or completion timestamp | Enforce fit in CHECK and completion through an owner-checked transaction; reject forged initial completion | E2-AC28/29 |
| False catalog runtimes | Database enforces supplied runtimes and arithmetic, not external catalog authenticity; no server TMDB integration is implied | E2-AC28 |
| Invalid pre-existing session payload | Migration fails transactionally for manual review; do not silently delete or change saved plans | E2-AC28 |
| Suggestion warning after a named draft | Keep planning/general feedback separate from save failure; no-fit preserves the draft and Save Night label, while actual failed/uncertain saves offer retry | E2-AC16/30; audit E2-F04 |


## Adversarial review refinement

- Accept a separate subagent for every proposed commit, including docs/tests/tooling; self-review alone does not satisfy the bonus (E2-AC31).
- Bind a review to the staged tree, parent and request. Restaging or changing the parent requires a fresh review; an unchanged tree with a renewed request also invalidates the old response (E2-AC32).
- Keep records outside the staged tree to avoid circular approval. Preserve local response history; evidence can be exported for a later separately reviewed commit (E2-AC32/33).
- Reject silent replacement of existing hooks, staging by reviewers, fabricated approvals and false live-test claims. A local hook cannot prove reviewer identity or prevent deliberate local bypass; no server enforcement is implied (E2-AC33).
