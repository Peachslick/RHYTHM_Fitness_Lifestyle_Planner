# RHYTHM Changelog

## V1.4.0 — Recovery & Lifestyle Intelligence + Identity (2026-10-19)

### Added
- New **Recovery & Lifestyle** page in main sidebar; works offline / guest and Cloud mode.
- Daily Recovery Check-in, dated by the user's local day, with 5 self-reported inputs (energy, fatigue, muscle soreness, stress, mood, all 1–5), optional water (mL), optional steps, and notes. A date has at most one Check-in; add, edit, delete, and backdate supported.
- Descriptive subjective balance (1–5) with explicit non-clinical wording; intentionally **not** a medical readiness/risk diagnostic. Missing logs remain missing rather than zero.
- Sleep rolling-average (recorded nights only), bedtime deviation (3+ logged nights, circular midnight-safe), average workout RPE based on sessions with RPE, 14-day subjective feeling trend, 7-day lifestyle log view.
- Carefully bounded and transparent suggestions based on user's logged inputs (low self-reported feeling, higher muscle soreness, sleep more than 60 minutes below user's target, 2+ high-RPE sessions within 3 days). No automatic edits to training schedule or TDEE.
- New original branded icon featuring a calendar and dumbbell. Sidebar, top header, loading indicator, modern browser favicon (PNG + ICO), and Apple touch icon.
- `js/recovery.js` focused pure analysis module, plus `tests/test-v14.cjs`.

### Compatibility and safety
- `checkins` is an **optional field** in the version-1 JSON payload, so older V1.0–V1.3 documents/imports still validate. Fresh and demo state have the field initialized. No SQL change / no added Supabase table: existing CAS + RLS document sync remains in use.
- Import validation limits the Recovery entries, dates, values, optional quantity fields, note lengths, and duplicate dates. UI prevents future dates. Untrusted notes rendered HTML-escaped.
- Existing profile, nutrition, sleeps, workout planning, training intelligence, sync, and font customization preserved.
- Source logo files and versioned URL query parameters support correct new assets after Vercel deployment.

### Validation
- 39 dedicated new V1.4.0 assertions, and all existing suites rerun (23 calculator/local, 32 V1.2, 44 V1.3, 29 app, 70 sync); Browser plugin was unavailable and localhost navigation was blocked in Chromium, so rendered QA used Playwright Chromium `set_content` with inline scripts/styles and a test-only LocalStorage shim.
- Tested Recovery page desktop/mobile rendering, edits, delete, and no JavaScript errors / page-level horizontal overflow.
- Not yet exercised against user's live Supabase credentials, network failures from their Vercel site, or cross-device account session.

## Previous versions
- **V1.3.0:** Expanded food catalog, gram/serving tracking, favorites, copy meals, weight goal insights.
- **V1.2.0:** Workout sets / training analytics / flexible planner, sleep % stages, Thai font choice.
- **V1.1.0:** Optional Supabase Auth, RLS, revisioned Cloud Sync, recovery draft/backup and conflict safeguards.
- **V1.0.0:** Baseline fitness, food, sleep, schedule, profile and local persistence.
