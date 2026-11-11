# Database setup and upgrades

Fresh installations: run schema.sql, then migrations/000_listing_integrity.sql, migrations/001_movie_nights.sql, migrations/002_movie_night_deletion.sql, migrations/003_movie_night_fit.sql and migrations/004_movie_night_watched.sql in order. Existing installations: compare the deployed Project 3 schema with schema.sql, then apply the migration once. Never replay the bootstrap to repair an unknown schema automatically. The bootstrap is repeatable for the documented schema, but does not reconcile incompatible historical enum/table definitions.

The repair migration adds an owner/page index, unique owner/type/catalog identity, and a nonempty-title constraint for future writes. It does not delete rows or change existing RLS policies. It aborts transactionally if duplicate titles exist. Review duplicates with this administrative read-only query:

```sql
select user_id, media_type, tmdb_id, array_agg(id order by id) as listing_ids
from public.my_listing
group by user_id, media_type, tmdb_id having count(*) > 1;
```

Choose which notes/ratings to preserve before resolving duplicates manually, with the data owner's approval. Rerun the migration after resolving them. Review empty legacy titles separately before validating my_listing_title_nonempty. The user confirmed applying the repair migration on November 11, 2026. The agent has not applied it or independently verified the deployed schema.

Account deletion remains outside product scope; the restrictive auth.users foreign key is deliberate. Missing posters remain valid (the older non-null poster column uses an empty string for absent artwork). No arbitrary comment-length limit is added to existing notes.

## Required live isolation verification

Use two ordinary test accounts, A and B, plus a signed-out client. Through ordinary public-client requests, verify that A cannot select, update, delete or reassign B's entries, and cannot insert an entry owned by B; repeat in reverse. Verify signed-out access is denied and own collection CRUD still works. Record affected rows/errors and actual observations without recording credentials. Owner filters in services are defense in depth and are not evidence that RLS works.

Rollback of an unused repair deployment may remove the new indexes/constraint; do not remove original RLS or user data. Back up and review any rollback after real usage. Never use a privileged key in the frontend.


## E2 — Movie Night migration

`migrations/001_movie_nights.sql` adds only the movie_nights table, its owner/history index, and select/insert RLS policies. Apply it once after the E1 migration. Its SQL matches the epic spec. E1 collection tables/policies are not changed. E2 migration application has not been performed or verified by the agent.

Saved movies are ordered JSON snapshots without a collection foreign key; deleting an E1 entry does not destroy historical plans. Session UUIDs are generated once per draft to recover uncertain saves. Migration 001 grants select/insert; the additive 002 migration also grants DELETE with an owner-only policy. Saved contents cannot be updated, but an authenticated owner can remove their own session. Migration 003 validates nested snapshots and enforces exact duration-plus-break totals within the budget, including direct client inserts. Invalid legacy plans abort that migration without deleting data. Review and correct any reported legacy rows before retrying. It validates declared runtimes, not external catalog truth. Migration 004 adds one-way, owner-authorized atomic completion through mark_movie_night_watched; direct session UPDATE remains unavailable. Completed-session deletion does not revert collection progress.

Verify with test accounts A and B: create one night per owner, read/list only own nights, deny anonymous reads/inserts, reject insertion under the other owner, and deny all update attempts and foreign/anonymous delete attempts, while allowing confirmed deletion of an owned night. Record actual outcomes in docs/VERIFICACION.md and criterion E2-AC21 in docs/AUDITORIA.md. Do not use privileged keys to demonstrate ordinary-user access. Confirm that an E1 title can be removed while its saved-night snapshot stays readable.

For an unused development deployment, rolling back E2 means dropping the new movie_nights table/index only; this destroys saved nights and must not be done after real usage without a backup and explicit data-preservation review. No rollback is run by this task. Never drop or disable E1 ownership policies as part of an E2 rollback.


## Owner session deletion — additive migration 002

Apply `migrations/002_movie_night_deletion.sql` once after 001. If 001 is already applied, do not rerun it; apply only 002. This grants authenticated DELETE and adds an auth.uid() ownership policy. It changes neither the E1 collection nor its policies, and does not grant UPDATE. Verify with two test accounts and a signed-out client: own deletion works, foreign/anonymous deletion is denied, other nights and all E1 entries/ratings/comments remain unchanged. Confirming application of 002 is still pending.


## Optional-feature database regression

From mi-cartelera-personal run `npm run test:db`. Requires local PostgreSQL tools (`initdb`, `pg_ctl`, `psql`) and a non-root user. The test creates and removes its own private temporary cluster, listens only on a Unix socket, uses synthetic users and applies the real schema/migrations. It never reads project environment files or contacts the deployed database. Sandboxes must permit the local socket. Test results cover direct invalid saves, exact fits, legacy migration failure, unauthorized completion, forged completion, idempotency, skipped missing titles, preservation of personal metadata and atomic rollback. Live Supabase roles/RLS still require the two-account checks in docs/VERIFICACION.md.


Migration rollback: each file is transactional, so a failed application leaves its prior schema/data intact. For an intentional rollback after deployment, first deploy a frontend that does not use completion/planning extensions; back up the database, then remove the completion RPC/insert trigger/guard function/watched_at column, and remove movie_nights_fit before movie_night_fits. Removing watched_at loses session-completion history and does not reverse already completed E1 movies. Removing the CHECK removes its protection; prefer a forward correction for production data.
