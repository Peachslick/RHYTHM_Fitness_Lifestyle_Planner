/* RHYTHM V1.6.0 — deterministic, explainable, read-only personal insights.
   No API, diagnosis, fixed sleep-stage thresholds, or changes to saved snapshots. */
(function(root){
'use strict';
const C=root.FitCore, R=root.FitRecovery, Run=root.FitRun;
const round=(v,d=1)=>v===null||!Number.isFinite(Number(v))?null:Number(Number(v).toFixed(d));
const avg=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const uniqDates=rows=>new Set(rows.map(x=>x.date)).size;
const clip=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const isPast=(d,from,to)=>C.isDate(d)&&d>=from&&d<=to;
function sleepRange(age){const a=Number(age);if(!Number.isFinite(a)||a<18)return {min:420,label:'ผู้ใหญ่ (กรุณากรอกอายุ)',known:false};if(a<=60)return {min:420,label:'อายุ 18–60 ปี: อย่างน้อย 7 ชั่วโมง',known:true};if(a<=64)return {min:420,label:'อายุ 61–64 ปี: 7–9 ชั่วโมง',known:true};return {min:420,label:'อายุ 65 ปีขึ้นไป: 7–8 ชั่วโมง',known:true};}
function sameNightStage(entry){if(!entry)return null;const duration=C.sleepDuration(entry);if(duration===null)return null;const stages=['deep','light','rem'].map(key=>({key,minutes:C.sleepStageMinutes(entry,key)}));const supplied=stages.filter(x=>x.minutes!==null);if(!supplied.length)return null;return {duration,values:stages,missing:Math.max(0,duration-supplied.reduce((a,x)=>a+x.minutes,0)),incomplete:supplied.length<3};}
function coverage(count,total,minimum=3){return {count,total,percent:Math.round(100*count/total),level:count>=Math.max(minimum,Math.ceil(total*.65))?'สูง':count>=minimum?'ปานกลาง':'จำกัด'};}
function insight(domain,severity,title,evidence,next,confidence='ปานกลาง') {return {domain,severity,title,evidence,next,confidence};}
function assemble(state,{days=14,asOf=C.today()}={}){
 if(![7,14,30].includes(days))days=14;
 if(!C.isDate(asOf))asOf=C.today();
 const from=C.shift(asOf,1-days),previousFrom=C.shift(from,-days),previousTo=C.shift(from,-1);
 const profile=state.profile||{},metrics=C.metrics(state),norm=sleepRange(profile.age);
 const sleepMap=new Map();for(const item of state.sleeps||[])if(isPast(item.date,from,asOf)&&C.sleepDuration(item)!==null)sleepMap.set(item.date,item);
 const nights=[...sleepMap.values()].sort((a,b)=>a.date.localeCompare(b.date));
 const sleepValues=nights.map(x=>C.sleepDuration(x));const sleepAvg=avg(sleepValues);
 const allSleep=(state.sleeps||[]).filter(x=>isPast(x.date,previousFrom,previousTo)&&C.sleepDuration(x)!==null);
 const previousSleepAvg=avg(allSleep.map(x=>C.sleepDuration(x)));
 const latestSleep=nights.at(-1)||null, latestStage=sameNightStage(latestSleep);
 const shortNights=nights.filter(x=>C.sleepDuration(x)<norm.min).length;
 const sleepLine=nights.map(x=>({date:x.date,value:round(C.sleepDuration(x)/60,2)}));
 const sleepCover=coverage(nights.length,days);
 const goal=finite(profile.sleepGoal)?clip(Number(profile.sleepGoal),6,12)*60:480;
 const dailyMeals=new Map();for(const item of state.meals||[])if(isPast(item.date,from,asOf)){const arr=dailyMeals.get(item.date)||[];arr.push(item);dailyMeals.set(item.date,arr);}
 const foods=[...dailyMeals].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,rows])=>({date,...C.foodTotals(rows)}));
 const foodCover=coverage(foods.length,days,4),foodAvg=avg(foods.map(x=>x.kcal)),proteinFoods=foods.filter(x=>!x.macroIncomplete),proteinAvg=avg(proteinFoods.map(x=>x.protein));
 const calorieTarget=metrics.ready?metrics.target:null;
 const mealLine=foods.map(x=>({date:x.date,value:round(x.kcal,1)}));
 const weightMap=new Map();for(const item of state.weights||[])if(isPast(item.date,from,asOf)&&finite(item.weight)&&Number(item.weight)>0)weightMap.set(item.date,item);
 const weights=[...weightMap.values()].sort((a,b)=>a.date.localeCompare(b.date));const weightLine=weights.map(x=>({date:x.date,value:Number(x.weight)}));
 const oldWeightMap=new Map();for(const item of state.weights||[])if(isPast(item.date,previousFrom,previousTo)&&finite(item.weight)&&Number(item.weight)>0)oldWeightMap.set(item.date,item);
 const weightMean=avg(weights.map(x=>Number(x.weight))),weightPrev=avg([...oldWeightMap.values()].map(x=>Number(x.weight)));
 const weightDelta=weightMean!==null&&weightPrev!==null&&weights.length>=2&&oldWeightMap.size>=2?weightMean-weightPrev:null;
 const weightGoal=finite(profile.targetWeight)?Number(profile.targetWeight):null;
 const weightCover=coverage(weights.length,days);
 const runs=Run.records(state).filter(x=>isPast(x.date,from,asOf));
 const runTotal=runs.reduce((s,x)=>s+Number(x.distanceKm),0),runSeconds=runs.reduce((s,x)=>s+Number(x.durationSeconds),0);
 const runLine=[...new Set(runs.map(x=>x.date))].sort().map(date=>({date,value:round(runs.filter(x=>x.date===date).reduce((s,x)=>s+Number(x.distanceKm),0),2)}));
 const sessions=(state.sessions||[]).filter(x=>isPast(x.date,from,asOf));
 const workouts=C.trainingStats(sessions),sessionCount=uniqDates(sessions);
 const trainingLine=[...new Set(sessions.map(x=>x.date))].sort().map(date=>({date,value:round(C.trainingStats(sessions.filter(x=>x.date===date)).volume,1)}));
 const heavySessions=sessions.filter(x=>finite(x.rpe)&&Number(x.rpe)>=8).length;
 const checkins=(R.checkins(state)).filter(x=>isPast(x.date,from,asOf)&&R.validCheckin(x));
 const checkCover=coverage(uniqDates(checkins),days),energyAvg=avg(checkins.map(x=>Number(x.energy))),fatigueAvg=avg(checkins.map(x=>Number(x.fatigue)));
 const recoveryLine=[...checkins].sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({date:x.date,value:Number(x.energy)}));
 const shortSleepDates=new Set(nights.filter(x=>C.sleepDuration(x)<norm.min).map(x=>x.date));
 const paired=checkins.filter(x=>sleepMap.has(x.date));
 const pairedShort=paired.filter(x=>shortSleepDates.has(x.date)).map(x=>Number(x.fatigue));
 const pairedEnough=paired.filter(x=>!shortSleepDates.has(x.date)).map(x=>Number(x.fatigue));
 const compareRecovery=pairedShort.length>=3&&pairedEnough.length>=3?{short:round(avg(pairedShort),1),enough:round(avg(pairedEnough),1),shortCount:pairedShort.length,enoughCount:pairedEnough.length}:null;
 const observations=[];
 // Sleep — duration first; stage percentages are descriptive, not validated clinical grading.
 if(latestSleep){
  const lastMinutes=C.sleepDuration(latestSleep);
  if(lastMinutes<norm.min){
   const shortBy=norm.min-lastMinutes;
   const shiftBed=Math.min(30,shortBy);
   observations.push(insight('sleep','high','เวลานอนคืนล่าสุดต่ำกว่าคำแนะนำ',`คุณนอน ${round(lastMinutes/60,1)} ชั่วโมง ต่ำกว่าขั้นต่ำตามช่วงอายุ ${Math.round(shortBy)} นาที`,`ลองขยับเวลาเข้านอนเร็วขึ้น ${shiftBed} นาที และเพิ่มเวลาสำหรับการนอนให้ถึงอย่างน้อย 7 ชั่วโมง โดยพยายามคงเวลาตื่นให้สม่ำเสมอ`,'สูง'));
  }else observations.push(insight('sleep','positive','เวลานอนคืนล่าสุดถึงขั้นต่ำที่แนะนำ',`บันทึกคืนล่าสุด ${round(lastMinutes/60,1)} ชั่วโมง`,`ลองรักษาเวลาเข้านอนและตื่นให้สม่ำเสมอ สังเกตความสดชื่นหลังตื่นควบคู่`,'สูง'));
  if(nights.length>=3&&shortNights>=Math.ceil(nights.length/2))observations.push(insight('sleep','high','การนอนสั้นเกิดซ้ำหลายคืน',`มี ${shortNights} จาก ${nights.length} คืนที่นอนน้อยกว่า 7 ชั่วโมง`,`ให้ความสำคัญกับตารางนอนต่อเนื่องตลอดสัปดาห์มากกว่าพยายามชดเชยในคืนเดียว`,'สูง'));
  if(latestStage){const vals=latestStage.values.filter(x=>x.minutes!==null).map(x=>`${x.key==='deep'?'Deep':x.key==='light'?'Light':'REM'} ${Math.round(x.minutes/latestStage.duration*100)}%`).join(' · ');observations.push(insight('sleep','info','สัดส่วนช่วงการนอนจากอุปกรณ์',`${vals}${latestStage.incomplete?' (กรอกไม่ครบทุกช่วง)':''}`,`สัดส่วนเป็นค่าประมาณจากนาฬิกา ไม่ควรตัดสินความสามารถในการฟื้นตัวจากเปอร์เซ็นต์คืนเดียว ให้ดูเวลานอนรวมและความรู้สึกหลังตื่นเป็นหลัก`,'จำกัด'));}
 }else observations.push(insight('sleep','info','ยังไม่มีข้อมูลการนอนในช่วงนี้',`พบ 0 จาก ${days} คืน`,`เริ่มบันทึกเวลานอนและตื่น 3–7 คืน แล้วกลับมาดูแนวโน้ม`,'จำกัด'));
 const bedtime=R.sleepWindow(state,days,asOf);
 if(bedtime.count>=4&&bedtime.bedtimeDeviationMinutes!==null){
  const spread=bedtime.bedtimeDeviationMinutes;
  observations.push(insight('sleep',spread>=35?'mid':'positive',spread>=35?'เวลาเข้านอนมีความผันผวน':'เวลาเข้านอนค่อนข้างสม่ำเสมอ',`ความคลาดเคลื่อนเวลาเข้านอนจากค่าเฉลี่ยตามวงนาฬิกาประมาณ ${spread} นาที จาก ${bedtime.count} คืน`,spread>=35?'ลองเลือกเวลาเข้านอนที่ทำได้จริง และปรับใกล้เวลานั้นทีละ 15–30 นาทีในแต่ละวัน':'รักษาเวลาเข้านอนใกล้เคียงกัน ควบคู่กับนอนให้พอ','ปานกลาง'));
 }
 if(sleepAvg!==null&&previousSleepAvg!==null&&allSleep.length>=3&&nights.length>=3){const change=round(sleepAvg-previousSleepAvg);if(Math.abs(change)>=20)observations.push(insight('sleep','info','เวลานอนเฉลี่ยเปลี่ยนจากช่วงก่อน',`เฉลี่ย ${round(sleepAvg/60,2)} ชม. เทียบช่วงก่อน ${round(previousSleepAvg/60,2)} ชม. (${change>0?'+':''}${change} นาที)`,`ลองดูว่าวันทำงาน/วันพัก หรือกิจวัตรใดทำให้เวลาเข้านอนเปลี่ยน`,'ปานกลาง'));}
 // Nutrition — counting only logged days, never assume unlogged = fasting.
 if(foods.length>=4&&calorieTarget!==null){const gap=foodAvg-calorieTarget;if(Math.abs(gap)>=250)observations.push(insight('nutrition','mid',gap<0?'แคลอรี่ที่บันทึกเฉลี่ยต่ำกว่าเป้า':'แคลอรี่ที่บันทึกเฉลี่ยสูงกว่าเป้า',`เฉลี่ย ${Math.round(foodAvg)} kcal/วันที่บันทึก เทียบเป้า ${calorieTarget} kcal (ต่าง ${Math.abs(Math.round(gap))} kcal) จาก ${foods.length} วัน`,`ตรวจความครบถ้วนของมื้ออาหารและน้ำหนักที่ชั่งก่อนปรับเป้าหมาย ถ้าบันทึกครบให้ดูแนวโน้มน้ำหนักร่วมอย่างน้อย 2 สัปดาห์`,foodCover.level));else observations.push(insight('nutrition','positive','แคลอรี่ที่บันทึกเฉลี่ยใกล้เป้าหมาย',`เฉลี่ย ${Math.round(foodAvg)} เทียบเป้า ${calorieTarget} kcal จาก ${foods.length} วัน`,`รักษาความสม่ำเสมอในการบันทึกและติดตามแนวโน้มน้ำหนัก`,'ปานกลาง'));}
 else observations.push(insight('nutrition','info','ต้องการข้อมูลอาหารเพิ่มก่อนสรุป',`มีบันทึกอาหาร ${foods.length}/${days} วัน${calorieTarget===null?' · ยังไม่มีเป้า kcal จากโปรไฟล์':''}`,`บันทึกมื้ออาหารให้ครบในหลายวันก่อนแปลความหมายว่าแคลอรี่น้อยหรือมากเกินไป`,'จำกัด'));
 if(proteinFoods.length>=4&&metrics.ready&&proteinAvg!==null){
  const proteinTarget=metrics.protein;
  const difference=proteinAvg-proteinTarget;
  observations.push(insight('nutrition',difference< -25?'mid':'info','เปรียบเทียบโปรตีนกับเป้าหมายที่ตั้งไว้',`บันทึกโปรตีนเฉลี่ย ${Math.round(proteinAvg)} g/วัน เทียบเป้าจากโปรไฟล์ ${proteinTarget} g/วัน (เฉพาะ ${proteinFoods.length} วันที่ทราบ Macro ครบ)`,difference< -25?'ลองตรวจว่าบันทึกแหล่งโปรตีนครบทุกมื้อหรือยัง แล้วปรับส่วนอาหารตามความสะดวกและความเหมาะสม':'ใช้แนวโน้มและน้ำหนักที่ชั่งร่วมกัน ไม่ต้องยึดค่าต่อวันเป๊ะทุกวัน',foodCover.level));
 }
 if(weightDelta!==null){observations.push(insight('weight','info','เปรียบเทียบน้ำหนักเฉลี่ยสองช่วง',`เฉลี่ยช่วงนี้ ${round(weightMean,2)} kg เทียบช่วงก่อน ${round(weightPrev,2)} kg (${weightDelta>=0?'+':''}${round(weightDelta,2)} kg)`,`ดูแนวโน้มต่อเนื่องและสภาพการชั่งคล้ายกันก่อนปรับแคลอรี่ ไม่ใช้ค่าชั่งครั้งเดียวตัดสิน`,'ปานกลาง'));}
 else observations.push(insight('weight','info','น้ำหนักยังไม่พอสำหรับเปรียบเทียบ',`ชั่ง ${weights.length} วันในช่วงนี้ และ ${oldWeightMap.size} วันในช่วงก่อน`,`ลองชั่งในเงื่อนไขใกล้เคียงกันอย่างสม่ำเสมออย่างน้อย 2 วันในแต่ละช่วงก่อนเทียบค่าเฉลี่ย`,'จำกัด'));
 if(weightGoal!==null&&weights.length){
  const lastWeight=Number(weights.at(-1).weight);
  observations.push(insight('weight','info','ระยะห่างจากน้ำหนักเป้าหมาย',`น้ำหนักที่ชั่งล่าสุด ${round(lastWeight,2)} kg · เป้าหมาย ${round(weightGoal,2)} kg · ต่างกัน ${round(weightGoal-lastWeight,2)} kg`, 'ใช้ความเปลี่ยนแปลงค่าเฉลี่ยหลายวันร่วมกับสมรรถภาพและความรู้สึก ไม่กำหนดเส้นตายหรือคาดการณ์จากการชั่งครั้งเดียว','ปานกลาง'));
 }
 if(sessions.length){if(heavySessions>=3)observations.push(insight('workout','mid','มีการฝึกหนักหลายครั้งในช่วงที่เลือก',`บันทึก RPE 8–10 จำนวน ${heavySessions} Session จาก ${sessions.length} Session`,`ทบทวนการจัดวันพัก ความล้า และประสิทธิภาพแต่ละครั้งก่อนเพิ่มภาระฝึก`,'ปานกลาง'));else observations.push(insight('workout','info','มีการบันทึกการฝึกจริง',`บันทึก ${sessions.length} Session, ${workouts.sets} เซตที่มีข้อมูลจริง, Volume ${Math.round(workouts.volume)} kg·reps`,`ดูจำนวนครั้งและน้ำหนักของท่าเดิมใน 2–3 ครั้งถัดไปก่อนปรับแผน`,'ปานกลาง'));}
 else observations.push(insight('workout','info','ยังไม่มี Workout Session ในช่วงนี้',`มี 0 Session จาก ${days} วัน`,`บันทึกเซตที่ทำจริงเพื่อให้วิเคราะห์การพัฒนาการยกน้ำหนักได้`,'จำกัด'));
 const previousSessions=(state.sessions||[]).filter(x=>isPast(x.date,previousFrom,previousTo));
 const previousTraining=C.trainingStats(previousSessions);
 if(workouts.sets>=3&&previousTraining.sets>=3){
  const delta=previousTraining.volume>0?round((workouts.volume-previousTraining.volume)/previousTraining.volume*100,1):null;
  observations.push(insight('workout','info','เปรียบเทียบปริมาณการยกน้ำหนักที่บันทึก',`ช่วงนี้ ${Math.round(workouts.volume)} kg·reps / ${workouts.sets} เซต เทียบช่วงก่อน ${Math.round(previousTraining.volume)} kg·reps / ${previousTraining.sets} เซต${delta!==null?` (${delta>=0?'+':''}${delta}%)`:''}`,`Volume ที่เพิ่มไม่ได้แปลว่าแข็งแรงขึ้นเสมอ ให้เปรียบเทียบท่าเดิม เทคนิค และความเหนื่อยประกอบ`,'ปานกลาง'));
 }
 if(runs.length>=2)observations.push(insight('running','info','สรุประยะทางและ Pace จากบันทึกวิ่ง',`วิ่ง ${runs.length} ครั้ง ระยะทางรวม ${round(runTotal,2)} km, Pace เฉลี่ยถ่วงน้ำหนักด้วยระยะทาง ${Run.pace(runTotal,runSeconds)}`,`เปรียบเทียบ Pace ของระยะทางและความหนักใกล้เคียงกันในหลายสัปดาห์ก่อนสรุปว่าพัฒนาขึ้น`,'ปานกลาง'));
 else observations.push(insight('running','info','ข้อมูลวิ่งยังไม่พอสำหรับวิเคราะห์แนวโน้ม',`บันทึกการวิ่ง ${runs.length} ครั้งในช่วง ${days} วัน`,`บันทึกระยะทาง เวลา และ RPE อย่างต่อเนื่อง เพื่อเปรียบเทียบ Pace แบบมีบริบท`,'จำกัด'));
 if(checkins.length){if(fatigueAvg>=4)observations.push(insight('recovery','mid','ความเหนื่อยล้าที่รายงานค่อนข้างสูง',`คะแนนความเหนื่อยเฉลี่ย ${round(fatigueAvg,1)}/5 จาก ${checkins.length} Check-in`,`ลองสังเกตการนอน วันพัก และความหนักของการฝึก พร้อมลดความหนักหากร่างกายไม่พร้อม`,'ปานกลาง'));else observations.push(insight('recovery','info','สรุปความรู้สึกจาก Check-in',`พลังงานเฉลี่ย ${round(energyAvg,1)}/5 · ความเหนื่อยเฉลี่ย ${round(fatigueAvg,1)}/5 จาก ${checkins.length} วัน`,`บันทึกหลังตื่นเวลาใกล้เคียงกันเพื่อให้เทียบแนวโน้มได้`,'ปานกลาง'));}
 else observations.push(insight('recovery','info','ยังไม่มี Recovery Check-in ในช่วงนี้',`ข้อมูล 0/${days} วัน`,`บันทึกความสดชื่น ความเหนื่อย ความเครียดอย่างสม่ำเสมอ`,'จำกัด'));
 if(compareRecovery){const diff=round(compareRecovery.short-compareRecovery.enough,1);observations.push(insight('cross',Math.abs(diff)>=.75?'mid':'info','เปรียบเทียบความเหนื่อยระหว่างคืนที่นอนสั้นกับคืนอื่น',`หลังคืนที่นอนสั้น ความเหนื่อยเฉลี่ย ${compareRecovery.short}/5 (${compareRecovery.shortCount} วัน) เทียบคืนอื่น ${compareRecovery.enough}/5 (${compareRecovery.enoughCount} วัน)`,diff>=.75?'ในข้อมูลที่บันทึกมีความเหนื่อยสูงกว่าหลังคืนนอนสั้น ลองเพิ่มเวลานอนและติดตามต่อ ทั้งนี้ยังระบุสาเหตุไม่ได้':'ยังไม่เห็นความต่างที่ชัดเจนจากตัวอย่างนี้ ให้เก็บข้อมูลต่อก่อนสรุปความสัมพันธ์','จำกัด'));}
 else observations.push(insight('cross','info','รอข้อมูลที่จับคู่กันเพื่อวิเคราะห์ข้ามหมวด',`มี Sleep + Check-in ที่จับคู่วันเดียวกัน ${paired.length} วัน (กลุ่มนอนสั้น ${pairedShort.length} วัน, กลุ่มอื่น ${pairedEnough.length} วัน)`,`ต้องมีอย่างน้อยกลุ่มละ 3 วันจึงเริ่มเปรียบเทียบความสัมพันธ์เชิงสังเกตได้ โดยยังไม่ใช่เหตุและผล`,'จำกัด'));
 const order={high:0,mid:1,positive:2,info:3};observations.sort((a,b)=>order[a.severity]-order[b.severity]);
 const domains={sleep:{count:nights.length,coverage:sleepCover,averageMinutes:round(sleepAvg),latest:latestSleep,latestStage,shortNights,range:norm,goalMinutes:goal,trend:sleepLine,previousAverage:previousSleepAvg},nutrition:{count:foods.length,coverage:foodCover,averageKcal:round(foodAvg),averageProtein:round(proteinAvg),target:calorieTarget,trend:mealLine},weight:{count:weights.length,coverage:weightCover,averageKg:round(weightMean,2),deltaKg:round(weightDelta,2),targetKg:weightGoal,trend:weightLine},workout:{count:sessions.length,days:sessionCount,sets:workouts.sets,volume:round(workouts.volume),heavySessions,trend:trainingLine},running:{count:runs.length,totalKm:round(runTotal,2),averagePace:Run.pace(runTotal,runSeconds),trend:runLine},recovery:{count:checkins.length,coverage:checkCover,energy:round(energyAvg),fatigue:round(fatigueAvg),trend:recoveryLine},cross:{pairedDays:paired.length,comparison:compareRecovery}};
 return {days,asOf,from,norm,observations,domains,summary:{domainsWithData:['sleep','nutrition','weight','workout','running','recovery'].filter(k=>domains[k].count>0).length,high:observations.filter(x=>x.severity==='high').length,actionCount:observations.filter(x=>['high','mid'].includes(x.severity)).length,shortSleep:shortNights}};
}
root.FitInsights=Object.freeze({assemble,sleepRange,sameNightStage,coverage});
})(typeof window!=='undefined'?window:globalThis);
