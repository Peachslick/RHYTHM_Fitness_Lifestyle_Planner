const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..');const local=new Map(),listeners={};
const dom={'app':{innerHTML:''},'modal-root':{innerHTML:'',children:[]},'toast-root':{innerHTML:''}};
const document={documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},getElementById:id=>dom[id],querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn};
const location={hash:'#insights'},history={replaceState:(a,b,p)=>location.hash=p};
const ctx={console,Date,Math,Intl,Number,JSON,Array,Object,String,Set,Map,Blob,parseInt,parseFloat,document,location,history,localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},sessionStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>1,clearTimeout:()=>{},confirm:()=>true};ctx.window=ctx;ctx.scrollY=0;ctx.scrollTo=()=>{};ctx.addEventListener=(k,f)=>listeners['window:'+k]=f;vm.createContext(ctx);
for(const file of ['js/data.js','js/core.js','js/recovery.js','js/running.js','js/timer.js','js/sync.js','js/insights.js','js/daily-experience.js','js/app.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const {FitCore:C,FitInsights:I,FitData:D}=ctx;
let checks=0;const eq=(a,b,msg)=>{assert.equal(a,b,msg);checks++},ok=(a,msg)=>{assert.ok(a,msg);checks++};
const now=C.today(),s=D.blankState();
s.profile.age=25;s.profile.sleepGoal=8;
s.sleeps=[{id:'1',date:now,bed:'01:00',wake:'06:00',awake:0,stageUnit:'percent',deep:20,light:60,rem:20,note:''}];
const r=I.assemble(s,{days:7,asOf:now});
eq(I.sleepRange(25).min,420,'age 25 min 7hr');eq(I.sleepRange(63).label,'อายุ 61–64 ปี: 7–9 ชั่วโมง','age 63 range');eq(I.sleepRange(70).label,'อายุ 65 ปีขึ้นไป: 7–8 ชั่วโมง','age 70 range');
eq(r.domains.sleep.count,1,'sleep count');eq(r.domains.sleep.averageMinutes,300,'sleep duration 5hr');eq(r.domains.sleep.shortNights,1,'night below 7 hours');eq(r.domains.sleep.latestStage.values[0].minutes,60,'deep 20pct =60 minutes');eq(r.domains.sleep.latestStage.values[1].minutes,180,'light 60pct =180 minutes');eq(r.domains.sleep.latestStage.values[2].minutes,60,'REM 20pct=60 minutes');ok(r.observations.some(x=>x.domain==='sleep'&&x.severity==='high'&&x.next.includes('30 นาที')),'30 min earlier step');ok(r.observations.some(x=>x.title.includes('สัดส่วน')&&x.evidence.includes('Deep 20%')),'descriptive stages');ok(r.observations.every(x=>!x.evidence.includes('ผิดปกติ')&&!x.evidence.includes('ซ่อมแซมร่างกายไม่พอ')),'no unwarranted stage diagnosis');
eq(r.domains.nutrition.count,0,'empty nutrition');eq(r.domains.nutrition.averageKcal,null,'do not impute zero calories');eq(r.domains.weight.averageKg,null,'do not impute missing weights');eq(r.domains.workout.volume,0,'no volume without real sets');eq(r.domains.running.totalKm,0,'no running without runs');eq(r.domains.cross.comparison,null,'no spurious cross analysis');
eq(r.domains.sleep.coverage.level,'จำกัด','one night low confidence');ok(r.observations.some(x=>x.domain==='nutrition'&&x.confidence==='จำกัด'),'nutrition missing -> constrained');
const before=JSON.stringify(s);I.assemble(s,{days:30});eq(JSON.stringify(s),before,'read only calculations');eq(I.assemble(s,{days:18}).days,14,'invalid windows sanitized');
const s2=D.blankState();const one=(day,id='s')=>({id,date:day,bed:'23:30',wake:'07:30',awake:0,deep:null,light:null,rem:null,note:''});for(let i=0;i<7;i++)s2.sleeps.push(one(C.shift(now,-i),String(i)));
let r2=I.assemble(s2,{days:7,asOf:now});eq(r2.domains.sleep.shortNights,0,'7 good nights');ok(r2.observations.some(x=>x.severity==='positive'&&x.domain==='sleep'),'positive sleep');eq(r2.domains.sleep.latestStage,null,'no stage makes no claim');
const dayBefore=C.shift(now,-1);
s2.meals.push({id:'meal',date:dayBefore,servings:1,kcal:600,protein:40,carbs:60,fat:22});r2=I.assemble(s2,{days:7,asOf:now});eq(r2.domains.nutrition.count,1,'one logged meal day');eq(r2.domains.nutrition.averageKcal,600,'average only logged days');ok(!r2.observations.some(x=>x.domain==='nutrition'&&x.title.includes('ต่ำกว่าเป้า')),'do not suggest calorie deficit from one day');
for(let i=0;i<4;i++){const date=C.shift(now,-i);s2.weights.push({id:'weight-'+i,date,weight:70+i*.1});s2.meals.push({id:'meal-'+i,date,servings:1,kcal:2100,protein:90,carbs:180,fat:60});}
s2.profile.age=30;s2.profile.height=175;s2.profile.weight=70;s2.profile.sleepGoal=8;
r2=I.assemble(s2,{days:7,asOf:now});ok(r2.domains.nutrition.target!==null,'personal target available');ok(r2.domains.nutrition.count>=4,'more food logged');ok(r2.domains.weight.averageKg!==null,'weight mean');
for(let i=0;i<3;i++){const date=C.shift(now,-i);s2.checkins.push({id:'c'+i,date,energy:3,fatigue:4,soreness:2,stress:3,mood:3,waterMl:null,steps:null,note:''});}
r2=I.assemble(s2,{days:7,asOf:now});eq(r2.domains.recovery.count,3,'checkin count');eq(r2.domains.recovery.fatigue,4,'fatigue average');eq(r2.domains.cross.comparison,null,'no comparison without both sleep categories');
const sr={id:'r1',date:now,type:'easy',distanceKm:5,durationSeconds:1800,rpe:6,notes:''};s2.runs=[sr,{...sr,id:'r2',distanceKm:3,durationSeconds:1200}];r2=I.assemble(s2,{days:7,asOf:now});eq(r2.domains.running.count,2,'two runs');eq(r2.domains.running.totalKm,8,'total run km');eq(r2.domains.running.averagePace,'6:15 นาที/กม.','weighted pace 3000 / 8');
const old=D.blankState();delete old.runs;delete old.checkins;ok(C.validateImported(old),'V1.0 legacy import still valid');ok(C.validateImported(s),'sleep stages update import valid');
// App checks: dashboard renders, navigation/filtering/widow controls interact, and no data mutation.
ok(dom.app.innerHTML.includes('วิเคราะห์เชิงลึก'),'new insights route renders');ok(dom.app.innerHTML.includes('รายงานวิเคราะห์และแนวทางถัดไป'),'observations present');
const appBefore=dom.app.innerHTML;
function click(action,value){const el={dataset:{action,value},closest:sel=>sel==='[data-route]'?null:el};listeners.click({target:el,preventDefault(){}});}
click('insights-days','30');ok(dom.app.innerHTML.includes('30 วัน')&&!dom.app.innerHTML.includes('NaN'),'30 day selected renders');
click('insights-focus','sleep');ok(dom.app.innerHTML.includes('deep-filter active')&&dom.app.innerHTML.includes('เจาะลึกการนอน'),'sleep filter works');
const event={target:{closest:sel=>sel==='[data-route]'?{dataset:{route:'dashboard'}}:null},preventDefault(){}};listeners.click(event);ok(dom.app.innerHTML.includes('สร้างจังหวะที่ใช่'),'dashboard navigation works');
console.log(`PASS: ${checks} V1.6.0 deterministic personal insights, stage limitations and UI assertions`);
