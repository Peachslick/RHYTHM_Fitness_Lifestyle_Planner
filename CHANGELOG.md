# Changelog

## [1.0.0] — 2026-10-19

### Added
- แอปส่วนตัว **RHYTHM** ใช้ HTML/CSS/Vanilla JavaScript ไม่ต้องมี Backend
- UI ภาษาไทย + Responsive + Light/Dark theme
- Dashboard แคลอรี่และ Macro, BMI/BMR/TDEE, การฝึกวันนี้, สรุปการนอน
- แก้ไขโปรแกรมฝึก 7 วัน (Push / Pull / Legs / Run / Full Body / Recovery / Rest)
- แก้ไขท่า, Sets, Reps, Load, Rest และบันทึก Session จริงแยกตามวัน
- Food Journal พร้อมคลังอาหารตัวอย่าง + อาหารส่วนตัว + จำนวนเสิร์ฟ
- Sleep Journal รองรับเวลากลางคืนข้ามวัน + นาทีตื่น + Deep/Light/REM แบบไม่บังคับ
- Routine Timeline พร้อมเลือกวันในสัปดาห์
- Weight log + กราฟแนวโน้ม 7/30/90 วัน และข้อสังเกตจากข้อมูลที่มีจริง
- Profile + ปรับ calorie offset, macro, sleep target
- Demo mode ที่ระบุชัดเจน, Start Fresh, LocalStorage, JSON Export/Import
- Tests สำหรับสูตร/ข้อมูลและการ Render/Interaction ผ่าน mocked DOM

### Limitations
- Local-only ยังไม่มี Supabase Cloud Sync หรืออุปกรณ์ Wearable
- ค่าอาหารในคลังเป็นค่าตัวอย่างโดยประมาณ ไม่ใช่ฐานข้อมูลโภชนาการที่รับรอง
- สูตร TDEE/BMR, BMI และ sleep summaries เป็นการประมาณสำหรับการวางแผน
