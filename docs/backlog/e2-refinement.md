# E2 — Refinement record

Status: agent-authored refinement draft, not a transcript of student approval. Accepted means included in this proposed documentation baseline; the student may revise it before implementation. Source facts are in details2.md. Assumption identifiers refer to the PRD.

## Client decisions preserved

Integer available minutes from 30 to 600; own pending movies only; 10 minutes between movies; exact fit allowed; duration from TMDB; unknown duration prevents adding and requires an explanation; saving does not change viewing state. These are requirements, not assumptions.

## Proposed edge cases and decisions

| ID | Case proposed in refinement | Disposition | Reason and resulting requirement |
| --- | --- | --- | --- |
| R01 | Same movie in different sessions | Accept, S1 | Alternative plans are useful; allow reuse, E2-AC18 |
| R02 | Same movie twice in one draft | Reject duplicate inclusion, S1 | Prevent accidental double counting, E2-AC12 |
| R03 | Unspecified result order | Accept deterministic duration/title/identity order, S2 | Easier comparison and repeatable results, E2-AC04 |
| R04 | Editing/deleting saved plans | Reject for this release, S3 | Save-and-consult is sufficient; immutable snapshots bound scope, E2-AC20 |
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
| R24 | Automatic fill, genre filter, mark completed | Reject from required scope | Optional features need separate specs; completion conflicts with the no-state-change rule |
| R25 | Backend repeats the full time-budget calculation | Defer optional hardening | Client explicitly lists database fit validation as extra; required RLS and basic constraints remain mandatory |
| R26 | Ambiguous retry after a lost save response | Accept idempotent draft identity | A retry should recover the same completed plan, not silently duplicate it; supports E2-AC16 |

## Pending student review

Confirm or amend S1–S12, especially immutable plans, name requirements, and deletion behavior. Changes must propagate PRD → criteria → tickets/specs before code. New edge cases must be added here with a decision and reason; rejected scope should not be implemented silently.
