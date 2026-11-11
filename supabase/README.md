# Database setup and upgrades

Fresh installations: run schema.sql, then migrations/000_listing_integrity.sql in order. Existing installations: compare the deployed Project 3 schema with schema.sql, then apply the migration once. Never replay the bootstrap to repair an unknown schema automatically. The bootstrap is repeatable for the documented schema, but does not reconcile incompatible historical enum/table definitions.

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
