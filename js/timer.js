/* RHYTHM v1.5.0 — wall clock timer. Device-local (not cloud-synced). */
(function(root){
 'use strict';
 const STORAGE_KEY='rhythm.v150.timer';
 const blank=()=>({mode:'countdown',status:'idle',duration:90,remaining:90,elapsed:0,startedAt:null,doneAt:null});
 const allowed=s=>s&&['countdown','stopwatch'].includes(s.mode)&&['idle','running','paused','done'].includes(s.status)&&Number.isFinite(s.duration)&&s.duration>=1&&s.duration<=36000&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=36000&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&s.elapsed<=604800&&(s.startedAt===null||(Number.isFinite(s.startedAt)&&s.startedAt>0));
 function create({storage,clock=()=>Date.now(),onTick=()=>{},onDone=()=>{}}={}){
   if(storage===undefined)try{storage=root.sessionStorage;}catch(_){storage=null;}
   let timer=blank();
   try{const previous=JSON.parse(storage.getItem(STORAGE_KEY)||'null');if(allowed(previous))timer=previous;}catch(_){/* private browsing */}
   function persist(){try{storage?.setItem(STORAGE_KEY,JSON.stringify(timer));}catch(_){/* storage disabled */}}
   function update(){
     if(timer.status==='running'&&timer.startedAt!==null){
       const passed=Math.max(0,Math.floor((clock()-timer.startedAt)/1000));
       if(timer.mode==='countdown'&&passed>=timer.remaining){timer.remaining=0;timer.elapsed=Math.min(604800,timer.elapsed+Math.max(0,Math.min(timer.duration,passed)));timer.startedAt=null;timer.status='done';timer.doneAt=clock();persist();onDone(snapshot());}
     }
     onTick(snapshot());return snapshot();
   }
   function snapshot(){
     const passed=timer.status==='running'&&timer.startedAt!==null?Math.max(0,Math.floor((clock()-timer.startedAt)/1000)):0;
     return {...timer,remaining:timer.mode==='countdown'?Math.max(0,timer.remaining-passed):timer.remaining,elapsed:Math.min(604800,timer.elapsed+passed),displaySeconds:timer.mode==='countdown'?Math.max(0,timer.remaining-passed):Math.min(604800,timer.elapsed+passed)};
   }
   function start(mode,seconds=90){if(!['countdown','stopwatch'].includes(mode))return false;seconds=Number(seconds);if(mode==='countdown'&&(!Number.isSafeInteger(seconds)||seconds<1||seconds>36000))return false;timer={...blank(),mode,duration:mode==='countdown'?seconds:90,remaining:mode==='countdown'?seconds:0,status:'running',startedAt:clock()};persist();update();return true;}
   function pause(){if(timer.status!=='running')return false;const snap=snapshot();timer.remaining=snap.remaining;timer.elapsed=snap.elapsed;timer.startedAt=null;timer.status='paused';persist();update();return true;}
   function resume(){if(timer.status!=='paused')return false;timer.status='running';timer.startedAt=clock();persist();update();return true;}
   function reset(){timer=blank();persist();update();}
   update();const id=typeof root.setInterval==='function'?root.setInterval(update,250):null;
   return {start,pause,resume,reset,snapshot,update,dispose:()=>{if(id!==null)root.clearInterval(id);}};
 }
 root.FitTimer=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
