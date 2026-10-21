(function(){
 'use strict';
 function update(existing,input,library){
   if(!existing || !Array.isArray(library) || !library.some(x=>x.id===existing.id))throw Error('ไม่พบเมนูของคุณ');
   const name=String(input.name||'').trim(),unit=String(input.unit||'').trim();
   if(!name||name.length>100||!unit||unit.length>70)throw Error('กรุณาระบุชื่ออาหารและหน่วยต่อเสิร์ฟให้ถูกต้อง');
   if(library.some(x=>x.id!==existing.id && String(x.name).trim().toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('ชื่อเมนูนี้มีอยู่ในคลังส่วนตัวแล้ว กรุณาใช้ชื่ออื่น');
   const numeric=(key,max,required=true)=>{
     const raw=String(input[key]??'').trim();
     if(raw===''){if(required)throw Error('กรุณาระบุตัวเลข '+key+' ให้ครบ');return null;}
     const value=Number(raw);
     if(!Number.isFinite(value)||value<0||value>max)throw Error('ตัวเลข '+key+' ไม่ถูกต้อง');
     return value;
   };
   const kcal=numeric('kcal',10000),baseGrams=numeric('baseGrams',10000,false);
   if(baseGrams!==null&&baseGrams<=0)throw Error('น้ำหนักต่อหนึ่งเสิร์ฟต้องมากกว่า 0');
   const macroKnown=input.macroStatus==='known';
   if(!macroKnown&&input.macroStatus!=='unknown')throw Error('กรุณาเลือกสถานะสารอาหาร');
   const macros=macroKnown?{protein:numeric('protein',1000),carbs:numeric('carbs',1000),fat:numeric('fat',1000)}:{protein:0,carbs:0,fat:0};
   // Edit the library definition, never in-place edit historical meal snapshots or templates.
   return {...existing,name,unit,baseGrams,kcal,...macros,macroKnown,macroEstimated:false,group:'เมนูของฉัน'};
 }
 window.FitCustomFoodEditor={update};
})();
