# E2 — Interface specification

Status: implemented locally; student browser results are recorded in three dated batches, including keyboard, Narrator, reduced motion and two contrast measurements. See [verification](../VERIFICACION.md) and [the latest audit](../AUDITORIA.md#student-verification-batch-3--november-11-2026) for specific limits. Behavior references [E2 acceptance criteria](../backlog/e2-stories.md). Visual source of truth: **DESIGN.md**, at the repository root, especially Bootstrap customization, responsive behavior, UI patterns, and DES-01–08. This spec deliberately does not duplicate colors, dimensions, or typography values.

## Entry and navigation

Add “Movie Night” and “Saved Nights” to the existing authenticated navigation. Keep Search, My Listing, and Logout available. Use the existing session gate; no personal content appears before authentication. Changing accounts clears drafts, selected saved detail, pending results, and prior-owner lists. E2-AC01/22; DES-04/07.

## Planning screen — MovieNightScreen

1. Heading “Movie Night” and a labeled “Available minutes” field with the accepted range explained in text.
2. Inline invalid-input feedback; no valid candidate/add/save state until the budget is accepted.
3. Candidate area showing titles, posters or meaningful placeholders, duration in minutes, and add actions. Initial fitting results use the full budget; while selecting, each add action uses the remaining total including the next break. Already selected, oversized-next-add, unknown-runtime, and failed-runtime states have distinct text reasons. Present unavailable movies separately so they do not disappear.
4. Explicit loading, retryable request failure, no-pending-movies, and no-fitting-movies states. Successful candidates remain usable during partial failures. Results from obsolete requests must not replace current-account results.
5. A session summary lists selected titles in viewing order, each runtime, breaks, total time, available budget, and time remaining. Removal is keyboard-operable. Removing any item recalculates the summary through domain results.
6. A labeled session-name field and “Save Night” action. Disable saving while invalid, empty, over budget, or pending, with an adjacent textual explanation. Changing the budget must not silently delete the selection.

Coverage: E2-AC02–14; DES-01–08. Candidate cards reuse the app's media-card pattern; summary uses the existing totals pattern. Do not introduce a new styling framework or a new visual theme.

## Save interaction

Show an in-progress state and prevent repeated submission. Before committing, refresh selected sources. If a movie is removed, no longer pending, has a new runtime, or becomes unavailable, display the affected titles and ask the user to review the updated draft; no automatic save follows. A failed save retains the draft and offers retry. A successful save opens the saved detail and clears the draft. Network-ambiguous retries keep the same draft identity, including through explicit source review. Manual changes stay locked until resolution. If a previous attempt committed first, show that actual saved plan; do not create a replacement identity.

Saving never marks movies Watched. A separate confirmed Mark as watched action completes an owned saved session as specified by E2-AC27/29 and [the optional-feature spec](e2-optionals.md). Coverage: E2-AC15–18; DES-05/07/08.

## Saved history — SavedMovieNightsScreen

Show newest first with name, saved timestamp, and total minutes, a detail action, and a load-more action when another page exists. Include loading, retryable error, and no-saved-sessions states. Do not expose edit/delete controls in history; deletion belongs on the detail screen. Keep the pagination footer visible after the first results: loading, load more, retry, or disabled “All sessions loaded”. Coverage: E2-AC19/21; DES-04/05/07.

## Saved detail — MovieNightDetailScreen

Show saved name/timestamp, movies in saved order, runtimes, inter-movie breaks, budget, total, and remaining time. Use only saved snapshots: collection deletion or catalog failure must not remove historical content. Poster failures have a readable fallback. Provide a return action to Saved Nights. There is no scheduled-date field or saved-session editing. Add a destructive “Delete session” action with confirmation; cancellation makes no request. Pending deletion disables repeated deletion and Back; errors retain details and offer retry. Success returns to refreshed Saved Nights. Coverage: E2-AC20; DES-02/04/07/08.

## Design verification

Apply DES-01–08 from DESIGN.md to both desktop and narrow-screen flows. Test keyboard navigation, focus visibility, programmatically associated labels, text reasons alongside disabled actions, announcements for total/error changes, and reduced motion. Record observed results rather than assuming that using Bootstrap guarantees compliance.


## Optional controls

See e2-optionals.md and DESIGN.md. Add Plan my night beside Find movies, with fresh loading, confirmation before replacing a nonempty draft, and no-fit/failure preservation. Add a labeled Genre select with All genres and dynamically loaded catalog genres; filtering does not remove selected movies. In saved detail, add a confirmed one-way Mark as watched button near the top and explicit Planned/Watched status, pending/error/retry feedback, and mutual exclusion with deletion. History indicates Planned/Watched. These controls implement E2-AC25–30; no visual constants are copied here.

Disabled/loading fields MUST retain the dark field surfaces and readable text specified by DESIGN.md throughout E1 and E2. Pending secondary/destructive actions MUST retain their variant styling. The prominent completion button MUST distinguish planned, pending, retry and watched states in text.
