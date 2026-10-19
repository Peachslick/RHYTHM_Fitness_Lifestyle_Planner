/* RHYTHM v1.4.0 — pure calculations, dates, local persistence and icons */
(function(){
  'use strict';
  const KEY='rhythm_fitness_v1';
  const $=(sel,scope=document)=>scope.querySelector(sel);
  const $$=(sel,scope=document)=>Array.from(scope.querySelectorAll(sel));
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(v,fallback=0)=>{const n=Number(v);return Number.isFinite(n)?n:fallback;};
  const nfmt=(v,max=0)=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-US',{maximumFractionDigits:max}).format(Number(v)):'—';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const uid=()=>`id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
  function today(offset=0){ const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  const isDate=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !Number.isNaN(d.getTime())&&`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`===s;};
  function shift(date,n){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function weekday(date){return (new Date(`${date}T12:00:00`).getDay()+6)%7;}
  function weekDates(date=today()){ const mon=shift(date,-weekday(date)); return Array.from({length:7},(_,i)=>shift(mon,i)); }
  function pretty(date,long=false){if(!isDate(date))return '—'; return new Date(`${date}T12:00:00`).toLocaleDateString('th-TH',{day:'numeric',month:long?'long':'short',year:long?'numeric':undefined});}
  function shortDate(date){if(!isDate(date))return '—';const d=new Date(`${date}T12:00:00`);return `${d.getDate()}/${d.getMonth()+1}`;}
  function timeMin(str){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(str)))return null;const [h,m]=str.split(':').map(Number);return h*60+m;}
  function sleepDuration(s){const bed=timeMin(s.bed),wake=timeMin(s.wake);if(bed===null||wake===null||bed===wake)return null;const inBed=(wake-bed+1440)%1440;const awake=num(s.awake,0);return awake>=0&&awake<inBed?inBed-awake:null;}
  function sleepStageMinutes(x,key){const value=x?.[key],dur=sleepDuration(x);return dur===null||value===null||value===''||value===undefined?null:(x.stageUnit==='percent'?dur*num(value)/100:num(value));}
  function sleepStagePercent(x,key){const value=sleepStageMinutes(x,key),duration=sleepDuration(x);return value!==null&&duration?value/duration*100:null;}
  function validSleepStages(x){const duration=sleepDuration(x),unit=x.stageUnit||'minutes';if(duration===null||!['minutes','percent'].includes(unit))return false;const vals=['deep','light','rem'].map(k=>x[k]).filter(v=>v!==null&&v!==''&&v!==undefined);if(vals.some(v=>!Number.isFinite(Number(v))||Number(v)<0))return false;return vals.reduce((a,v)=>a+Number(v),0)<=(unit==='percent'?100.001:duration+.001);}
  function planOn(state,date){return state.scheduleOverrides?.[date]||state.plan[weekday(date)];}
  function trainingStats(sessions){
    const byExercise={},byDate={};let volume=0,sets=0;
    for(const session of sessions||[])for(const ex of session.exercises||[]){
      // Old records have only target reps / aggregate count. Never treat them as performed sets.
      if(!Array.isArray(ex.setLog))continue;
      for(const row of ex.setLog){const load=num(row.load,-1),reps=num(row.reps,-1);if(row.warmup||!Number.isInteger(reps)||reps<1||reps>100||load<0||load>1000)continue;
        const key=String(ex.name||'').trim().toLocaleLowerCase();if(!key)continue;
        const item=byExercise[key]||(byExercise[key]={name:ex.name,sets:0,volume:0,maxLoad:0,maxEst1RM:0,history:[]});
        item.sets++;item.volume+=load*reps;item.maxLoad=Math.max(item.maxLoad,load);if(reps<=10)item.maxEst1RM=Math.max(item.maxEst1RM,load*(1+reps/30));item.history.push({date:session.date,load,reps,volume:load*reps});
        byDate[session.date]=(byDate[session.date]||0)+load*reps;volume+=load*reps;sets++;
      }
    }
    return {volume,sets,byExercise,byDate};
  }
  function ageValid(p){return num(p?.age)>=18&&num(p?.age)<=100;}
  function metrics(state){
    const p=state.profile||{};
    const latest=state.weights.filter(w=>num(w.weight)>0&&isDate(w.date)&&w.date<=today()).sort((a,b)=>b.date.localeCompare(a.date))[0];
    const weight=latest?num(latest.weight):num(p.weight);
    const height=num(p.height),age=num(p.age),valid=ageValid(p)&&height>=100&&height<=250&&weight>=25&&weight<=400;
    if(!valid) return {ready:false,weight:weight||null,height:height||null};
    const bmi=weight/((height/100)**2);
    const bmr=10*weight+6.25*height-5*age+(p.sex==='female'?-161:5);
    const activity=FitData.ACTIVITY[p.activity]?.factor||1.2;
    const tdee=bmr*activity;
    const adjust=clamp(num(p.calorieAdjust),-750,750);
    const target=Math.round(Math.max(0,tdee+adjust));
    const protein=Math.round(weight*clamp(num(p.proteinPerKg,1.6),0.8,2.5));
    const fat=Math.round(target*clamp(num(p.fatPercent,25),15,40)/100/9);
    const carbs=Math.round(Math.max(0,(target-protein*4-fat*9)/4));
    const bmiCategory=age<20?'สำหรับอายุ 20 ปีขึ้นไป':bmi<18.5?'น้ำหนักน้อย':bmi<25?'เกณฑ์ทั่วไป':bmi<30?'น้ำหนักเกิน':'ค่าดัชนีสูง';
    return {ready:true,weight,height,age,bmi,bmiCategory,bmr:Math.round(bmr),tdee:Math.round(tdee),target,adjust,protein,fat,carbs,activity};
  }
  function mealsFor(state,date){return state.meals.filter(e=>e.date===date);}
  function foodTotals(entries){const result={kcal:0,protein:0,carbs:0,fat:0};for(const e of entries)for(const k of Object.keys(result))result[k]+=num(e[k])*num(e.servings,1);for(const k of Object.keys(result))result[k]=Math.round(result[k]*10)/10;return result;}
  function weightSeries(state,days=30){return state.weights.filter(x=>isDate(x.date)&&x.date>=shift(today(),-(days-1))&&x.date<=today()&&num(x.weight)>0).sort((a,b)=>a.date.localeCompare(b.date));}
  function recentSleep(state,days=7){return state.sleeps.filter(x=>isDate(x.date)&&x.date>=shift(today(),-(days-1))&&x.date<=today()&&sleepDuration(x)!==null).sort((a,b)=>a.date.localeCompare(b.date));}
  function sleepStats(state,days=7){const entries=recentSleep(state,days),avg=entries.length?entries.reduce((s,e)=>s+sleepDuration(e),0)/entries.length:null;return {entries,avg};}
  function workoutStats(state,days=7){const dates=Array.from({length:days},(_,i)=>shift(today(),-(days-1-i)));const planned=dates.filter(d=>!['rest','recovery'].includes(planOn(state,d)?.type));const completed=planned.filter(d=>state.sessions.some(s=>s.date===d));return {planned:planned.length,completed:completed.length,rate:planned.length?completed.length/planned.length:null};}
  const avg=(arr)=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
  function calorieAverage(state,days=7){const dates=Array.from({length:days},(_,i)=>shift(today(),-i));const logged=dates.filter(d=>state.meals.some(m=>m.date===d));return {days:logged.length,value:avg(logged.map(d=>foodTotals(mealsFor(state,d)).kcal))};}
  // Compare two independent 7-day calendar windows, not just the first/last noisy weigh-ins.
  // Multiple weigh-ins on one day use the latest entry; never invent unrecorded values.
  function weightTrend(state,asOf=today()){
    const lastByDay=new Map();
    for(const row of state.weights||[]){if(isDate(row.date)&&row.date<=asOf&&num(row.weight)>0)lastByDay.set(row.date,num(row.weight));}
    const values=(start,end)=>[...lastByDay].filter(([d])=>d>=start&&d<=end).map(([,v])=>v);
    const current=values(shift(asOf,-6),asOf),previous=values(shift(asOf,-13),shift(asOf,-7));
    const now=avg(current),before=avg(previous),ready=current.length>=2&&previous.length>=2;
    return {ready,currentDays:current.length,previousDays:previous.length,currentAverage:now,previousAverage:before,delta:ready?now-before:null};
  }
  function nutritionSummary(state,asOf=today(),days=14){
    const from=shift(asOf,1-days),dates=[...new Set((state.meals||[]).filter(x=>isDate(x.date)&&x.date>=from&&x.date<=asOf).map(x=>x.date))].sort();
    const kcal=dates.map(d=>foodTotals(mealsFor(state,d)).kcal);
    const last7=dates.filter(d=>d>=shift(asOf,-6));
    return {days,loggedDays:dates.length,average:avg(kcal),sevenDayLogged:last7.length,sevenDayAverage:avg(last7.map(d=>foodTotals(mealsFor(state,d)).kcal)),daily:dates.map((date,i)=>({date,value:kcal[i]}))};
  }
  function sorted(arr,field='date'){return [...arr].sort((a,b)=>String(b[field]||'').localeCompare(String(a[field]||'')));}
  function validateImported(data){
    if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1)return false;
    const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
    const shortText=(s,len=800)=>typeof s==='string'&&s.length<=len;
    const nonNeg=v=>Number.isFinite(Number(v))&&Number(v)>=0;
    for(const key of ['plan','meals','sleeps','sessions','weights','routines','customFoods'])if(!Array.isArray(data[key])||data[key].length>20000)return false;
    if(!record(data.profile)||!record(data.settings)||!['light','dark'].includes(data.settings.theme))return false;
    if(data.settings.font!==undefined&&!['sarabun','bai','noto','ibm','leelawadee','tahoma','segoe','prompt','kanit','mitr','anakotmai','athiti','trirong','itim','pattaya','chonburi'].includes(data.settings.font))return false;
    if(!shortText(data.profile.name,80)||!['male','female'].includes(data.profile.sex)||!FitData.ACTIVITY[data.profile.activity]||!FitData.GOALS[data.profile.goal])return false;
    if(![data.profile.age,data.profile.height,data.profile.weight,data.profile.targetWeight].every(v=>v===''||Number.isFinite(Number(v))))return false;
    if(!Number.isFinite(Number(data.profile.calorieAdjust))||!Number.isFinite(Number(data.profile.proteinPerKg))||!Number.isFinite(Number(data.profile.fatPercent))||!Number.isFinite(Number(data.profile.sleepGoal)))return false;
    if(data.plan.length!==7||data.plan.some((p,i)=>!record(p)||p.day!==i||!Object.hasOwn(FitData.TYPES,p.type)||!shortText(p.title,120)||!Array.isArray(p.exercises)||p.exercises.length>150||p.exercises.some(ex=>!record(ex)||!shortText(ex.id,80)||!shortText(ex.name,120)||!shortText(ex.reps,60)||!nonNeg(ex.sets)||!nonNeg(ex.load)||!nonNeg(ex.rest))))return false;
    const dated=x=>record(x)&&isDate(x.date)&&shortText(x.id,100);
    if(!data.meals.every(x=>dated(x)&&shortText(x.name,140)&&shortText(x.unit,120)&&Object.hasOwn(FitData.MEALTYPES,x.meal)&&['servings','kcal','protein','carbs','fat'].every(k=>nonNeg(x[k]))))return false;
    if(!data.sleeps.every(x=>dated(x)&&shortText(x.bed,5)&&shortText(x.wake,5)&&nonNeg(x.awake)&&validSleepStages(x)&&shortText(x.note||'',1000)))return false;
    if(!data.sessions.every(x=>dated(x)&&shortText(x.title,120)&&nonNeg(x.duration)&&Array.isArray(x.exercises)&&x.exercises.length<=150&&x.exercises.every(ex=>record(ex)&&shortText(ex.name,120)&&shortText(ex.reps,60)&&nonNeg(ex.sets)&&nonNeg(ex.load))))return false;
    if(data.scheduleOverrides!==undefined){if(!record(data.scheduleOverrides)||Object.keys(data.scheduleOverrides).length>730)return false;
      for(const [date,plan] of Object.entries(data.scheduleOverrides))if(!isDate(date)||!record(plan)||!shortText(plan.title,120)||!Object.hasOwn(FitData.TYPES,plan.type)||!Array.isArray(plan.exercises)||plan.exercises.length>150||plan.exercises.some(ex=>!record(ex)||!shortText(ex.id,80)||!shortText(ex.name,120)||!shortText(ex.reps,60)||!nonNeg(ex.sets)||!nonNeg(ex.load)||!nonNeg(ex.rest)))return false;}
    for(const session of data.sessions)for(const ex of session.exercises){if(ex.setLog!==undefined&&(!Array.isArray(ex.setLog)||ex.setLog.length>30||ex.setLog.some(r=>!record(r)||!Number.isInteger(Number(r.reps))||num(r.reps)<1||num(r.reps)>100||!nonNeg(r.load)||num(r.load)>1000||typeof r.warmup!=='boolean')))return false;}
    if(!data.weights.every(x=>dated(x)&&nonNeg(x.weight)&&(x.bodyFat===null||x.bodyFat===''||nonNeg(x.bodyFat))))return false;
    if(!data.routines.every(x=>record(x)&&shortText(x.id,100)&&shortText(x.title,120)&&shortText(x.start,5)&&shortText(x.end,5)&&timeMin(x.start)!==null&&timeMin(x.end)!==null&&Object.hasOwn(FitData.CATEGORIES,x.category)&&Array.isArray(x.days)&&x.days.length<=7&&x.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)))return false;
    if(!data.customFoods.every(x=>record(x)&&shortText(x.id,100)&&shortText(x.name,120)&&shortText(x.unit,100)&&shortText(x.group,60)&&['kcal','protein','carbs','fat'].every(k=>nonNeg(x[k]))))return false;
    // V1.3 fields are optional so old V1.0–V1.2 exports remain importable.
    if(data.favoriteFoodIds!==undefined&&(!Array.isArray(data.favoriteFoodIds)||data.favoriteFoodIds.length>2000||data.favoriteFoodIds.some(id=>!shortText(id,100))))return false;
    if(!data.meals.every(x=>(x.baseGrams===undefined||x.baseGrams===null||(nonNeg(x.baseGrams)&&Number(x.baseGrams)>0&&Number(x.baseGrams)<=10000))&&(x.quantityMode===undefined||['servings','grams'].includes(x.quantityMode))&&(x.quantityGrams===undefined||x.quantityGrams===null||(nonNeg(x.quantityGrams)&&Number(x.quantityGrams)<=3000))&&(x.copiedFrom===undefined||shortText(x.copiedFrom,100))))return false;
    if(!data.customFoods.every(x=>x.baseGrams===undefined||x.baseGrams===null||(nonNeg(x.baseGrams)&&Number(x.baseGrams)>0&&Number(x.baseGrams)<=10000)))return false;
    // Recovery check-ins are optional: previous V1.0–V1.3 JSON exports remain valid.
    if(data.checkins!==undefined){
      if(!Array.isArray(data.checkins)||data.checkins.length>20000||!data.checkins.every(x=>dated(x)&&['energy','fatigue','soreness','stress','mood'].every(k=>Number.isInteger(Number(x[k]))&&Number(x[k])>=1&&Number(x[k])<=5)&&['waterMl','steps'].every(k=>x[k]===null||x[k]===undefined||x[k]===''||(Number.isInteger(Number(x[k]))&&Number(x[k])>=0&&Number(x[k])<=(k==='steps'?100000:12000)))&&shortText(x.note||'',600)))return false;
      if(new Set(data.checkins.map(x=>x.date)).size!==data.checkins.length)return false;
    }
    return true;
  }
  function load(){try {const raw=localStorage.getItem(KEY);if(raw){const p=JSON.parse(raw);if(validateImported(p))return p;}}catch(e){console.warn('RHYTHM storage unavailable:',e.message);}return FitData.demoState();}
  function save(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch(e){console.error('RHYTHM cannot save:',e);return false;}}
  function exportData(state){const text=JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2);const blob=new Blob([text],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`RHYTHM-backup-${today()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const paths={
    layout:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    dumbbell:'<path d="m6.5 6.5 11 11M3.5 8l4.5-4.5M16 20.5l4.5-4.5M2 10l8-8M14 22l8-8"/>',
    utensils:'<path d="M4 3v7a4 4 0 0 0 8 0V3M8 3v19M18 3v19M18 3c-4 4-4 10 0 10"/>',
    moon:'<path d="M20.5 14.5A8 8 0 0 1 9.5 3.5 8.3 8.3 0 1 0 20.5 14.5Z"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    chart:'<path d="M3 3v18h18M7 16l4-5 4 3 5-7"/>',
    cloud:'<path d="M7 19h11a4.5 4.5 0 0 0 .2-9A6 6 0 0 0 6 9.5 4.8 4.8 0 0 0 7 19Z"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    'chevron-down':'<path d="m6 9 6 6 6-6"/>',
    'chevron-left':'<path d="m15 18-6-6 6-6"/>',
    'chevron-right':'<path d="m9 18 6-6-6-6"/>',
    edit:'<path d="m16 4 4 4-12 12H4v-4L16 4Zm-3 3 4 4"/>',
    trash:'<path d="M4 7h16M10 3h4M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
    check:'<path d="M4 12l5 5L20 6"/>',
    close:'<path d="M5 5l14 14M19 5 5 19"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5M2 12h2m16 0h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    flame:'<path d="M12 22c5 0 8-3.5 8-8 0-4-3-6-4-7 0 3-2 4-2 4C12 9 13 5 9 2c0 5-2 7-4 10a7 7 0 0 0 7 10Z"/>',
    scale:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9a4 4 0 0 1 8 0l-4 4-4-4"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.5"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    settings:'<path d="M10 3h4l1 3 3 1 3-1 2 4-2 2v2l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-2l-2-2 2-4 3 1 3-1 1-3Z"/><circle cx="12" cy="13" r="3"/>',
    bolt:'<path d="M13 2 4 13h7l-1 9 10-12h-7l0-8Z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
    drop:'<path d="M12 2S5 11 5 15a7 7 0 0 0 14 0c0-4-7-13-7-13Z"/>'
  };
  function icon(name,size=20){return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.info}</svg>`;}
  function lineChart(points,opts={}){
    const clean=points.filter(p=>Number.isFinite(Number(p.value))).map(p=>({...p,value:Number(p.value)}));
    if(!clean.length)return '<div class="chart-empty">ยังไม่มีข้อมูลในช่วงเวลานี้</div>';
    const w=700,h=210,pl=25,pr=22,pt=20,pb=38;
    const raw=[...clean.map(x=>x.value),...(Number.isFinite(opts.target)?[opts.target]:[])];
    let mn=Math.min(...raw),mx=Math.max(...raw);if(mx-mn<1){mn-=1;mx+=1;}
    const pad=(mx-mn)*0.18;mn=Math.max(0,mn-pad);mx+=pad;
    const x=i=>pl+(w-pl-pr)*(clean.length===1?0.5:i/(clean.length-1));
    const y=v=>pt+(h-pt-pb)*(1-(v-mn)/(mx-mn));
    const path=clean.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
    const fill=`${path} L${x(clean.length-1).toFixed(1)} ${h-pb} L${x(0).toFixed(1)} ${h-pb} Z`;
    const guid=uid().replaceAll('-','');
    const grid=[0,.25,.5,.75,1].map(fr=>{const v=mn+(mx-mn)*fr;return `<line x1="${pl}" y1="${y(v)}" x2="${w-pr}" y2="${y(v)}" stroke="var(--chart-grid)" stroke-dasharray="3 6"/><text x="${pl-6}" y="${y(v)+4}" font-size="10" text-anchor="end" fill="var(--muted)">${nfmt(v,1)}</text>`;}).join('');
    const labels=clean.filter((_,i)=>i===0||i===clean.length-1||(clean.length<8&&i%2===0)).map(p=>{const i=clean.indexOf(p);return `<text x="${x(i)}" y="${h-9}" font-size="11" text-anchor="middle" fill="var(--muted)">${esc(shortDate(p.date))}</text>`;}).join('');
    const target=Number.isFinite(opts.target)?`<line x1="${pl}" y1="${y(opts.target)}" x2="${w-pr}" y2="${y(opts.target)}" stroke="#f0a56b" stroke-width="1.5" stroke-dasharray="7 5"/>`:'';
    const dots=clean.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.value)}" r="4.4" fill="var(--accent-deep)" stroke="var(--surface)" stroke-width="2"><title>${esc(pretty(p.date))} • ${nfmt(p.value,1)}</title></circle>`).join('');
    return `<svg role="img" aria-label="${esc(opts.label||'กราฟแนวโน้ม')}" class="line-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="${guid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--accent-deep)" stop-opacity=".21"/><stop offset="100%" stop-color="var(--accent-deep)" stop-opacity="0"/></linearGradient></defs>${grid}${target}<path d="${fill}" fill="url(#${guid})"/><path d="${path}" stroke="var(--accent-deep)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>${dots}${labels}</svg>`;
  }
  window.FitCore={KEY,$,$$,esc,num,nfmt,clamp,uid,today,isDate,shift,weekday,weekDates,pretty,shortDate,timeMin,sleepDuration,sleepStageMinutes,sleepStagePercent,validSleepStages,planOn,trainingStats,ageValid,metrics,mealsFor,foodTotals,weightSeries,recentSleep,sleepStats,workoutStats,calorieAverage,weightTrend,nutritionSummary,sorted,validateImported,load,save,exportData,icon,lineChart};
})();
