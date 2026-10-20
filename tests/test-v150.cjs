// V1.5.0 new pure calculations, clock-safe timer, schema compatibility and running UI.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const local=new Map(),timerStorage=new Map();
const dom={app:{innerHTML:''},'modal-root':{innerHTML:'',children:[]},'toast-root':{innerHTML:''}};
const listeners={},document={documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},getElementById:id=>dom[id],querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners[type]=fn};
const location={hash:'#running'},history={replaceState:(a,b,h)=>location.hash=h};
const storage={getItem:k=>timerStorage.get(k)||null,setItem:(k,v)=>timerStorage.set(k,v)};
const ctx={console,Date,Math,Intl,Number,JSON,Array,Object,String,Set,Map,Blob,parseInt,parseFloat,document,location,history,localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},sessionStorage:storage,setTimeout:()=>1,clearTimeout:()=>{},confirm:()=>true};
ctx.window=ctx;ctx.scrollY=0;ctx.scrollTo=()=>{};ctx.addEventListener=(k,f)=>listeners['window:'+k]=f;
ctx.FormData=class{constructor(form){this.values=form.mock||{}}get(k){return this.values[k]??null}getAll(k){return this.values[k]??[]}has(k){return Object.hasOwn(this.values,k)}};
vm.createContext(ctx);
for(const file of ['js/data.js','js/core.js','js/sync.js','js/running.js','js/timer.js','js/app.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
let checks=0;const ok=(cond,msg)=>{assert.ok(cond,msg);checks++;},eq=(a,b,msg)=>{assert.equal(a,b,msg);checks++;};
const R=ctx.FitRun,C=ctx.FitCore,T=ctx.FitTimer;
eq(R.parseDuration('30','0'),1800,'30 mins');eq(R.parseDuration('1','30'),90,'1:30');eq(R.parseDuration('0','59'),59,'59sec');eq(R.parseDuration('12','60'),null,'seconds 60 invalid');eq(R.parseDuration('',''),null,'blank invalid');eq(R.parseDuration('-1','2'),null,'negative minutes');eq(R.parseDuration('1.5','0'),null,'decimal minutes');eq(R.parseDuration('0','0'),null,'zero invalid');eq(R.parseDuration('2880','0'),172800,'48 hr supported');eq(R.parseDuration('2881','0'),null,'over 48h');
eq(R.pace(5,1800),'6:00 นาที/กม.','5km in 30m');eq(R.pace(10,3210),'5:21 นาที/กม.','10km in 53.5m');eq(R.pace(0,100),'—','zero distance');eq(R.pace(2,0),'—','zero duration');eq(R.duration(3723),'1 ชม. 2 นาที 3 วินาที','duration format');eq(R.parts(1800).minutes,30,'duration parts');
const day=C.today(),run={id:'run1',date:day,type:'easy',distanceKm:5,durationSeconds:1800,rpe:6,notes:'รอบสวน'};
ok(R.validRun(run),'valid run');ok(!R.validRun({...run,distanceKm:-1}),'negative km');ok(!R.validRun({...run,distanceKm:501}),'high km');ok(!R.validRun({...run,rpe:12}),'high RPE');ok(!R.validRun({...run,type:'spoof'}),'unknown run type');ok(!R.validRun({...run,notes:'z'.repeat(701)}),'long notes');ok(!R.validRun({...run,date:'2026-02-30'}),'date integrity');
const ss=R.stats({runs:[run,{...run,id:'run2',distanceKm:5,durationSeconds:1500}]},day);
eq(ss.count,2,'two run records');eq(ss.distanceKm,10,'10km total');eq(ss.pace,'5:30 นาที/กม.','weighted pace uses total seconds/distance');eq(R.weeklySeries({runs:[run]},day).reduce((s,x)=>s+x.value,0),5,'8-week chart includes run');
const s=ctx.FitData.blankState();s.runs=[run];s.settings.runWeeklyGoalKm=15;
ok(C.validateImported(s),'new state runs import valid');const legacy={...s};delete legacy.runs;delete legacy.settings.runWeeklyGoalKm;ok(C.validateImported(legacy),'legacy import valid');ok(!C.validateImported({...s,runs:[{...run,durationSeconds:-5}]}),'reject corrupted run');ok(!C.validateImported({...s,settings:{...s.settings,runWeeklyGoalKm:900}}),'reject invalid goal');
let now=1000000,done=0;const st=new Map(),timerStore={getItem:k=>st.get(k)||null,setItem:(k,v)=>st.set(k,v)};
const timer=T.create({storage:timerStore,clock:()=>now,onTick:()=>{},onDone:()=>done++});
ok(timer.start('countdown',90),'start rest');eq(timer.snapshot().displaySeconds,90,'90 sec countdown');now+=30000;eq(timer.snapshot().displaySeconds,60,'subtract wallclock time');timer.pause();now+=60000;eq(timer.snapshot().displaySeconds,60,'pause freezes time');timer.resume();now+=60500;eq(timer.update().status,'done','wall-clock done after tab suspended');eq(done,1,'completion only once');timer.update();eq(done,1,'not repeated');timer.reset();eq(timer.snapshot().status,'idle','reset');ok(timer.start('stopwatch'),'start stopwatch');now+=65123;eq(timer.snapshot().displaySeconds,65,'stopwatch counts wall-clock');timer.pause();eq(timer.snapshot().displaySeconds,65,'pause stopwatch');const rehydrated=T.create({storage:timerStore,clock:()=>now,onTick:()=>{},onDone:()=>{}});eq(rehydrated.snapshot().displaySeconds,65,'timer persists in session storage');rehydrated.dispose();timer.dispose();
function click(action,id=''){const el={dataset:{action,id},closest:sel=>sel==='[data-route]'?null:el};listeners.click({target:el,preventDefault(){}})}
function submit(id,fields,dataId=''){listeners.submit({target:{id,mock:fields,dataset:{id:dataId}},preventDefault(){}})}
ok(dom.app.innerHTML.includes('Running Tracker'),'running screen visible');ok(dom.app.innerHTML.includes('Smart Workout Timer'),'timer visible on running route');click('start-real');click('add-run');ok(dom['modal-root'].innerHTML.includes('run-form'),'run entry modal opens');
submit('run-form',{date:day,type:'easy',distanceKm:'5',minutes:'30',seconds:'0',rpe:'6',notes:'my jog'});
let saved=JSON.parse(local.get(C.KEY));eq(saved.runs.length,1,'run saved');eq(saved.runs[0].durationSeconds,1800,'duration saved in seconds');ok(C.validateImported(saved),'cloud snapshot remains valid');
submit('run-goal-form',{goal:'20'});saved=JSON.parse(local.get(C.KEY));eq(saved.settings.runWeeklyGoalKm,20,'save weekly km goal');
click('delete-run',saved.runs[0].id);saved=JSON.parse(local.get(C.KEY));eq(saved.runs.length,0,'run removed without deleting workouts');
console.log(`PASS: ${checks} V1.5.0 running tracker / clock-safe timer / compatibility assertions`);
