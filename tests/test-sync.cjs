/* Integration-style Cloud Sync tests against an in-memory Supabase REST/Auth mock.
 * No real Supabase credentials are used. Server-side RLS must be tested in a real project.
 */
'use strict';
const assert=require('node:assert/strict');
const {SyncManager}=require('../js/sync.js');
const {setTimeout:delay}=require('node:timers/promises');
const clone=o=>structuredClone(o);
const stores={};
let db=new Map();
let blocked=false,events={};
let checks=0;
const check=(condition,message)=>{assert(condition,message);checks++;};
function makeLocal(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};}
const origin='https://rhythm.vercel.app';
global.location={origin,pathname:'/'};
global.addEventListener=()=>{};
global.setInterval=()=>0;
global.document={addEventListener:()=>{},visibilityState:'visible',activeElement:null,querySelector:()=>null};
global.FitCore={KEY:'rhythm_fitness_v1',save:data=>{localStorage.setItem('rhythm_fitness_v1',JSON.stringify(data));return true;}};
global.RHYTHM_SUPABASE_CONFIG={url:'https://abc123.supabase.co',publishableKey:'sb_publishable_12345678901234567890'};
function blank(label='') {return {version:1,demo:false,profile:{name:label},plan:Array.from({length:7},(_,day)=>({day})),meals:[],sessions:[],weights:[],sleeps:[],routines:[],customFoods:[],settings:{theme:'light'}};}
function mockClient(identity){
  const user={id:identity,email:`${identity}@example.com`};
  const handlers=[];
  const from=(table)=>{
    check(table==='rhythm_user_data','table name correct');
    const request={operation:null,body:null,filters:[],
      select(fields){if(!this.operation)this.operation='select';return this;},
      insert(body){this.operation='insert';this.body=body;return this;},
      update(body){this.operation='update';this.body=body;return this;},
      eq(k,v){this.filters.push([k,v]);return this;},
      async maybeSingle(){return respond(this);},
      async single(){return respond(this);}
    };
    return request;
  };
  async function respond(req){
    if(blocked) return {data:null,error:{code:'NETWORK',message:'offline'}};
    const filters=Object.fromEntries(req.filters);
    const id=filters.user_id||req.body?.user_id||identity;
    // Fake RLS: a client cannot operate on another identity.
    if(id!==identity)return {data:null,error:{code:'42501',message:'RLS'} };
    const row=db.get(id);
    if(req.operation==='select')return {data:row?clone(row):null,error:null};
    if(req.operation==='insert'){
      if(row)return {data:null,error:{code:'23505',message:'duplicate'}};
      const created={user_id:id,revision:1,updated_at:new Date().toISOString(),data:clone(req.body.data)};
      db.set(id,created);return {data:clone(created),error:null};
    }
    if(req.operation==='update'){
      if(!row||Number(filters.revision)!==row.revision)return {data:null,error:null};
      const updated={user_id:id,revision:row.revision+1,updated_at:new Date().toISOString(),data:clone(req.body.data)};
      db.set(id,updated);return {data:clone(updated),error:null};
    }
    throw new Error('Unknown query');
  }
  return {from,auth:{
    onAuthStateChange(fn){handlers.push(fn);return {data:{subscription:{unsubscribe(){}}}}},
    async getUser(){return {data:{user:identity==='anonymous'?null:user},error:null}},
    async signInWithPassword(){handlers.forEach(fn=>fn('SIGNED_IN',{user}));return {data:{user},error:null}},
    async signUp(){return {data:{user,session:{user}},error:null}},
    async signOut(){handlers.forEach(fn=>fn('SIGNED_OUT',null));return {error:null}},
    async resetPasswordForEmail(){return {error:null}},
    async updateUser(){return {error:null}}
  }};
}
let activeClient=null;
global.supabase={createClient:()=>activeClient};
async function makeManager(id,local){
  global.localStorage=local;
  activeClient=mockClient(id);
  let activeData=null;
  const instance=new SyncManager({getLocal:()=>{const raw=local.getItem('rhythm_fitness_v1');return raw?JSON.parse(raw):{...blank(),demo:true};},blank:()=>blank(),validate:d=>!!(d?.version===1&&d.profile&&Array.isArray(d.meals)),onData:d=>{activeData=d;}});
  const init=instance.init();await init;
  return {instance,local,get data(){return activeData}};
}
(async()=>{
  // Setup: a first sign-in should NEVER silently upload existing guest data.
  db.clear();const local=makeLocal();local.setItem('rhythm_fitness_v1',JSON.stringify(blank('guest workout history')));
  const t=await makeManager('userA',local);
  check(t.instance.mode==='setup','first time waits for explicit migration decision');
  check(db.size===0,'guest data not auto-uploaded');
  await t.instance.chooseInitial(true);
  check(t.instance.mode==='cloud','after confirmed migration cloud mode');
  check(db.get('userA').data.profile.name==='guest workout history','migrated exact local data');
  check(!local.getItem('rhythm_fitness_v1'),'local original cleared after successful upload');
  check(t.instance.revision===1,'initial version 1');

  // Local edit -> durable pending draft before network request -> successful CAS.
  const changed=clone(t.data);changed.profile.name='updated';
  check(t.instance.persist(changed),'stores local pending changes');
  check(!!local.getItem(t.instance.draftKey()),'pending state is persisted to LocalStorage');
  global.localStorage=local;
  check(await t.instance.flush(),'flush succeeded');
  check(!local.getItem(t.instance.draftKey()),'pending cleared only after acknowledgement');
  check(db.get('userA').revision===2,'server increased revision');
  check(db.get('userA').data.profile.name==='updated','server contains new data');

  // Lost network: keep the local pending draft and refuse logout.
  const offline=clone(changed);offline.profile.name='offline session';
  check(t.instance.persist(offline),'pending saved while online');
  blocked=true;
  check(!await t.instance.flush(),'network error does not claim success');
  check(t.instance.hasUnsynced,'unsynced draft still exists');
  check(t.instance.status==='error','offline error is visible');
  await assert.rejects(()=>t.instance.signout(),/ยังมีข้อมูลไม่ซิงค์/);checks++;
  blocked=false;
  check(await t.instance.flush(),'offline data retransmitted');
  check(db.get('userA').data.profile.name==='offline session','offline edits not lost');

  // Conflict from another device: the stale write must not overwrite remote data.
  const remote=clone(db.get('userA'));
  const pending=clone(t.data);pending.profile.name='from first device';
  check(t.instance.persist(pending),'local write queued');
  db.set('userA',{...remote,revision:remote.revision+1,data:blank('second device')});
  check(!await t.instance.flush(),'CAS rejected stale revision');
  check(t.instance.mode==='conflict','conflict blocks editing');
  check(db.get('userA').data.profile.name==='second device','remote preserved during conflict');
  check(!!local.getItem(t.instance.draftKey()),'local branch still safe in draft');
  await t.instance.resolveConflict('local');
  check(t.instance.mode==='cloud','explicit keep-local resolution unblocked app');
  check(db.get('userA').data.profile.name==='from first device','user-selected local wins');

  // Another conflict can be resolved by choosing remote, without modifying cloud.
  global.localStorage=local;
  const secondDraft=clone(t.data);secondDraft.profile.name='stale, discard me';
  t.instance.persist(secondDraft);
  const originalRevision=db.get('userA').revision;
  db.set('userA',{...db.get('userA'),data:blank('remote selected'),revision:originalRevision+1});
  await t.instance.flush();
  check(t.instance.mode==='conflict','second conflict detected');
  await t.instance.resolveConflict('remote');
  check(t.instance.mode==='cloud','choosing remote returns to cloud');
  check(t.data.profile.name==='remote selected','remote data loaded on explicit selection');
  check(!local.getItem(t.instance.draftKey()),'discarded draft removed after explicit decision');

  // Same identity on fresh device loads cloud, not the guest seed.
  const other=makeLocal();other.setItem('rhythm_fitness_v1',JSON.stringify(blank('other device guest')));
  const t2=await makeManager('userA',other);
  check(t2.data.profile.name==='remote selected','cloud wins when account already has data');
  check(other.getItem('rhythm_fitness_v1')!==null,'guest data kept separately');

  // Two accounts NEVER load each other's data.
  const localB=makeLocal();
  const b=await makeManager('userB',localB);
  check(b.instance.mode==='cloud','new account created fresh document');
  check(!b.data.profile.name,'new account starts without another user profile');
  check(db.get('userB').user_id==='userB','new account uses its own user id');
  check(db.get('userA').data.profile.name==='remote selected','other user unaffected');
  global.localStorage=localB;
  await b.instance.signout();
  check(b.instance.mode==='guest','logout returns to guest display');
  check(!b.instance.user,'no account retained after logout');

  // Damaged local pending draft must NEVER be silently dropped by loading the cloud.
  const damagedLocal=makeLocal();
  damagedLocal.setItem('rhythm_cloud_pending_v1_userBad','{broken-json');
  const damaged=await makeManager('userBad',damagedLocal);
  check(damaged.instance.status==='corrupt-draft','damaged pending is blocked for explicit recovery');
  check(damaged.instance.mode==='loading','cannot edit under a damaged pending state');
  check(damagedLocal.getItem('rhythm_cloud_pending_v1_userBad')==='{broken-json','damaged pending remains available for download');
  global.localStorage=damagedLocal;
  await damaged.instance.clearCorruptDraft();
  check(damaged.instance.mode==='cloud','after confirmed clear account loads normally');

  // A race creating first cloud row must not discard explicitly migrated local data.
  const raceLocal=makeLocal();raceLocal.setItem('rhythm_fitness_v1',JSON.stringify(blank('first-device data')));
  const race=await makeManager('userRace',raceLocal);
  check(race.instance.mode==='setup','first cloud creation waits for migration');
  db.set('userRace',{user_id:'userRace',data:blank('other-device data'),revision:1,updated_at:new Date().toISOString()});
  global.localStorage=raceLocal;
  await race.instance.chooseInitial(true);
  check(race.instance.mode==='conflict','duplicate creation presents conflict instead of silent overwrite');
  check(db.get('userRace').data.profile.name==='other-device data','remote survives insert race');
  check(!!raceLocal.getItem('rhythm_cloud_pending_v1_userRace'),'local migration draft survives insert race');
  await race.instance.resolveConflict('local');
  check(db.get('userRace').data.profile.name==='first-device data','user can deliberately finish migration after race');

  // Crash/reload with pending offline edits: restored when base revision still matches.
  global.localStorage=local;
  const crashState=clone(t.data);crashState.profile.name='restored after reload';
  t.instance.persist(crashState);
  const restored=await makeManager('userA',local);
  // Wait for auto-retry started by enterAccount.
  await delay(30);
  check(restored.instance.mode==='cloud','restored pending draft loaded');
  check(db.get('userA').data.profile.name==='restored after reload','restored draft reaches cloud');
  clearTimeout(t.instance.flushTimer);
  clearTimeout(restored.instance.flushTimer);
  console.log(`PASS: ${checks} Cloud Sync / offline / account isolation / CAS conflict assertions`);
})().catch(err=>{console.error(err);process.exitCode=1;});
