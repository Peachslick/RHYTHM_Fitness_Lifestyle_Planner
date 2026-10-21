/* RHYTHM v1.9.3 — reusable meal templates, draft workout utilities and
 * explicitly labelled MACRO ESTIMATES. No server calls or personal health inference.
 */
(function(){
 'use strict';
 const D=window.FitData;
 const cut=(v,min,max)=>Math.max(min,Math.min(max,v));
 const round=v=>Math.round(v*10)/10;
 const macroMix=(food)=>{
   const name=(food.name||'').toLowerCase(),group=(food.group||'').toLowerCase();
   // These are *heuristic energy distributions*, never measured nutrients.
   // Prefer specific dish descriptions to broad groups.
   if(/น้ำเปล่า|น้ำแร่|ชาไม่หวาน|กาแฟดำ/.test(name))return [0,1,0];
   if(/หมูกรอบ|สามชั้น|หนังไก่|ไส้กรอก|หมูยอ|กุนเชียง|แคบหมู/.test(name))return [.18,.1,.72];
   if(/นม|โยเกิร์ต|ชีส/.test(name))return [.19,.47,.34];
   if(/ไข่ต้ม|ไข่ดาว|ไข่เจียว|เต้าหู้/.test(name))return [.28,.06,.66];
   if(/ทอด|ชุบแป้ง|เฟรนช์ฟรายส์|ปาท่องโก๋/.test(name))return [.09,.54,.37];
   if(/ขนม|เค้ก|คุกกี้|พาย|ไอศกรีม|บัวลอย|ลอดช่อง|กล้วยบวชชี|ข้าวเหนียวมูน|ทองหยิบ|ฝอยทอง/.test(name)||/ขนมและของว่าง/.test(group))return [.06,.69,.25];
   if(/น้ำหวาน|น้ำอัดลม|ชานม|น้ำผลไม้|น้ำตาล|น้ำเชื่อม/.test(name)||/เครื่องดื่ม/.test(group))return [.02,.92,.06];
   if(/ผลไม้|กล้วย|ส้ม|มะละกอ|แตงโม|สับปะรด|แอปเปิล|ฝรั่ง|มะม่วง|องุ่น|ชมพู่|ลำไย/.test(name)||/ผลไม้/.test(group))return [.04,.93,.03];
   if(/ปลาเผา|ปลานึ่ง|อกไก่|กุ้งต้ม|ไก่ย่าง|หมูย่าง|เนื้อย่าง/.test(name))return [.66,.06,.28];
   if(/ต้มยำ|ต้มจืด|แกงเลียง|แกงส้ม|ซุป|แกงจืด/.test(name))return [.34,.42,.24];
   if(/สลัด|ยำ|ลาบ|น้ำตก|ตำไทย|ส้มตำ/.test(name))return [.24,.55,.21];
   if(/ข้าว|ขนมจีน|เส้น|ก๋วยเตี๋ยว|มักกะโรนี|ผัดไทย|บะหมี่|โจ๊ก|ข้าวต้ม|กะเพรา/.test(name)||/อาหารจานเดียว/.test(group))return [.16,.58,.26];
   if(/ผัด|แกงเขียวหวาน|พะแนง|แกงกะทิ|มัสมั่น/.test(name))return [.25,.3,.45];
   if(/โปรตีน|เนื้อสัตว์/.test(group))return [.55,.08,.37];
   if(/ผัก/.test(group))return [.18,.74,.08];
   return [.16,.59,.25];
 };
 const estimate=(food)=>{
   const kcal=Number(food.kcal);
   if(!Number.isFinite(kcal)||kcal<0||kcal>10000)return null;
   const [p,c,f]=macroMix(food);
   return {protein:round(kcal*p/4),carbs:round(kcal*c/4),fat:round(kcal*f/9)};
 };
 let estimatedCount=0;
 if(D&&Array.isArray(D.FOOD_LIBRARY)){
   for(const row of D.FOOD_LIBRARY){
     if(row.macroKnown!==false)continue;
     const m=estimate(row);if(!m)continue;
     Object.assign(row,m,{macroKnown:true,macroEstimated:true,macroMethod:'energy-share-v1',macroNote:'ประมาณจากประเภทเมนูและ kcal ไม่ใช่ค่าตรวจวัด/ฉลาก'});
     estimatedCount++;
   }
 }
 const validMealTemplate=t=>!!t&&typeof t==='object'&&!Array.isArray(t)&&typeof t.id==='string'&&t.id.length<=100&&typeof t.name==='string'&&t.name.trim().length>0&&t.name.length<=100&&['breakfast','lunch','dinner','snack'].includes(t.meal)&&Array.isArray(t.items)&&t.items.length>0&&t.items.length<=30&&t.items.every(x=>x&&typeof x==='object'&&typeof x.name==='string'&&x.name.length>0&&x.name.length<=140&&typeof x.unit==='string'&&x.unit.length<=120&&['kcal','protein','carbs','fat','servings'].every(k=>Number.isFinite(Number(x[k]))&&Number(x[k])>=0)&&Number(x.servings)>0&&Number(x.servings)<=30&&['kcal','protein','carbs','fat'].every(k=>Number(x[k])<=10000)&&(x.macroKnown===undefined||typeof x.macroKnown==='boolean')&&(x.macroEstimated===undefined||typeof x.macroEstimated==='boolean'));
 const makeTemplate=(name,meal,items,id)=>({id,name:name.trim(),meal,items:items.map(x=>({name:x.name,unit:x.unit,foodId:x.foodId||null,servings:Number(x.servings),kcal:Number(x.kcal),protein:Number(x.protein),carbs:Number(x.carbs),fat:Number(x.fat),macroKnown:x.macroKnown!==false,macroEstimated:x.macroEstimated===true,source:x.source||undefined,baseGrams:x.baseGrams??null,quantityMode:x.quantityMode||'servings',quantityGrams:x.quantityGrams??null}))});
 const applyTemplate=(t,date,uid)=>t.items.map(x=>({...x,id:uid(),date,meal:t.meal,fromTemplate:t.id}));
 const parseRows=(draft)=>{try{const v=JSON.parse(draft);return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch(_){return null;}};
 window.FitUX={estimate,estimatedCount,validMealTemplate,makeTemplate,applyTemplate,parseRows};
})();
