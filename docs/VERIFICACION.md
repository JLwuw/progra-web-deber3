# E2 — Verification worksheet

Scope: Movie Night from details2.md, implementing the existing PRD/backlog/specs. Source contract: [epic spec](specs/e2-movie-night.md) and [DESIGN.md](../DESIGN.md).

## Automated verification

Local regression, domain, service and DOM-interaction checks run without project environment files. They simulate catalog/database failure boundaries and are not a live browser, catalog or RLS demonstration. Actual command results are recorded in [AUDITORIA.md](AUDITORIA.md).

## Student-reported checkpoint for Part D

Reported in this conversation on November 11, 2026: **“Browser workflows checked; two-account tests pending.”** The student previously approved the visual changes as looking fine. The date/environment of those browser runs, individual scenario outcomes and applied migration versions are not yet confirmed. This general report does not establish every acceptance/edge/design scenario as passed. The actual-result cells below remain pending until the student supplies the corresponding observations. Two-account isolation is explicitly not yet tested.

The agent's current local Part D checks passed: 113 Vitest tests, strict production build, lint and isolated PostgreSQL regression. These are recorded separately in [the audit](AUDITORIA.md#part-d--quality-and-verification-current-checkpoint) and must not be entered as student browser observations.

## Browser and live-database verification — student results

The student must fill the “actual result” column with what was observed, plus date/environment and evidence links. Pending entries below are deliberately not filled with automated results. After the E1 migration, apply any unapplied E2 migrations 001–004 in order before checking the corresponding live functionality. The agent has tested them in a disposable local cluster, but has not applied or inspected them on the deployed database.

For security checks, use two ordinary accounts and a signed-out public client. Test direct access as well as hidden UI; never use a privileged key as proof of user isolation. Record only outcomes, affected rows and sanitized evidence, never credentials. See [database instructions](../supabase/README.md).

| Criterion | Scenario | Expected result | Actual result (student) | Evidence |
| --- | --- | --- | --- | --- |
| E2-AC01 | Sign out; attempt Movie Night/history/detail; sign in again. | Personal content requires sign-in. | Pending student verification | — |
| E2-AC02 | Submit blank/text/fraction/29/30/600/601 minutes. | Only whole minutes from 30 through 600 are accepted. | Pending student verification | — |
| E2-AC03 | Use a collection containing pending movies, TV, Watching/Finished entries. | Only distinct own pending movies are candidates, with known runtimes in minutes. | Pending student verification | — |
| E2-AC04 | Use 90/100/101-minute movies against a 100-minute budget; include title/runtime ties. | 90 and 100 fit, 101 is not addable; deterministic runtime/title/identity order. | Pending student verification | — |
| E2-AC05 | Simulate missing/zero/non-whole runtime in a catalog response. | Unavailable with a reason; cannot add; never counted as zero. | Pending student verification | — |
| E2-AC06 | Fail one runtime request while others are still loading, retry it successfully, then let the initial load finish. | Loading and error are distinct; a successful retry stays ready after older progress/completion updates. | Pending student verification | — |
| E2-AC07 | Try no pending movies, unknown-only movies, and no fitting movies. | Distinct empty explanations; unknown movies remain explained. | Pending student verification | — |
| E2-AC08 | Add one 90-minute movie with 120 available, then remove it. | Total 90, break 0, remaining 30; empty total/break 0, remaining 120. | Pending student verification | — |
| E2-AC09 | Add 90 and 100 minutes with a budget of 200. | Total 200 including one 10-minute break; zero remaining; save allowed. | Pending student verification | — |
| E2-AC10 | With 200 available and 90 selected, attempt to add 101. | Add blocked with explanation; existing selection unchanged. | Pending student verification | — |
| E2-AC11 | Add three movies, then remove the middle and last movies. | Remaining order preserved; break time recalculated; keyboard focus retained. | Pending student verification | — |
| E2-AC12 | Attempt to add an already selected movie. | One instance only, with explanation. | Pending student verification | — |
| E2-AC13 | Lower budget below selected total; then enter an invalid value. | Selection stays visible; adding/saving blocked; removal remains possible. | Pending student verification | — |
| E2-AC14 | Try blank/space/81-character name, no movies, then trimmed 1/80-character names. | Only nonempty selections with trimmed valid names can be saved. | Pending student verification | — |
| E2-AC15 | Apply E2 migration; save a valid named session and open its detail. | Complete ordered snapshot saved; collection viewing states remain unchanged. | Pending student verification | — |
| E2-AC16 | Double-submit a pending save; simulate a lost response, retry unchanged, and review a source change before the original write finishes. | One concurrent write; failure retains draft; recovery/review keeps the same ID and recovers whichever known attempt committed, without a duplicate session. | Pending student verification | — |
| E2-AC17 | Change/delete selected source entry or its duration before saving. | Explicit review; no automatic save; accept changes and save again. | Pending student verification | — |
| E2-AC18 | Save the same still-pending movie in two different sessions. | Both plans saved; no duplicate movie within either plan. | Pending student verification | — |
| E2-AC19 | Open empty and populated history; use Load more. | Newest-first order with stable ties; names/timestamps/totals; empty state and bounded pages. | Pending student verification | — |
| E2-AC20 | Remove a saved movie from E1 or block TMDB, then open its saved night. | Snapshot order, title, durations, pauses, total/budget/remaining preserved; no editing controls; owner deletion is checked separately. | Pending student verification | — |
| E2-AC21 | Use accounts A/B and a signed-out client for direct reads/inserts/updates/deletes. | No cross-owner or anonymous access; inserts cannot name another owner; updates denied; deletion allowed only for the owner after 002. | Pending student verification | — |
| E2-AC22 | Leave/reload/sign out with an unsaved draft; switch accounts; revisit saved history; run E1 workflows. | Draft discarded; owner-specific history persists; E1 functionality remains. | Pending student verification | — |
| E2-AC23 | Apply 002; cancel then confirm own deletion; simulate failure/retry; attempt foreign/anonymous deletion. | Cancellation leaves the plan; success returns to refreshed history; pending/error feedback works; only owner deletion is allowed and E1 data/other nights stay unchanged. | Pending student verification | — |
| E2-AC24 | Load history across pages, fail and retry a page, then reach the end. | Existing results persist; footer shows loading/retry and remains visible as disabled “All sessions loaded” at completion. | Pending student verification | — |
| DES-01 | Compare E1/E2 styles and dependencies. | Existing Bootstrap classes, tokens and identity; no extra styling library. | Pending student verification | — |
| DES-02 | Compare real cards, controls and posters with DESIGN.md and the brand board. | Established typography, poster proportions and hierarchy. | Pending student verification | — |
| DES-03 | Test widths 375/768/1280 and desktop 200% zoom, with long unbroken names. | No horizontal page overflow; titles wrap and controls remain reachable. | Pending student verification | — |
| DES-04 | Complete the workflow by keyboard, including add/remove/back navigation. | Associated labels, visible focus and logical focus retention. | Pending student verification | — |
| DES-05 | Exercise every async/error/unavailable/over-budget/pending state with assistive technology. | Textual reasons and appropriate live announcements. | Pending student verification | — |
| DES-06 | Enable reduced motion during loading and interactions. | No nonessential spinner/transition motion; text remains. | Pending student verification | — |
| DES-07 | Run E1 login/search/add/filter/edit/delete/details/logout after E2 integration. | Existing workflows and design preserved. | Pending student verification | — |
| DES-08 | Measure actual rendered text/control/focus contrast, including alpha blends. | WCAG AA text targets and non-text contrast; state never color-only. | Pending student verification | — |


## Selected E2 optional features — browser and live database checks

Apply migrations 003_movie_night_fit.sql and 004_movie_night_watched.sql after 000–002 before these checks. Local SQL tests do not deploy them.

| Criteria | Student action and expected result | Actual result (student) |
| --- | --- | --- |
| E2-AC25 | Plan my night from pending movies: optimal time including breaks, no duplicates, editable unsaved draft; single/exact fit works | Pending |
| E2-AC26 | Choose genre / All genres; candidates and suggestions follow filter, selected movies remain; empty matches explained | Pending |
| E2-AC30 | Cancel replacing draft; test no fit and load failure; draft stays. During planning budget/filter/save cannot conflict | Pending |
| E2-AC27 | Confirm Watched on detail; reload detail/history/collection: session stays watched and matching movies show Finished; grades/comments/TV unchanged | Pending |
| E2-AC29 | Cancel completion; test pending/failure/retry; completed button stays disabled and completion cannot be undone; repeat does not reapply collection changes | Pending |
| E2-AC28 | Authenticated direct insert with over-budget/wrong-total/invalid snapshots denied by deployed database; exact fit succeeds | Pending |
| E2-AC29 | Two accounts: foreign completion denied, anonymous denied, direct session update and precompleted insert denied; delete does not revert progress | Pending |
| DES-01–08 | Keyboard, focus, contrast, narrow layouts and announced feedback for added controls; compare existing E1 views | Pending |

Visual follow-up: during Plan my night and other submissions, confirm disabled inputs/selects remain dark and button variants retain their styling. Saved detail must show a prominent completion action near the top, with Planned, pending, retry and Watched states. Actual browser result: Pending.

E2-F04 browser regression: create a named draft, run Plan my night with no fitting refreshed candidates, and confirm the warning and draft remain while the save action still reads Save Night. Only an actual failed/uncertain save should show Retry saving; editing a resolvable failed draft clears obsolete save-failure feedback. Actual student result: Pending.


## Selected quality bonus — independent review

The local gate and independent-subagent forward-test are recorded in [AUDITORIA.md](AUDITORIA.md#selected-quality-bonus--adversarial-review). They are tooling checks, not student browser results. E2-AC31–33 do not require new application UI: observe a future staged commit request, independent findings/review record, rejection of changed/unapproved content, and acceptance only of the reviewed snapshot. Each clone must enable its local hook. Existing live/browser pending cells remain unchanged.
