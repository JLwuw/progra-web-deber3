# E2 — Stories and acceptance criteria

Status: implemented locally; final browser/live acceptance remains pending. Scope and assumptions come from the [PRD](../prd/mi-cartelera-personal.md). Criteria intentionally describe observable behavior without implementation details. GIVEN / WHEN / THEN express the assignment’s acceptance format in English; user stories use As a / I want / so that.

## E2-US1 — Find movies for the time I have

**As a** user with a personal collection, **I want** to enter my available time and see pending movies that fit, **so that** I can choose something I can finish.

- **E2-AC01 — Access:** GIVEN I am signed out, WHEN I try to access Movie Night, THEN I must sign in before seeing personal content.
- **E2-AC02 — Budget:** GIVEN an empty, nonnumeric, fractional, below-30, or above-600 time value, WHEN I submit it, THEN the accepted range and format are explained and no valid planning session begins. GIVEN 30 or 600 minutes, WHEN I submit it, THEN that boundary value is accepted.
- **E2-AC03 — Eligibility:** GIVEN my collection includes pending movies, movies in other states, and TV shows, WHEN I check what fits, THEN only my pending movies are offered and each movie with a known duration shows its minutes. Duplicate entries for the same title appear only once.
- **E2-AC04 — Individual fit and order:** GIVEN a valid budget of 100 minutes and movies lasting 90, 100, and 101 minutes, WHEN I check what fits, THEN the 90- and 100-minute movies are offered in that order and the 101-minute movie is not offered as addable. Ties are ordered by title and a stable identity.
- **E2-AC05 — Unknown duration:** GIVEN a pending movie without a valid duration, WHEN results are displayed, THEN it appears as unavailable with a reason and cannot be added.
- **E2-AC06 — Retrieval states:** GIVEN durations are being retrieved, WHEN I wait for results, THEN I see a loading indication; GIVEN a request fails, WHEN it finishes, THEN I see the failure and can retry without confusing it with an unknown duration or losing valid results for other movies.
- **E2-AC07 — Empty states:** GIVEN I have no pending movies or no movie with a known duration fits, WHEN I check what fits, THEN I see the corresponding explanation; movies without durations remain identified as unavailable.

## E2-US2 — Assemble a session that fits

**As a** user who found pending movies, **I want** to add and remove movies while seeing their durations and breaks, **so that** I can use my available time without exceeding it.

- **E2-AC08 — Single movie and empty draft:** GIVEN an empty session, WHEN I add a 90-minute movie with 120 minutes available, THEN the total is 90 and 30 remain, with no break added. Removing the last movie resets the total and break time to zero and restores the full budget.
- **E2-AC09 — Breaks and exact fit:** GIVEN 200 minutes available and a selected 90-minute movie, WHEN I add a 100-minute movie, THEN the total is 200 including one 10-minute break, with zero minutes remaining. The session is valid.
- **E2-AC10 — Over budget:** GIVEN the same budget and a selected 90-minute movie, WHEN I try to add a 101-minute movie, THEN it is not added, the draft is preserved, and an explanation states that the movie and break would exceed the available time.
- **E2-AC11 — Removal and order:** GIVEN three selected movies, WHEN I remove one, THEN the remaining order is preserved and the total is recalculated with one break. Addition order is viewing order.
- **E2-AC12 — Repeated title:** GIVEN a movie is already selected, WHEN I try to add it again, THEN it is not duplicated and an explanation states that it is already included.
- **E2-AC13 — Reduced budget:** GIVEN a valid draft, WHEN I reduce the budget below the total or enter an invalid time, THEN the draft remains visible, the problem is explained, and I cannot add movies or save until it is corrected. I can remove movies.

## E2-US3 — Save my plan

**As a** user with a prepared session, **I want** to save it with a name, **so that** I can retrieve my plan without selecting the movies again.

- **E2-AC14 — Name and minimum content:** GIVEN an empty name, a whitespace-only name, a name longer than 80 characters, or an empty session, WHEN I try to save, THEN the problem is explained and nothing is saved. A name with 1 or 80 characters after trimming outer spaces is valid.
- **E2-AC15 — Successful save:** GIVEN a valid named session, WHEN I save it, THEN a complete session is preserved with its order, durations, breaks, budget, and save timestamp; the movies remain pending and the saved detail is displayed.
- **E2-AC16 — Failure and pending save:** GIVEN a save is pending, WHEN I try to save again, THEN no concurrent save begins; GIVEN saving fails, WHEN I see the error, THEN I retain the draft and can retry. No partially saved session may appear. GIVEN the save response was lost and I do not know whether the session was saved, WHEN I retry the unchanged draft, THEN I recover the same saved session if it already exists, rather than creating a duplicate.
- **E2-AC17 — Changed source:** GIVEN a movie was removed, changed viewing state, or changed duration before saving, WHEN I try to save, THEN I am asked to review the draft with current information and a different plan is not silently saved. A duration that becomes unavailable prevents saving that selection.
- **E2-AC18 — Reuse across sessions:** GIVEN a movie appears in a saved session, WHEN I create another valid session with the same still-pending movie, THEN I can save it too.

## E2-US4 — Consult my saved sessions

**As a** user with saved sessions, **I want** to consult my plans and their details, **so that** I can remember what to watch and how much time I reserved.

- **E2-AC19 — Saved list:** GIVEN I have saved sessions, WHEN I consult them, THEN they appear newest first with their name, save timestamp, and total; ties have a stable order. If I have none, I see an empty state.
- **E2-AC20 — Historical detail:** GIVEN a saved session, WHEN I open its detail, THEN I see its movies in order, saved durations, breaks, total, budget, and remaining time, even if I later remove a movie from my collection or its information changes. No editing or scheduled viewing date is offered; owner deletion is specified separately in E2-AC23.
- **E2-AC21 — Isolation:** GIVEN two users with different sessions, WHEN one attempts to consult or modify the other user's sessions, THEN access and modification are denied, even through an attempt that bypasses normal navigation. A signed-out person is also denied.
- **E2-AC22 — Draft lifecycle and regression:** GIVEN an unsaved draft, WHEN I leave the planner, reload, or sign out, THEN it is not retained or shown in another account; saved plans return when their owner signs in. Existing authentication, search, collection, editing, and detail features remain available.

## E2-US5 — Remove a saved session

**As a** user with saved plans, **I want** to delete a session from its detail view, **so that** I can remove plans I no longer need.

- **E2-AC23 — Owner deletion:** GIVEN my saved session is open, WHEN I confirm deleting it, THEN the session is removed and I return to refreshed Saved Nights. Its movies, collection entries, ratings, comments and other sessions remain unchanged. Cancelling confirmation makes no change. Pending deletion prevents duplicate submission; failure retains the detail and offers retry. Other accounts and signed-out visitors cannot delete it.
- **E2-AC24 — History pagination feedback:** GIVEN saved history, WHEN I load another page, THEN existing sessions stay visible, the control indicates pending work, and errors can be retried. Once all sessions are loaded the control remains visible and disabled with an explicit completion label. If no further rows exist, no active load-more control is offered; short server-capped pages must not hide remaining sessions.

## E2-US6 — Plan my night automatically

**As a** user with limited free time, **I want** a suggested combination of my pending movies, **so that** I can fill my evening without exceeding it.

- **E2-AC25 — Best fitting suggestion:** GIVEN eligible movies with known durations and a valid budget, WHEN I choose Plan my night, THEN the suggested draft maximizes total movie-plus-break minutes without exceeding the budget, uses each movie once, honors the chosen genre, and resolves equal totals by fewer movies then a stable order. It is not saved automatically.
- **E2-AC30 — Safe replacement:** GIVEN an existing draft, WHEN I request a suggestion, THEN replacement requires confirmation. Cancelling, a collection-load failure, or no fitting movies preserves it. Loading/pending recovery prevents conflicting edits; unavailable durations are explained and excluded.

## E2-US7 — Filter planning choices by genre

**As a** user choosing what to watch, **I want** to filter my pending movies by genre, **so that** my choices and automatic plan match my mood.

- **E2-AC26 — Genre:** GIVEN movie genre metadata, WHEN I choose a genre, THEN only matching candidates are shown and used in suggestions; All genres restores the full list. Existing draft movies remain selected. Missing genre metadata is not assumed to match; empty matches and metadata failures have explanations.

## E2-US8 — Mark a saved night watched

**As a** session owner, **I want** to mark my session watched, **so that** its movies move to Watched without updating each title separately.

- **E2-AC27 — Completion:** GIVEN my uncompleted saved session, WHEN I confirm Mark as watched, THEN the session is recorded as watched and all matching movie entries still in my collection become Watched together. Saving alone never does this. Cancellation or server rejection leaves everything unchanged; a lost response is safely recoverable by retry; deleted entries are not recreated, other sessions/users/TV/ratings/comments are unchanged, and deleting the session does not undo progress.
- **E2-AC29 — Safe owner-only completion:** GIVEN a watched session or another user’s session, WHEN completion is retried or attempted without ownership/sign-in, THEN retries of the already-completed owned session are harmless and foreign/anonymous attempts are denied. Completion cannot be undone from the session; the completed action stays disabled; pending/error/success state is visible.

## E2-US9 — Trust the saved time budget

**As a** session owner, **I want** over-budget or malformed sessions rejected regardless of the interface used, **so that** my saved plans obey the same timing rule.

- **E2-AC28 — Database invariant:** GIVEN a direct save request bypassing the normal interface, WHEN its declared durations plus breaks exceed the budget, or its selection/durations/total are invalid, THEN the database rejects it. Exact fit and one movie without breaks remain valid. Ordinary callers cannot forge completion or bypass ownership checks.

## E2-US10 — Independently review changes before committing

**As a** project maintainer, **I want** a separate reviewer to challenge proposed changes before each commit, **so that** defects and unsupported acceptance claims are caught before they enter history.

- **E2-AC31 — Independent review:** GIVEN proposed changes, WHEN I request a commit, THEN a separate reviewer examines the changes and relevant requirements, reports concrete findings with evidence, and does not modify the work or approve its own implementation.
- **E2-AC32 — Approval matches the proposal:** GIVEN missing, failed, incomplete or outdated review, WHEN I attempt to commit, THEN the local gate blocks it. A passing review permits only the reviewed staged version and parent; changes to either require another review.
- **E2-AC33 — Honest operation:** GIVEN existing staging, hooks or unavailable verification, WHEN review is prepared or activated, THEN staging is preserved, incompatible hook settings are not silently replaced, missing evidence is reported accurately, and no commit/push happens without its own authorization. Local bypass limits are documented.

## INVEST review

- **Independent:** finding fitting movies has value without saving; assembling adds live planning; saving adds persistence; consulting adds retrieval. Stories share the domain model but remain separate user outcomes. Technical prerequisites are explicit ticket dependencies, not disguised user stories.
- **Negotiable:** S1–S12 are visible proposals; wording and interface composition can change while client rules remain fixed.
- **Valuable:** each story states its user benefit in “so that”.
- **Estimable:** boundaries, failures, and expected behavior are defined; the selected time optimizer is explicit; no calendar or social scope is hidden.
- **Small:** each story covers one stage of the workflow; implementation is split into bounded tickets.
- **Testable:** each E2-AC scenario has an observable result and a planned verification mapping in the epic spec.
