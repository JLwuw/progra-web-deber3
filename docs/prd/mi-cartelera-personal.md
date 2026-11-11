# Mi Cartelera Personal — Product Requirements Document

Status: product requirements for details2.md. E1 is the existing product; E2 is implemented locally with live acceptance still pending. “Built” does not mean all requirements have been verified: the initial-state audit records E1 gaps.

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

The signed-in user supplies available minutes, sees which pending movies fit with their durations, assembles a session with one or more movies, sees total and remaining time, and saves and later consults their private sessions and details. Owners can delete a saved session from its detail view after confirmation. Unknown durations and catalog failures receive explicit explanations. Adding a movie that would exceed the budget is prevented.

### Selected optional E2 features

- Plan my night suggests a combination of eligible pending movies that uses the available time as fully as possible, including breaks. Suggestions respect the chosen genre. They are editable drafts, never automatic saves.
- Filter pending candidates by one movie genre or All genres. Changing the filter does not remove already-selected movies.
- Owners can explicitly mark a saved session Watched. This is a separate confirmed action; saving alone still leaves movies pending.
- Saved sessions must fit their declared time budget even if someone bypasses the normal interface.

## Out of scope

Streaming or downloading content; shared sessions or viewing with friends; reminders and notifications; calendar or streaming-platform synchronization; recommendations outside the user's collection; TV shows in a session; editing saved sessions in this E2 release; and offline planning.

Optional assignment features require their own stories, criteria, and spec before implementation. E1's unimplemented optional sorting and public deployment are not added to E2 scope.

## Business rules

### E1 — preserved product rules

- Only signed-in users access product content. Users can sign out throughout that experience.
- Each user can see and change only their own personal collection.
- Saved titles are movies or TV shows, each with one state: To Watch, Watching, or Watched.
- Personal ratings are optional whole numbers from 1 through 5. Comments are optional personal text. Both are independent of the public rating.
- Adding, editing, or removing a personal entry does not change the public catalog or another user's collection.

### E1 — repair decisions

- New duplicate collection entries are rejected per movie/TV identity. Existing duplicates require manual review without silently deleting personal notes or ratings.
- Personal ratings may be assigned in any viewing state and cleared. Empty comments clear the note; no new comment-length limit is imposed.
- New entries default to To Watch. Removal requires confirmation.
- Existing status, exact-rating/unrated and local date-range filters and whole-collection counters remain available.
- Account recovery/deletion remains outside this repair scope.

### E2 — client decisions

- Available time is a whole number of minutes from 30 through 600, inclusive.
- Only movies in the user's own To Watch collection are eligible for a session.
- Between consecutive movies there is a 10-minute break. There is no break before the first movie or after the last.
- A session fits when its movie durations plus those breaks are less than or equal to the available time. An exact fit is valid.
- Duration comes from TMDB. A movie without a known duration cannot be added, and the user sees why.
- Saving a session leaves its movies in To Watch; saving is not evidence that the user watched them. A separate owner-confirmed Mark as watched action completes the session and marks all matching movies still in that owner’s collection Watched together. This explicitly revises the earlier no-completion scope, not the no-progress-change-on-save rule.
- Sessions and their details are private to their owner.

## Suppositions

These are proposed student decisions, labeled `[ASSUMPTION]` and reflected in E2 criteria. Their rationale is part of refinement.

- **S1 [ASSUMPTION]:** A movie may appear in different saved sessions, but only once within one session. This allows alternative plans without accidentally counting the same movie twice.
- **S2 [ASSUMPTION]:** Eligible movies are ordered by duration ascending, then title ascending, then a stable title identity. This makes short options easy to compare and keeps ties predictable. Unavailable entries appear separately in title order.
- **S3 [ASSUMPTION]:** Saved session contents cannot be edited. Owners can delete a saved session from its detail view after confirmation. Deleting a session leaves all movies, ratings, comments and other sessions unchanged. This supersedes the original no-deletion assumption at the user’s request.
- **S4 [ASSUMPTION]:** A saved session preserves its titles, movie order, and known durations at save time. Removing a movie from the collection, changing its viewing state, or later catalog changes do not rewrite past plans. Before saving, ownership, eligibility, and known durations are checked again; changes require the user to review the draft.
- **S5 [ASSUMPTION]:** A session requires a trimmed name of 1–80 characters and records when it was saved. It has no scheduled viewing date. A name helps distinguish plans without introducing calendar behavior.
- **S6 [ASSUMPTION]:** Empty sessions cannot be saved. Selection order is viewing order. Removal closes the gap and recalculates breaks; reordering controls are outside scope.
- **S7 [ASSUMPTION]:** Blank, nonnumeric, fractional, or out-of-range available time is invalid. Lowering the budget keeps the draft visible but prevents additions and saving while over budget, so users can remove movies deliberately.
- **S8 [ASSUMPTION]:** Zero, negative, nonnumeric, or non-whole durations are unknown/unusable. A catalog request failure is shown as a retryable retrieval failure, not as proof that duration is absent. Unaffected movies remain usable.
- **S9 [ASSUMPTION]:** Initial fit results compare each movie with the full valid budget; while building a draft, add availability uses the remaining budget including the next required break. Unavailable-duration movies remain visible with their reason, and known movies exceeding the full budget may be summarized separately.
- **S10 [ASSUMPTION]:** Drafts are not persisted when leaving the planner, reloading, or signing out. Successful save clears the draft after opening the saved detail. Failed save preserves it and offers retry; only one save can be pending at once. If the save response is lost and the outcome is uncertain, retrying the unchanged draft recovers the same saved session rather than creating a duplicate. This avoids duplicate plans when a connection fails after a successful save.
- **S11 [ASSUMPTION]:** Saved sessions are listed newest first, with a stable identity resolving timestamp ties. Viewing saved details does not require a fresh catalog request.
- **S12 [ASSUMPTION]:** Duplicate E1 collection entries referring to the same movie are represented once in the planner, without modifying the collection. This preserves E1 behavior while avoiding duplicate session titles.

### Optional-feature decisions

- Automatic planning maximizes occupied minutes within the budget; equal totals prefer fewer movies, then a stable duration/title/identity order. Each movie appears at most once. Unknown or failed durations are excluded. No movies outside the owner’s pending collection are suggested.
- Planning refreshes the pending collection and metadata. It requires valid time, and waits for that refresh to finish. Replacing a nonempty draft requires confirmation. Load failure or no fitting results preserves the previous draft and explains the outcome.
- Genre comes from catalog metadata. Missing genre information remains visible under All genres and is excluded from a specific-genre match. The filter applies to candidates and suggestions, not saved sessions or the existing draft.
- Watched completion is one-way. Repeating the action is harmless and does not reapply progress changes after completion. Removed collection entries remain removed; matching movie entries still present are completed regardless of their previous status. TV entries and other users’ entries, ratings, comments, other sessions and saved snapshots stay unchanged. Deleting a completed session does not revert movie progress.
- All movie-state changes and session completion succeed together or leave everything unchanged. Only the session owner may complete it. A rejected operation changes neither session nor movie progress. A lost response may hide a successful completion; the interface retains its previous state and retry safely recovers the recorded result.
- Database validation rejects empty/duplicate selections, unknown or invalid durations, incorrect totals and sessions exceeding available time, counting exactly the inter-movie breaks. It checks the durations supplied in the saved plan; it does not independently verify catalog truth or contact TMDB.

## Open questions

- The implementation follows S1–S12 as explicit working decisions. Revise the corresponding criteria and specs before changing those behaviors.
- How will the qualitative goal “finishes what they start” be evaluated? Sessions now record explicit completion; analytics and measured success rates remain outside scope.
- Which pre-existing E1 defects must be fixed before E2 delivery? Record them as separately specified work; the regression baseline must distinguish old defects from newly introduced ones.
- Four optional features are selected above. Social/calendar/streaming/deployment and adversarial-agent extras remain outside this change.
