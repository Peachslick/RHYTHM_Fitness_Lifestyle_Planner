const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),local=new Map(),listeners={};let checks=0;
const dom={app:{innerHTML:''},'modal-root':{innerHTML:'',children:[]},'toast-root':{innerHTML:''}};
const document={documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},getElementById:id=>dom[id],querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(event,fn)=>listeners[event]=fn};
const location={hash:'#nutrition'};
const ctx={console,Date,Math,Intl,Number,JSON,Array,Object,String,Set,Map,Blob,parseInt,parseFloat,document,location,history:{replaceState:(a,b,hash)=>location.hash=hash},localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},setTimeout:()=>1,clearTimeout:()=>{},confirm:()=>true};
ctx.window=ctx;ctx.addEventListener=()=>{};ctx.scrollY=0;ctx.scrollTo=()=>{};
ctx.FormData=class{constructor(form){this.values=form.mock||{}}get(k){return this.values[k]??null}getAll(k){return this.values[k]??[]}has(k){return Object.hasOwn(this.values,k)}};
vm.createContext(ctx);
for(const file of ['js/data.js','js/foods-expanded.js','js/core.js','js/sync.js','js/running.js','js/timer.js','js/app.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
const D=ctx.FitData,C=ctx.FitCore,date=C.today();
function ok(expr,message){assert(expr,message);checks++}function eq(a,b,message){assert.equal(a,b,message);checks++}
function click(action,id='',value=''){const el={dataset:{action,id,value},closest:selector=>selector==='[data-route]'?null:el};listeners.click({target:el,preventDefault(){}})}
function submit(id,values,data={}){listeners.submit({target:{id,mock:values,dataset:{id:data.id||'',foodid:data.foodid||''}},preventDefault(){}})}
function saved(){return JSON.parse(local.get(C.KEY))}
ok(dom.app.innerHTML.includes('Smart Nutrition'),'new page heading is visible');
ok(D.FOOD_LIBRARY.length>=150,'expanded catalog 150+ foods');
eq(new Set(D.FOOD_LIBRARY.map(f=>f.id)).size,D.FOOD_LIBRARY.length,'IDs unique');
ok(D.FOOD_LIBRARY.some(x=>x.group==='กับข้าวไทย'),'Thai dishes category present');
ok(D.FOOD_LIBRARY.some(x=>x.group==='อาหารจานเดียว'),'single dishes category present');
ok(D.FOOD_LIBRARY.some(x=>x.name==='ข้าวมันไก่'),'popular dish present');
ok(D.FOOD_LIBRARY.every(x=>x.kcal>=0&&x.protein>=0&&x.carbs>=0&&x.fat>=0),'non-negative catalogue estimates');
ok(D.FOOD_LIBRARY.every(x=>x.name&&x.unit&&x.group),'catalog metadata complete');
ok(D.FOOD_LIBRARY.some(x=>x.id==='f-rice'),'legacy food IDs preserved');
ok(D.FOOD_LIBRARY.find(x=>x.id==='f-rice').baseGrams===80,'legacy rice gram reference inferred');
eq(D.FOOD_LIBRARY.find(x=>x.name==='ข้าวหอมมะลิสุก').baseGrams,100,'new gram reference');
ok(dom.app.innerHTML.includes('154 รายการ'),'full library count displayed');
ok(dom.app.innerHTML.includes('แสดงเพิ่มอีก'),'pagination not truncating 154 items');
click('food-more');ok(dom.app.innerHTML.includes('120/154'),'see more works');
click('food-favorite','f-rice');ok(saved().favoriteFoodIds.includes('f-rice'),'favorite persisted');
click('food-favorite','f-rice');eq(saved().favoriteFoodIds.length,0,'favorite toggled off');
const profile=D.blankState();ok(C.validateImported(profile),'old blank compatible');
const legacy={...profile,meals:[{id:'m-old',date,meal:'breakfast',name:'ไข่ต้ม',unit:'1 ฟอง',servings:2,kcal:78,protein:6,carbs:0.5,fat:5}]};
ok(C.validateImported(legacy),'old food entries compatible');
const withFavorites={...profile,favoriteFoodIds:['f-rice']};ok(C.validateImported(withFavorites),'favorite fields valid');
ok(!C.validateImported({...withFavorites,favoriteFoodIds:['x'.repeat(101)]}),'malicious long fav rejected');
ok(!C.validateImported({...withFavorites,favoriteFoodIds:'f-rice'}),'invalid fav type rejected');
const savedMeal={id:'new-m',date,name:'ข้าว',unit:'100 กรัม',meal:'lunch',servings:1.5,quantityMode:'grams',quantityGrams:150,baseGrams:100,kcal:130,protein:2.7,carbs:28.2,fat:0.3};
ok(C.validateImported({...profile,meals:[savedMeal]}),'gram record valid');
eq(C.foodTotals([savedMeal]).kcal,195,'grams conversion totals');
ok(!C.validateImported({...profile,meals:[{...savedMeal,baseGrams:0}]}),'invalid baseGrams rejected');
const weightState=D.blankState();
// Sparse daily measurements in two independent weekly windows, with a same-day replacement.
for(const [offset,weight] of [[-12,65],[-9,65.2],[-5,65.4],[-2,65.5],[-2,65.6]])weightState.weights.push({id:String(offset)+String(weight),date:C.shift(date,offset),weight});
const trend=C.weightTrend(weightState,date);ok(trend.ready,'two-week trend available');
eq(trend.previousDays,2,'previous window measured days');eq(trend.currentDays,2,'current window measured days, duplicates removed');
eq(Math.round(trend.delta*100)/100,0.4,'trailing means protect against noise');
weightState.weights=weightState.weights.filter(w=>w.date!==C.shift(date,-12));ok(!C.weightTrend(weightState,date).ready,'insufficient historic readings gives no trend');
const nState=D.blankState();
const log=d=>nState.meals.push({id:d,date:d,name:'อาหารทดลอง',unit:'1 จาน',meal:'lunch',servings:1,kcal:700,protein:20,carbs:55,fat:15});
log(date);log(C.shift(date,-3));let sum=C.nutritionSummary(nState,date,14);
eq(sum.loggedDays,2,'not all missing days counted');eq(sum.average,700,'only logged days count');eq(sum.sevenDayLogged,2,'7 day log count');
log(C.shift(date,-16));eq(C.nutritionSummary(nState,date,14).loggedDays,2,'old records ignored');
// Real app form submit in the DOM-free regression harness.
click('start-real');
const food=D.FOOD_LIBRARY.find(x=>x.name==='ข้าวหอมมะลิสุก');
submit('meal-form',{date,name:food.name,unit:food.unit,meal:'lunch',quantityMode:'grams',quantity:'150',baseGrams:'100',kcal:'130',protein:'2.7',carbs:'28.2',fat:'0.3'},{foodid:food.id});
let out=saved();eq(out.meals.length,1,'gram meal saved');eq(out.meals[0].servings,1.5,'stored canonical servings');eq(out.meals[0].quantityGrams,150,'gram snapshot');eq(C.foodTotals(out.meals).kcal,195,'actual kcal computed');
submit('meal-form',{date,name:'invalid',unit:'100 กรัม',meal:'lunch',quantityMode:'grams',quantity:'150',baseGrams:'',kcal:'130',protein:'2',carbs:'20',fat:'2'});
eq(saved().meals.length,1,'reject grams with unknown portion mass');
submit('meal-form',{date,name:'invalid',unit:'100 กรัม',meal:'lunch',quantityMode:'grams',quantity:'3500',baseGrams:'100',kcal:'130',protein:'2',carbs:'20',fat:'2'});
eq(saved().meals.length,1,'reject unsafe quantity');
submit('meal-form',{date,name:'ขนม test',unit:'1 ชิ้น',meal:'snack',quantityMode:'servings',quantity:'2',baseGrams:'',kcal:'200',protein:'2',carbs:'20',fat:'8',remember:'on'});
out=saved();eq(out.meals.length,2,'serving meal saved');eq(out.customFoods.length,1,'custom foods saved');eq(C.foodTotals(out.meals).kcal,595,'sum gram and servings');
// Yesterday duplication is idempotent.
const yesterday=C.shift(date,-1);
submit('meal-form',{date:yesterday,name:'นมถั่วเหลือง',unit:'250 มล.',meal:'breakfast',quantityMode:'servings',quantity:'1',baseGrams:'',kcal:'100',protein:'7',carbs:'5',fat:'5'});
listeners.change({target:{dataset:{picker:'foodDate'},value:date}});
click('copy-yesterday');out=saved();ok(out.meals.some(x=>x.date===date&&x.copiedFrom),'yesterday copy marks original id');
const before=out.meals.length;click('copy-yesterday');eq(saved().meals.length,before,'second copy is idempotent');
console.log(`PASS: ${checks} V1.3.0 catalog / gram conversion / favorites / trends / local cloud-schema checks`);
