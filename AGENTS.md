# Mi Cartelera Personal

## Project
Web App to search for movies and TV shows, add them to a personal listing, and to add a comment and or rating to each entry

## Stack
- Vite + React + TypeScript
- Supabase (`@supabase/supabase-js`)
- Tests with Vitest; formatting Prettier

## Project Structure
App paths below are relative to `mi-cartelera-personal/`; docs/ and supabase/ are at repository root:
- `src/lib/supabase.ts`: Supabase client
- `src/types/`: domain types
- `src/services/`: access to Supabase
- `src/components/`: React components
- `src/index.css`: stylesheet
- `supabase/migrations/`: SQL migrations
- `docs/prd/`, `docs/backlog/`, `docs/specs/`: documentation
- `docs/design/`: Design references

## Commands
`cd mi-cartelera-personal` to access React App root. From there:
- `npm run dev`:  start dev server
- `npm test`: Vitest regression tests
- `npm run build`: compile for prod

## Conventions
- Domain names and interface in English
- camelCase for TypeScript; snake_case for DB.
- Never use `any`.
- Components never call Supabase directly. All DB access is done through services in `src/services/`.

## Rules
- Never read or modify `.env` or `.env.local`.
- Never write keys or other sensive data in code
- The frontend only uses the public (anon/publishable) keys. It never uses `service_role`.
- No features are implemented without a corresponding spec inside `docs/specs/`.
- Before finishing, run `npm test` and `npm run build` in the app folder; read DESIGN.md before visual code.
- Before every commit, use `.agents/skills/adversarial-review/SKILL.md` with an independent subagent.
