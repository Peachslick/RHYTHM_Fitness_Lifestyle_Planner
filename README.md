# RHYTHM — Fitness & Lifestyle Planner

**Version:** `1.2.0` — Workout Intelligence, Adaptive Planner, Sleep % & Fonts (19 ตุลาคม 2026)

**Tech stack:** HTML5 + CSS3 + Vanilla JavaScript + Supabase Auth/Postgres (optional) + LocalStorage. ไม่ต้องมี Node.js/PHP/Express/การ Build เพื่อรัน Production บน Vercel. Supabase JS v2 โหลดผ่าน jsDelivr CDN เฉพาะตอนหน้าเว็บเริ่มทำงาน (ต้องเชื่อมอินเทอร์เน็ตเพื่อเปิดส่วน Cloud; หาก CDN โหลดไม่ได้ยังใช้โหมด Guest ได้).

> ⚠️ **สำคัญ:** ไฟล์ที่ดาวน์โหลดเป็นโค้ดพร้อมเชื่อม Supabase แต่ **ยังไม่ได้เชื่อมฐานข้อมูลของคุณจริง** เพราะไม่มี Project URL/Publishable Key และยังไม่ได้รัน SQL ภายใต้โปรเจกต์ของคุณ กรุณาทำขั้นตอนด้านล่างก่อนเปิดฟังก์ชันบัญชี ไม่ต้องส่ง API key/รหัสผ่านให้ใครผ่านแชต.

## อะไรใหม่ใน V1.2.0

**สำคัญสำหรับผู้ใช้ V1.1.0:** V1.2.0 อัปเดตโค้ดหน้าเว็บอย่างเดียว ไม่ต้องแก้ตาราง ไม่ต้องรัน SQL ใหม่ และไม่เปลี่ยน LocalStorage key หรือรูปแบบ Cloud Document เวอร์ชัน 1. ควร Export JSON สำรองข้อมูลจริงก่อน Deploy เวอร์ชันใหม่ทุกครั้ง โดยเฉพาะในกรณีที่มี Pending/Conflict อย่าแก้โค้ด Supabase config จน Project URL / Publishable Key เดิมหาย.

- **Workout Intelligence:** บันทึกแต่ละเซตจริงแยก Reps, kg และทำเครื่องหมาย Warm-up; เพิ่ม/ลบเซตในบันทึกการฝึก, แก้ข้อมูลเซตย้อนหลังได้; ดู Volume (kg × reps), เซตใน 7 วัน, PR น้ำหนักสูงสุด, e1RM โดยประมาณจาก Epley (เซต 1–10 reps) และ Volume รายท่า/วันในกราฟ. ข้อมูลบันทึก V1.1.0 ไม่มี Reps จริงแยกแต่ละเซต จึงเก็บไว้ดูประวัติได้แต่ **ไม่เดามาเป็น Volume หรือ PR**.
- **Adaptive Planner:** ใช้ปุ่ม **สลับวันฝึก** ในหน้า Workout เลือกวันที่ต้นทางและปลายทางที่ไม่ใช่อดีตเพื่อสลับ Push/Pull/Legs/Run/Rest เฉพาะสองวันได้ โดยไม่เปลี่ยนเทมเพลตสัปดาห์ ไม่แก้บันทึกที่ทำแล้ว และสามารถคืนแผนตามเทมเพลตได้. ถ้าทั้งสองวันมีประวัติฝึก ระบบไม่ยอมสลับเพื่อป้องกันข้อมูลคลาดเคลื่อน. การสลับถูกเก็บเป็น `scheduleOverrides` ใน JSON เดิม.
- **Sleep tracker:** เลือกหน่วยสำหรับ Deep / Light / REM เป็น **เปอร์เซ็นต์** (ค่าเริ่มต้นของรายการใหม่) หรือ **นาที**. ถ้ากรอกเป็นเปอร์เซ็นต์ ผลรวมสามระยะต้องไม่เกิน 100% และระบบจะแสดงนาทีโดยประมาณจากเวลาหลับจริง = เวลาบนเตียง − นาทีตื่น. ไม่บังคับให้กรอกครบ 100% เพราะอุปกรณ์บางรุ่นแสดงระยะการนอนไม่ครบ. การเปลี่ยนหน่วยจะล้างค่าระยะการนอนในฟอร์มเพื่อป้องกันการสับสน, ไม่ลบค่าที่บันทึกไว้จนกว่าจะกดบันทึก. ข้อมูลเก่าที่เป็นนาทียังคงแสดงได้.
- **Font personalization:** หน้า **โปรไฟล์และตั้งค่า → ตั้งค่าแบบอักษร** เปลี่ยนฟอนต์ได้โดยไม่ต้องกรอกโปรไฟล์ให้ครบ รองรับรายชื่อ 16 แบบเหมือนใน Workday Journey: Sarabun, Bai Jamjuree, Noto Sans Thai, IBM Plex Sans Thai, Leelawadee UI, Tahoma, Segoe UI / System, Prompt, Kanit, Mitr, Anakotmai, Athiti, Trirong, Itim, Pattaya และ Chonburi. บันทึกเป็น `settings.font` ซิงค์ไปพร้อมข้อมูลบัญชี. ฟอนต์ Google โหลดผ่าน Google Fonts เมื่อมีเน็ต; Leelawadee UI และ Anakotmai จะใช้ฟอนต์ที่ติดตั้งในอุปกรณ์ หากไม่มีจะแสดงฟอนต์สำรอง. ไม่มีการแนบไฟล์ฟอนต์ลิขสิทธิ์.
- **ข้อมูลเดิม / Cloud:** โค้ด `js/sync.js`, `supabase/001_init.sql` และ RLS ของ V1.1.0 ยังคงเดิม; การแก้ไขข้อมูลทุกหน้าผ่าน flow `sync.persist()` เดิม รวมถึง Prompt/FONT, วงรอบซิงค์, Revision, Pending และ Conflict.

### ทดสอบก่อน Deploy (แนะนำ)

1. ดาวน์โหลด JSON backup ของบัญชีปัจจุบันก่อนอัปเดต (หากใช้ Cloud ให้รอสถานะซิงค์สำเร็จ และตรวจว่าไม่มี Pending หรือ Conflict)
2. ทดสอบ Font เปลี่ยนเป็น Prompt แล้วรีเฟรช / Login อีกอุปกรณ์เพื่อดูว่าสถานะ Cloud ถูกต้อง
3. ทดสอบบันทึกวันฝึก เพิ่มเซต 40 kg × 10 reps → Volume 400 kg·reps (ไม่รวม Warm-up); ลองแก้เซตและตรวจ PR
4. ทดลองสลับ Rest Day กับ Legs ในวันอนาคต ตรวจว่าเทมเพลตสัปดาห์ยังคงเดิม และคืนตารางได้
5. ทดลองกรอก Sleep Deep 22%, Light 55%, REM 23% → ระบบแสดงเปอร์เซ็นต์พร้อมนาทีโดยประมาณ; ลองกรอกเกิน 100% ต้องบันทึกไม่ได้
6. ใช้บัญชี Supabase สองบัญชีทดสอบแยกข้อมูลตามคำแนะนำเดิมในส่วน Setup ด้านล่าง

### คำสั่งทดสอบตรรกะ (Node.js)

```bash
node tests/test-core.cjs
node tests/test-app.cjs
node tests/test-v12.cjs
node tests/test-sync.cjs
```

หากใช้ Chromium Browser ในระบบที่บล็อกการเปิด `localhost` หรือ `file://` อาจต้องทดสอบด้วยเบราว์เซอร์จริงบน Vercel เพิ่ม. ชุดทดสอบอัตโนมัติเหล่านี้เป็นการทดสอบโค้ด/Mock ยังไม่ยืนยันการเชื่อม Supabase ของคุณจริง.

---

## 1. สิ่งที่มีใน V1.1.0

- ยังใช้ Workout Planner, Nutrition, Sleep, Routine, Progress, Profile, BMI/TDEE และ Backup JSON เหมือน V1.0.0
- สมัครสมาชิก, เข้าสู่ระบบ, ออกจากระบบ, รีเซ็ตรหัสผ่านด้วยอีเมลผ่าน **Supabase Auth**
- **RLS (Row-Level Security)**: จำกัดอ่าน/เขียนข้อมูล `public.rhythm_user_data` ของเจ้าของบัญชีเท่านั้น; ไม่มีสิทธิ์ `anon` เข้าถึงตาราง
- **1 แถวต่อ user_id** เก็บรูปแบบ JSON ของ V1 เดิมไว้ ไม่ต้องย้าย schema ทุกฟีเจอร์ตอนนี้
- **Optimistic concurrency**: ตรวจ `revision` ที่เครื่องเคยอ่านก่อน UPDATE; การแก้ข้อมูลพร้อมกันจากหลายอุปกรณ์ไม่ถูกเขียนทับเงียบ ๆ
- **Draft ใน LocalStorage แยก user_id**: บันทึกก่อนส่งขึ้น Cloud, ถ้าเน็ตขาดหรือปิดแท็บก่อนซิงค์จะลองส่งใหม่เมื่อเปิดเว็บครั้งต่อไป
- เลือกชุดข้อมูลเองเมื่อเกิด Conflict (ข้อมูลในเครื่อง/Cloud) พร้อมปุ่มดาวน์โหลด Backup ทั้งสองชุด
- **ย้าย LocalStorage เดิมแบบ Opt-in เท่านั้น**; ไม่อัปโหลด Demo หรือข้อมูล Guest โดยอัตโนมัติ; ไม่ลบข้อมูลเครื่องก่อน Cloud ยืนยันว่ารับข้อมูลแล้ว
- เช็กเวอร์ชันข้อมูลบน Cloud ทุก ~45 วินาทีเมื่อหน้าเว็บยังเปิดอยู่ และเมื่อกลับมาที่แท็บ; กด “ซิงค์ตอนนี้” ได้
- Sign out จะปฏิเสธหากมี Draft ค้างส่ง เพื่อไม่ให้ผู้ใช้เข้าใจผิดว่าเซฟแล้ว

## 2. Supabase Setup — ทำตามลำดับ

### 2.1 สร้าง Supabase Project

1. ไปที่ https://supabase.com/dashboard แล้วสร้าง Project ใหม่สำหรับ RHYTHM (**แนะนำแยกจาก Workday Journey**)
2. เปิด **Authentication → Providers → Email** และเปิด Email/Password
3. **แนะนำเปิด Confirm email** สำหรับเว็บที่เข้าถึงได้สาธารณะ เพื่อยืนยันความเป็นเจ้าของอีเมล (หากปิดจะได้รับ session หลังสมัครทันที และควรชั่งน้ำหนักความเสี่ยง/สแปม)
4. ตั้ง Rate limits และบริการ SMTP สำหรับ Production ถ้ามีผู้ใช้จริงจำนวนมาก; ค่าอีเมลเริ่มต้นของ Supabase อาจมีโควตาจำกัด
5. ไปที่ **SQL Editor → New query** วางเนื้อหา `supabase/001_init.sql` ทั้งหมด แล้วกด **Run** **เพียงครั้งแรก** (SQL idempotent บางส่วน แต่ไม่ควรใช้เพื่อแก้ schema ในอนาคตโดยไม่ทบทวน)
6. ตรวจด้วย `supabase/VERIFY_SETUP.md` ก่อนให้บุคคลอื่นสมัครจริง

### 2.2 ตั้ง Auth URL Configuration

เปิด **Authentication → URL Configuration** ใน Supabase:

- **Site URL:** `https://<ชื่อเว็บของคุณ>.vercel.app`
- **Redirect URLs:** เพิ่ม `https://<ชื่อเว็บของคุณ>.vercel.app/**` และ `http://localhost:8080/**` (หรือ localhost port ที่ใช้) อนุญาตเฉพาะ URL ที่ไว้ใจได้
- ถ้ามี Custom Domain เพิ่มโดเมนจริงด้วย

ระบบ Password Reset และอีเมลยืนยันใช้ URL เหล่านี้ หาก URL ไม่ถูกต้อง ลิงก์จะส่งกลับผิดเว็บไซต์

### 2.3 กำหนด Frontend Public Config

แก้ `js/supabase-config.js`:

```js
window.RHYTHM_SUPABASE_CONFIG = Object.freeze({
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  publishableKey: 'sb_publishable_YOUR_PUBLIC_KEY'
});
```

หา Project URL และ **Publishable Key** ได้จาก Supabase → **Project Settings → API Keys** (ชื่อเมนูอาจเปลี่ยน) หรือใช้ legacy **anon key** ในโปรเจกต์ที่ยังใช้รูปแบบเดิม.

**ห้ามใส่ `service_role` / `sb_secret_...` / Database Password ลงใน HTML, JS, Repo, Vercel Public Environment Variables หรือ Source Control โดยเด็ดขาด**: ไฟล์ static เป็นสาธารณะ; การปกป้องข้อมูลพึ่ง Supabase Auth + RLS ไม่ใช่ซ่อน Publishable Key.

> หากยังไม่กรอกค่าทั้งสอง ผู้ใช้ยังใช้เว็บใน **โหมดในเครื่อง** ได้ แต่ปุ่มเข้าสู่ระบบจะปิดไว้โดยเจตนา

### 2.4 ทดสอบด้วยบัญชี 2 คน ก่อนเปิดใช้งานจริง

- สมัครบัญชี A และ B แยกอีเมล → กรอกข้อมูลที่แตกต่างกัน
- Login A บนเบราว์เซอร์หนึ่ง → บันทึกน้ำหนัก → รอคำว่า `ซิงค์แล้ว`
- Login A บนอีกเครื่อง → เห็นข้อมูล A
- Login B บนอีกเครื่อง → ต้อง **ไม่เห็นข้อมูล A** ไม่ว่าเปลี่ยน URL/API Request อย่างไร (RLS เป็นตัวบังคับสิทธิ์ที่ฐานข้อมูล)
- ทดสอบการเปลี่ยนข้อมูลพร้อมกัน โดยบันทึกบนอุปกรณ์ทั้งสองก่อนอีกเครื่องจะโหลด revision ใหม่ → ควรเห็นหน้า Conflict และเลือกทางแก้ได้
- ปิดอินเทอร์เน็ต → แก้ข้อมูล → เช็ก Pending/Refresh → ต่อเน็ต → กดซิงค์ → ข้อมูลไม่หาย
- Sign out → ข้อมูลบัญชีไม่แสดงในหน้า Guest; Sign in อีกครั้ง → ได้ข้อมูลบัญชีเดิม
- ทดสอบ Forgot Password ด้วยอีเมลและ Redirect จริง

## 3. Deploy ขึ้น GitHub + Vercel

1. แตก ZIP, เปิดโฟลเดอร์ `RHYTHM_v1.2.0` แล้วอัปโหลด **ไฟล์ข้างใน** โฟลเดอร์ขึ้น GitHub Repository (ให้ `index.html` อยู่ Repo Root)
2. แก้ `js/supabase-config.js` เป็น public URL/publishable key จริง (อย่าใช้ Secret Key)
3. Vercel → Add New → Project → Import Git Repository
4. Framework Preset = `Other`, Root Directory = `./`, Build Command = ว่าง, Output Directory = `./` (เลือก static root/default)
5. Deploy → ตั้ง Supabase Site/Redirect URLs ให้ตรงกับ URL ที่ได้จาก Vercel
6. ทดสอบ Login/Sync + Backup บน URL HTTPS ที่ Deploy แล้ว

ไม่มี Node.js หรือ API Server ฝั่ง Vercel; Frontend จะติดต่อ Supabase โดยตรงภายใต้ session ของผู้ใช้และ RLS. `vercel.json` เพิ่ม Response Headers ที่เป็นประโยชน์สำหรับเว็บ static.

## 4. วิธีใช้ข้อมูล Guest + บัญชี

### เริ่มใช้ใหม่

หน้าแรกถ้ายังไม่ล็อกอินเป็น Demo/Guest และบันทึกลง LocalStorage (`rhythm_fitness_v1`) ตามเดิม. เมื่อ Login บัญชีที่ไม่มีแถว Cloud:

- ถ้ามีข้อมูลจริงใน Guest: **ต้องเลือก** ระหว่าง “ย้ายข้อมูลจากเครื่องนี้ขึ้น Cloud” หรือ “เริ่มบัญชีใหม่บน Cloud”
- ถ้า Guest ยังเป็น Demo: สร้าง Cloud Profile ว่างให้อัตโนมัติ (**ไม่ย้ายข้อมูลสมมติ**)

### บัญชีมีข้อมูล Cloud อยู่แล้ว

ระบบใช้ข้อมูลบัญชีเป็นหลัก ไม่สลับไปใช้ Guest โดยอัตโนมัติ. Guest เดิมจะอยู่ใน LocalStorage แยกต่อไปจนกว่าคุณจะเลือก **ย้ายข้อมูล LocalStorage เดิมไป Cloud** จากหน้าโปรไฟล์; การย้ายแบบนี้เป็น **การแทนที่ทั้งชุด** จึงจะมี Confirm และดาวน์โหลด Backup Cloud ก่อน.

### ข้อมูลชนกัน (Conflict)

หาก revision เปลี่ยนเพราะอุปกรณ์อื่นอัปเดต Cloud ระหว่างนี้:

- ระบบเก็บ Pending Draft บนเครื่องไว้ และหยุดส่งข้อมูล ไม่เขียนทับอัตโนมัติ
- ให้ Export สำรอง “เครื่องนี้” และ “Cloud” (ถ้ามี) ก่อนเลือก
- **ใช้เครื่องนี้แทน Cloud** = ตั้งใจเขียนข้อมูลในเครื่องทับ Cloud โดย CAS อีกครั้ง
- **ใช้ Cloud แทนเครื่องนี้** = ทิ้งการแก้ในเครื่อง (หน้าเว็บจะดาวน์โหลดสำรองเครื่องให้อัตโนมัติก่อนทิ้ง)
- ตอนนี้ **ยังไม่มี Merge ระดับรายการ** (เช่น เซตอาหารจากเครื่อง A + Sleep จาก B) — ต้องเลือกระหว่างข้อมูลทั้งชุด เพื่อให้ผู้ใช้ควบคุมความขัดแย้งได้ชัดเจน

### กรณีอินเทอร์เน็ตหลุด

- หากเข้าสู่ระบบแล้วและเปิดข้อมูล Cloud ได้อย่างน้อยหนึ่งครั้ง: สามารถบันทึกชั่วคราวเป็น Pending Draft แยก user_id ได้
- Pending Draft จะเก็บใน **LocalStorage โดยไม่ได้เข้ารหัส** (ควรใช้บนเครื่องส่วนตัวเท่านั้น; อย่าบันทึกข้อมูลสุขภาพบนเครื่องสาธารณะ)
- Draft **ไม่ถือว่า Backup Cloud** จนกว่าแถบสถานะจะขึ้น “ซิงค์แล้ว”
- ห้ามเคลียร์ข้อมูลเว็บไซต์ / ใช้ Incognito / เปิดหลายแท็บแล้วเข้าใจว่าปลอดภัย 100%: LocalStorage มีโควตาและอาจถูกลบหรือถูกเข้าถึงโดยผู้ใช้เบราว์เซอร์เดียวกันได้
- หากข้อมูลค้างส่งนาน ให้ดาวน์โหลด JSON เก็บไว้ในที่ปลอดภัยก่อน Refresh / Logout

## 5. ประเด็นความเป็นส่วนตัวและข้อจำกัด

- หน้าเว็บไม่ได้ส่งข้อมูลสุขภาพให้บุคคลอื่นโดยเจตนา **แต่ Supabase เป็นผู้ให้บริการ Cloud ที่เก็บข้อมูลจริง** ต้องพิจารณานโยบายส่วนตัวและ Data Residency ก่อนใช้งานกับผู้อื่น
- Supabase Database เข้ารหัสข้อมูลระหว่างส่งผ่าน HTTPS และควบคุมสิทธิ์ด้วย RLS; แถว `data` ไม่ได้เข้ารหัสแบบ end-to-end ฝั่งผู้ใช้หรือฝั่งแอป
- `supabase-js` เก็บข้อมูล Auth Session ใน Browser Storage ตามการตั้งค่า SDK; ดังนั้น **อย่าใช้เครื่องที่ไม่ไว้ใจ** และควรเปิดใช้งานการยืนยันอีเมลสำหรับการใช้งานสาธารณะ
- ระบบเริ่มด้วย Data Model แบบ JSONB 1 document/user เหมาะกับ MVP และการรักษาความเข้ากันได้กับ V1; หากมีข้อมูลจำนวนมากหรือทำ Collaboration ต้องออกแบบ schema แยกตารางพร้อม migrations, constraint และ test เพิ่ม
- เวอร์ชันนี้ไม่ได้รับรองการใช้งานทางคลินิก; ตัวเลขอาหาร BMI/TDEE และ Deep/REM เป็นค่าประมาณ/บันทึกตามผู้ใช้หรืออุปกรณ์
- ไม่ได้รองรับ Merge เฉพาะรายการ และไม่มี Autosync เมื่อเว็บถูกปิดสนิท
- ไม่ได้เชื่อม Live Supabase Test ในการสร้างไฟล์นี้ เพราะไม่มี Project Credentials; **การทดสอบ Mock ไม่สามารถพิสูจน์ว่า RLS บน Project ของคุณตั้งถูกต้องแล้ว**

## 6. โครงสร้างไฟล์

```text
RHYTHM_v1.1.0/
├── index.html
├── vercel.json                 # Static security headers
├── css/styles.css
├── js/
│   ├── data.js                 # Nutrition/Workout example data
│   ├── core.js                 # Calculations, validation, guest storage
│   ├── supabase-config.js      # PUBLIC Project URL + Publishable Key
│   ├── sync.js                 # Supabase Auth, pending drafts, CAS, conflicts
│   └── app.js                  # 7 existing pages + Account UI
├── supabase/
│   ├── 001_init.sql            # Create table, RLS, revision trigger
│   └── VERIFY_SETUP.md        # Postgres + two-user authorization checklist
├── tests/
│   ├── test-core.cjs
│   ├── test-app.cjs
│   └── test-sync.cjs
├── CHANGELOG.md
└── README.md
```

## 7. การทดสอบโค้ด (Node ใช้เฉพาะผู้พัฒนา)

```bash
node tests/test-core.cjs
node tests/test-app.cjs
node tests/test-sync.cjs
```

**ผลการทดสอบในแพ็กนี้:** Calculator/Storage 23 assertions, App Render/CRUD 29 assertions, Supabase Mock Sync 70 assertions = **122 assertions** ผ่านทั้งหมด. ตรวจไวยากรณ์ JavaScript, JSON และตรวจ UI แบบ Chromium ด้วยการฉีดไฟล์ source เข้า Browser (ข้อจำกัดระบบไม่อนุญาตให้ Browser เปิด localhost; ไม่ได้ทดสอบจริงผ่าน HTTP URL). Browser ระบุไม่พบ JavaScript errors ใน Guest Demo; mobile ไม่พบ Horizontal Overflow ในขนาด 390px.

> หากต่อ Supabase จริงแล้วพบ Error โปรดดู Network/Console และตาราง `rhythm_user_data` ใน Supabase ก่อนแก้โค้ด อย่าลบฐานข้อมูลหรือ Reset Auth เพื่อทดลองโดยไม่มี Backup.

## 8. อ้างอิงทางเทคนิค

- Supabase Auth JS v2: https://supabase.com/docs/reference/javascript/start
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase JavaScript CDN: https://supabase.com/docs/reference/javascript/installing
- Supabase Auth URL settings: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Password Reset: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
