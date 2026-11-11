# Mi Cartelera Personal — Product Requirements Document

## Problem

People need a personal place to keep track of the movies and TV shows they want to watch, are watching, or have already watched. A title's public information and rating do not capture an individual's viewing progress, opinion, or experience.

Mi Cartelera Personal lets users discover real titles, maintain a private collection, and record their own ratings and comments alongside the title's public information. The intended outcome is that a user can find a title, save it, and return later to review or update their viewing history.

## Users

- People who want to keep a watchlist of movies and TV shows they plan to watch.
- People who want to track what they are currently watching and what they have finished.
- People who want to preserve personal ratings and notes about their viewing experiences.

## Scope

### Required for the initial release

- Account registration, sign-in, and sign-out. Access to search, collections, and title details requires an active session. A sign-out action remains available throughout the signed-in experience.
- Search for movies and TV shows using The Movie Database (TMDB) as the source of title information. Search results show each title's poster, name, and release year, with clear feedback while results are loading or when a search fails.
- Add a title from search results to the user's personal collection.
- View the user's saved collection.
- Update a saved title's viewing status, personal rating, and personal comment.
- Remove a title from the personal collection.
- Open a saved title's detailed view with a large poster, full synopsis, cast, public rating, personal rating, and personal comment.
- Keep each user's collection private and prevent other users from accessing or changing it.
- Preserve saved titles and personal updates so users can return to their collection in later sessions.

### Optional enhancements

The following are explicitly optional and are not conditions for completing the initial release:

- Filter the collection by viewing status.
- Sort the collection by personal rating or date added.
- Show a summary of the number of titles in each viewing status.

## Out of scope

- Watching, streaming, or downloading movies and TV shows.
- Public profiles, shared collections, social feeds, or interactions between users.
- Publishing personal ratings or comments to TMDB, or changing its title information.
- Personalized recommendations and viewing reminders.
- Tracking individual seasons or episodes; the required collection tracks movie and TV show titles.

These capabilities are outside the requirements described in the project brief.

## Business rules

1. Visitors can register or sign in, but cannot access product content without an active session. Signing out ends access to that content.
2. Every saved entry belongs to the user who added it. Only that user may view, update, or remove it. This restriction must hold even if someone attempts to bypass normal navigation.
3. A saved title is either a movie or a TV show and originates from the search catalog.
4. Every saved title has exactly one viewing status: To Watch, Watching, or Watched.
5. A personal rating is optional. When present, it is a whole number from 1 through 5.
6. A personal comment is optional and contains the user's own free-text notes.
7. Personal ratings and comments are independent of the title's public rating and information.
8. Users can change the viewing status, personal rating, or personal comment of titles in their own collection.
9. Removing a title affects the user's personal collection; it does not remove the title from the search catalog or another user's collection.
10. Adding or updating a personal entry does not change information published by TMDB.

## Suppositions

- Users have internet access when searching for titles and managing their collections; offline use is not part of the initial release.
- A single personal collection per account is sufficient for the initial release.
- Registration and sign-in are the only experiences available before authentication. This interpretation reconciles the requirement for controlled access with the need to let visitors create or access an account.
- The user-facing interface will be in English, following the project's stated convention. The status labels in this document express the same three states described in the brief.

## Open questions

- Can the same movie or TV show be added more than once to a user's collection? If not, what feedback should a repeat attempt provide?
- Which viewing status should a newly added title receive, or must the user choose one when adding it?
- Can a title be rated in any viewing status, or only after it is marked Watched?
- Can users clear a previously saved rating or comment?
- Is there a maximum length for personal comments?
- What should users see when a title has no poster, release year, synopsis, cast, or public rating?
- Should saved title information reflect later catalog changes, or retain the information available when the title was added?
- Should removing a title require confirmation or offer a way to undo the action?
- Are account verification, password recovery, or account deletion required for the initial release?
- Which optional enhancements, if any, will be included in the delivery?
