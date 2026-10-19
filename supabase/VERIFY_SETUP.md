# RHYTHM Supabase Setup / RLS Validation Checklist

This is a **manual** security checklist: static JavaScript unit tests cannot verify real database policies. Use throwaway accounts A and B and fake fitness records; do NOT test on production health data.

## 1. Read-only SQL Checks in SQL Editor

Run the following after `001_init.sql`:

```sql
-- Must return true.
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relname='rhythm_user_data';

-- Expected: SELECT/INSERT/UPDATE policies, all TO authenticated.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public' and tablename='rhythm_user_data';

-- Check table privileges. anon must NOT have read/write privileges.
select
  has_table_privilege('anon','public.rhythm_user_data','SELECT') as anon_select,
  has_table_privilege('anon','public.rhythm_user_data','INSERT') as anon_insert,
  has_table_privilege('authenticated','public.rhythm_user_data','SELECT') as user_select,
  has_table_privilege('authenticated','public.rhythm_user_data','INSERT') as user_insert,
  has_table_privilege('authenticated','public.rhythm_user_data','UPDATE') as user_update;
```

Expected: RLS `true`; `anon_select=false`, `anon_insert=false`; user privileges `true` where stated. Note that SQL Editor typically runs as the project owner and **bypasses RLS**: running `SELECT` as postgres is not a test of user isolation.

## 2. Test with two real JWT identities (browser)

1. Sign up **A**, create fake weight/sleep data, wait until status says `ซิงค์แล้ว`.
2. Sign out, sign up **B**, verify none of A's data is visible; create B data.
3. If you use browser DevTools: while signed in as B, read `rhythm_user_data` filtering for `user_id` of A with the user-scoped client (not the SQL Editor). The response must return zero rows, not A's document. A user-scoped write for A's ID must fail/return zero rows.
4. Sign in as A from a separate browser/profile; data must be only A's.
5. For a conflict, keep device A and B logged into the **same account**; make both edit stale revision; ensure the last stale UPDATE is rejected and the Conflict screen appears.
6. Verify UPDATE trigger increments `revision` by exactly one and updates `updated_at`.
7. Verify password recovery link, redirect URLs, and sign out on the actual Vercel domain.

**Do not expose the service-role / secret key to browsers to do these tests.**

## 3. Rollback / restore

- Before any schema change, save a Supabase database backup and download the current data JSON from the RHYTHM Profile page.
- Never drop `public.rhythm_user_data` to debug a login problem.
- If a cloud document was overwritten, restore from a prior JSON export by explicit import, or use your Supabase database backup and audit process. There is no built-in version history of old Cloud revisions in V1.1.0.
