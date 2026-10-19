/* RHYTHM v1.1.0 — optional Supabase auth and conflict-safe document sync.
 * No secrets, background server, or dependency on a build system.
 * Workflow: persist local pending draft BEFORE editing UI returns, then CAS to cloud.
 * Deliberately avoids last-write-wins and automatic guest-data migration.
 */
(function (root) {
  'use strict';
  const DRAFT_PREFIX='rhythm_cloud_pending_v1_';
  const TABLE='rhythm_user_data';
  const DELAY=1100;
  const POLL_MS=45000;
  const MAX_BYTES=1900000; // lower than database limit; JSONB text size differs slightly

  class SyncManager {
    constructor(options={}) {
      this.options=options;
      this.client=null;
      this.user=null;
      this.mode='guest'; // guest | loading | setup | cloud | conflict
      this.status='guest';
      this.revision=null;
      this.syncedAt=null;
      this.pending=null;
      this.conflict=null;
      this.availableRemote=null;
      this.initialGuest=null;
      this.errorMessage='';
      this.enabled=false;
      this.initialized=false;
      this.flushTimer=null;
      this.pollTimer=null;
      this.flushing=false;
      this.generation=0;
      this.authLoading=false;
      this.onData=options.onData||(()=>{});
      this.onStatus=options.onStatus||(()=>{});
      this.onRecovery=options.onRecovery||(()=>{});
      this.getLocal=options.getLocal||(()=>null);
      this.blank=options.blank||(()=>null);
      this.validate=options.validate||(()=>false);
    }
    get email(){return this.user?.email||'';}
    get isCloud(){return !!this.user;}
    get isBlocked(){return this.mode==='loading'||this.mode==='setup'||this.mode==='conflict';}
    get hasUnsynced(){return !!this.pending;}
    describe(){
      if(!this.enabled)return this.errorMessage?'Cloud ไม่พร้อมใช้งาน':'โหมดในเครื่อง · ยังไม่ตั้งค่า Cloud';
      if(!this.user)return 'โหมดในเครื่อง · ยังไม่ได้เข้าสู่ระบบ';
      if(this.mode==='loading')return 'กำลังโหลดข้อมูลบัญชี…';
      if(this.mode==='setup')return 'เลือกรูปแบบการเริ่มต้น Cloud';
      if(this.mode==='conflict')return 'ข้อมูลสองอุปกรณ์ไม่ตรงกัน · ต้องเลือก';
      if(this.status==='saving')return 'กำลังซิงค์ข้อมูล…';
      if(this.pending)return 'ยังไม่ซิงค์ · ข้อมูลรอบันทึกอยู่ในเครื่อง';
      if(this.status==='error')return 'ซิงค์ไม่สำเร็จ · กรุณาลองอีกครั้ง';
      if(this.availableRemote)return 'Cloud มีข้อมูลใหม่ · กดโหลด';
      return 'ซิงค์แล้ว · Cloud ปลอดภัยด้วย RLS';
    }
    notify(){this.onStatus(this);}
    draftKey(userId=this.user?.id){return DRAFT_PREFIX+String(userId||'');}
    readDraft(userId){
      try {
        const raw=localStorage.getItem(this.draftKey(userId));
        if(!raw)return null;
        const o=JSON.parse(raw);
        if(o?.userId!==userId || !this.validate(o.data) || !(o.baseRevision===null||Number.isSafeInteger(o.baseRevision)&&o.baseRevision>0))return null;
        return o;
      } catch(err){console.warn('Unable to read local pending draft:',err);return null;}
    }
    storeDraft(draft){
      try {
        const raw=JSON.stringify(draft);
        if(new Blob([raw]).size>MAX_BYTES)throw new Error('ข้อมูลใหญ่เกิน 1.9 MB');
        localStorage.setItem(this.draftKey(draft.userId),raw);
        return true;
      }catch(err){this.errorMessage=err.message||'LocalStorage ไม่พร้อมใช้งาน';this.status='error';this.notify();return false;}
    }
    rawDraft(){try{return localStorage.getItem(this.draftKey());}catch(e){return null;}}
    deleteDraft(){try{localStorage.removeItem(this.draftKey());}catch(e){console.warn(e);}}
    async init(){
      const cfg=root.RHYTHM_SUPABASE_CONFIG||{};
      const validURL=typeof cfg.url==='string'&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url.trim());
      const validKey=typeof cfg.publishableKey==='string'&&cfg.publishableKey.trim().length>15;
      if(!validURL||!validKey){this.errorMessage='';this.notify();return;}
      if(!root.supabase?.createClient){this.errorMessage='โหลด Supabase SDK ไม่ได้ · ตรวจอินเทอร์เน็ตหรือ CDN';this.notify();return;}
      this.client=root.supabase.createClient(cfg.url.trim().replace(/\/$/,''),cfg.publishableKey.trim(),{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'rhythm-auth-v1',flowType:'pkce'}
      });
      this.enabled=true;
      this.client.auth.onAuthStateChange((event,session)=>{
        if(event==='PASSWORD_RECOVERY'){queueMicrotask(()=>this.onRecovery());}
        if(event==='SIGNED_OUT')queueMicrotask(()=>this.exitAccount());
        if((event==='SIGNED_IN'||event==='INITIAL_SESSION')&&session?.user){
          queueMicrotask(()=>{if(this.user?.id!==session.user.id)this.enterAccount(session.user);});
        }
      });
      this.initialized=true;
      try {
        const {data,error}=await this.client.auth.getUser();
        // getUser validates identity with the Auth server, not just the locally stored JWT.
        if(error && !/session missing|auth session missing/i.test(error.message||'')){
          this.errorMessage='ไม่สามารถตรวจสอบเซสชัน: '+error.message;
          this.status='error';this.notify();return;
        }
        if(data?.user)await this.enterAccount(data.user);
        else this.notify();
      } catch(err){this.errorMessage=err.message;this.status='error';this.notify();}
      this.pollTimer=setInterval(()=>{if(this.isCloud&&!this.isBlocked)void this.checkRemote();},POLL_MS);
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible'&&this.isCloud&&!this.isBlocked)void this.checkRemote();
      });
      root.addEventListener?.('online',()=>{if(this.isCloud&&!this.isBlocked)void this.flush();});
    }
    async signup(email,password){
      if(!this.client)throw new Error('กรุณาตั้งค่า Supabase ก่อน');
      const {data,error}=await this.client.auth.signUp({email,password,options:{emailRedirectTo:this.redirectUrl()}});
      if(error)throw error;
      // With email confirmations enabled signUp intentionally has no session.
      if(data.session?.user)await this.enterAccount(data.session.user);
      return !!data.session;
    }
    async signin(email,password){
      if(!this.client)throw new Error('กรุณาตั้งค่า Supabase ก่อน');
      const {data,error}=await this.client.auth.signInWithPassword({email,password});
      if(error)throw error;
      if(data.user)await this.enterAccount(data.user);
    }
    async sendPasswordReset(email){
      if(!this.client)throw new Error('กรุณาตั้งค่า Supabase ก่อน');
      const {error}=await this.client.auth.resetPasswordForEmail(email,{redirectTo:this.redirectUrl()});
      if(error)throw error;
    }
    async changePassword(password){
      if(!this.client||!this.user)throw new Error('กรุณาเข้าสู่ระบบ');
      const {error}=await this.client.auth.updateUser({password});
      if(error)throw error;
    }
    redirectUrl(){return root.location.origin+root.location.pathname+'#profile';}
    async signout(){
      if(!this.client||!this.user)return;
      if(this.flushing)throw new Error('กำลังบันทึก Cloud กรุณาลองอีกครั้ง');
      if(this.pending)throw new Error('ยังมีข้อมูลไม่ซิงค์ กรุณากดซิงค์/แก้ Conflict และสำรองข้อมูลก่อนออกจากระบบ');
      const {error}=await this.client.auth.signOut({scope:'local'});
      if(error)throw error;
      this.exitAccount();
    }
    exitAccount(){
      if(!this.user)return;
      clearTimeout(this.flushTimer);
      this.generation++;
      this.user=null;
      this.mode='guest';this.status='guest';this.revision=null;this.syncedAt=null;
      this.pending=null;this.conflict=null;this.availableRemote=null;this.initialGuest=null;
      this.onData(this.getLocal());this.notify();
    }
    async getRemote(userId=this.user?.id){
      const {data,error}=await this.client.from(TABLE).select('user_id,data,revision,updated_at').eq('user_id',userId).maybeSingle();
      if(error)throw error;
      if(data&&!this.validate(data.data))throw new Error('ข้อมูล Cloud มีรูปแบบไม่รองรับ ต้องตรวจสอบและสำรองใน Supabase ก่อน');
      return data;
    }
    async enterAccount(user){
      if(!user?.id)return;
      if(this.user?.id===user.id && this.mode!=='guest')return;
      const gen=++this.generation;
      clearTimeout(this.flushTimer);
      this.user={id:user.id,email:user.email};this.mode='loading';this.status='loading';this.revision=null;
      this.pending=null;this.conflict=null;this.availableRemote=null;this.initialGuest=null;
      this.notify();
      const draft=this.readDraft(user.id);
      if(this.rawDraft()!==null && !draft){
        // Corrupt/unsupported pending content is never discarded silently.
        this.mode='loading';this.status='corrupt-draft';
        this.errorMessage='พบข้อมูลค้างส่งที่อ่านไม่ได้ ระบบหยุดโหลดเพื่อป้องกันการลบข้อมูล กรุณาดาวน์โหลดไฟล์ดิบก่อนเลือกล้าง Draft เสีย';
        this.onData(this.blank());this.notify();return;
      }
      try{
        const remote=await this.getRemote(user.id);
        if(gen!==this.generation)return;
        if(draft){
          this.pending=draft;
          if((remote?.revision??null)===draft.baseRevision){
            this.revision=draft.baseRevision;this.syncedAt=remote?.updated_at||null;
            this.mode='cloud';this.status='pending';this.onData(draft.data);this.notify();
            void this.flush();
          }else{
            this.openConflict(remote,draft);
          }
          return;
        }
        if(remote){this.acceptRemote(remote);return;}
        const guest=this.getLocal();
        if(guest && !guest.demo && this.validate(guest)){
          this.initialGuest=guest;
          this.mode='setup';this.status='setup';this.onData(this.blank());this.notify();
        }else{
          await this.createInitial(this.blank(),gen);
        }
      }catch(err){
        if(gen!==this.generation)return;
        this.errorMessage=err.message||'โหลด Cloud ไม่ได้';
        this.status='error';
        if(draft){
          this.revision=draft.baseRevision;this.pending=draft;this.mode='cloud';this.onData(draft.data);
        }else{
          // Never expose the previous guest user's data as if it belonged to the signed-in user.
          this.mode='loading';this.onData(this.blank());
        }
        this.notify();
      }
    }
    acceptRemote(remote){
      this.revision=Number(remote.revision);
      this.syncedAt=remote.updated_at;
      this.pending=null;this.conflict=null;this.availableRemote=null;this.initialGuest=null;
      this.mode='cloud';this.status='synced';this.errorMessage='';
      this.deleteDraft();this.onData(remote.data);this.notify();
    }
    async createInitial(data,gen=this.generation,protectLocal=false){
      if(!this.validate(data))throw new Error('ข้อมูลตั้งต้นไม่ถูกต้อง');
      const userId=this.user.id;
      try{
        const {data:created,error}=await this.client.from(TABLE)
          .insert({user_id:userId,data}).select('user_id,data,revision,updated_at').single();
        if(error)throw error;
        if(gen!==this.generation)return;
        this.acceptRemote(created);
      }catch(err){
        if(gen!==this.generation)return;
        // Another device may have created the row between SELECT and INSERT.
        if(err.code==='23505'){
          const remote=await this.getRemote(userId);
          if(protectLocal){
            const draft={userId,baseRevision:null,data,changedAt:new Date().toISOString()};
            if(!this.storeDraft(draft))throw new Error('ไม่สามารถเก็บข้อมูลก่อนแก้ Conflict');
            this.openConflict(remote,draft);
          }else this.acceptRemote(remote);
        }else throw err;
      }
    }
    async chooseInitial(useLocal){
      if(this.mode!=='setup'||!this.user)return;
      const data=useLocal?this.initialGuest:this.blank();
      const gen=this.generation;
      this.mode='loading';this.status='loading';this.notify();
      try{
        await this.createInitial(data,gen,useLocal);
        if(gen===this.generation&&useLocal && this.mode==='cloud'&&!this.pending){
          // Clear old unscoped v1 data only AFTER confirmed upload succeeded.
          try{localStorage.removeItem(root.FitCore.KEY);}catch(e){console.warn(e);}
        }
      }catch(err){if(gen===this.generation){this.mode='setup';this.status='error';this.errorMessage=err.message;this.notify();}throw err;}
    }
    persist(data){
      if(!this.user)return root.FitCore.save(data);
      if(this.mode!=='cloud')return false;
      if(!this.validate(data))return false;
      const draft={userId:this.user.id,baseRevision:this.revision,data:structuredClone(data),changedAt:new Date().toISOString()};
      if(!this.storeDraft(draft))return false;
      this.pending=draft;
      this.status='pending';this.errorMessage='';this.notify();
      clearTimeout(this.flushTimer);
      this.flushTimer=setTimeout(()=>void this.flush(),DELAY);
      return true;
    }
    async flush(){
      clearTimeout(this.flushTimer);
      if(!this.user||this.flushing||!this.pending||this.mode!=='cloud')return false;
      const gen=this.generation,userId=this.user.id,draft=this.pending;
      if(draft.baseRevision===null){this.errorMessage='ไม่มี revision อ้างอิง: กรุณาโหลดข้อมูล Cloud';this.status='error';this.notify();return false;}
      this.flushing=true;this.status='saving';this.notify();
      try{
        const {data:updated,error}=await this.client.from(TABLE).update({data:draft.data})
          .eq('user_id',userId).eq('revision',draft.baseRevision)
          .select('user_id,data,revision,updated_at').maybeSingle();
        if(error)throw error;
        if(gen!==this.generation)return false;
        if(!updated){
          const remote=await this.getRemote(userId);
          if(gen!==this.generation)return false;
          this.openConflict(remote,this.pending||draft);
          return false;
        }
        this.revision=Number(updated.revision);this.syncedAt=updated.updated_at;
        if(this.pending===draft){
          this.pending=null;this.deleteDraft();this.status='synced';this.errorMessage='';
        }else{
          // New edits happened while request was in flight. Preserve them and bump base rev.
          this.pending.baseRevision=this.revision;
          if(!this.storeDraft(this.pending))this.status='error';
          else this.status='pending';
        }
        this.notify();return true;
      }catch(err){
        if(gen===this.generation){this.status='error';this.errorMessage=err.message||'การเชื่อมต่อล้มเหลว';this.notify();}
        return false;
      }finally{
        this.flushing=false;
        if(this.pending&&this.status==='pending'&&gen===this.generation){
          clearTimeout(this.flushTimer);this.flushTimer=setTimeout(()=>void this.flush(),DELAY);
        }
      }
    }
    openConflict(remote,draft){
      this.conflict={remote,draft};
      this.pending=draft;this.revision=draft.baseRevision;
      this.mode='conflict';this.status='conflict';
      this.onData(draft.data);this.notify();
    }
    async resolveConflict(choice){
      if(this.mode!=='conflict'||!this.user)return;
      const {remote,draft}=this.conflict;
      if(choice==='remote'){
        if(!remote)throw new Error('Cloud ไม่มีข้อมูลให้เลือก กรุณาใช้ข้อมูลในเครื่องเพื่อสร้าง Cloud ใหม่');
        // The caller must explicitly confirm discarding local changes.
        this.acceptRemote(remote);return;
      }
      if(choice!=='local')return;
      if(!remote){
        this.mode='loading';this.notify();
        try{await this.createInitial(draft.data,this.generation,true);}
        catch(err){this.openConflict(await this.getRemote(),draft);throw err;}
        return;
      }
      const gen=this.generation;
      this.mode='loading';this.status='saving';this.notify();
      try{
        // CAS against exact observed remote revision; retry requires a new decision.
        const {data:updated,error}=await this.client.from(TABLE)
          .update({data:draft.data}).eq('user_id',this.user.id).eq('revision',remote.revision)
          .select('user_id,data,revision,updated_at').maybeSingle();
        if(error)throw error;
        if(gen!==this.generation)return;
        if(!updated){this.openConflict(await this.getRemote(),draft);return;}
        this.acceptRemote(updated);
      }catch(err){if(gen===this.generation){this.mode='conflict';this.status='error';this.errorMessage=err.message;this.notify();}throw err;}
    }
    clearCorruptDraft(){
      if(this.status!=='corrupt-draft')throw new Error('ไม่มี Draft ที่อ่านไม่ได้');
      this.deleteDraft();
      this.errorMessage='';
      return this.enterAccountRetry();
    }
    async useGuestAsCloud(){
      if(!this.user||this.mode!=='cloud'||this.pending)throw new Error('กรุณาซิงค์ข้อมูลปัจจุบันก่อน');
      const data=this.getLocal();
      if(!data||data.demo||!this.validate(data))throw new Error('ไม่มีข้อมูลจริงในเครื่องเดิมให้ย้าย');
      // Called only after user has reviewed a backup and explicitly confirmed overwrite.
      if(!this.persist(data))throw new Error('บันทึกข้อมูลรอย้ายไม่สำเร็จ');
      const ok=await this.flush();
      if(ok && !this.pending){try{localStorage.removeItem(root.FitCore.KEY);}catch(e){console.warn(e);}this.onData(data);}
      return ok;
    }
    async checkRemote(){
      if(!this.user||this.mode!=='cloud'||this.flushing||this.pending)return;
      const gen=this.generation;
      try{
        const remote=await this.getRemote();
        if(gen!==this.generation||this.mode!=='cloud'||this.pending)return;
        if(!remote)return;
        if(Number(remote.revision)!==this.revision){
          const focus=document.activeElement;
          if(focus?.closest?.('form')||document.querySelector('#modal-root form')){
            this.availableRemote=remote;this.notify();
          }else this.acceptRemote(remote);
        }
      }catch(err){
        // Do not replace locally visible data when the network fails.
        this.status='error';this.errorMessage=err.message;this.notify();
      }
    }
    async refresh(){
      if(!this.user)return;
      if(this.mode==='loading'&&this.status==='corrupt-draft')return;
      if(this.mode==='loading'&&this.status==='error'){await this.enterAccountRetry();return;}
      if(this.pending){await this.flush();return;}
      if(this.availableRemote){this.acceptRemote(this.availableRemote);return;}
      await this.checkRemote();
      if(this.status==='error'&&this.mode==='cloud'&&!this.pending){this.status='synced';this.notify();}
    }
    async enterAccountRetry(){
      if(!this.user)return;
      const user={...this.user};this.user=null;await this.enterAccount(user);
    }
  }
  root.FitSync={create:opts=>new SyncManager(opts),SyncManager};
  if(typeof module!=='undefined'&&module.exports)module.exports={SyncManager,DRAFT_PREFIX};
})(typeof window!=='undefined'?window:globalThis);
