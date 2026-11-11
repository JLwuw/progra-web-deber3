# Mi Cartelera Personal — Product Requirements Document

Status: draft for section 1.4.B of details2.md. E1 is the existing product; E2 is the proposed extension. “Built” does not mean all requirements have been verified: the initial-state audit records E1 gaps.

## Problem

People need a private place to remember movies and TV shows they want to watch, are watching, or have finished, together with their own opinions.

A saved watchlist does not solve another everyday problem: when a user has a limited amount of free time, they do not know which pending movies they can finish. Movie Night helps them assemble and save a session that fits their available time, including breaks. The intended outcome is that users finish what they start; no measured success rate is claimed yet.

## Users

Registered users who keep a personal movie and TV collection. The same users plan Movie Night sessions from their own pending movies. There are no new social roles or shared sessions.

## Scope

### E1 — Personal collection (already built; preserve existing behavior)

Registration, sign-in, sign-out, protected content, movie/TV search, saving titles, viewing a private collection, editing viewing status and optional personal ratings/comments, deleting saved titles, and expanded title details. Search should present poster, title, and year. Detail includes synopsis, cast, public information, and personal information. Existing status/rating/date filters and status summaries must continue working.

E1 acceptance gaps remain tracked by the initial-state audit. E2 must not be used as a reason to rewrite the original product or silently change its rules.

### E2 — Movie Night (new, required)

The signed-in user supplies available minutes, sees which pending movies fit with their durations, assembles a session with one or more movies, sees total and remaining time, and saves and later consults their private sessions and details. Unknown durations and catalog failures receive explicit explanations. Adding a movie that would exceed the budget is prevented.

## Out of scope

Streaming or downloading content; shared sessions or viewing with friends; reminders and notifications; calendar or streaming-platform synchronization; recommendations outside the user's collection; TV shows in a session; automatic combinations; genre filtering; marking sessions completed or changing their movies to Watched; editing or deleting saved sessions in this E2 release; and offline planning.

Optional assignment features require their own stories, criteria, and spec before implementation. E1's unimplemented optional sorting and public deployment are not added to E2 scope.

## Business rules

### E1 — preserved product rules

- Only signed-in users access product content. Users can sign out throughout that experience.
- Each user can see and change only their own personal collection.
- Saved titles are movies or TV shows, each with one state: To Watch, Watching, or Watched.
- Personal ratings are optional whole numbers from 1 through 5. Comments are optional personal text. Both are independent of the public rating.
- Adding, editing, or removing a personal entry does not change the public catalog or another user's collection.

### E2 — client decisions

- Available time is a whole number of minutes from 30 through 600, inclusive.
- Only movies in the user's own To Watch collection are eligible for a session.
- Between consecutive movies there is a 10-minute break. There is no break before the first movie or after the last.
- A session fits when its movie durations plus those breaks are less than or equal to the available time. An exact fit is valid.
- Duration comes from TMDB. A movie without a known duration cannot be added, and the user sees why.
- Saving a session leaves its movies in To Watch; saving is not evidence that the user watched them.
- Sessions and their details are private to their owner.

## Suppositions

These are proposed student decisions, labeled `[ASSUMPTION]` and reflected in E2 criteria. Their rationale is part of refinement.

- **S1 [ASSUMPTION]:** A movie may appear in different saved sessions, but only once within one session. This allows alternative plans without accidentally counting the same movie twice.
- **S2 [ASSUMPTION]:** Eligible movies are ordered by duration ascending, then title ascending, then a stable title identity. This makes short options easy to compare and keeps ties predictable. Unavailable entries appear separately in title order.
- **S3 [ASSUMPTION]:** Saved sessions cannot be edited or deleted in this release. Users may create another session instead. This bounds the required save-and-consult workflow.
- **S4 [ASSUMPTION]:** A saved session preserves its titles, movie order, and known durations at save time. Removing a movie from the collection, changing its viewing state, or later catalog changes do not rewrite past plans. Before saving, ownership, eligibility, and known durations are checked again; changes require the user to review the draft.
- **S5 [ASSUMPTION]:** A session requires a trimmed name of 1–80 characters and records when it was saved. It has no scheduled viewing date. A name helps distinguish plans without introducing calendar behavior.
- **S6 [ASSUMPTION]:** Empty sessions cannot be saved. Selection order is viewing order. Removal closes the gap and recalculates breaks; reordering controls are outside scope.
- **S7 [ASSUMPTION]:** Blank, nonnumeric, fractional, or out-of-range available time is invalid. Lowering the budget keeps the draft visible but prevents additions and saving while over budget, so users can remove movies deliberately.
- **S8 [ASSUMPTION]:** Zero, negative, nonnumeric, or non-whole durations are unknown/unusable. A catalog request failure is shown as a retryable retrieval failure, not as proof that duration is absent. Unaffected movies remain usable.
- **S9 [ASSUMPTION]:** Initial fit results compare each movie with the full valid budget; while building a draft, add availability uses the remaining budget including the next required break. Unavailable-duration movies remain visible with their reason, and known movies exceeding the full budget may be summarized separately.
- **S10 [ASSUMPTION]:** Drafts are not persisted across reloads or sign-out. Successful save clears the draft after opening the saved detail. Failed save preserves it and offers retry; only one save can be pending at once.
- **S11 [ASSUMPTION]:** Saved sessions are listed newest first, with a stable identity resolving timestamp ties. Viewing saved details does not require a fresh catalog request.
- **S12 [ASSUMPTION]:** Duplicate E1 collection entries referring to the same movie are represented once in the planner, without modifying the collection. This preserves E1 behavior while avoiding duplicate session titles.

## Open questions

- The student still needs to confirm or revise S1–S12 and their associated acceptance criteria before implementation. They are explicit working decisions, not hidden requirements.
- How will the qualitative goal “finishes what they start” be evaluated? Completion tracking and analytics are not currently in scope.
- Which pre-existing E1 defects must be fixed before E2 delivery? Record them as separately specified work; the regression baseline must distinguish old defects from newly introduced ones.
- Are any optional assignment features selected? None are assumed in this draft.
- E1 still has unresolved product policies, including duplicate collection entries, when ratings may be assigned, and account recovery/deletion. E2 does not settle those policies globally.
