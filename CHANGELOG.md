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
