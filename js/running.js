/* RHYTHM v1.5.0 — manual running journal and pace calculations.
 * Not GPS or a medical/device measurement. No network calls. */
(function(root){
 'use strict';
 const TYPES={easy:'Easy / Zone 2',tempo:'Tempo',interval:'Intervals',long:'Long Run',race:'Race / Event',other:'Other'};
 function parts(total){const v=Math.max(0,Math.floor(Number(total)||0));return {hours:Math.floor(v/3600),minutes:Math.floor(v%3600/60),seconds:v%60};}
 function duration(total){const {hours,minutes,seconds}=parts(total);return hours?`${hours} ชม. ${minutes} นาที ${seconds} วินาที`:minutes?`${minutes} นาที ${seconds} วินาที`:`${seconds} วินาที`;}
 function parseDuration(mins,secs){const m=String(mins??'').trim(),s=String(secs??'').trim();if(!m&&!s)return null;if(!/^\d+$/.test(m||'0')||!/^\d+$/.test(s||'0'))return null;const mm=Number(m||0),ss=Number(s||0),value=mm*60+ss;return Number.isSafeInteger(value)&&ss<60&&value>0&&value<=172800?value:null;}
 function paceSeconds(distanceKm,seconds){const d=Number(distanceKm),t=Number(seconds);return Number.isFinite(d)&&d>0&&Number.isFinite(t)&&t>0?t/d:null;}
 function pace(distanceKm,seconds){const p=paceSeconds(distanceKm,seconds);if(p===null)return '—';const rounded=Math.round(p);return `${Math.floor(rounded/60)}:${String(rounded%60).padStart(2,'0')} นาที/กม.`;}
 function safeDate(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const d=new Date(date+'T12:00:00');return !Number.isNaN(d.getTime())&&`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`===date;}
 function validRun(r){return !!r&&!Array.isArray(r)&&typeof r==='object'&&typeof r.id==='string'&&r.id.length>0&&r.id.length<=100&&safeDate(r.date)&&TYPES[r.type]!==undefined&&Number.isFinite(Number(r.distanceKm))&&Number(r.distanceKm)>=0.01&&Number(r.distanceKm)<=500&&Number.isInteger(Number(r.durationSeconds))&&Number(r.durationSeconds)>=1&&Number(r.durationSeconds)<=172800&&(r.rpe===null||r.rpe===undefined||r.rpe===''||(Number.isInteger(Number(r.rpe))&&Number(r.rpe)>=1&&Number(r.rpe)<=10))&&typeof (r.notes||'')==='string'&&(r.notes||'').length<=700;}
 function records(state){return (Array.isArray(state?.runs)?state.runs:[]).filter(validRun).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));}
 function shift(date,days){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
 function weekStart(date){const d=new Date(date+'T12:00:00');return shift(date,-(d.getDay()+6)%7);}
 function stats(state,asOf){const latest=records(state).filter(r=>r.date<=asOf),from7=shift(asOf,-6),recent=latest.filter(r=>r.date>=from7);const week=weekStart(asOf),weekly=latest.filter(r=>r.date>=week);const total=recent.reduce((n,r)=>n+Number(r.distanceKm),0);const durationSeconds=recent.reduce((n,r)=>n+Number(r.durationSeconds),0);return {count:recent.length,distanceKm:total,durationSeconds,pace:pace(total,durationSeconds),weeklyKm:weekly.reduce((n,r)=>n+Number(r.distanceKm),0),weeklyCount:weekly.length,allCount:latest.length};}
 function weeklySeries(state,asOf,count=8){const list=records(state).filter(r=>r.date<=asOf),current=weekStart(asOf);return Array.from({length:count},(_,i)=>{const start=shift(current,(i-count+1)*7),end=shift(start,6);return {date:start,value:+list.filter(r=>r.date>=start&&r.date<=end).reduce((n,r)=>n+Number(r.distanceKm),0).toFixed(2)};});}
 root.FitRun=Object.freeze({TYPES,parts,duration,parseDuration,paceSeconds,pace,validRun,records,stats,weeklySeries,weekStart});
})(typeof window!=='undefined'?window:globalThis);
