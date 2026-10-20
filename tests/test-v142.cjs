// RHYTHM V1.4.2: minute + second input, no data format migration.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'..'),saved=new Map(),listeners={};
const dom={app:{innerHTML:''},'modal-root':{innerHTML:'',children:[]},'toast-root':{innerHTML:''}};
const document={documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},getElementById:id=>dom[id],querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners[type]=fn};
const location={hash:'#workouts'},history={replaceState:(a,b,h)=>location.hash=h};
const ctx={console,Date,Math,Intl,Number,JSON,Array,Object,String,Set,Map,Blob,parseInt,parseFloat,document,location,history,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},setTimeout:()=>1,clearTimeout:()=>{},confirm:()=>true};
ctx.window=ctx;ctx.scrollY=0;ctx.scrollTo=()=>{};ctx.addEventListener=(k,f)=>listeners['window:'+k]=f;
ctx.FormData=class {constructor(form){this.values=form.mock||{}}get(k){return this.values[k]??null}getAll(k){return this.values[k]??[]}has(k){return Object.hasOwn(this.values,k)}};
vm.createContext(ctx);
for(const f of ['js/data.js','js/core.js','js/sync.js','js/running.js','js/timer.js','js/app.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
const C=ctx.FitCore;let count=0;
function equal(a,b,msg){assert.equal(a,b,msg);count++}
function ok(a,msg){assert.ok(a,msg);count++}
function click(action,id='',day=''){const el={dataset:{action,id,day},closest:s=>s==='[data-action]'?el:null};listeners.click({target:el,preventDefault(){}})}
function submit(form,fields,id=''){listeners.submit({target:{id:form,mock:fields,dataset:{id,foodid:''}},preventDefault(){}})}
function getState(){return JSON.parse(saved.get(C.KEY))}
// Unit conversions and limits.
for(const [m,s,want] of [['0','45',45],['1','30',90],['30','0',1800],['0','1',1],['600','0',36000],['','45',45],['12','',720]])equal(C.parseDurationParts(m,s),want,`combine ${m}:${s}`);
for(const [m,s] of [['',''],['0','0'],['0','60'],['1','-2'],['1.5','0'],['601','0'],['1','1.2'],['a','4']])equal(C.parseDurationParts(m,s),null,`reject ${m}:${s}`);
equal(C.formatDuration(45),'45 วินาที','seconds label');equal(C.formatDuration(90),'1 นาที 30 วินาที','mixed label');equal(C.formatDuration(1800),'30 นาที','minutes label');equal(C.durationParts(1800).minutes,30,'decode saved run');equal(C.durationParts(1800).seconds,0,'decode remainder');
click('start-real');click('open-exercise');
ok(dom['modal-root'].innerHTML.includes('name="targetMinutes"'),'minute input exists');
ok(dom['modal-root'].innerHTML.includes('name="targetRemainingSeconds"'),'seconds input exists');
ok(dom['modal-root'].innerHTML.includes('max="59"'),'seconds capped at 59');
ok(!dom['modal-root'].innerHTML.includes('name="targetSeconds"'),'old seconds-only input removed');
submit('exercise-form',{name:'Plank 90',sets:'3',measure:'time',loadType:'bodyweight',targetMinutes:'1',targetRemainingSeconds:'30',load:'0',rest:'90',rememberExercise:'on'});
let data=getState();let ex=data.plan[C.weekday(C.today())].exercises.find(x=>x.name==='Plank 90');
ok(ex,'timed exercise saved');equal(ex.targetSeconds,90,'target remains seconds in JSON');equal(ex.reps,'90 วินาที','legacy display field preserved');equal(data.customExercises[0].targetSeconds,90,'library saved same canonical duration');ok(C.validateImported(data),'cloud-compatible state validates');
const json=JSON.stringify(data);ok(json.includes('"targetSeconds":90'),'backup uses seconds');
click('edit-exercise',ex.id);ok(dom['modal-root'].innerHTML.includes('value="1"'),'editor repopulates minutes');ok(dom['modal-root'].innerHTML.includes('value="30"'),'editor repopulates seconds');
let before=JSON.stringify(data);
submit('exercise-form',{name:'Plank 90',sets:'3',measure:'time',loadType:'bodyweight',targetMinutes:'0',targetRemainingSeconds:'60',load:'0',rest:'90'},ex.id);
equal(JSON.stringify(getState()),before,'invalid 60 seconds does not overwrite');
submit('exercise-form',{name:'Plank 90',sets:'3',measure:'time',loadType:'bodyweight',targetMinutes:'0',targetRemainingSeconds:'0',load:'0',rest:'90'},ex.id);
equal(JSON.stringify(getState()),before,'zero duration does not overwrite');
submit('exercise-form',{name:'Plank 90',sets:'3',measure:'time',loadType:'bodyweight',targetMinutes:'2',targetRemainingSeconds:'5',load:'0',rest:'90'},ex.id);
data=getState();ex=data.plan[C.weekday(C.today())].exercises.find(x=>x.id===ex.id);equal(ex.targetSeconds,125,'editing stored as total seconds');
equal(C.formatDuration(C.exerciseSeconds(ex)),'2 นาที 5 วินาที','new plan display human readable');
// Old V1.4.1 stored plans and sessions need no migration.
const old={id:'legacy',name:'Run / Zone 2',reps:'1800 วินาที',measure:'time',targetSeconds:1800,loadType:'none',sets:1,load:0,rest:0};
equal(C.durationParts(C.exerciseSeconds(old)).minutes,30,'old 1800-second workout edited as 30 minutes');
const session={id:'s',date:C.today(),type:'run',title:'Run',duration:30,exercises:[{...old,setLog:[{seconds:1800,load:0,warmup:false}]}]};
data.sessions=[session];ok(C.validateImported(data),'old timed set still validates');equal(C.trainingStats(data.sessions).timedSeconds,1800,'old stats unchanged');
console.log('PASS: '+count+' v1.4.2 minute/second conversions, editor, invalid input, library, legacy sync assertions');
