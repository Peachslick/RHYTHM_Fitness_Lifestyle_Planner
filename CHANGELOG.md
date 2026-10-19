# RHYTHM — Changelog

## V1.2.0 — Workout Intelligence & Adaptive Planner (19 October 2026)

### Added
- Per-set workout log (actual reps, kg, warmup flag) with add/remove set controls and edit-in-place; no synthetic backfilling from legacy templates.
- Training volume, weekly comparison, exercise-specific PR, estimated 1RM, session volume chart, and conservative progressive-overload hints.
- Per-date Adaptive Planner allowing safe two-date workout swaps with original weekly templates and logged sessions preserved.
- Deep / Light / REM sleep stage mode with percentage inputs (watch readings) or minute inputs, totals validation and dual-unit display.
- 16 Workday Journey style font choices and independently savable font preference applied app-wide.
- `tests/test-v12.cjs` for sleep stages, schema compatibility, routine overrides, volume/PR math and font persistence.

### Compatibility / security
- Keeps schema version `1` so current JSON backups, Supabase RLS, revision, CAS sync and Guest LocalStorage continue to work.
- No new Supabase SQL migration is required. Do not re-run `001_init.sql` if V1.1 is already configured.
- Font choice stored in the existing `settings.font`; new schedule overrides are optional `scheduleOverrides` objects. Previous data remains valid.
- Google Fonts require network; system/local font fallbacks are used when unavailable. No font files shipped.
- All fitness metrics are estimates for tracking and reflection, not clinical guidance.

### Validation
- Existing core, UI CRUD, Cloud Mock suites and new V1.2 calculator/schema tests pass; Chromium DOM interaction tests performed via injected local app scripts because the sandbox blocks direct HTTP/file navigation.
- **Not yet verified with a live user-owned Supabase project**, cross-device or actual Vercel deployment.

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
