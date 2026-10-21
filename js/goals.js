/* RHYTHM v1.7.0 — explainable, user-approved goals. Derives progress read-only. */
(function(root){
'use strict';
const C=root.FitCore, I=root.FitInsights;
const KINDS={
 sleep:{label:'นอนเฉลี่ย',unit:'ชั่วโมง/คืน',min:4,max:12,step:.25,scope:'ช่วง 7 วันล่าสุด',minimum:3},
 protein:{label:'โปรตีนเฉลี่ยวันที่บันทึก',unit:'กรัม/วัน',min:10,max:350,step:5,scope:'วันที่บันทึกอาหารใน 7 วัน',minimum:3},
 foodDays:{label:'วันที่บันทึกอาหาร',unit:'วัน/7 วัน',min:1,max:7,step:1,scope:'ช่วง 7 วันล่าสุด',minimum:1},
 workoutDays:{label:'วันที่บันทึกการฝึกจริง',unit:'วัน/7 วัน',min:1,max:7,step:1,scope:'ช่วง 7 วันล่าสุด',minimum:1},
 runningKm:{label:'ระยะทางวิ่งรวม',unit:'กม./7 วัน',min:0.5,max:150,step:0.5,scope:'ช่วง 7 วันล่าสุด',minimum:1},
 recoveryDays:{label:'วันที่บันทึก Recovery',unit:'วัน/7 วัน',min:1,max:7,step:1,scope:'ช่วง 7 วันล่าสุด',minimum:1},
 weighDays:{label:'วันที่ชั่งน้ำหนัก',unit:'วัน/7 วัน',min:1,max:7,step:1,scope:'ช่วง 7 วันล่าสุด',minimum:1}
};
const num=v=>Number(v),has=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(num(v));
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const round=v=>Math.round(v*10)/10;
const inRange=(d,a,b)=>C.isDate(d)&&d>=a&&d<=b;
function validGoal(g){
 if(!g||typeof g!=='object'||Array.isArray(g)||typeof g.id!=='string'||g.id.length>100||typeof g.title!=='string'||g.title.trim().length<1||g.title.length>100||!Object.hasOwn(KINDS,g.kind))return false;
 const k=KINDS[g.kind];
 if(!has(g.target)||num(g.target)<k.min||num(g.target)>k.max||!C.isDate(g.startDate)||!C.isDate(g.endDate)||g.endDate<g.startDate||C.shift(g.startDate,365)<g.endDate)return false;
 if(!['active','paused','completed','archived'].includes(g.status)||typeof g.note!=='string'||g.note.length>600)return false;
 return Array.isArray(g.reviews)&&g.reviews.length<=120&&g.reviews.every(r=>r&&C.isDate(r.date)&&typeof r.note==='string'&&r.note.length<=300&&[1,2,3,4,5].includes(Number(r.rating)));
}
function progress(goal,state,asOf=C.today()){
 const spec=KINDS[goal.kind];if(!spec||!C.isDate(asOf))return null;
 const end=asOf<goal.endDate?asOf:goal.endDate;
 const start=goal.startDate>C.shift(end,-6)?goal.startDate:C.shift(end,-6);
 const dateOK=d=>inRange(d,start,end);
 let value=0,count=0,totalDays=0;
 if(end>=start){
   const dates=new Set();for(let day=start;day<=end;day=C.shift(day,1)){dates.add(day);if(dates.size>7)break;}
   totalDays=dates.size;
   if(goal.kind==='sleep'){
     const byDay=new Map();for(const x of state.sleeps||[])if(dateOK(x.date)&&C.sleepDuration(x)!==null)byDay.set(x.date,C.sleepDuration(x)/60);
     count=byDay.size;value=mean([...byDay.values()]);
   }else if(goal.kind==='protein'||goal.kind==='foodDays'){
     const byDay=new Map();for(const x of state.meals||[])if(dateOK(x.date)){const arr=byDay.get(x.date)||[];arr.push(x);byDay.set(x.date,arr);}
     const totals=[...byDay.values()].map(rows=>C.foodTotals(rows));
     count=goal.kind==='foodDays'?byDay.size:totals.filter(t=>!t.macroIncomplete).length;
     value=goal.kind==='foodDays'?count:mean(totals.filter(t=>!t.macroIncomplete).map(t=>t.protein));
   }else if(goal.kind==='workoutDays'){
     const days=new Set((state.sessions||[]).filter(x=>dateOK(x.date)).map(x=>x.date));count=days.size;value=count;
   }else if(goal.kind==='runningKm'){
     const runs=(root.FitRun?.records?.(state)||[]).filter(x=>dateOK(x.date));count=runs.length;value=runs.reduce((s,x)=>s+Number(x.distanceKm),0);
   }else if(goal.kind==='recoveryDays'){
     count=new Set((state.checkins||[]).filter(x=>dateOK(x.date)).map(x=>x.date)).size;value=count;
   }else if(goal.kind==='weighDays'){
     count=new Set((state.weights||[]).filter(x=>dateOK(x.date)&&num(x.weight)>0).map(x=>x.date)).size;value=count;
   }
 }
 if(value!==null)value=round(value);
 const enough=count>=spec.minimum;
 const ratio=value===null?0:Math.max(0,Math.min(100,Math.round(100*value/Number(goal.target))));
 return {value,count,totalDays,enough,ratio,achieved:enough&&value>=Number(goal.target),window:`${start} — ${end}`,unit:spec.unit};
}
function suggestions(state,asOf=C.today()){
 const d=I.assemble(state,{days:14,asOf}).domains;
 const m=C.metrics(state),active=new Set((state.goals||[]).filter(g=>g.status==='active'||g.status==='paused').map(g=>g.kind));
 const out=[];
 const add=(kind,target,title,evidence,reason)=>{
   if(!active.has(kind))out.push({kind,target,title,evidence,reason,days:14});
 };
 if(d.sleep.count>=2&&d.sleep.averageMinutes<420){
   add('sleep',7,'เพิ่มเวลานอนให้ใกล้ 7 ชั่วโมง',`นอนเฉลี่ย ${round(d.sleep.averageMinutes/60)} ชม. จาก ${d.sleep.count} คืน`, 'ทดลองขยับเวลาเข้านอนเร็วขึ้น 15–30 นาทีและประเมินความสม่ำเสมอ ไม่ใช้สัดส่วน Deep/REM คืนเดียวตัดสินคุณภาพการนอน');
 }else if(d.sleep.count<3){add('sleep',7,'สร้างพื้นฐานการติดตามเวลานอน',`มีข้อมูลการนอน ${d.sleep.count} คืนใน 14 วัน`,'เริ่มบันทึกเวลานอนจริงอย่างต่อเนื่องก่อนสรุปแนวโน้ม');}
 if(d.nutrition.count>=4&&m.ready&&d.nutrition.averageProtein!==null&&d.nutrition.averageProtein<m.protein*.85){
   add('protein',m.protein,'ติดตามโปรตีนให้ใกล้เป้าหมายที่ตั้งไว้',`เฉลี่ย ${round(d.nutrition.averageProtein)} g จาก ${d.nutrition.count} วัน เทียบเป้าปัจจุบัน ${m.protein} g`,'ตรวจความครบถ้วนของรายการอาหารและปรับตามความต้องการส่วนตัว');
 }else if(d.nutrition.count<4){add('foodDays',5,'เพิ่มความต่อเนื่องของบันทึกอาหาร',`มีอาหารที่บันทึก ${d.nutrition.count} วันใน 14 วัน`,'ลองบันทึกอย่างน้อย 5 วันต่อสัปดาห์เพื่อให้การวิเคราะห์แคลอรี่แม่นขึ้น');}
 if(d.workout.count<2){add('workoutDays',2,'ติดตามวันฝึกจริงอย่างสม่ำเสมอ',`มีบันทึก ${d.workout.count} Session ใน 14 วัน`,'เป้าหมายนี้เน้นความครบถ้วนของบันทึก ไม่ได้บังคับให้เพิ่มความหนักของการฝึก');}
 if(d.recovery.count<4){add('recoveryDays',4,'เพิ่มข้อมูลความพร้อมของร่างกาย',`มี Recovery Check-in ${d.recovery.count} วันใน 14 วัน`,'บันทึกความเหนื่อยและความสดชื่นเพื่อเปรียบเทียบกับวันฝึกและการนอน');}
 if(d.weight.count<3){add('weighDays',3,'ติดตามแนวโน้มน้ำหนักอย่างสม่ำเสมอ',`มีบันทึกน้ำหนัก ${d.weight.count} วันใน 14 วัน`,'ชั่งภายใต้เงื่อนไขคล้ายกัน ไม่ให้ความสำคัญกับตัวเลขรายวันมากเกินไป');}
 if(d.running.count>=2){add('runningKm',Math.max(.5,Math.min(150,round(d.running.totalKm/2)||1)),'รักษาความต่อเนื่องของระยะวิ่ง',`บันทึก ${d.running.count} ครั้ง ระยะรวม ${round(d.running.totalKm)} กม. ใน 14 วัน`,'เริ่มจากระยะวิ่งเฉลี่ยที่ทำได้จริง ไม่เพิ่มปริมาณโดยอัตโนมัติ');}
 return out.slice(0,6);
}
root.FitGoals=Object.freeze({KINDS,validGoal,progress,suggestions});
})(typeof window!=='undefined'?window:globalThis);
