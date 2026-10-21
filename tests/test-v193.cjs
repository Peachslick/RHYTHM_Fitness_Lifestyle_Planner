const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'..');
const context=vm.createContext({window:{},localStorage:{getItem:()=>null,setItem:()=>{}},document:{},console});let checks=0;
for(const name of ['js/data.js','js/foods-expanded.js','js/foods-hdmall.js','js/ux-features.js'])vm.runInContext(fs.readFileSync(path.join(base,name),'utf8'),context);
context.FitData=context.window.FitData;vm.runInContext(fs.readFileSync(path.join(base,'js/core.js'),'utf8'),context);
const D=context.window.FitData,U=context.window.FitUX,C=context.window.FitCore;
assert.equal(U.estimatedCount,183);checks++;
const estimated=D.FOOD_LIBRARY.filter(f=>f.macroEstimated);assert.equal(estimated.length,183);checks++;
for(const f of estimated){
  assert.equal(f.macroKnown,true);checks++;
  assert(f.protein>=0&&f.fat>=0&&f.carbs>=0);checks++;
  assert(Math.abs(f.protein*4+f.carbs*4+f.fat*9-f.kcal)<1.1);checks++;
}
const state=D.blankState();assert.equal(C.validateImported(state),true);checks++;
const rows=[{name:'ไข่ต้ม',unit:'1 ฟอง',servings:2,kcal:78,protein:6,carbs:1,fat:5,macroKnown:true}];
const t=U.makeTemplate('มื้อเช้าประจำ','breakfast',rows,'meal-a');assert(U.validMealTemplate(t));checks++;
const saved=U.applyTemplate(t,'2026-10-21',()=> 'new-meal-1');assert.equal(saved[0].servings,2);checks++;assert.equal(saved[0].date,'2026-10-21');checks++;
assert.equal(U.validMealTemplate({...t,items:[]}),false);checks++;
state.mealTemplates=[t];assert.equal(C.validateImported(state),true);checks++;
state.mealTemplates=[{...t,items:[]}];assert.equal(C.validateImported(state),false);checks++;
state.mealTemplates=[t];state.meals=[...saved];assert.equal(C.validateImported(state),true);checks++;
const logged=C.foodTotals([{...saved[0],macroEstimated:true}]);assert.equal(logged.estimatedItems,1);checks++;assert.equal(logged.kcal,156);checks++;
assert.deepEqual(U.parseRows('{"date":"2026-10-21"}').date,'2026-10-21');checks++;
console.log('V1.9.3 tests passed:',checks);
