# RHYTHM — Changelog

## V1.1.0 — Account & Cloud Sync (19 October 2026)

### Added
- Supabase Email + Password signup/sign-in, sign-out, forgot password and reset password.
- SQL migration `supabase/001_init.sql` for owner-isolated JSONB data with RLS, DB-managed revision counter and updated_at trigger.
- Account status bar and first-time choice to import a real Guest/LocalStorage profile or create a fresh Cloud profile.
- Durable per-user local pending draft, debounced saving, retry when online, manually initiated sync, periodic Cloud revision checks.
- CAS cloud write (`WHERE user_id AND revision`), explicit conflict resolution with backup of both alternatives.
- Cloud-safe reset/import/logout guards, safe migration from local without silent overwrites.
- `vercel.json` for static-security response headers; setup README and RLS verification guide.
- `tests/test-sync.cjs` (70 mock-service assertions).

### Compatibility
- Existing V1.0.0 data structures and 7 feature pages kept unchanged.
- Existing LocalStorage key remains `rhythm_fitness_v1` for Guest only. Cloud data is isolated by authenticated UUID.
- Initial Cloud accounts start empty (no fake demo history).

### Caveats
- Supabase account functionality works only after the project owner configures the public credentials, executes SQL and Auth URL settings.
- Cloud Sync is currently a single JSON document per user; concurrent edits require a manual choice and there is no field-level merge.
- Offline pending drafts remain unencrypted in the browser's LocalStorage; manual backups recommended.
- No real Supabase endpoint was available for integration/RLS validation during creation.

## V1.0.0 — Fitness & Lifestyle Planner (19 October 2026)
- See the original archive/previous release notes for details of the seven main feature pages.
