// Lightweight DOM-free event/render smoke suite; a browser is still needed for visual QA.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const local=new Map();
const dom={app:{innerHTML:''},'modal-root':{innerHTML:'',children:[]},'toast-root':{innerHTML:''}};
const listeners={};
const document={documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},getElementById:id=>dom[id],querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners[type]=fn};
const location={hash:'#dashboard'};
const history={replaceState:(a,b,hash)=>location.hash=hash};
const ctx={console,Date,Math,Intl,Number,JSON,Array,Object,String,Set,Map,Blob,parseInt,parseFloat,document,location,history,localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},setTimeout:()=>1,clearTimeout:()=>{},confirm:()=>true};
ctx.window=ctx;ctx.scrollY=0;ctx.scrollTo=()=>{};ctx.addEventListener=(type,fn)=>listeners[`window:${type}`]=fn;
ctx.FormData=class {constructor(form){this.values=form.mock||{}}get(k){return this.values[k]??null}getAll(k){return this.values[k]??[]}has(k){return Object.prototype.hasOwnProperty.call(this.values,k)}};
vm.createContext(ctx);
for(const file of ['js/data.js','js/core.js','js/sync.js','js/running.js','js/timer.js','js/app.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
assert(dom.app.innerHTML.includes('สร้างจังหวะที่ใช่'),'first viewport contains dashboard hero');
assert(dom.app.innerHTML.includes('โหมดทดลอง'),'demo is labeled');
function click({action=null,route=null,id='',date='',day='',value=''}){
 const data={action,route,id,date,day,value};
 const el={dataset:data,closest:s=>(s==='[data-route]'?route?el:null:action?el:null)};
 listeners.click({target:el,preventDefault(){}});
}
function submit(id,fields,dataId=''){
 listeners.submit({target:{id,mock:fields,dataset:{id:dataId,foodid:''}},preventDefault(){}});
}
for(const [route,title] of Object.entries({workouts:'แผนออกกำลังกาย',nutrition:'โภชนาการ',sleep:'การนอน',routine:'ตารางชีวิต',progress:'น้ำหนักและแนวโน้ม',profile:'โปรไฟล์และตั้งค่า'})){
 click({route});assert(dom.app.innerHTML.includes(`<h1>${title}</h1>`),`render ${route}`);
}
click({route:'workouts'});click({action:'edit-day'});assert(dom['modal-root'].innerHTML.includes('day-form'),'opens program editor');
click({action:'close-modal'});
click({action:'open-exercise'});assert(dom['modal-root'].innerHTML.includes('exercise-form'),'opens exercise builder');
click({action:'close-modal'});
click({route:'nutrition'});click({action:'open-meal'});assert(dom['modal-root'].innerHTML.includes('meal-form'),'opens nutrition form');
click({action:'close-modal'});
click({route:'sleep'});click({action:'open-sleep'});assert(dom['modal-root'].innerHTML.includes('sleep-form'),'opens sleep form');
click({action:'close-modal'});
click({route:'routine'});click({action:'open-routine'});assert(dom['modal-root'].innerHTML.includes('routine-form'),'opens timeline form');
click({action:'close-modal'});
// Simulate profile form submission and verify data-driven TDEE display.
click({action:'start-real'});
assert(!dom.app.innerHTML.includes('โหมดทดลอง'),'onboarding cleared demo');
click({route:'profile'});
submit('profile-form',{name:'Tester <test>',age:'30',height:'180',weight:'80',sex:'male',activity:'moderate',goal:'muscle',targetWeight:'85',calorieAdjust:'200',proteinPerKg:'1.6',fatPercent:'25',sleepGoal:'8'});
const saved=JSON.parse(local.get('rhythm_fitness_v1'));
assert.equal(saved.profile.name,'Tester <test>');
assert(dom.app.innerHTML.includes('Tester &lt;test&gt;'),'escaped profile name in sidebar');
assert(dom.app.innerHTML.includes('TDEE'),'profile estimate still rendered');
const date=ctx.FitCore.today();
click({action:'quick-add'});
submit('weight-form',{date,weight:'80.5',bodyFat:'20'});
assert.equal(JSON.parse(local.get('rhythm_fitness_v1')).weights.length,1,'weight saved');
click({route:'nutrition'});
submit('meal-form',{date,meal:'lunch',name:'ข้าวเทส',unit:'1 จาน',quantity:'2',quantityMode:'servings',kcal:'300',protein:'20',carbs:'30',fat:'10',remember:'on'});
const diet=JSON.parse(local.get('rhythm_fitness_v1'));
assert.equal(diet.meals[0].name,'ข้าวเทส');
assert.equal(ctx.FitCore.foodTotals(diet.meals).kcal,600);
assert.equal(diet.customFoods.length,1);
click({route:'sleep'});
submit('sleep-form',{date,bed:'23:00',wake:'07:00',awake:'20',deep:'90',light:'220',rem:'120',note:'โอเค'});
assert.equal(JSON.parse(local.get('rhythm_fitness_v1')).sleeps.length,1,'sleep saved');
// Reject an impossible sleep stage sum and preserve existing data.
submit('sleep-form',{date,bed:'23:00',wake:'07:00',awake:'20',deep:'300',light:'220',rem:'120',note:''});
assert.equal(JSON.parse(local.get('rhythm_fitness_v1')).sleeps.length,1,'bad sleep rejected');
click({route:'routine'});
submit('routine-form',{title:'อ่านหนังสือ',start:'19:00',end:'20:00',category:'personal',days:['0','2']});
assert.equal(JSON.parse(local.get('rhythm_fitness_v1')).routines.at(-1).title,'อ่านหนังสือ','routine saved');
click({route:'workouts'});
submit('exercise-form',{name:'Test Move',sets:'3',reps:'8-10',load:'12',rest:'60'});
let fresh=JSON.parse(local.get('rhythm_fitness_v1'));
assert(fresh.plan[ctx.FitCore.weekday(date)].exercises.some(x=>x.name==='Test Move'),'exercise added');
const session={date,duration:'65',rpe:'7',notes:'test session'};
fresh.plan[ctx.FitCore.weekday(date)].exercises.forEach((x,i)=>{session[`sets-${i}`]=String(x.sets);session[`reps-${i}`]=x.reps;session[`load-${i}`]=String(x.load);});
submit('session-form',session);
fresh=JSON.parse(local.get('rhythm_fitness_v1'));
assert.equal(fresh.sessions.length,1,'actual session saved');
assert.equal(fresh.sessions[0].exercises.at(-1).name,'Test Move','exercise snapshot saved');
console.log('PASS: 29 app render / route / modal / CRUD / validation checks');
