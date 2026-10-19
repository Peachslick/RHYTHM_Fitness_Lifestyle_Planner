/* RHYTHM v1.4.0 — descriptive wellness analysis only, NOT a medical or injury risk score. */
(function(){
  'use strict';
  const C=window.FitCore;
  const fields=['energy','fatigue','soreness','stress','mood'];
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const checkins=s=>Array.isArray(s?.checkins)?s.checkins:[];
  const value=x=>Number(x);
  function validCheckin(x){
    if(!x||!C.isDate(x.date)||typeof x.id!=='string'||x.id.length>100)return false;
    if(fields.some(k=>!Number.isInteger(value(x[k]))||value(x[k])<1||value(x[k])>5))return false;
    if(x.waterMl!==null&&x.waterMl!==undefined&&x.waterMl!==''&&(!Number.isInteger(value(x.waterMl))||value(x.waterMl)<0||value(x.waterMl)>12000))return false;
    if(x.steps!==null&&x.steps!==undefined&&x.steps!==''&&(!Number.isInteger(value(x.steps))||value(x.steps)<0||value(x.steps)>100000))return false;
    return typeof (x.note||'')==='string'&&(x.note||'').length<=600;
  }
  function subjective(entry){
    if(!validCheckin(entry))return null;
    const score=(value(entry.energy)+(6-value(entry.fatigue))+(6-value(entry.soreness))+(6-value(entry.stress))+value(entry.mood))/5;
    const label=score<2.5?'วันนี้อาจเหมาะกับการฝึกเบาลง':score<3.6?'ประเมินร่างกายก่อนเริ่มฝึก':'ความรู้สึกโดยรวมค่อนข้างดี';
    return {score:Number(score.toFixed(1)),label,tone:score<2.5?'low':score<3.6?'mid':'good'};
  }
  function sleepWindow(state,days=7,asOf=C.today()){
    const entries=(state?.sleeps||[]).filter(x=>C.isDate(x.date)&&x.date<=asOf&&x.date>=C.shift(asOf,1-days)&&C.sleepDuration(x)!==null);
    const duration=entries.length?entries.reduce((s,x)=>s+C.sleepDuration(x),0)/entries.length:null;
    // Circular clock difference: 23:50 and 00:10 are just 20 minutes apart.
    const times=entries.map(x=>C.timeMin(x.bed)).filter(x=>x!==null);
    let consistency=null;
    if(times.length>=3){
      const ang=times.map(min=>2*Math.PI*min/1440);
      const mean=Math.atan2(ang.reduce((a,b)=>a+Math.sin(b),0),ang.reduce((a,b)=>a+Math.cos(b),0));
      const center=(mean<0?mean+2*Math.PI:mean)*1440/(2*Math.PI);
      consistency=Math.round(times.reduce((sum,minute)=>sum+Math.abs(((minute-center+2160)%1440)-720),0)/times.length);
    }
    return {count:entries.length,averageMinutes:duration===null?null:Math.round(duration),bedtimeDeviationMinutes:consistency};
  }
  function trend(state,days=14,asOf=C.today()){
    return checkins(state).filter(x=>C.isDate(x.date)&&x.date>=C.shift(asOf,1-days)&&x.date<=asOf&&validCheckin(x)).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({date:x.date,...subjective(x),energy:value(x.energy),soreness:value(x.soreness),fatigue:value(x.fatigue)}));
  }
  function insights(state,date=C.today()){
    const entry=checkins(state).find(x=>x.date===date),feel=subjective(entry);
    const sleep=(state?.sleeps||[]).find(x=>x.date===date);
    const sleepMinutes=sleep?C.sleepDuration(sleep):null;
    const goal=clamp(Number(state?.profile?.sleepGoal)||8,6,12)*60;
    const sessions=(state?.sessions||[]).filter(x=>C.isDate(x.date)&&x.date<=date&&x.date>=C.shift(date,-2));
    const hardSessions=sessions.filter(x=>Number(x.rpe)>=8);
    const points=[];
    if(feel?.tone==='low')points.push('วันนี้ความรู้สึกโดยรวมค่อนข้างล้า อาจพิจารณาลดความหนักหรือเลือกวันพักตามความเหมาะสม');
    if(feel&&value(entry.soreness)>=4)points.push('คุณบันทึกความปวดกล้ามเนื้อสูง ควรประเมินความสบายของร่างกายก่อนฝึกกลุ่มเดิม');
    if(sleepMinutes!==null&&sleepMinutes<goal-60)points.push(`เวลานอนที่บันทึกต่ำกว่าเป้าหมายเกิน 1 ชั่วโมง ลองจัดตารางให้มีเวลาพักเพิ่ม`);
    if(hardSessions.length>=2)points.push('มีบันทึกการฝึก RPE 8–10 หลายครั้งในช่วง 3 วัน ลองทบทวนความหนักและวันพัก');
    if(!points.length){
      if(feel)points.push('ยังไม่พบสัญญาณที่ตั้งเงื่อนไขไว้จากข้อมูลที่บันทึก ควรสังเกตความรู้สึกจริงก่อนเริ่มฝึกเสมอ');
      else points.push('ยังไม่มี Check-in ของวันนี้ ลองบันทึกความรู้สึกเพื่อดูรูปแบบการพักฟื้นของตัวเอง');
    }
    return {feel,entry:entry||null,sleepMinutes,sleepGoalMinutes:goal,hardSessions:hardSessions.length,points,sleepSummary:sleepWindow(state,7,date),trend:trend(state,14,date)};
  }
  window.FitRecovery={fields,checkins,validCheckin,subjective,sleepWindow,trend,insights};
})();
