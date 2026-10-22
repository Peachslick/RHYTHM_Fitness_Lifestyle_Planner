/* RHYTHM v1.9.5: read-only suggestions from user history; never auto-save. */
(function(root){
 'use strict';
 const str=v=>String(v==null?'':v);
 const byDate=(a,b)=>str(b.date).localeCompare(str(a.date));
 function latest(arr,date,excludesToday=false){
   return (Array.isArray(arr)?arr:[]).filter(x=>x&&str(x.date)&&(excludesToday?x.date<date:x.date<=date)).sort(byDate)[0]||null;
 }
 function todaySummary(state,date,plan){
   const meals=(state.meals||[]).filter(x=>x.date===date);
   const session=(state.sessions||[]).find(x=>x.date===date)||null;
   const sleep=(state.sleeps||[]).find(x=>x.date===date)||null;
   const checkin=(state.checkins||[]).find(x=>x.date===date)||null;
   const weight=(state.weights||[]).find(x=>x.date===date)||null;
   const isRest=plan?.type==='rest';
   return {meals,session,sleep,checkin,weight,isRest,mealTypes:[...new Set(meals.map(x=>x.meal))],
     indicators:[{key:'sleep',title:'การนอน',done:!!sleep,optional:false},
       {key:'nutrition',title:'อาหารวันนี้',done:meals.length>0,optional:true},
       {key:'workout',title:isRest?'วันพัก':'การฝึกวันนี้',done:isRest||!!session,optional:isRest},
       {key:'recovery',title:'Recovery',done:!!checkin,optional:true},
       {key:'weight',title:'น้ำหนัก',done:!!weight,optional:true}]};
 }
 function lastSameMeal(state,date,meal){
   const earlier=(state.meals||[]).filter(x=>x.date<date&&x.meal===meal).sort(byDate);
   const last=earlier[0]?.date;
   return last?earlier.filter(x=>x.date===last):[];
 }
 function topRepeated(state,date,limit=5){
   const counts=new Map();
   const rows=(state.meals||[]).filter(x=>x.date<date).sort(byDate);
   for(const row of rows){
     if(!row?.id||!row?.name)continue;
     const key=str(row.name).trim().toLocaleLowerCase()+'\0'+str(row.unit);
     if(!counts.has(key))counts.set(key,{row,count:0});
     counts.get(key).count++;
   }
   return [...counts.values()].sort((a,b)=>b.count-a.count||str(b.row.date).localeCompare(str(a.row.date))).slice(0,limit);
 }
 function previousExercise(state,date,exercise){
   const name=str(exercise?.name).trim().toLocaleLowerCase();
   if(!name)return null;
   const sessions=(state.sessions||[]).filter(x=>x.date<date).sort(byDate);
   for(const session of sessions){
     const entry=(session.exercises||[]).find(x=>str(x.name).trim().toLocaleLowerCase()===name);
     if(!entry)continue;
     const sets=(entry.setLog||[]).filter(s=>s&&!s.warmup);
     if(!sets.length)continue;
     return {date:session.date,set:sets.at(-1),sets:sets.length};
   }
   return null;
 }
 function safeCopyRows(rows,date,uid){
   return rows.map(row=>({...row,id:uid(),date,copiedFrom:row.id,fromQuickCopy:true}));
 }
 root.FitDaily={latest,todaySummary,lastSameMeal,topRepeated,previousExercise,safeCopyRows};
})(typeof window!=='undefined'?window:globalThis);
