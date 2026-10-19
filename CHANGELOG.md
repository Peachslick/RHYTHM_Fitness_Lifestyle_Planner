# RHYTHM — CHANGELOG

## V1.3.0 — Smart Nutrition & Weight Goals (2026-10-19)

### New
- Expand food reference library 18 -> **154 foods** across Thai meals, common proteins, fruit, vegetables, grains, fats, dessert and drinks; keep all legacy IDs unchanged.
- Search, category filters, favorites per user (`favoriteFoodIds`) and progressively reveal the full library in groups of 60.
- Record grams or servings; per-serving reference weight, live macros preview, persisted gram snapshot and saved custom-food reference grams.
- Copy previous day's journal into selected day with duplicate-source guard and confirmation when target already contains entries.
- Analyze 14-day food log completion / average of logged days and independent 7-day average weight windows; give contextual rather than prescriptive advice.
- Add 7-day moving-window insight on Progress page.

### Compatibility / Security
- Uses the existing `version:1` JSON document, Supabase table, CAS Revision and RLS architecture; **no Supabase SQL migration**.
- Old meals, custom foods, backups and account records remain compatible; optional new fields are validated.
- Catalog is versioned Static JS, not replicated per account to the Cloud.
- Does not overwrite user's Supabase configuration in Update Only package.

### Notes
- The 154 foods have illustrative/approximate nutrient data, not verified nutrition-database entries; users should edit values according to exact product/restaurant/portion.
- No automatic calorie target adjustment. `NutritionSummary` explicitly excludes missing days instead of treating them as zero.
- Browser integration checked with locally injected source due restricted browser-to-localhost navigation; real Supabase connection remains to be validated by owner.

## Earlier versions
- **V1.2.0** — Workout Intelligence, Adaptive Planner, sleep-stage percentage input, font personalization.
- **V1.1.0** — Account & Cloud Sync with Supabase Auth, RLS, offline draft, CAS revision conflict checking and JSON backup.
- **V1.0.0** — Core dashboard, workouts, nutrition, sleep, routine, progress and profile.
