# RHYTHM V1.4.2 — Minute & Second Workout Timing

อัปเดตต่อจาก RHYTHM V1.4.1 โดยปรับฟอร์มท่าออกกำลังกายและฟอร์มบันทึกเซตจริงให้กรอก **นาที + วินาที** แทนการแปลงเองเป็นวินาทียาว ๆ ข้อมูลเก่า, คลังท่าส่วนตัว, ตัวคำนวณ Training Analytics และ Supabase Cloud Sync ยังใช้รูปแบบเดิม

## ฟีเจอร์ใหม่

- เมื่อเลือก **รูปแบบการทำ → จับเวลา** ช่อง **เวลาต่อเซต** แยกเป็น `นาที` (0–600) และ `วินาที` (0–59)
- ตัวอย่าง: Plank **1 นาที 30 วินาที** → นาที `1`, วินาที `30`; วิ่ง **30 นาที** → นาที `30`, วินาที `0`; Plank 45 วินาที → นาที `0`, วินาที `45`
- **บันทึกการฝึกจริง → เพิ่มเซตจริง** รองรับนาที + วินาทีแยกกันเช่นเดียวกัน และเปิดแก้ไขเซตเก่าได้
- ตารางฝึก, คลังท่าส่วนตัว และผล PR ที่เป็นเวลาจะแสดงผลอ่านง่าย (`30 นาที`, `1 นาที 30 วินาที`)
- ระบบเก็บค่า `targetSeconds`, `seconds` ภายในเป็น **จำนวนวินาทีเต็มเท่านั้น** (`30 นาที = 1800 วินาที`) เพื่อไม่เปลี่ยน JSON Schema และไม่กระทบสถิติที่มีอยู่
- ปฏิเสธเวลา 0, ค่าติดลบ, วินาที 60 ขึ้นไป และเวลารวมที่เกิน 10 ชั่วโมงต่อเซต โดยไม่เขียนทับข้อมูลก่อนหน้า

## วิธีอัปเดตเว็บที่ใช้ V1.4.1 อยู่แล้ว

1. เข้าเว็บ V1.4.1 ให้ Cloud Sync ไม่มี Pending/Conflict และดาวน์โหลด **Backup JSON** ก่อน
2. แตก `RHYTHM_v1.4.2_UPDATE_ONLY.zip` แล้วนำไฟล์ภายในไป **ทับตรง root** ของ GitHub Repository เดิม (ไม่ต้องเพิ่มโฟลเดอร์ครอบ)
3. ไฟล์ใน ZIP อัปเดต: `index.html`, `css/styles.css`, `js/app.js`, `js/core.js`, `tests/test-v142.cjs`, `README.md`, `CHANGELOG.md`
4. **ไม่มี** `js/supabase-config.js` ในไฟล์ Update Only; URL และ Publishable Key ที่คุณตั้งไว้ไม่ถูกทับ
5. Commit/Push ไป GitHub → รอ Vercel Deploy → Hard Refresh → ตรวจ footer ว่า **V1.4.2**
6. ลองสร้าง Plank 1 นาที 30 วินาที และวิ่ง 30 นาที; บันทึกเซตจริง; เปิดกลับมาแก้; ตรวจ Cloud Sync จากบัญชีจริงด้วยตนเอง

**ไม่ต้องรัน SQL ใหม่** ระบบยังใช้ JSON user document + RLS และ CAS sync ของ V1.1.0 ตามเดิม ส่วนการทดสอบกับ Supabase จริงยังไม่ได้ทำในสภาพแวดล้อมนี้

## ทดสอบ

```bash
node tests/test-core.cjs
node tests/test-app.cjs
node tests/test-sync.cjs
node tests/test-v12.cjs
node tests/test-v13.cjs
node tests/test-v14.cjs
node tests/test-v141.cjs
node tests/test-v142.cjs
```

ทดสอบบน Node.js ผ่าน **312 assertions** จาก 8 ชุด (273 เดิม + 39 ใหม่) และทดสอบ Chromium แบบ Desktop 1440×900 / Mobile 390×844 โดยใช้ inline source fallback เนื่องจากสภาพแวดล้อมบล็อก localhost: เพิ่มท่า → ตั้งเป้า 1:30 → แก้ 30:00 → บันทึกเซต 1:20 → เปิดซ้ำ, ไม่พบ JavaScript Error หรือ mobile page overflow; **ยังไม่ได้ทดสอบ Supabase จริง**

---

## คู่มือ V1.4.1 และก่อนหน้า

# RHYTHM V1.4.1 — Reusable Exercise Library & Workout Modes

แก้จาก **V1.4.0** โดยไม่ล้างข้อมูลเดิม และไม่ต้องแก้ Supabase SQL / RLS เพิ่ม

## ฟีเจอร์ใหม่

- **คลังท่าออกกำลังกายของฉัน**: หน้า *แผนออกกำลังกาย* → *เพิ่มท่า* → กรอกชื่อท่า เลือกประเภท แล้วติ๊ก **บันทึก/อัปเดตท่านี้ในคลังของฉัน** (ติ๊กไว้เริ่มต้นสำหรับท่าใหม่) → กดเพิ่มท่า จากวันฝึกอื่น เลือกท่าที่เคยบันทึกใน Dropdown ได้ทันที
- กด **คลังท่าของฉัน** เพื่อเลือกรายการที่บันทึกหรือเอาออกจากคลัง การลบออกจากคลัง **ไม่ลบ** ท่าที่เคยเพิ่มในวันอื่นหรือประวัติการฝึก
- รองรับ **จำนวนครั้ง (Reps)** หรือ **เวลาต่อเซตเป็นวินาที** เช่น Plank 45 วินาที; เลือก **น้ำหนักอุปกรณ์**, **น้ำหนักตัว**, หรือ **ไม่มีน้ำหนัก** เช่น Push-up ไม่ต้องกรอก kg
- ในหน้าบันทึกการฝึกจริง ให้กรอกจำนวนครั้ง/วินาทีตามชนิดท่า; คำนวณ Training Volume (kg × reps) และประมาณ 1RM เฉพาะท่าที่ใช้น้ำหนักอุปกรณ์จริง ส่วน Plank ดูเวลาต่อเซต, Push-up ดูจำนวนครั้ง
- เพิ่มตัวอย่าง Push-ups, Bench Dips, Bodyweight Squat และ Wall Sit; Plank/Pull-up/Run เดิมปรับเป็นประเภทที่เหมาะสมแล้ว

## ขั้นตอนอัปเดต V1.4.0 บน GitHub + Vercel

1. เปิด RHYTHM แล้วสำรอง JSON ก่อน และรอให้ Cloud Sync ไม่มี Pending / Conflict
2. แตก `RHYTHM_v1.4.1_UPDATE_ONLY.zip` **คัดลอกเนื้อหา** ไปทับ root ของ GitHub Repository เดิม (อย่าสร้างโฟลเดอร์ครอบเพิ่ม)
3. ไฟล์อัปเดตมีเพียง `index.html`, `css/styles.css`, `js/app.js`, `js/core.js`, `js/data.js`, `tests/test-v141.cjs`, `README.md`, `CHANGELOG.md` **ไม่มี `js/supabase-config.js`**
4. Commit/Push ให้ Vercel Deploy อัตโนมัติ แล้ว Refresh หน้าเว็บ ตรวจว่าด้านล่างแสดง V1.4.1
5. เพิ่มท่า Plank แบบ 45 วินาที; บันทึกลงคลัง จากนั้นไป Pull/Leg Day ลองเลือกใช้ซ้ำ; ทดสอบ Push-up แบบน้ำหนักตัว และบันทึกเซตจริงก่อนใช้งานจริง

**ไม่ต้องรัน SQL เพิ่ม**: ใช้ตาราง Supabase เดิมและโครงข้อมูล JSON เดิม แต่ควรทดสอบ Cloud Sync ด้วยบัญชีของคุณหลัง Deploy ทุกครั้ง

**ข้อจำกัด**: การคัดแยกประเภทของท่าเก่า (เช่น Push-up, Plank) ใช้รูปแบบชื่อ/เป้าหมายเดิมช่วยคาดเดา; หากเป็นชื่อเฉพาะควรแก้ประเภทด้วยตนเอง การแปลงเซตจริงเก่าเป็นวินาทีจะไม่ทำอัตโนมัติและไม่มีการแต่งเติมน้ำหนักตัวเป็น kg ส่วนข้อมูล Library จะซิงค์เป็น JSON ทั้งชุดตามระบบ Cloud Sync เดิม ไม่ใช่ merge รายท่าอัตโนมัติเมื่อเกิด conflict

## ทดสอบ

```bash
node tests/test-core.cjs
node tests/test-app.cjs
node tests/test-sync.cjs
node tests/test-v12.cjs
node tests/test-v13.cjs
node tests/test-v14.cjs
node tests/test-v141.cjs
```

---

## คู่มือจาก V1.4.0 (ฟีเจอร์เดิมยังอยู่)


เว็บส่วนตัวสำหรับออกกำลังกายและวางแผนสุขภาพด้วย HTML/CSS/Vanilla JavaScript ต่อจาก RHYTHM V1.3.0 โดยยังรองรับบัญชี Supabase, Cloud Sync, Backup / Restore และตั้งค่าฟอนต์จาก Workday Journey เช่นเดิม

## ของใหม่ V1.4.0

- เพิ่มหน้า **Recovery & Lifestyle** ในเมนูด้านซ้าย เพื่อบันทึก **Recovery Check-in** รายวัน ย้อนหลังได้: ความสดชื่น/พลังงาน (1–5), ความเหนื่อยล้า (1–5), ความปวดเมื่อยกล้ามเนื้อ (1–5), ความเครียด (1–5), อารมณ์ (1–5), น้ำดื่มและก้าวเดิน (ไม่บังคับ), โน้ต รายการเก่ารองรับการแก้ไข/ลบ
- แสดง **ความรู้สึกเฉลี่ย** จากแบบประเมินตัวเอง (คะแนน 1–5; ไม่ใช่คะแนนตรวจสุขภาพ), กราฟแนวโน้ม 14 วัน, ปฏิทินย่อ 7 วัน, ชั่วโมงนอนเฉลี่ยจากบันทึกที่มีจริง, ความแปรปรวนของเวลาเข้านอนที่เคยบันทึกอย่างน้อย 3 คืน, RPE เฉลี่ยการฝึก 14 วัน
- สร้าง **ข้อสังเกตเชิงพฤติกรรม** เช่น มีข้อมูลว่าคืนล่าสุดนอนต่ำกว่าเป้าหมายเกิน 1 ชั่วโมง, เหนื่อย/ปวดกล้ามเนื้อสูง, ฝึกหนัก RPE ≥ 8 มากกว่า 1 ครั้งใน 3 วัน ทั้งหมดเป็นเงื่อนไขโปร่งใส แสดงเพื่อให้ผู้ใช้ตัดสินใจเอง **ไม่ปรับตารางฝึกหรือแคลอรี่ให้อัตโนมัติ**
- เพิ่มโลโก้ **ดัมเบลล์ + ปฏิทิน** ใน Sidebar, แถบหัวเว็บ, หน้า Loading และ Favicon บน Browser Tab พร้อม Apple Touch Icon

> **สำคัญ:** การประเมินความรู้สึก, ระยะการนอนจากนาฬิกา และข้อสังเกตเชิงการฝึกเป็นข้อมูลประกอบการวางแผน ไม่ใช่การประเมินโรคหรือบาดเจ็บ หากมีอาการเจ็บปวดผิดปกติหรือปัญหาสุขภาพ ให้ปรึกษาบุคลากรสุขภาพที่เหมาะสม

## การอัปเดตจาก V1.3.0 (แนะนำ)

1. เปิด RHYTHM V1.3.0 ของคุณ แล้วเข้า **โปรไฟล์และตั้งค่า → สำรองข้อมูล (.json)** ก่อนทุกครั้ง
2. สำหรับ Cloud ให้ตรวจสถานะซิงค์ว่าไม่มี **Pending** หรือ **Conflict** ก่อนอัปเดต และสำรองฝั่ง Cloud/เครื่องหากมีความขัดแย้ง
3. แตก `RHYTHM_v1.4.0_UPDATE_ONLY.zip` แล้วคัดลอก **ไฟล์ภายใน** ไปทับ root ของ GitHub repo/Vercel project เดิม โดยให้ `index.html` อยู่ชั้นบนสุด ไม่ต้องสร้างโฟลเดอร์ซ้อน
4. ไฟล์ที่จะอัปเดต: `index.html`, `css/styles.css`, `js/app.js`, `js/core.js`, `js/data.js`, `js/recovery.js` (ใหม่), `assets/*` (ใหม่), `tests/test-v14.cjs` (ใหม่), `README.md`, `CHANGELOG.md`
5. **ห้ามทับ `js/supabase-config.js` เดิม** — ไฟล์ดังกล่าวไม่อยู่ใน Update Only ZIP
6. Git commit/Push แล้วให้ Vercel Deploy อัตโนมัติ (`Framework Preset: Other`, Static Site ไม่มี Build Command)
7. กด Refresh หรือ Hard Refresh หาก Favicon เดิมยังอยู่ (ไอคอนมี `?v=1.4.0` สำหรับแยก cache)
8. เปิดหน้า **Recovery & Lifestyle** เพิ่ม Check-in ทดสอบ, Refresh, เช็กข้อมูลเดิม, ทดสอบ Sync, Login บัญชีเดิมและทดสอบจากอีกอุปกรณ์

**ไม่มี SQL Migration ใน V1.4.0**: Check-in เก็บใน `checkins` ภายใน JSON payload รุ่น `version:1` เดิม; ตัวตรวจข้อมูลรองรับ `checkins` ที่ไม่มีอยู่ใน export ของเวอร์ชันก่อน ข้อมูลยังคงแยก per-user ตาม Supabase RLS เดิม

## ติดตั้งใหม่ด้วย Full Source

1. แตก `RHYTHM_Fitness_Lifestyle_Planner_v1.4.0_FULL.zip` แล้วนำเนื้อหาโฟลเดอร์ `RHYTHM_v1.4.0` ไปใส่ root ของ GitHub repo
2. เปิด `index.html` โดยตรงหรือผ่าน local static server/XAMPP ได้ ส่วนการเข้าสู่ระบบ Cloud ต้องใช้งานผ่านโดเมน https ที่กำหนดใน Supabase
3. หากต้องการ Cloud ให้สร้าง Supabase project และใช้ `supabase/001_init.sql` **เพียงครั้งแรกของโปรเจกต์ใหม่เท่านั้น** แล้วตรวจ `supabase/VERIFY_SETUP.md`
4. กรอก URL และ **Publishable Key** ใน `js/supabase-config.js` (ห้ามใช้ `service_role`, secret key หรือใส่รหัสผ่านฐานข้อมูล)
5. กำหนด Authentication URL Configuration และ Redirect URLs ให้รองรับ URL Vercel ที่ใช้งาน แล้วทดสอบการยืนยันอีเมล/รีเซ็ตรหัสผ่าน

**หมายเหตุ:** ถ้าใช้ Full Source เพื่อทับโปรเจกต์เก่าที่ตั้งค่า Supabase แล้ว จะต้องเก็บ `js/supabase-config.js` เดิมไว้เอง มิฉะนั้น Cloud จะกลับเป็นโหมดไม่ได้ตั้งค่า และ **อย่ารัน `001_init.sql` ซ้ำในโปรเจกต์เดิมโดยไม่ตรวจสอบ**

## โครงสร้าง

```text
RHYTHM_v1.4.0/
├── index.html                   # favicon, styles, scripts
├── assets/
│   ├── rhythm-logo.png          # original 512×512 brand icon
│   ├── favicon.ico
│   ├── favicon.png
│   ├── favicon-32.png
│   └── apple-touch-icon.png
├── css/styles.css
├── js/
│   ├── app.js                   # UI / forms / navigation
│   ├── recovery.js              # descriptive recovery analysis (new)
│   ├── data.js                  # demo/empty state
│   ├── core.js                  # dates, calculations, import validation
│   ├── foods-expanded.js
│   ├── sync.js                  # Supabase CAS/Conflict protection (unchanged)
│   └── supabase-config.js       # your existing config (Full Source only)
├── supabase/
├── tests/
├── README.md
└── CHANGELOG.md
```

## วิธีทดสอบ (ติดตั้ง Node.js สำหรับการรันทดสอบเท่านั้น)

```bash
node tests/test-core.cjs
node tests/test-v12.cjs
node tests/test-v13.cjs
node tests/test-v14.cjs
node tests/test-app.cjs
node tests/test-sync.cjs
```

การรันทดสอบได้ `23 + 32 + 44 + 39 + 29 + 70 = 237` checks (แยกเป็น assertions/reported checks ของแต่ละชุด; Cloud ทำเป็น Mock). ทดสอบหน้าจอผ่าน Playwright Chromium โดยโหลด HTML/JS/CSS โดยตรง เนื่องจากสภาพแวดล้อมจำกัดการเปิด localhost ของ Chromium; ได้ตรวจ Desktop/Mobile และฟอร์ม Recovery จริง แต่ยังไม่ได้ทดสอบกับ Project Supabase/Vercel ของคุณ จึงต้องทดสอบอัปเดตข้ามอุปกรณ์และ RLS บน Supabase จริงหลัง Deploy

## ความปลอดภัย / ข้อมูลส่วนบุคคล

- `LocalStorage` **ไม่ถูกเข้ารหัส** เหมาะกับอุปกรณ์ส่วนตัว และไฟล์ JSON backup มีข้อมูลส่วนตัวจริง; อย่าแชร์โดยไม่ลบข้อมูลออกก่อน
- Cloud Sync ใช้ CAS revision เพื่อลดความเสี่ยงการเขียนทับจากสองเครื่อง, แต่กรณี Conflict ยังต้องเลือกว่าจะเก็บฝั่งใดทั้งชุด; สำรองทั้งคู่ก่อนทุกครั้ง
- ข้อมูล Check-in ที่บันทึกในอุปกรณ์จะรวมในไฟล์ JSON และถูกซิงค์ผ่านกลไกเดิมเมื่อเข้าสู่บัญชี Cloud
- Favicon เป็นไฟล์ Static ไม่มีข้อมูลผู้ใช้
- งานนี้ไม่เปลี่ยนรหัสผ่าน Supabase, RLS หรือตารางฐานข้อมูล
