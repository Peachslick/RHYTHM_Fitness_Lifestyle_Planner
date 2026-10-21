/* RHYTHM v1.8.0 — read-only analysis of confirmed sets (never mutates cloud data). */
(function(){
 'use strict';
 const C=window.FitCore;
 const finite=v=>Number.isFinite(Number(v))?Number(v):0;
 const round=(x,d=1)=>Number(x.toFixed(d));
 const normalize=s=>String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase();
 function muscle(name,type){
   const s=normalize(name);
   if(/plank|crunch|sit.?up|abs|core|abdominal|ท้อง|แพลงก์/.test(s))return 'core';
   if(/run|walk|jog|cycling|cardio|treadmill|วิ่ง|เดิน|ปั่นจักรยาน/.test(s))return 'cardio';
   if(/curl|bicep|หน้าแขน/.test(s))return 'biceps';
   if(/tricep|pushdown|kickback|skullcrush|หลังแขน|dip/.test(s))return 'triceps';
   if(/lateral|shoulder|overhead press|military press|deltoid|ไหล่/.test(s))return 'shoulders';
   if(/squat|lunge|deadlift|calf|leg press|leg curl|wall sit|hip thrust|ขา|น่อง|สะโพก/.test(s))return 'legs';
   if(/row|pull.?up|chin.?up|pulldown|lat |shrug|face pull|หลัง/.test(s))return 'back';
   if(/bench|chest|fly|push.?up|วิดพื้น|อก/.test(s))return 'chest';
   return ({push:'chest',pull:'back',legs:'legs',run:'cardio'})[type]||'other';
 }
 const GROUPS={chest:'อก',back:'หลัง',shoulders:'หัวไหล่',biceps:'หน้าแขน',triceps:'หลังแขน',legs:'ขาและสะโพก',core:'แกนกลาง',cardio:'คาร์ดิโอ',other:'อื่น ๆ'};
 function analyse(state,{days=90,asOf=C.today()}={}){
   days=[30,90,180].includes(Number(days))?Number(days):90;
   const from=C.shift(asOf,1-days),recentFrom=C.shift(asOf,-27);
   const all=Array.isArray(state?.sessions)?state.sessions:[];
   const sessions=all.filter(s=>C.isDate(s?.date)&&s.date<=asOf&&s.date>=from).sort((a,b)=>a.date.localeCompare(b.date));
   const records=new Map(),byDay=new Map(),muscles={},weeks=[];
   let workSets=0,volume=0,bodyweightReps=0,timedSeconds=0,exerciseOccurrences=0,activeSessions=0;
   for(const session of sessions){
     let sessionSets=0;
     for(const ex of session.exercises||[]){
       const key=normalize(ex?.name);if(!key||!Array.isArray(ex.setLog))continue;
       const kind=C.exerciseMode(ex);let sessionHasSet=false;
       let item=records.get(key);
       for(const [i,row] of ex.setLog.entries()){
         if(!C.validPerformedSet(ex,row)||row.warmup)continue;
         const reps=kind.measure==='reps'?finite(row.reps):0,seconds=kind.measure==='time'?finite(row.seconds):0;
         const load=kind.loadType==='external'?finite(row.load):0;
         const amount=kind.loadType==='external'&&kind.measure==='reps'&&load>0?load*reps:0;
         if(!item){item={name:ex.name,key,measure:kind.measure,loadType:kind.loadType,group:muscle(ex.name,session.type),setCount:0,volume:0,totalReps:0,totalSeconds:0,maxLoad:0,maxReps:0,maxSeconds:0,maxEst1RM:0,history:[],days:new Set(),first:session.date,last:session.date};records.set(key,item);}
         item.setCount++;item.volume+=amount;item.totalReps+=reps;item.totalSeconds+=seconds;item.maxLoad=Math.max(item.maxLoad,load);item.maxReps=Math.max(item.maxReps,reps);item.maxSeconds=Math.max(item.maxSeconds,seconds);if(amount&&reps<=10)item.maxEst1RM=Math.max(item.maxEst1RM,load*(1+reps/30));
         item.days.add(session.date);item.last=session.date;
         item.history.push({date:session.date,index:i,reps,seconds,load,volume:amount});
         sessionSets++;workSets++;volume+=amount;timedSeconds+=seconds;
         if(kind.measure==='reps'&&kind.loadType!=='external')bodyweightReps+=reps;
         const day=byDay.get(session.date)||{date:session.date,sets:0,volume:0};day.sets++;day.volume+=amount;byDay.set(session.date,day);
         muscles[item.group]=(muscles[item.group]||0)+1;sessionHasSet=true;
       }
       if(sessionHasSet)exerciseOccurrences++;
     }
     if(sessionSets>0)activeSessions++;
   }
   const exercises=[...records.values()].map(item=>{
     const dates=[...item.days].sort();const distinct=dates.length;
     const byDate=dates.map(date=>{
       const rows=item.history.filter(h=>h.date===date);
       return {date,sets:rows.length,volume:round(rows.reduce((t,r)=>t+r.volume,0)),bestLoad:Math.max(...rows.map(r=>r.load)),bestReps:Math.max(...rows.map(r=>r.reps)),bestSeconds:Math.max(...rows.map(r=>r.seconds)),totalReps:rows.reduce((t,r)=>t+r.reps,0),totalSeconds:rows.reduce((t,r)=>t+r.seconds,0)};
     });
     let direction='insufficient',detail='ต้องมีการฝึกท่าเดิมอย่างน้อย 3 วันจึงจะเปรียบเทียบแนวโน้มได้';
     if(distinct>=3){
       const earliest=byDate[0],latest=byDate.at(-1);
       const val=d=>item.measure==='time'?d.bestSeconds:item.loadType==='external'?d.bestLoad:d.bestReps;
       if(val(latest)>val(earliest)){direction='up';detail='ค่าสูงสุดที่บันทึกวันล่าสุดมากกว่าวันแรกในช่วงนี้';}
       else if(val(latest)<val(earliest)){direction='down';detail='ค่าสูงสุดที่บันทึกวันล่าสุดน้อยกว่าวันแรกในช่วงนี้';}
       else {direction='same';detail='ค่าสูงสุดวันแรกและวันล่าสุดใกล้เคียงกัน';}
     }
     return {...item,days:distinct,byDate,volume:round(item.volume),maxEst1RM:round(item.maxEst1RM),direction,detail};
   }).sort((a,b)=>b.setCount-a.setCount||a.name.localeCompare(b.name));
   // Fixed Monday–Sunday buckets ending with the current week (including only dates inside the selected window).
   let monday=C.shift(asOf,-C.weekday(asOf));
   for(let i=7;i>=0;i--){const start=C.shift(monday,-7*i),end=C.shift(start,6);const logs=[...byDay.values()].filter(x=>x.date>=start&&x.date<=end);weeks.push({start,end,sets:logs.reduce((t,x)=>t+x.sets,0),volume:round(logs.reduce((t,x)=>t+x.volume,0)),days:logs.length});}
   const current28=[...byDay.values()].filter(x=>x.date>=recentFrom&&x.date<=asOf);
   // Compare equal-length windows and use only confirmed working sets, not planned sets.
   function sumSets(sessions){let result=0;for(const s of sessions)for(const ex of s.exercises||[])for(const row of ex.setLog||[])if(C.validPerformedSet(ex,row)&&!row.warmup)result++;return result;}
   const prev28Start=C.shift(recentFrom,-28);
   const prev28=all.filter(s=>C.isDate(s?.date)&&s.date>=prev28Start&&s.date<recentFrom);
   const previousSets=sumSets(prev28),recentSets=current28.reduce((s,x)=>s+x.sets,0);
   const observedDays=[...byDay.keys()].sort();
   const focusGroups=Object.entries(muscles).map(([key,sets])=>({key,label:GROUPS[key],sets})).sort((a,b)=>b.sets-a.sets);
   const notes=[];
   if(!workSets){notes.push({level:'info',title:'ยังไม่มีเซตที่ยืนยัน',evidence:'มีเพียงแผนหรือ Session ที่ยังไม่ได้กดยืนยันเซต',next:'เริ่มกรอกและติ๊ก “ทำแล้ว” หลังฝึกจริง เพื่อเปิดการวิเคราะห์จากข้อมูลที่ใช้ได้'});}
   else{
     notes.push({level:'info',title:'ความสม่ำเสมอในการบันทึก',evidence:`บันทึกเซตทำจริง ${workSets} เซต จาก ${observedDays.length} วันใน ${days} วันที่เลือก`,next:'ลองบันทึกอย่างต่อเนื่องในวันที่ฝึก เพื่อให้เปรียบเทียบปริมาณการฝึกแต่ละสัปดาห์ได้แม่นยำขึ้น'});
     if(previousSets>0&&recentSets>0){const change=round((recentSets-previousSets)*100/previousSets);notes.push({level:'info',title:'จำนวนเซต 28 วันเปลี่ยนจากช่วงก่อน',evidence:`${recentSets} เซต เทียบกับ ${previousSets} เซต (${change>0?'+':''}${change}%)`,next:'ใช้จำนวนวันฝึก ความเหนื่อย และความพร้อมฟื้นตัวประกอบ อย่าปรับการฝึกจากเปอร์เซ็นต์เซตอย่างเดียว'});}
     for(const item of exercises.filter(x=>x.days>=3).slice(0,3))notes.push({level:item.direction==='up'?'good':'info',title:`ติดตาม ${item.name}`,evidence:item.detail+` (${item.days} วันฝึก)`,next:item.direction==='up'?'หากรู้สึกฟื้นตัวดี ให้รักษารูปแบบการฝึกและค่อย ๆ เปรียบเทียบครั้งถัดไป':'ทบทวนจำนวนครั้ง น้ำหนัก และความเหนื่อยของวันก่อน ๆ โดยไม่จำเป็นต้องเพิ่มน้ำหนักทุกครั้ง'});
     if(exercises.every(x=>x.days<3))notes.push({level:'info',title:'ข้อมูลรายท่ายังน้อย',evidence:'ยังไม่มีท่าใดบันทึกครบ 3 วันในช่วงที่เลือก',next:'ลองบันทึกท่าเดิมต่อเนื่องอีก 2–3 ครั้ง เพื่อให้เปรียบเทียบการพัฒนาได้'});
   }
   return {days,asOf,from,sessions:sessions.length,activeSessions,loggedDays:observedDays.length,workSets,exerciseOccurrences,volume:round(volume),bodyweightReps,timedSeconds,exercises,muscles:focusGroups,weeks,previousSets,recentSets,notes};
 }
 window.FitWorkoutAnalytics={analyse,muscle,GROUPS};
})();
