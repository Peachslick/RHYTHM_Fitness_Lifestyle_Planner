const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[
 ['per-exercise toggle only within nearest block',app.includes('data-session-select-all')&&app.includes("block?.querySelectorAll('[data-set=\"completed\"]')")],
 ['per-set change refreshes overall state',app.includes(`if(el.matches?.('[data-set="completed"]'))`)],
 ['mixed checkbox for partial rows',app.includes('all.indeterminate=done>0&&done<rows.length')],
 ['counts verified rows without persisting them',app.includes('data-session-set-count')&&app.includes('refreshSessionSetControls(block)')],
 ['add/remove keep totals in sync',app.includes("if(a==='session-add-set')")&&app.includes("if(a==='session-remove-set')")],
 ['collapse hides form without rebuilding it',app.includes("if(a==='session-toggle-details')")&&app.includes('content.hidden=!content.hidden')],
 ['completed set validation stays in submit handler',app.includes(`if(!line.querySelector('[data-set="completed"]')?.checked)continue`)],
 ['no changes to cloud schema needed',!app.includes('CREATE TABLE')],
 ['responsive header styles',css.includes('.session-ex-quick-actions')&&css.includes('@media(max-width:670px)')],
 ['cache update for UI',html.includes('styles.css?v=1.9.6.1')&&html.includes('app.js?v=1.9.6.1')]
];
for(const [label,result] of checks)assert.ok(result,label);
console.log('PASS:',checks.length,'V1.9.6.1 set-quick-actions regression contracts');
