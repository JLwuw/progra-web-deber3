# Mi Cartelera Personal — Product Requirements Document

## 1. Problem

People need a single place to keep track of movies and TV shows they want to watch, are watching, or have finished. A title's public information does not capture an individual's progress, opinion, or rating. Mi Cartelera Personal provides a private collection that combines information about real titles with each user's viewing records.

## 2. Users

- People who want to organize movies and TV shows across different viewing stages.
- People who want to record their personal ratings and comments and revisit them later.

Each registered user manages an independent, private collection. The MVP has no additional user roles.

## 3. Objectives and Success Metrics

The MVP aims to make discovering, saving, and maintaining a personal collection possible from end to end. Success is measured against the following acceptance targets; no adoption or engagement targets are defined for the initial release.

| Objective | Success metric |
| --- | --- |
| Provide controlled access | Registration, sign-in, and sign-out can be completed; all collection and search content requires an active session. |
| Help users find real titles | Users can search for movies and TV shows and identify results by title, poster, and year when available. |
| Support a lasting personal collection | Users can add, view, update, and remove titles, and saved changes remain available after signing in again. |
| Capture personal viewing information | Each saved title supports one of the three viewing states, an optional rating from 1 to 5, and an optional comment. |
| Provide useful title details | Users can open a saved title and review its synopsis, cast, poster, public rating, and their own information when available. |
| Keep collections private | Verification with two accounts confirms that neither user can view or change the other's collection. |

## 4. Functional Requirements

### Account access

- Users can create an account, sign in, and sign out.
- People without an active session can access registration and sign-in only.
- A sign-out action remains visible throughout the authenticated experience.

### Title discovery

- Users can search for movies and TV shows by title using The Movie Database (TMDB) as the catalog source.
- Search results show a poster, title, and year when available.
- Users receive clear feedback while a search is in progress, when it returns no results, or when it cannot be completed.

### Personal collection

- Users can add a search result to their own collection.
- Users can view all titles saved in their collection.
- Users can change a saved title's viewing state, personal rating, and comment.
- Users can remove titles from their collection.
- Changes to a collection remain available across sessions.

### Viewing information

- Each saved title has a viewing state: `To watch`, `Watching`, or `Watched`.
- Users can optionally give each saved title a personal rating from 1 to 5.
- Users can optionally record a free-text comment for each saved title.
- Personal ratings and comments remain distinct from the title's public catalog information.

### Title details

- Users can open a detailed view from a title in their collection.
- The detail view includes a larger poster, full synopsis, cast, public rating, viewing state, personal rating, and personal comment when available.

### Privacy

- Users can view and manage only the titles they saved themselves.
- This restriction applies to every access to a collection, including attempts to access another user's saved title directly.

## 5. MVP Scope

The MVP includes account registration and session management, authenticated title search, a persistent private collection, adding and removing titles, editing viewing information, and viewing title details. It covers both movies and TV shows and includes feedback for search progress and unavailable results.

The release is complete when all mandatory functional requirements and acceptance targets in this document are satisfied. Optional enhancements do not block MVP completion.

## 6. Out of Scope

The following enhancements are optional in the source description and are deferred beyond the MVP:

- Filtering the collection by viewing state.
- Sorting the collection by personal rating or date added.
- Displaying summary counts for each viewing state.
- Providing a publicly hosted application link.

The MVP also does not include shared collections, social interactions, personalized recommendations, playback, or tracking individual seasons and episodes.

## 7. Business Rules

- An active session is required to search the catalog or access a collection.
- Every saved entry belongs to the user who added it; other users cannot view, edit, or remove it.
- A saved entry represents either a movie or a TV show from the catalog.
- Each saved title has exactly one viewing state: `To watch`, `Watching`, or `Watched`.
- A personal rating is optional; when provided, it must be a whole number from 1 to 5.
- A personal comment is optional and contains the user's own notes about the title.
- Personal ratings do not replace or change public catalog ratings.
- Adding, editing, or removing a title affects only the user's collection and does not modify the source catalog.

## 8. Supositions

- Users have internet access and an individual account to use the application.
- TMDB supplies the catalog information needed for discovery and title details; some titles may have incomplete information.
- Users maintain their own collections without sharing them or collaborating with other accounts.
- Viewing progress is recorded at the movie or whole-series level.
- English is the language for the product interface and domain terminology, following the project conventions.
- The initial viewing state, handling of duplicate additions, and comment length limits are not specified in the source description and remain to be defined in the relevant feature specifications.
