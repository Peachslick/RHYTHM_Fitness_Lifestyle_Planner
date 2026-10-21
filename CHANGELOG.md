## V1.9.4 — Custom Food Editor (2026-10-21)

- Added edit control on **customFoods** rows in Nutrition Food Library, separate from the Add (+) button; core/HDmall entries remain read-only in the library.
- Edit name, serving unit, optional grams/serving, kcal and known/unknown protein-carbs-fat in a focused modal; validation for required and bounded fields, duplicate custom-food names.
- Persist updates to existing custom ID (retains favorites) through existing Guest or Supabase snapshot sync; no schema/SQL change.
- Optional custom food deletion with confirmation, without deleting food history or past Meal Templates. Favorite ID cleaned up on deletion.
- Historical meal records and saved Meal Templates keep their values; only **future** logs use the updated custom-food definition.
- Includes `js/custom-food-editor.js`, CSS, cache-busted index, Thai README / guide, and regression and Chromium interaction QA.

## V1.9.3 — Everyday UX Upgrade (2026-10-21)

- Setup Wizard 3 steps (save on confirm; open after starting real data).
- Meal Templates create/reuse/delete; cloud-synced JSON, duplicate confirmation.
- Inline Live Workout per-set entry, rest timer, browser-tab draft scoped to account/date; save confirmed sets only.
- 183 HDmall kcal-only catalog items gain clearly labelled heuristic Macro estimates while preserving original kcal. Historical user logs not overwritten.
- Analytics separate estimated macros from verified data; no new SQL or Supabase config changes.
- README and Thai guide include usage instructions and Macro caveats.

## V1.9.1 — HDmall Food Calorie Catalog (2026-10-21)

- Added 183 curated HDmall per-serving menu entries, excluding known catalog-name duplicates (154 existing -> 337 total). Attribution URL retained in source entries and UI.
- Source calories kept per original plate/bowl/cup/piece, never inventing a reference weight in grams.
- Calories-only menu records carry `macroKnown:false` and are labeled as missing nutrients, not zero-g protein/carbs/fat; macro-dependent analysis excludes incompletely logged days.
- Preserved user custom foods, favorites, old food logs, cloud Sync and V1.9.0 functionality; no SQL migration.
- Added `tests/test-v191.cjs` and tested nutrition flow on Chromium Desktop/Mobile (direct source injection fallback; live Supabase integration unverified).

---

## V1.9.0 — Metabolism & Nutrition Insights & Sidebar Scroll Preservation (2026-10-21)

- New read-only `js/metabolism.js`: TDEE vs intake, tracked-day coverage, macros, weight trend and evidence-gated rough energy-maintenance model.
- Added 14/28/56-day Metabolism & Nutrition page with charts, food-frequency view and action-oriented notes; no automatic calorie adjustment.
- Fixed Sidebar scrolling to preserve scrollTop during full shell re-render when navigating or filtering; tested desktop and mobile.
- All prior data and existing Supabase Auth/RLS/schema retained; **no SQL migration** or sync-format changes.
- Added `tests/test-v190.cjs` (34 new checks). Aggregate 508 checks across 13 suites.
- Browser QA used Playwright Chromium with direct source injection because localhost navigation was blocked by environment policy; Supabase live integration not tested.

## V1.8.0 — Advanced Workout Analytics & Deep Insights Filter Scroll Fix (2026-10-21)

- Added read-only advanced workout analytics engine in `js/workout-analytics.js`; no database schema change.
- Added navigation page with 30/90/180-day exercise records, training volume, timed/bodyweight totals, weekly confirmed-set bars, approximate exercise group distribution, best performances and per-exercise trend charts.
- Excludes unconfirmed template rows and warm-up sets; estimates 1RM only for weighted reps <=10.
- Replaced deep-insights category filter's full reset-to-top render with focused DOM updates that keep the report in view, preserve keyboard focus, and retain horizontal filter scroll.
- Tests: `tests/test-v180.cjs` new; stale progress route label in existing app smoke test corrected.
- Compatibility: V1.7.0 state and Supabase JSON kept unchanged; no SQL migration.

# V1.7.0 — Smart Goals & Recommendations

- หน้าใหม่ เป้าหมายอัจฉริยะ: Personal Goals, Insight-based Suggestions, ค่าจริงย้อนหลัง, ตัวกรองสถานะ, Reflection และสรุปความคืบหน้า
- ไม่แก้ Cloud schema; optional `goals[]` ใน snapshot และ backward compatibility พร้อม validation
- Workout Session สร้างแถวเซตอัตโนมัติจากเทมเพลต, มีตัวเลขเป้าหมาย editable และติ๊ก “ทำแล้ว” ก่อนนับในสถิติ
- บันทึกเก่าคงเดิม ไม่เปลี่ยนสูตร Volume/1RM

---

# RHYTHM — Changelog

## V1.6.0 — Deep Analytics & Personal Insights (2026-10-20)

- Added Insights Dashboard with 7/14/30 day windows, insight filtering, graphs and data coverage.
- Added descriptive sleep-duration advice and sleep-stage percentages; no diagnosis based on wearable stage ratios.
- Added nutrition, weight, actual training volume, running, recovery, and observational cross-domain analysis.
- No database migrations; all analyses derived from existing state and excluded from Cloud writes.
- Kept Supabase conflict protection and V1.5.0 features unchanged.
- Added `js/insights.js` and `tests/test-v160.cjs`.

---

## V1.5.0 — Smart Workout Timer & Running Tracker (2026-10-20)

### Added
- หน้า Running Tracker ใน Sidebar พร้อมกรอกระยะทาง km เวลา นาที/วินาที ประเภทการวิ่ง RPE และหมายเหตุ
- ฟอร์มเพิ่ม/แก้ไข/ลบบันทึกวิ่งหลายครั้งต่อวัน พร้อม Pace สดขณะกรอก, Pace เฉลี่ยย้อนหลัง, แผนภูมิระยะทาง 8 สัปดาห์ และเป้าหมายระยะทางรายสัปดาห์
- Timer ใช้ได้ทั้งหน้า Workout และ Running: Countdown, Stopwatch, Pause/Resume/Reset, เวลาพักสำเร็จรูป, เวลาพักในแผนและท่าจับเวลาในแผน, กรอกนาทีและวินาทีเอง
- SessionStorage กู้สถานะ Timer หลังรีเฟรชในแท็บเดิม และคำนวณอิงเวลาจริงเมื่อแท็บไม่ได้ active; Toast/เสียง (หาก browser อนุญาต); opt-in Notification
- ใหม่ `js/running.js`, `js/timer.js` และ `tests/test-v150.cjs` (51 assertions)

### Safety / Compatibility
- เก็บ `runs` เป็นฟิลด์ทางเลือกใน JSON Snapshot เดิม พร้อมตรวจ validRun เมื่อ import และตรวจเป้าหมาย weekly km — นำเข้าข้อมูลเดิมได้โดยไม่ต้อง SQL Migration
- Timer ไม่ถูกเขียนเข้าฐานข้อมูลหรือบันทึก Workout Session อัตโนมัติ
- ไม่ใช้ค่าจาก GPS/สมาร์ตวอทช์อัตโนมัติ ไม่มี Health API หรือการวัดทางการแพทย์
- ไม่แก้ไข `js/supabase-config.js` ใน Update Only

# RHYTHM Changelog

## V1.4.2 — Minute & Second Workout Timing (2026-10-20)

### Changed
- Timed exercise targets now use separate minute/second fields, allowing 30-minute running or 1-minute-30-second planks without manual conversion. Performed workout logs use the same two-field design.
- Daily plan goals, personal library rows and timed PR summaries display a readable Thai duration while analytics continue using the exact stored number of seconds.
- Timed input validation enforces seconds 0–59, total duration 1–36000 seconds, and integer minutes/seconds. Switching back to repetitions does not require timed fields.

### Compatibility / Safety
- Existing `targetSeconds`, `reps` text, and `setLog[].seconds` are preserved as-is in persisted JSON / Supabase. No schema migration, SQL, new tables or cloud credential changes required.
- No changes to the original account isolation, RLS or conflict-handling modules. Update Only excludes Supabase Config.

### Verification
- 39 new V1.4.2 logic/editor assertions, plus 273 existing = **312 passing assertions**.
- Chromium Playwright real interaction verified on Desktop and Mobile with inline source fallback because the environment blocked localhost: plan creation 1:30, editing 30:00, actual set 1:20, reload of stored values, and no JS errors or horizontal mobile page overflow.
- User's actual Supabase cloud and Vercel deployments remain untested: back up JSON and test login/sync on deployed site.


## V1.4.1 — Reusable Exercise Library & Adaptive Workout Types (2026-10-20)

### New
- Added a permanent **My Exercise Library**, backed by optional `customExercises` inside the existing version-1 user document. Each new exercise can be saved to the library and reused on other workout days. Previously customized exercises in weekly templates can also be selected without retyping.
- Added **Manage My Exercise Library** to list, reuse, or remove saved entries; deleting a library item leaves existing workout plans and historical workout sessions unchanged.
- Exercise form now offers **repetitions** or **seconds per set**, alongside **external weight / bodyweight / no weight**. Supports Plank, Wall Sit, running, Push-ups, Pull-ups, etc. Added sample presets.
- Daily template rows and actual set logging display appropriate units. Push-ups no longer require fabricated kg values; Plank uses actual recorded seconds.
- Updated analytics: kg·reps and Epley estimated 1RM only for real externally weighted repetition sets, with separate bodyweight repetitions and timed seconds. Warm-up sets remain excluded.

### Compatibility / Cloud
- Old exercise templates lacking `measure`, `loadType` and `targetSeconds` are interpreted without rewriting old data. Common Push-up and Plank names are inferred for accurate display; edit any non-standard exercise name to choose the right mode.
- Old session logs remain preserved; no conversion of historical repetitions to elapsed seconds is attempted.
- `customExercises` and exercise metadata are **optional fields**; backups from V1.4.0 and older stay importable.
- No Supabase SQL migration required: the existing JSON document, optimistic concurrency protection and per-user RLS remain untouched. This patch does not contain `js/supabase-config.js`.

### Verification
- All 7 local test suites passed (273 assertions in total, including 36 new V1.4.1 assertions).
- Chromium Playwright verified on desktop and mobile (inline-script fallback because browser file URL was blocked by the environment), with a test-only localStorage shim: exercise library save, selecting Plank, seconds-only set logs, bodyweight reps without kg, and zero JS exceptions / no mobile horizontal overflow.
- **Not yet validated** with user's real Supabase account, network reconnect, multiple concurrent Vercel devices, or live production data. Back up JSON first.

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

---

# V1.9.2 — UX Simplification & In-App Guide (21 October 2026)

- จัดกลุ่ม Sidebar เป็น **บันทึกและวางแผน** และ **วิเคราะห์และพัฒนา** พร้อมยุบ/กางได้ และคง URL เดิมทุกหน้า
- เปลี่ยนปุ่มบน Toolbar จาก “บันทึกน้ำหนัก” เป็น **+ บันทึกด่วน** เลือก Meal, Workout, Sleep, Weight, Recovery และ Running ได้โดยไม่ต้องเปลี่ยนหน้า
- เพิ่มเมนู **เริ่มต้นและคู่มือ** และ `#guide` พร้อมสถานะข้อมูลย้อนหลัง 14 วัน คำอธิบายข้อมูลที่จำเป็นต่อผลวิเคราะห์ และทางลัดไปหน้าใช้งานจริง
- เพิ่มแถบสั้นบน Dashboard เชื่อมไปคู่มือ ลดปัญหาผู้ใช้ไม่รู้ว่าจะกรอกอะไร
- เพิ่ม **บันทึกเมนูที่เคยกินอีกครั้ง** ในหน้าโภชนาการ เลือกเมนูจากประวัติย้อนหลัง 28 วันและใช้ปริมาณเดิม (ตรวจสอบก่อนใช้งาน); ป้องกันการคัดลอกแถวต้นทางเดียวกันซ้ำโดยไม่ตั้งใจ
- เพิ่ม `USER_GUIDE_TH.md` คู่มือเต็มภาษาไทย อธิบาย Inputs → Analyses → Limits ของทุกโมดูล และแนะนำการกรอกให้น้อยลง
- ยังไม่รวม/ลบตาราง SQL หรือโครงสร้าง Cloud JSON และไม่แก้ Supabase Config
- **หมายเหตุ QA:** Regression ทุกชุดเดิมผ่าน; Chromium Desktop/Mobile ทดสอบ Guide, Navigation, Quick Log, Meal Repeat ผ่านโดยโหลดโค้ดโดยตรงเพราะ file:// ถูกบล็อก; ยังไม่เชื่อมทดสอบ Supabase จริง
