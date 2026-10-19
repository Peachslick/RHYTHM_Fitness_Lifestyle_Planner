# RHYTHM V1.4.0 — Recovery & Lifestyle Intelligence

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
