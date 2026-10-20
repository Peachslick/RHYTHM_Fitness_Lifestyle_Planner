const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'..'),saved=new Map(),listeners={};
const dom={app:{innerHTML:''},'modal-root':{innerHTML:'',children:[]},'toast-root':{innerHTML:''}};
const document={documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},getElementById:id=>dom[id],querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners[type]=fn};
const location={hash:'#workouts'},history={replaceState:(a,b,h)=>location.hash=h};
const ctx={console,Date,Math,Intl,Number,JSON,Array,Object,String,Set,Map,Blob,document,location,history,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},setTimeout:()=>1,clearTimeout:()=>{},confirm:()=>true};
ctx.window=ctx;ctx.scrollY=0;ctx.scrollTo=()=>{};ctx.addEventListener=(k,f)=>listeners['window:'+k]=f;
ctx.FormData=class{constructor(form){this.values=form.mock||{}}get(k){return this.values[k]??null}getAll(k){return this.values[k]??[]}has(k){return Object.hasOwn(this.values,k)}};
vm.createContext(ctx);
for(const f of ['js/data.js','js/core.js','js/sync.js','js/app.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
const C=ctx.FitCore,D=ctx.FitData;let count=0;
function ok(cond,msg){assert(cond,msg);count++}function eq(a,b,msg){assert.equal(a,b,msg);count++}
function click(action,id='',day=''){const el={dataset:{action,id,day},closest:s=>s==='[data-action]'?el:null};listeners.click({target:el,preventDefault(){}})}
function submit(form,fields,id=''){listeners.submit({target:{id:form,mock:fields,dataset:{id,foodid:''}},preventDefault(){}})}
const getState=()=>JSON.parse(saved.get(C.KEY));
ok(dom.app.innerHTML.includes('คลังท่าของฉัน'),'visible library action');
click('start-real');
click('select-workday','',0);
const initial=getState();eq(initial.customExercises.length,0,'initial custom library empty');
ok(C.validateImported(initial),'new default valid');
const without={...initial};delete without.customExercises;ok(C.validateImported(without),'v1.4.0 backup stays valid');
const push={id:'legacy-push',name:'วิดพื้น (Push-ups)',sets:3,reps:'12-15',load:40,rest:90};
eq(C.exerciseMode(push).loadType,'bodyweight','legacy push-up infers bodyweight even if erroneous kg');
const plank={id:'legacy-plank',name:'Plank',sets:3,reps:'60 วินาที',load:40,rest:90};
eq(C.exerciseMode(plank).measure,'time','legacy plank timed');eq(C.exerciseMode(plank).loadType,'bodyweight','legacy plank bodyweight');eq(C.exerciseSeconds(plank),60,'old plank seconds');
eq(C.exerciseSeconds({reps:'3 นาที'}),180,'minutes converted');
const run=D.EXERCISES.find(x=>x.id==='ex-run');eq(C.exerciseMode(run).measure,'time','running timed');eq(C.exerciseMode(run).loadType,'none','running unweighted');
click('open-exercise');ok(dom['modal-root'].innerHTML.includes('เลือกจากคลังท่า'),'exercise editor shows library');
ok(dom['modal-root'].innerHTML.includes('exercise-measure'),'exercise editor has reps vs time');
ok(dom['modal-root'].innerHTML.includes('exercise-load-type'),'exercise editor has load type');
submit('exercise-form',{name:'Push-ups (วิดพื้น)',sets:'3',reps:'12-15',load:'40',rest:'90',measure:'reps',loadType:'bodyweight',rememberExercise:'on'});
let state=getState();let exercise=state.plan[0].exercises.find(x=>x.name==='Push-ups (วิดพื้น)');
ok(!!exercise,'push-up added to plan');eq(exercise.load,0,'bodyweight ignores entered kg');eq(state.customExercises.length,1,'saved to personal library');eq(state.customExercises[0].loadType,'bodyweight','saved mode correct');
// Choose other day and reuse the stored exercise, retaining its independent plan ID.
click('select-workday','',1);click('open-exercise');ok(dom['modal-root'].innerHTML.includes('ท่าที่ฉันบันทึกไว้'),'personal group listed next day');
submit('exercise-form',{name:'Push-ups (วิดพื้น)',sets:'3',reps:'12-15',load:'0',rest:'60',measure:'reps',loadType:'bodyweight'});
state=getState();ok(state.plan[1].exercises.some(x=>x.name==='Push-ups (วิดพื้น)'),'reuse other day');eq(state.customExercises.length,1,'reuse not duplicated in library');
// Save plank with seconds and keep it reusable.
submit('exercise-form',{name:'Plank',sets:'3',targetSeconds:'45',load:'0',rest:'45',measure:'time',loadType:'bodyweight',rememberExercise:'on'});
state=getState();exercise=state.plan[1].exercises.find(x=>x.name==='Plank');eq(exercise.targetSeconds,45,'plank 45 seconds saved');eq(exercise.reps,'45 วินาที','legacy reps field compatibility');ok(C.validateImported(state),'new format passes full validator');
click('open-exercise-library');ok(dom['modal-root'].innerHTML.includes('Plank'),'library manager lists plank');
// Positive/negative validation for duration and set logs.
const real={id:'train',date:C.today(),title:'Push',duration:60,exercises:[
 {...state.plan[1].exercises.find(x=>x.name==='Push-ups (วิดพื้น)'),setLog:[{reps:15,load:80,warmup:false}]},
 {...exercise,setLog:[{seconds:45,load:100,warmup:false},{seconds:30,load:0,warmup:true}]},
 {...D.EXERCISES.find(x=>x.id==='ex-bench'),setLog:[{reps:10,load:40,warmup:false}]}]};
state.sessions=[real];ok(C.validateImported(state),'bodyweight/timed and weighted logs accepted');
const stats=C.trainingStats(state.sessions);eq(stats.sets,3,'warmup excluded');eq(stats.volume,400,'volume only from external weighted reps');eq(stats.bodyweightReps,15,'push-up counts reps');eq(stats.timedSeconds,45,'plank counts seconds');
eq(stats.byExercise['plank'].maxEst1RM,0,'plank does not calculate 1RM');eq(stats.byExercise['push-ups (วิดพื้น)'].maxLoad,0,'push-up ignores old kg');
const invalid={...state,sessions:[{...real,exercises:[{...exercise,setLog:[{seconds:-10,load:0,warmup:false}]}]}]};ok(!C.validateImported(invalid),'negative seconds rejected');
const bogusLibrary={...state,customExercises:[{...exercise,measure:'bogus'}]};ok(!C.validateImported(bogusLibrary),'invalid type rejected');
// Deleted library entry must not remove copies in templates.
click('library-delete',state.customExercises.find(x=>x.name==='Plank').id);state=getState();ok(!state.customExercises.some(x=>x.name==='Plank'),'library deletion succeeded');ok(state.plan[1].exercises.some(x=>x.name==='Plank'),'plan preserved on library delete');
console.log('PASS: '+count+' V1.4.1 exercise library, modes, backward compatibility and analytics assertions');
