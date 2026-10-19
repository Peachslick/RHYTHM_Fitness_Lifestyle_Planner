-- RHYTHM v1.1.0 — Run once in Supabase SQL Editor as project owner.
-- One JSONB document per authenticated user to preserve the v1 data model.
-- Never create policies granting anonymous access to this table.

create table if not exists public.rhythm_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rhythm_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint rhythm_data_is_v1 check (data ->> 'version' = '1'),
  constraint rhythm_data_size_limit check (octet_length(data::text) <= 2097152)
);

-- Never trust the version/timestamp supplied by a browser. A conditional UPDATE
-- WHERE revision = expected_revision does the optimistic concurrency check.
create or replace function public.rhythm_bump_revision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed';
  end if;
  new.revision := old.revision + 1;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists rhythm_revision_before_update on public.rhythm_user_data;
create trigger rhythm_revision_before_update
  before update on public.rhythm_user_data
  for each row execute function public.rhythm_bump_revision();

alter table public.rhythm_user_data enable row level security;
revoke all on public.rhythm_user_data from public, anon, authenticated;
grant select, insert, update on public.rhythm_user_data to authenticated;
-- Do not grant delete. The app's reset replaces the document with an empty one.

-- Idempotent policies, suitable for rerunning the migration when necessary.
drop policy if exists rhythm_select_own on public.rhythm_user_data;
create policy rhythm_select_own on public.rhythm_user_data
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists rhythm_insert_own on public.rhythm_user_data;
create policy rhythm_insert_own on public.rhythm_user_data
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists rhythm_update_own on public.rhythm_user_data;
create policy rhythm_update_own on public.rhythm_user_data
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- user_id is the primary key, so RLS filtering already uses its index.
-- Only the table's own user_id is used to authorize reads/writes (not email or metadata).
