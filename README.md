## Setup

### 1. Install dependencies

From the repository root:

```sh
cd mi-cartelera-personal
npm ci
```

Run the remaining npm commands from this folder as well.

### 2. Set up Supabase

1. Create a Supabase project.
2. Open its SQL editor and run [supabase/schema.sql](supabase/schema.sql)
3. Enable email/password authentication for the project.
4. Copy the project URL and public anon key for the next step. Use the public client key.

### 3. Configure environment variables

Copy `mi-cartelera-personal/.env.example` to `mi-cartelera-personal/.env`. 

Replace the placeholders in `.env`:

```dotenv
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_key
VITE_TMDB_API_KEY=your_tmdb_v3_api_key
```

The TMDB variable expects an API key, **not an API read access token**.

### 4. Start the app

```sh
npm run dev
```
