const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const listeners={};const map=new Map();let checks=0;
const dom={app:{innerHTML:''},'modal-root':{innerHTML:'',children:[]},'toast-root':{innerHTML:''}};
const document={documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},getElementById:k=>dom[k]||null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(e,f)=>listeners[e]=f};
const location={hash:'#nutrition'};
const ctx={console,Math,Date,Number,JSON,String,Array,Intl,Map,Set,Blob,parseInt,parseFloat,document,location,history:{replaceState:(a,b,hash)=>location.hash=hash},localStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},setTimeout:()=>1,clearTimeout(){},confirm:()=>true};
ctx.window=ctx;ctx.addEventListener=()=>{};ctx.scrollTo=()=>{};ctx.scrollY=0;
ctx.FormData=class{constructor(f){this.values=f.mock||{}}get(k){return this.values[k]??null}getAll(k){return this.values[k]??[]}has(k){return Object.hasOwn(this.values,k)}};
vm.createContext(ctx);
for(const filename of ['js/data.js','js/foods-expanded.js','js/foods-hdmall.js','js/core.js','js/sync.js','js/recovery.js','js/running.js','js/timer.js','js/insights.js','js/goals.js','js/workout-analytics.js','js/metabolism.js','js/app.js'])vm.runInContext(fs.readFileSync(path.join(base,filename),'utf8'),ctx,{filename});
function equal(a,b,s){assert.equal(a,b,s);checks++}function ok(a,s){assert(a,s);checks++}
function click(action,id=''){const el={dataset:{action,id},closest:q=>q==='[data-route]'?null:el};listeners.click({target:el,preventDefault(){}})}
function submit(id,mock,dataset={}){listeners.submit({target:{id,mock,dataset},preventDefault(){}})}
const D=ctx.FitData,C=ctx.FitCore,M=ctx.FitMetabolism,date=C.today();
const HD=D.FOOD_LIBRARY.filter(x=>x.source==='HDmall');
equal(HD.length,183,'exact curated HDmall items');
equal(D.FOOD_LIBRARY.length,337,'154 previous +183 new');
equal(new Set(D.FOOD_LIBRARY.map(x=>x.id)).size,D.FOOD_LIBRARY.length,'unique ids');
equal(new Set(D.FOOD_LIBRARY.map(x=>x.name.replace(/\s|\(|\)|-|ประมาณ/g,''))).size,D.FOOD_LIBRARY.length,'unique names');
ok(HD.every(x=>x.macroKnown===false&&x.protein===0&&x.carbs===0&&x.fat===0),'no invented Macro');
ok(HD.every(x=>!x.baseGrams&&!/กรัม/.test(x.unit)),'no invented gram mass');
ok(HD.every(x=>x.sourceUrl==='https://hdmall.co.th/health-tools/food-calorie-table.html'),'source URL retained');
ok(D.FOOD_LIBRARY.some(x=>x.id==='f-rice'),'unchanged original foods');
ok(D.FOOD_LIBRARY.find(x=>x.id==='f-rice').kcal===104,'unchanged original reference values');
for(const [name,unit,kcal] of [['ข้าวขาหมู','1 จาน',690],['ข้าวผัดกะเพราไก่ไข่ดาว','1 จาน',630],['ผัดไทยกุ้งสดใส่ไข่','1 จาน',545],['กล้วยบวชชี','1 ถ้วยเล็ก',152],['ต้มยำกุ้ง','1 ถ้วย',65],['ชาเย็น','1 แก้ว',100]]){
 const f=HD.find(x=>x.name===name);ok(f,'contains '+name);equal(f.unit,unit,'correct serving '+name);equal(f.kcal,kcal,'HDmall kcal '+name);
}
ok(dom.app.innerHTML.includes('337 รายการ'),'UI count dynamically reflects new catalog');
ok(dom.app.innerHTML.includes('HDmall'),'source appears in catalog view');
const f=HD.find(x=>x.name==='ข้าวขาหมู');
const total=C.foodTotals([{name:f.name,unit:f.unit,servings:2,kcal:f.kcal,protein:0,carbs:0,fat:0,macroKnown:false}]);
equal(total.kcal,1380,'quantity multiplies source calorie');equal(total.macroIncomplete,true,'flags incomplete day');equal(total.incompleteItems,1,'counts incomplete items');
let s=D.blankState();const before=JSON.stringify(s);
equal(M.analyse(s,{asOf:date,days:14}).totals.protein,null,'no meals: macro unknown');
equal(JSON.stringify(s),before,'analytics is read-only');
s.meals=[{id:'h1',date,meal:'lunch',name:f.name,unit:f.unit,servings:1,kcal:f.kcal,protein:0,carbs:0,fat:0,macroKnown:false}];
let result=M.analyse(s,{asOf:date,days:14});equal(result.totals.kcal,690,'HDmall kcal in analysis');equal(result.totals.protein,null,'unknown protein is null');equal(result.macroDays,0,'no complete macro day');
ok(C.validateImported(s),'cloud backup schema accepts unknown Macro');
click('start-real');click('food-add',f.id);
ok(dom['modal-root'].innerHTML.includes('ยังไม่ทราบ · บันทึกเฉพาะแคลอรี่'),'form defaults to kcal only');
ok(dom['modal-root'].innerHTML.includes('href="https://hdmall.co.th/health-tools/food-calorie-table.html"'),'form links source');
submit('meal-form',{date,meal:'lunch',name:f.name,unit:f.unit,quantityMode:'servings',quantity:'1.5',baseGrams:'',kcal:'690',protein:'',carbs:'',fat:'',macroStatus:'unknown'},{foodid:f.id,foodsource:'HDmall'});
const saved=JSON.parse(map.get(C.KEY));equal(saved.meals.length,1,'kcal-only menu saved');equal(saved.meals[0].macroKnown,false,'unknown status persisted');equal(saved.meals[0].servings,1.5,'servings persisted');equal(C.foodTotals(saved.meals).kcal,1035,'logged kcal correct');equal(saved.meals[0].source,'HDmall','HDmall provenance persisted');
ok(C.validateImported(saved),'backup import validates with source and macro flags');
// No data is written into the user's custom food library by adding a catalog entry.
equal(saved.customFoods.length,0,'source menu does not overwrite or create personal food');
console.log(`PASS: ${checks} V1.9.1 source food/macro/no-duplicate/compatibility assertions`);
