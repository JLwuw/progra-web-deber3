# Mi Cartelera Personal

A private movie and TV watchlist: search real titles, save them, track viewing progress, and keep personal ratings and comments. Movie Night (E2) lets you plan and save a session of pending movies that fits your available time, including breaks.

## Setup

From the repository root:

```sh
cd mi-cartelera-personal
npm ci
```

Run the remaining npm commands from this folder. Use a Node version supported by the locked Vite/Vitest dependencies (CI uses Node 22).

Create a Supabase project with email/password authentication. Follow [database setup and migration instructions](supabase/README.md): fresh projects run schema.sql then the ordered migrations; existing projects follow the upgrade/preflight instructions. Public frontend credentials do not bypass row-level security. Migrations are not automatically applied by the application. E2 requires `supabase/migrations/001_movie_nights.sql` after the E1 repair migration, then `supabase/migrations/002_movie_night_deletion.sql` for owner deletion; the agent has prepared this new migration but has not applied it.

Create local configuration with these variable names using your own values:

- VITE_SUPABASE_URL: Supabase project URL.
- VITE_SUPABASE_ANON_KEY: public anon/publishable client key, never a privileged service-role key.
- VITE_TMDB_API_KEY: TMDB v3 API key, not the API read access token.

No environment example is assumed. Do not commit local environment files or real credentials. Vite client variables are browser-visible; they are not server-side secrets.

```sh
npm run dev
```

Missing Supabase configuration displays startup guidance. Missing catalog configuration displays a search/detail error. After updating local configuration, restart the development server.

## Verification

```sh
npm test
npm run lint
npm run build
```

Tests type-check their sources and use mocked network/authentication boundaries; they do not load project environment files. They are not proof of deployed RLS or catalog availability. See [E1 repair results](docs/E1-REPAIRS.md) for the checklist and outstanding manual checks.

## Movie Night

Sign in and choose Movie Night. Enter 30–600 whole minutes, choose Find movies, then select pending movies with known durations. The summary includes a 10-minute break only between movies. Give the plan a name and save it; Saved Nights lists your saved plans newest first. Their contents cannot be edited; owners can delete a plan from its detail page after confirmation. Saving does not change the movies’ viewing status. A changed duration or collection entry requires review before saving. Reloading, signing out, or leaving the planner discards an unsaved draft.

See [E2 verification](docs/VERIFICACION.md) and [E2 implementation audit](docs/AUDITORIA.md) for automated evidence and pending live/browser checks.

## Documentation and delivery

- [Documentation index](docs/README.md)
- [Historical initial-state audit](docs/INITIAL-STATE.md)
- [Design guide](DESIGN.md) and [brand board](docs/design/brand-board.html)
- [Database setup, duplicate review and two-account isolation checks](supabase/README.md)

Screenshots and a published-app link have not been collected. No production deployment is claimed. Navigation currently uses in-memory views; refresh returns to Search. Local date filters follow the browser timezone.
