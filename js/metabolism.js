/* RHYTHM V1.9.0 — read-only metabolism & nutrition analysis.
   All outputs are estimates. A missing meal day is unknown, never zero intake.
   No backend writes, no automatic changes to goals, and no medical conclusions. */
(function(){
 'use strict';
 const C=window.FitCore;
 const allowed=[14,28,56];
 const round=(x,d=0)=>Number(x.toFixed(d));
 const avg=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
 const dateToMs=d=>new Date(`${d}T12:00:00`).getTime();
 const dailyMealTotals=(state,asOf,days)=>{
   const start=C.shift(asOf,1-days),byDay=new Map();
   for(const x of state.meals||[]){
     if(!C.isDate(x.date)||x.date<start||x.date>asOf)continue;
     if(!byDay.has(x.date))byDay.set(x.date,[]);
     byDay.get(x.date).push(x);
   }
   return [...byDay.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,meals])=>({date,...C.foodTotals(meals),items:meals.length}));
 };
 function analyse(state,{asOf=C.today(),days=28}={}){
   const safeAsOf=C.isDate(asOf)?asOf:C.today(),range=allowed.includes(days)?days:28;
   const start=C.shift(safeAsOf,1-range),metrics=C.metrics(state);
   const daily=dailyMealTotals(state,safeAsOf,range),loggedDays=daily.length,coverage=loggedDays/range;
   const calories=avg(daily.map(d=>d.kcal)),protein=avg(daily.map(d=>d.protein)),carbs=avg(daily.map(d=>d.carbs)),fat=avg(daily.map(d=>d.fat));
   const calorieTarget=metrics.ready?metrics.target:null,proteinTarget=metrics.ready?metrics.protein:null,tdee=metrics.ready?metrics.tdee:null;
   const macro={protein,carbs,fat},totals={kcal:calories,protein,carbs,fat};
   const byDate=new Map();
   for(const x of state.weights||[]){if(C.isDate(x.date)&&x.date>=start&&x.date<=safeAsOf&&C.num(x.weight)>0)byDate.set(x.date,C.num(x.weight));}
   const weights=[...byDate].sort(([a],[b])=>a.localeCompare(b)).map(([date,weight])=>({date,weight}));
   const firstWeekEnd=C.shift(start,6),lastWeekStart=C.shift(safeAsOf,-6);
   const first=weights.filter(x=>x.date<=firstWeekEnd),last=weights.filter(x=>x.date>=lastWeekStart);
   const firstAverage=avg(first.map(x=>x.weight)),lastAverage=avg(last.map(x=>x.weight));
   const span=first.length&&last.length?(avg(last.map(x=>dateToMs(x.date)))-avg(first.map(x=>dateToMs(x.date))))/86400000:0;
   const trendReady=range>=14&&first.length>=2&&last.length>=2&&span>=7;
   const delta=trendReady?lastAverage-firstAverage:null;
   const weeklyKg=trendReady?delta/span*7:null;
   // A coarse 7,700 kcal/kg model is optional and gated on adequate food + weight logs.
   // This is NOT a measurement of basal metabolism or an individualized energy requirement.
   const comparable=range>=28&&coverage>=.85&&first.length>=2&&last.length>=2&&span>=18&&Number.isFinite(calories);
   const empiricalTdee=comparable?calories-weeklyKg*7700/7:null;
   const empiricalPlausible=empiricalTdee!==null&&empiricalTdee>=900&&empiricalTdee<=6500;
   const mealGroups={};
   const foodCounts=new Map();
   for(const meal of state.meals||[]){
     if(!C.isDate(meal.date)||meal.date<start||meal.date>safeAsOf)continue;
     const type=meal.meal||'snack';mealGroups[type]=(mealGroups[type]||0)+C.num(meal.kcal)*C.num(meal.servings,1);
     const key=String(meal.name||'รายการอาหาร').trim();foodCounts.set(key,(foodCounts.get(key)||0)+1);
   }
   const topFoods=[...foodCounts].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
   const mealMix=Object.entries(mealGroups).map(([name,kcal])=>({name,kcal,share:loggedDays&&daily.reduce((v,d)=>v+d.kcal,0)>0?kcal/daily.reduce((v,d)=>v+d.kcal,0):0})).sort((a,b)=>b.kcal-a.kcal);
   const notes=[];
   const add=(domain,title,evidence,next,level='ข้อมูลเพื่อประกอบการตัดสินใจ')=>notes.push({domain,title,evidence,next,level});
   if(!metrics.ready)add('setup','กรอกโปรไฟล์เพื่อคำนวณ TDEE','ยังไม่มีอายุ น้ำหนัก ส่วนสูง หรือข้อมูลกิจกรรมที่ครบถ้วน','กรอกข้อมูลในหน้าโปรไฟล์และตั้งค่า เพื่อให้ระบบคำนวณ BMR/TDEE ด้วยสูตรประมาณการ');
   if(loggedDays===0)add('nutrition','ยังไม่มีข้อมูลอาหาร','0 วันที่บันทึกจาก '+range+' วัน','เริ่มบันทึกมื้ออาหาร และระบุปริมาณให้ใกล้กับที่กินจริง ข้อมูลที่ขาดจะไม่ถูกนับเป็นการกิน 0 kcal','ข้อมูลไม่พอ');
   else if(coverage<.7)add('nutrition','ข้อมูลอาหารยังไม่ครอบคลุม','บันทึก '+loggedDays+' / '+range+' วัน ('+Math.round(coverage*100)+'%)','บันทึกให้สม่ำเสมอขึ้นก่อนตีความค่าเฉลี่ย โดยเฉพาะเครื่องดื่ม น้ำมัน และอาหารว่าง','ข้อมูลจำกัด');
   else add('nutrition','ความครอบคลุมของบันทึกอาหาร','มีบันทึก '+loggedDays+' / '+range+' วัน ('+Math.round(coverage*100)+'%)','ตรวจว่ามื้ออาหารและปริมาณในวันที่บันทึกครบจริง เพราะบันทึกได้หลายวันไม่ได้แปลว่าบันทึกครบทุกมื้อ','ค่าเฉลี่ยจากวันที่บันทึก');
   if(calories!==null&&calorieTarget!==null){
     const gap=calories-calorieTarget;
     add('energy',Math.abs(gap)<100?'พลังงานเฉลี่ยใกล้เป้าหมายที่ตั้งไว้':gap>0?'พลังงานเฉลี่ยที่บันทึกสูงกว่าเป้าหมาย':'พลังงานเฉลี่ยที่บันทึกต่ำกว่าเป้าหมาย',
       'เฉลี่ย '+round(calories)+' เทียบเป้าหมาย '+round(calorieTarget)+' kcal/วันที่บันทึก (ต่าง '+(gap>=0?'+':'')+round(gap)+' kcal)',
       coverage<.7?'ข้อมูลยังน้อย ไม่ควรปรับแคลอรี่จากค่าเฉลี่ยนี้': 'เปรียบเทียบกับแนวโน้มน้ำหนักอย่างน้อยหลายสัปดาห์ ก่อนพิจารณาปรับเป้าหมายด้วยตนเอง',coverage<.7?'ข้อมูลจำกัด':'ประมาณการ');
   }
   if(protein!==null&&proteinTarget!==null){const gap=protein-proteinTarget;
     add('protein',gap>=-10?'โปรตีนเฉลี่ยที่บันทึกใกล้เป้าหมาย':'โปรตีนเฉลี่ยที่บันทึกต่ำกว่าเป้าหมาย',
       round(protein,1)+' เทียบ '+round(proteinTarget)+' กรัม/วันที่บันทึก',
       gap<-10?'ลองกระจายอาหารที่มีโปรตีนในมื้อหลัก และตรวจปริมาณจากฉลาก/การชั่งจริง':'รักษาการบันทึกให้ต่อเนื่อง และดูความครบถ้วนของโปรตีนในทุกมื้อ',coverage<.7?'ข้อมูลจำกัด':'ประมาณการ');}
   if(trendReady){add('weight',weeklyKg>0.05?'น้ำหนักมีแนวโน้มเพิ่ม':weeklyKg<-.05?'น้ำหนักมีแนวโน้มลด':'น้ำหนักค่อนข้างคงที่',
      'เฉลี่ยต้นช่วง '+round(firstAverage,2)+' kg และปลายช่วง '+round(lastAverage,2)+' kg (ประมาณ '+(weeklyKg>=0?'+':'')+round(weeklyKg,2)+' kg/สัปดาห์)',
      'ดูน้ำหนักเฉลี่ยหลายสัปดาห์และบริบทการฝึก การนอน และการเปลี่ยนแปลงน้ำในร่างกายก่อนสรุป', 'แนวโน้มเชิงสังเกต');}
   else add('weight','ข้อมูลน้ำหนักยังไม่พอให้เทียบแนวโน้ม','ต้องมีอย่างน้อย 2 วันชั่งในสัปดาห์แรกและ 2 วันในสัปดาห์ท้ายของช่วงที่เลือก', 'ชั่งในสภาวะคล้ายกันและดูค่าเฉลี่ยรายสัปดาห์ แทนการตัดสินจากวันเดียว','ข้อมูลไม่พอ');
   if(empiricalPlausible)add('metabolism','พลังงานคงสภาพจากข้อมูลจริง (แบบจำลองหยาบ)',
      'เทียบแคลอรี่ที่บันทึกกับการเปลี่ยนแปลงน้ำหนัก ใช้สมมติฐาน 7,700 kcal/kg ได้ ~'+round(empiricalTdee)+' kcal/วัน',
      'ใช้เพื่อดูทิศทางเท่านั้น ไม่ใช่การตรวจวัด TDEE; หากมื้ออาหารบันทึกไม่ครบหรือมวลน้ำ/กล้ามเนื้อเปลี่ยน ผลอาจคลาดเคลื่อนมาก','ความมั่นใจจำกัด');
   else add('metabolism','ยังไม่ประเมินพลังงานคงสภาพจากแนวโน้ม',
      'ต้องมีช่วงอย่างน้อย 28 วัน บันทึกอาหาร ≥85% ของวัน และชั่งน้ำหนักต้น/ท้ายช่วงอย่างน้อยช่วงละ 2 วัน',
      'เก็บข้อมูลเพิ่มและอย่าปรับค่าแคลอรี่จากสูตรประมาณการเพียงอย่างเดียว','ข้อมูลไม่พอ');
   return {asOf:safeAsOf,days:range,start,metrics,loggedDays,coverage,daily,totals,calorieTarget,proteinTarget,tdee,weights,firstAverage,lastAverage,firstDays:first.length,lastDays:last.length,trendReady,weeklyKg,empiricalTdee:empiricalPlausible?empiricalTdee:null,mealMix,topFoods,notes};
 }
 window.FitMetabolism={analyse};
})();
