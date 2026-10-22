/* RHYTHM v1.9.3 — Thai-first, optional Supabase account and cloud sync */
(function(){
 'use strict';
 const Daily=window.FitDaily,C=window.FitCore,D=window.FitData,R=window.FitRecovery,Run=window.FitRun,I=window.FitInsights,G=window.FitGoals,WA=window.FitWorkoutAnalytics,M=window.FitMetabolism,U=window.FitUX,FoodEdit=window.FitCustomFoodEditor;
 let state=C.load();
 const sync=window.FitSync.create({
   getLocal:()=>C.load(),blank:()=>D.blankState(),validate:C.validateImported,
   onData:data=>{state=data||D.blankState();ui.liveActive=false;ui.liveDraft=null;render(false);},
   onStatus:manager=>{
     if(cloudBooting)return;
     const label=document.getElementById('sync-state-label');
     if(label)label.textContent=manager.describe();
     const current=manager.mode;
     if(current!==lastSyncMode){lastSyncMode=current;ui.liveActive=false;ui.liveDraft=null;render(true);}
   },
   onRecovery:()=>{ui.authMode='new-password';showAuthModal();}
 });
 let lastSyncMode='guest';
 let cloudBooting=!!(window.RHYTHM_SUPABASE_CONFIG?.url && window.RHYTHM_SUPABASE_CONFIG?.publishableKey);
 let route=location.hash.replace('#','')||'dashboard';
 let sidebarScrollTop=0;
 const pages={dashboard:{label:'ภาพรวม',icon:'layout',caption:'มองภาพรวมของการฝึก อาหาร และการพักฟื้น'},workouts:{label:'แผนออกกำลังกาย',icon:'dumbbell',caption:'จัดตาราง Push / Pull / Legs / Run ได้ตามชีวิตจริง'},running:{label:'บันทึกการวิ่ง',icon:'route',caption:'บันทึกระยะทาง เวลา Pace และแนวโน้มการวิ่ง'},nutrition:{label:'โภชนาการ',icon:'utensils',caption:'บันทึกอาหารและติดตามพลังงานอย่างยืดหยุ่น'},sleep:{label:'การนอน',icon:'moon',caption:'ติดตามชั่วโมงนอนและระยะการนอนจากข้อมูลที่บันทึก'},recovery:{label:'Recovery & Lifestyle',icon:'sparkles',caption:'เชื่อมความรู้สึก การพักผ่อน และภาระการฝึกโดยไม่วินิจฉัยสุขภาพ'},routine:{label:'ตารางชีวิต',icon:'clock',caption:'ออกแบบวันของคุณ ตั้งแต่ตื่นจนเข้านอน'},progress:{label:'น้ำหนักและแนวโน้ม',icon:'chart',caption:'เรียนรู้จากแนวโน้ม ไม่ตัดสินด้วยข้อมูลวันเดียว'},metabolism:{label:'วิเคราะห์พลังงานและโภชนาการ',icon:'flame',caption:'เข้าใจ TDEE มื้ออาหาร และการเปลี่ยนแปลงน้ำหนักตามข้อมูลจริง'},workoutAnalytics:{label:'วิเคราะห์การฝึก',icon:'chart',caption:'Personal Records, Volume, ความสม่ำเสมอ และพัฒนาการรายท่า'},goals:{label:'เป้าหมายอัจฉริยะ',icon:'target',caption:'เปลี่ยนข้อสังเกตเป็นเป้าหมายที่ติดตามผลได้'},insights:{label:'วิเคราะห์เชิงลึก',icon:'sparkles',caption:'เชื่อมข้อมูลสุขภาพที่บันทึก พร้อมเหตุผลและแนวทางต่อไป'},guide:{label:'เริ่มต้นและคู่มือ',icon:'info',caption:'เริ่มใช้ง่ายขึ้น · รู้ว่าต้องบันทึกอะไรเพื่อวิเคราะห์แต่ละด้าน'},profile:{label:'โปรไฟล์และตั้งค่า',icon:'user',caption:'ปรับค่าตั้งต้น เป้าหมาย และการจัดการข้อมูล'}};
 const ui={runDate:C.today(),exerciseFocus:'',authMode:'login',workoutDay:C.weekday(C.today()),workoutDate:C.today(),foodDate:C.today(),sleepDate:C.today(),recoveryDate:C.today(),routineDay:C.weekday(C.today()),weightPeriod:30,search:'',foodCategory:'ทั้งหมด',foodLimit:60,insightsDays:14,analyticsDays:90,analyticsExercise:'',metabolismDays:28,insightsFocus:'all',mobileOpen:false,goalStatusFilter:"active",menuOpen:{logs:true,analysis:false},wizardDraft:null,wizardStep:0,liveDraft:null,liveActive:false};
 const FONTS={sarabun:'Sarabun · Recommended',bai:'Bai Jamjuree',noto:'Noto Sans Thai',ibm:'IBM Plex Sans Thai',leelawadee:'Leelawadee UI',tahoma:'Tahoma',segoe:'Segoe UI / System',prompt:'Prompt',kanit:'Kanit',mitr:'Mitr',anakotmai:'Anakotmai',athiti:'Athiti',trirong:'Trirong (Serif)',itim:'Itim (Handwriting)',pattaya:'Pattaya (Display)',chonburi:'Chonburi (Display)'};
 const e=C.esc,ic=C.icon,n=C.nfmt,num=C.num,fmt=C.pretty;
 // Browser-local timer: never upload transient state into Supabase snapshots.
 let timerSound=null;
 function timerTick(snap){
   document.querySelectorAll('[data-timer-display]').forEach(node=>node.textContent=clockText(snap.displaySeconds));
   document.querySelectorAll('[data-timer-status]').forEach(node=>node.textContent=timerStatus(snap));
   document.querySelectorAll('[data-timer-progress]').forEach(node=>{const pct=snap.mode==='countdown'&&snap.duration?100*snap.remaining/snap.duration:0;node.style.width=`${pct}%`;});
 }
 function clockText(seconds){const v=Math.max(0,Math.floor(Number(seconds)||0));const h=Math.floor(v/3600),m=Math.floor(v%3600/60),s=v%60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
 function timerStatus(snap){return snap.status==='running'?'กำลังจับเวลา':snap.status==='paused'?'หยุดชั่วคราว':snap.status==='done'?'ครบเวลาแล้ว':'พร้อมเริ่ม';}
 function beepTimer(){try{if(!timerSound)return;const osc=timerSound.createOscillator(),gain=timerSound.createGain();osc.type='sine';osc.frequency.value=780;gain.gain.value=.07;osc.connect(gain);gain.connect(timerSound.destination);osc.start();osc.stop(timerSound.currentTime+.22);}catch(err){console.warn('Timer sound unavailable:',err);}}
 const workoutTimer=window.FitTimer.create({onTick:timerTick,onDone:()=>{
   beepTimer();toast('ครบเวลาจับถอยหลังแล้ว');
   if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&document.visibilityState==='hidden')try{new Notification('RHYTHM · ครบเวลาแล้ว',{body:'พร้อมเริ่มเซตถัดไป',icon:'assets/favicon.png'});}catch(_){/* blocked notifications */}
   setTimeout(()=>{if(!document.querySelector('.modal'))render(true);},0);
 }});
 document.addEventListener('visibilitychange',()=>workoutTimer.update());

 const option=(value,label,selected)=>`<option value="${e(value)}" ${String(value)===String(selected)?'selected':''}>${e(label)}</option>`;
 const val=(obj,key,defaultVal='')=>obj?.[key]===null||obj?.[key]===undefined?defaultVal:obj[key];
 const empty=(icon,title,desc,button='')=>`<div class="empty-state">${ic(icon,30)}<h3>${title}</h3><p>${desc}</p>${button}</div>`;
 function update(){
   if(!sync.persist(state))toast('ยังไม่สามารถเก็บข้อมูลที่เปลี่ยนได้ กรุณาสำรอง JSON ก่อนรีเฟรช','error');
   render(true);
 }
 function cloudBlocker(){
   if(sync.mode==='loading')return `<div class="panel sync-blocker"><div class="sync-emblem">${ic('cloud',30)}</div><h2>กำลังตรวจสอบข้อมูลบัญชี</h2><p>${e(sync.errorMessage||'กำลังเชื่อมต่อ Cloud โดยยังไม่แตะต้องข้อมูลเดิมในเครื่อง')}</p>${sync.status==='error'?`<button class="button button-primary" data-action="auth-sync">ลองเชื่อมต่ออีกครั้ง</button>`:sync.status==='corrupt-draft'?`<div class="sync-block-actions"><button class="button button-outline" data-action="auth-backup-raw">ดาวน์โหลด Draft ที่อ่านไม่ได้</button><button class="button button-plain danger" data-action="auth-clear-raw">ลบ Draft เสีย (หลังสำรอง)</button></div>`:''}</div>`;
   if(sync.mode==='setup')return `<div class="panel sync-blocker"><div class="sync-emblem">${ic('cloud',30)}</div><h2>เริ่มต้น Cloud ครั้งแรก</h2><p>ยังไม่มีข้อมูลสำหรับบัญชีนี้ใน Supabase พบข้อมูลจริงในเครื่องนี้ คุณเลือกย้ายข้อมูลเดิมหรือเริ่มบัญชีใหม่ได้ โดยจะไม่อัปโหลดข้อมูลในเครื่องโดยไม่ถามก่อน</p>${sync.errorMessage?`<p class="sync-error">${e(sync.errorMessage)}</p>`:''}<div class="sync-block-actions"><button class="button button-primary" data-action="auth-initial-local">ย้ายข้อมูลจากเครื่องนี้ขึ้น Cloud</button><button class="button button-outline" data-action="auth-initial-blank">เริ่มบัญชีใหม่บน Cloud</button><button class="button button-plain" data-action="auth-backup-guest">สำรองข้อมูลในเครื่องก่อน</button></div></div>`;
   if(sync.mode==='conflict')return `<div class="panel sync-blocker"><div class="sync-emblem sync-emblem-warn">${ic('info',30)}</div><h2>พบข้อมูล 2 เวอร์ชันที่ไม่ตรงกัน</h2><p>มีข้อมูลจากอุปกรณ์อื่นถูกบันทึกหลังจากที่เครื่องนี้เริ่มแก้ไข เพื่อป้องกันข้อมูลหาย ระบบหยุดซิงค์ไว้จนกว่าคุณจะเลือก</p>${sync.errorMessage?`<p class="sync-error">${e(sync.errorMessage)}</p>`:''}<div class="sync-compare"><div><strong>ข้อมูลบนเครื่องนี้</strong><small>แก้ไขเมื่อ ${e(sync.conflict?.draft?.changedAt?new Date(sync.conflict.draft.changedAt).toLocaleString('th-TH'):'ไม่ทราบ')}</small><button class="button button-outline" data-action="auth-backup-draft">ดาวน์โหลดสำรองของเครื่องนี้</button></div><div><strong>ข้อมูลบน Cloud</strong><small>${e(sync.conflict?.remote?.updated_at?new Date(sync.conflict.remote.updated_at).toLocaleString('th-TH'):'ยังไม่มีข้อมูล')}</small><button class="button button-outline" data-action="auth-backup-remote" ${sync.conflict?.remote?'':'disabled'}>ดาวน์โหลดสำรอง Cloud</button></div></div><div class="sync-block-actions"><button class="button button-primary" data-action="auth-resolve-local">ใช้ข้อมูลเครื่องนี้แทน Cloud</button><button class="button button-outline" data-action="auth-resolve-remote" ${sync.conflict?.remote?'':'disabled'}>ใช้ข้อมูล Cloud แทนเครื่องนี้</button></div><p class="source-hint">ไม่มีการรวมข้อมูลอัตโนมัติ กรุณาดาวน์โหลดสำรองก่อนเลือก เพราะทั้งสองทางเลือกเป็นการแทนที่ข้อมูลทั้งชุด</p></div>`;
   return '';
 }
 function cloudStrip(){
   const txt=sync.describe();
   return `<div class="sync-strip ${sync.isCloud?'sync-strip-cloud':'sync-strip-local'}" role="status"><div class="sync-strip-left">${ic(sync.isCloud?'cloud':'user',17)}<span id="sync-state-label">${e(txt)}</span>${sync.isCloud?`<small class="sync-email">${e(sync.email)}</small>`:''}</div><div class="sync-strip-actions">${sync.isCloud?`<button class="button button-mini" data-action="auth-sync">${ic('check',15)} ซิงค์ตอนนี้</button><button class="button button-mini" data-action="auth-logout">ออกจากระบบ</button>`:`<button class="button button-mini" data-action="auth-open" ${!sync.enabled?'disabled':''}>${sync.enabled?'เข้าสู่ระบบ / สมัครสมาชิก':'ยังไม่ตั้งค่า Supabase'}</button>`}</div></div>`;
 }
 function showAuthModal(){
   if(!sync.enabled){toast('กรุณาตั้งค่า js/supabase-config.js และสร้างตารางด้วย SQL ก่อน','error');return;}
   const mode=ui.authMode;
   if(mode==='new-password'){
     showModal('ตั้งรหัสผ่านใหม่',`<form id="auth-password-form"><label class="field"><span>รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</span><input name="password" type="password" required minlength="8" autocomplete="new-password" /></label>${modalButtons('อัปเดตรหัสผ่าน')}</form>`,'เปิดจากลิงก์กู้รหัสผ่านในอีเมล');return;
   }
   const isSignup=mode==='signup',isReset=mode==='reset';
   const title=isReset?'ลืมรหัสผ่าน':isSignup?'สมัครสมาชิก RHYTHM':'เข้าสู่ระบบ RHYTHM';
   const passField=isReset?'':`<label class="field"><span>รหัสผ่าน</span><input name="password" type="password" ${isSignup?'minlength="8"':''} required autocomplete="${isSignup?'new-password':'current-password'}" /></label>`;
   showModal(title,`<form id="auth-form"><div class="form-grid"><label class="field"><span>อีเมล</span><input name="email" type="email" maxlength="254" required autocomplete="email" placeholder="name@example.com" /></label>${passField}<button type="submit" class="button button-dark full">${isReset?'ส่งลิงก์รีเซ็ตรหัสผ่าน':isSignup?'สมัครสมาชิก':'เข้าสู่ระบบ'}</button></div></form><div class="auth-switch">${mode!=='login'?'<button data-action="auth-mode" data-mode="login">เข้าสู่ระบบ</button>':''}${mode!=='signup'?'<button data-action="auth-mode" data-mode="signup">สร้างบัญชี</button>':''}${mode!=='reset'?'<button data-action="auth-mode" data-mode="reset">ลืมรหัสผ่าน?</button>':''}</div><p class="source-hint">ข้อมูลบัญชีดูแลโดย Supabase Auth และข้อมูลสุขภาพแยกด้วย RLS · รหัสผ่านไม่ถูกบันทึกในโค้ดเว็บ</p>`,isSignup?'หากเปิดยืนยันอีเมล ต้องกดยืนยันก่อนเข้าสู่ระบบ':'ใช้บัญชีเดียวกันบนหลายอุปกรณ์ได้');
 }
 async function withCloudAction(task){try{await task();}catch(err){console.error('RHYTHM cloud:',err);toast(err.message||'ไม่สามารถดำเนินการกับ Cloud ได้','error');}}
 async function handleAuthForm(form){
   if(sync.authLoading)return;
   sync.authLoading=true;
   const btn=form.querySelector('button[type=submit]');if(btn)btn.disabled=true;
   try{
     const fd=new FormData(form),password=String(fd.get('password')||'');
     if(form.id==='auth-password-form'){
       if(password.length<8)throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
       await sync.changePassword(password);closeModal();toast('เปลี่ยนรหัสผ่านแล้ว');return;
     }
     const email=String(fd.get('email')||'').trim();
     if(ui.authMode==='reset'){
       await sync.sendPasswordReset(email);closeModal();toast('หากอีเมลถูกต้อง ระบบจะส่งลิงก์รีเซ็ตให้');return;
     }
     if(ui.authMode==='signup'){
       if(password.length<8)throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
       const signedIn=await sync.signup(email,password);closeModal();toast(signedIn?'สมัครสมาชิกและเข้าสู่ระบบแล้ว':'กรุณาตรวจอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ');return;
     }
     await sync.signin(email,password);closeModal();toast('เข้าสู่ระบบเรียบร้อย');
   }catch(err){console.error('Auth:',err);toast(err.message||'เข้าสู่ระบบไม่สำเร็จ','error');}
   finally{sync.authLoading=false;if(btn?.isConnected)btn.disabled=false;}
 }

 const NAV_GROUPS=[
   {id:'logs',title:'บันทึกและวางแผน',items:['workouts','running','nutrition','sleep','recovery','routine','progress']},
   {id:'analysis',title:'วิเคราะห์และพัฒนา',items:['insights','workoutAnalytics','metabolism','goals']}
 ];
 function sideLink(key){const pg=pages[key];return `<a href="#${key}" class="nav-item ${route===key?'active':''}" data-route="${key}" ${route===key?'aria-current="page"':''}>${ic(pg.icon,19)}<span>${pg.label}</span></a>`;}
 function sidebarNavigation(){
   return `${sideLink('dashboard')}${NAV_GROUPS.map(group=>{const expanded=!!ui.menuOpen[group.id]||group.items.includes(route);return `<div class="side-group"><button type="button" class="side-group-toggle" data-action="nav-group" data-group="${group.id}" aria-controls="nav-${group.id}" aria-expanded="${expanded}"><span>${e(group.title)}</span>${ic('chevron-down',16)}</button><div id="nav-${group.id}" class="side-group-content" ${expanded?'':'hidden'}>${group.items.map(sideLink).join('')}</div></div>`;}).join('')}<div class="side-end-links">${sideLink('guide')}${sideLink('profile')}</div>`;
 }
 function openQuickLog(){
   if(sync.isBlocked){toast('กรุณาจัดการสถานะการซิงค์ก่อนบันทึกข้อมูล','error');return;}
   const actions=[['meal','อาหาร','utensils','ค้นหาในคลังหรือเพิ่มอาหารเอง'],['workout','การฝึกจริง','dumbbell','ดึงเซตจากเทมเพลตวันนี้'],['sleep','การนอน','moon','เวลานอน/ตื่น และ Deep/Light/REM'],['weight','น้ำหนัก','scale','น้ำหนักและเปอร์เซ็นต์ไขมัน (ถ้ามี)'],['recovery','Recovery','sparkles','ความสดชื่น ความเหนื่อย และความเครียด'],['run','วิ่ง','route','ระยะทาง เวลา และความหนัก']];
   showModal('บันทึกด่วน',`<p class="quick-log-description">เลือกสิ่งที่ต้องการบันทึกได้ทันที ไม่ต้องหาเมนูจาก Sidebar</p><div class="quick-log-list">${actions.map(([key,label,icon,desc])=>`<button type="button" class="quick-log-choice" data-action="quick-log" data-kind="${key}"><span class="quick-log-icon">${ic(icon,20)}</span><span><strong>${label}</strong><small>${desc}</small></span>${ic('arrow',17)}</button>`).join('')}</div>`,'ข้อมูลทั้งหมดจะบันทึกลงระบบเดิมของแต่ละหมวด');
 }
 function quickLog(kind){
   closeModal();
   if(kind==='meal'){ui.foodDate=C.today();openMeal();}
   else if(kind==='workout'){ui.workoutDate=C.today();ui.workoutDay=C.weekday(ui.workoutDate);openSession();}
   else if(kind==='sleep'){ui.sleepDate=C.today();openSleep();}
   else if(kind==='weight')openWeight();
   else if(kind==='recovery'){ui.recoveryDate=C.today();openCheckin();}
   else if(kind==='run'){ui.runDate=C.today();openRun();}
 }
 function navigate(page){if(!pages[page])page='dashboard';for(const g of NAV_GROUPS)if(g.items.includes(page))ui.menuOpen[g.id]=true;route=page;ui.mobileOpen=false;if(location.hash!==`#${page}`)history.replaceState(null,'',`#${page}`);render(false);}
 function render(preserve=true){
   if(cloudBooting){document.getElementById('app').innerHTML='<div class="boot"><img class="boot-logo" src="assets/rhythm-logo.png" alt="RHYTHM" /><p>กำลังตรวจสอบเซสชัน RHYTHM…</p></div>';return;}
   if(!pages[route])route='dashboard'; const y=preserve?window.scrollY:0;
   const existingSidebar=document.getElementById('sidebar');
   if(existingSidebar)sidebarScrollTop=existingSidebar.scrollTop;
   document.documentElement.dataset.theme=state.settings.theme==='dark'?'dark':'light';
   document.documentElement.dataset.font=FONTS[state.settings.font]?state.settings.font:'ibm';
   const m=C.metrics(state),pg=pages[route];
   document.getElementById('app').innerHTML=`<div class="app-shell">
    <aside class="sidebar ${ui.mobileOpen?'sidebar-open':''}" id="sidebar">
      <div class="brand"><img class="brand-logo" src="assets/rhythm-logo.png" alt="โลโก้ RHYTHM" /><div class="brand-copy"><strong>RHYTHM</strong><small>Move • Fuel • Recover</small></div><button class="mob-close icon-button" data-action="mobile-close" aria-label="ปิดเมนู">${ic('close')}</button></div>
      <p class="side-label">YOUR SPACE</p>
      <nav class="side-nav" aria-label="เมนูหลัก">${sidebarNavigation()}</nav>
      <div class="sidebar-bottom"><div class="side-mantra"><span class="mantra-icon">${ic('bolt',19)}</span><strong>Small steps.<br>Real progress.</strong><p>ก้าวเล็ก ๆ ที่ทำได้ทุกวัน มีค่ากว่าความสมบูรณ์แบบ</p></div><div class="side-profile"><div class="avatar">${e((sync.isBlocked?'R':(state.profile.name||'R')).slice(0,1).toUpperCase())}</div><div><strong>${e(sync.isBlocked?'กำลังตรวจสอบบัญชี':(state.profile.name||'ผู้ใช้ RHYTHM'))}</strong><small>${sync.isCloud?'บัญชี Cloud':'ข้อมูลเก็บในเครื่องนี้'}</small></div></div></div>
    </aside><div class="mobile-mask ${ui.mobileOpen?'visible':''}" data-action="mobile-close"></div>
    <div class="workspace"><header class="topbar"><div class="topbar-left"><button class="mob-menu icon-button" data-action="mobile-open" aria-label="เปิดเมนู">${ic('menu')}</button><div><div class="breadcrumb"><img class="topbar-logo" src="assets/rhythm-logo.png" alt="" /> RHYTHM <span>/</span> ${pg.label}</div><h1>${pg.label}</h1><p>${pg.caption}</p></div></div><div class="topbar-actions"><div class="today-chip">${ic('calendar',16)}<span>${e(fmt(C.today(),true))}</span></div><button class="icon-button theme-toggle" data-action="toggle-theme" aria-label="สลับธีม" title="สลับธีม">${ic(state.settings.theme==='dark'?'sun':'moon')}</button><button class="button button-primary top-quick" data-action="quick-menu" aria-label="เปิดเมนูบันทึกด่วน">${ic('plus',16)} <span>บันทึกด่วน</span></button></div></header>
     <div class="content">${cloudStrip()}${sync.isBlocked?cloudBlocker():state.demo?`<div class="demo-banner">${ic('info',17)} <div><strong>โหมดทดลอง:</strong> ตัวเลขและบันทึกที่เห็นเป็นข้อมูลสมมติสำหรับทดสอบเว็บ</div><button class="button button-mini" data-action="start-real">เริ่มใช้ข้อมูลของฉัน ${ic('arrow',15)}</button></div>`:''}${renderPage(m)}</div>
     <footer class="footer"><span>RHYTHM <b>v1.9.5</b> · Personal Wellness Workspace</span><span>ประมาณการเพื่อการวางแผน ไม่ใช่คำแนะนำทางการแพทย์</span></footer>
    </div></div>`;
   const newSidebar=document.getElementById('sidebar');
   if(newSidebar)newSidebar.scrollTop=sidebarScrollTop;
   window.scrollTo({top:y,behavior:'instant'});
 }
 function renderPage(m){return ({dashboard:()=>dashboard(m),workouts,running,workoutAnalytics,goals,metabolism,nutrition:()=>nutrition(m), sleep, recovery, routine, progress:()=>progress(m),insights,guide:()=>userGuide(m),profile:()=>profile(m)})[route]();}
 const sectionHead=(title,sub,action='')=>`<div class="section-head"><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${action}</div>`;
 const ghost=(action,label,icon='plus',attrs='')=>`<button class="button button-outline" data-action="${action}" ${attrs}>${ic(icon,16)} ${label}</button>`;
 const formatHour=mins=>mins===null?'—':`${Math.floor(mins/60)} ชม. ${Math.round(mins%60)} นาที`;
 function trendCards(m){
   const bmi=m.ready?n(m.bmi,1):'—',bmr=m.ready?n(m.bmr):'—',tdee=m.ready?n(m.tdee):'—';
   const sleep=C.sleepStats(state); const rate=C.workoutStats(state);
   return `<div class="metrics-grid">
    <article class="metric-card"><div class="metric-top">${ic('target',20)}<span>ค่าดัชนีมวลกาย</span></div><div class="metric-value">${bmi}<small> BMI</small></div><div class="metric-foot">${m.ready?e(m.bmiCategory):'กรอกโปรไฟล์เพื่อคำนวณ'}</div></article>
    <article class="metric-card"><div class="metric-top">${ic('flame',20)}<span>พลังงานพื้นฐาน</span></div><div class="metric-value">${bmr}<small> kcal</small></div><div class="metric-foot">BMR โดยประมาณ / วัน</div></article>
    <article class="metric-card"><div class="metric-top">${ic('bolt',20)}<span>พลังงานต่อวัน</span></div><div class="metric-value">${tdee}<small> kcal</small></div><div class="metric-foot">TDEE ตามระดับกิจกรรม</div></article>
    <article class="metric-card"><div class="metric-top">${ic('moon',20)}<span>เวลานอนเฉลี่ย 7 วัน</span></div><div class="metric-value">${sleep.avg===null?'—':n(sleep.avg/60,1)}<small> ชม.</small></div><div class="metric-foot">${sleep.entries.length?`จาก ${sleep.entries.length} คืนที่บันทึก`:'ยังไม่มีบันทึกการนอน'}</div></article>
   </div>`;
 }
 function goals(){
   const all=state.goals||[],active=all.filter(g=>g.status==='active'),complete=all.filter(g=>g.status==='completed'),items=G.suggestions(state);
   const shown=all.filter(g=>ui.goalStatusFilter==='all'||(ui.goalStatusFilter==='active'?g.status==='active'||g.status==='paused':g.status===ui.goalStatusFilter));
   const status={active:'กำลังติดตาม',paused:'พักเป้าหมาย',completed:'สำเร็จ',archived:'เก็บในประวัติ'};
   const recs=items.map(r=>`<article class="goals-suggestion"><div class="goals-suggestion-head"><span>${ic('sparkles',17)} ข้อเสนอจากข้อมูล</span><small>${e(G.KINDS[r.kind].label)}</small></div><h3>${e(r.title)}</h3><p><b>หลักฐาน:</b> ${e(r.evidence)}</p><p><b>แนวทาง:</b> ${e(r.reason)}</p><div class="goals-suggestion-footer"><small>ปรับเป้าหมายได้ก่อนเริ่ม · ไม่บันทึกอัตโนมัติ</small><button type="button" class="button button-dark" data-action="goal-from-suggestion" data-kind="${e(r.kind)}" data-target="${e(r.target)}">${ic('plus',15)} เลือกตั้งเป้าหมาย</button></div></article>`).join('');
   const goalsHtml=shown.map(g=>{const spec=G.KINDS[g.kind],p=G.progress(g,state),progress=Math.min(100,p?.ratio||0),badge= g.status==='active'&&p?.achieved?'ถึงเกณฑ์ที่ตั้งไว้':status[g.status];return `<article class="goal-active-card"><div class="goal-active-head"><div><span class="goal-category">${ic('target',16)} ${e(spec.label)}</span><h3>${e(g.title||spec.label)}</h3></div><span class="goal-status-tag">${e(badge)}</span></div><p class="goal-meta">${e(g.startDate)} ถึง ${e(g.endDate)} · ${e(spec.scope)}</p><div class="goal-measure"><strong>${p?.value===null?'—':n(p?.value??0,1)}</strong><span>/ ${n(g.target,1)} ${e(spec.unit)}</span></div><div class="goal-meter"><span style="width:${progress}%"></span></div><div class="goal-bottom"><span>${p?.count??0} บันทึกที่ใช้คำนวณ · ${p?.enough?'มีข้อมูลขั้นต่ำ':'ข้อมูลยังไม่พอสำหรับตัดสินเป้าหมาย'}</span><strong>${progress}%</strong></div><p class="goal-note">${e(g.note||'ติดตามผลจากบันทึกจริงทุกครั้งที่เข้าหน้าเว็บ')}</p>${g.reviews?.length?`<small class="goal-review-summary">ทบทวนล่าสุด: ${e(g.reviews.at(-1).note)} (${e(g.reviews.at(-1).date)})</small>`:''}<div class="goal-actions"><button class="button button-outline" data-action="goal-review" data-id="${e(g.id)}">${ic('edit',15)} ทบทวนผล</button><button class="button button-outline" data-action="goal-edit" data-id="${e(g.id)}">แก้เป้า</button>${g.status==='active'?`<button class="button button-plain" data-action="goal-status" data-status="paused" data-id="${e(g.id)}">พัก</button>`:g.status==='paused'?`<button class="button button-plain" data-action="goal-status" data-status="active" data-id="${e(g.id)}">ทำต่อ</button>`:''}${g.status==='active'||g.status==='paused'?`<button class="button button-plain" data-action="goal-status" data-status="completed" data-id="${e(g.id)}">จบเป้าหมาย</button>`:''}<button class="button button-plain danger" data-action="goal-delete" data-id="${e(g.id)}">ลบ</button></div></article>`;}).join('');
   return `<section class="goal-hero"><div><h2>จากข้อมูล → สู่แผนที่ทำได้จริง</h2><p>วางเป้าหมายจากประวัติที่บันทึก แล้วติดตามผลทีละสัปดาห์ · ทุกข้อเสนอให้คุณเป็นคนตัดสินใจ</p></div><button class="button button-accent" data-action="goal-new">${ic('plus',17)} สร้างเป้าหมายเอง</button></section>
   <div class="goal-overview"><div><span>เป้าหมายที่ติดตาม</span><strong>${active.length}</strong></div><div><span>เป้าหมายที่จบแล้ว</span><strong>${complete.length}</strong></div><div><span>ข้อเสนอที่เลือกใช้ได้</span><strong>${items.length}</strong></div></div>
   <section class="panel goal-list-section">${sectionHead('เป้าหมายส่วนตัว','คำนวณจากบันทึกจริงหลังวันเริ่มเป้าหมาย ไม่เพิ่มข้อมูลของวันที่ไม่ได้บันทึก')}<div class="goals-controls"><button class="goal-filter ${ui.goalStatusFilter==='active'?'active':''}" data-action="goal-filter" data-value="active">กำลังติดตาม</button><button class="goal-filter ${ui.goalStatusFilter==='completed'?'active':''}" data-action="goal-filter" data-value="completed">สำเร็จ</button><button class="goal-filter ${ui.goalStatusFilter==='all'?'active':''}" data-action="goal-filter" data-value="all">ทั้งหมด</button></div><div class="goal-card-grid">${goalsHtml||empty('target','ไม่มีเป้าหมายในหมวดนี้','เลือกคำแนะนำด้านล่าง หรือสร้างเป้าหมายเอง')}</div></section>
   <section class="panel goal-recommendations">${sectionHead('แนวทางที่ระบบเสนอ','อ้างอิงข้อมูลล่าสุด 14 วัน · หากข้อมูลน้อยจะเสนอให้บันทึกก่อน ไม่รีบสรุปสาเหตุ')}<div class="goal-card-grid">${recs||'<p class="small-muted">ข้อเสนอที่เหมาะสมถูกนำไปตั้งเป้าหมายแล้ว หรือยังไม่มีข้อมูลใหม่</p>'}</div></section>
   <div class="insight-inline">${ic('info',18)}<p>ข้อเสนอไม่ใช่การวินิจฉัยหรือแผนการรักษา ค่าเป้าหมายปรับได้เอง และระบบไม่รับรองผลลัพธ์ ข้อมูลจากอุปกรณ์สวมใส่เป็นค่าประมาณ</p></div>`;
 }
 function openGoal(g=null,suggestion=null){
   const kind=g?.kind||suggestion?.kind||'sleep',spec=G.KINDS[kind],date=C.today(),end=C.shift(date,13);
   const target=g?.target??suggestion?.target??spec.min;
   showModal(g?'แก้ไขเป้าหมาย':'สร้างเป้าหมายส่วนตัว',`<form id="goal-form" data-id="${e(g?.id||'')}"><div class="form-grid"><label class="field"><span>ประเภทเป้าหมาย</span><select name="kind" id="goal-kind" ${g?'disabled':''}>${Object.entries(G.KINDS).map(([key,v])=>option(key,v.label,kind)).join('')}</select></label><label class="field"><span>ชื่อเป้าหมาย</span><input name="title" required maxlength="100" value="${e(g?.title||suggestion?.title||spec.label)}" /></label><div class="form-grid two"><label class="field"><span id="goal-target-label">ค่าเป้าหมาย (${e(spec.unit)})</span><input name="target" id="goal-target" type="number" required min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${e(target)}" /></label><label class="field"><span>สถานะ</span><input value="${e(g?.status==='paused'?'พักอยู่':g?.status==='completed'?'เสร็จสิ้น':'กำลังติดตาม')}" disabled /></label></div><div class="form-grid two"><label class="field"><span>เริ่มวันที่</span><input name="startDate" type="date" required value="${e(g?.startDate||date)}" max="${date}" /></label><label class="field"><span>วันที่ประเมินผล</span><input name="endDate" type="date" required value="${e(g?.endDate||end)}" /></label></div><label class="field"><span>แนวทางที่อยากทดลอง (ไม่บังคับ)</span><textarea name="note" rows="3" maxlength="600">${e(g?.note||suggestion?.reason||'')}</textarea></label></div><p class="form-help">ระบบจะติดตามข้อมูลจากวันเริ่มเป้าหมาย โดยไม่บันทึกค่าของวันที่ไม่มีข้อมูล และจะไม่ทำเครื่องหมายว่าสำเร็จให้เอง</p>${modalButtons(g?'อัปเดตเป้าหมาย':'เริ่มติดตามเป้าหมาย')}</form>`,'เปลี่ยนเป้าหมายได้เสมอโดยไม่เขียนทับประวัติการนอนและการฝึก');
 }
 function openGoalReview(g){
   const p=G.progress(g,state);
   showModal('ทบทวนเป้าหมาย',`<form id="goal-review-form" data-id="${e(g.id)}"><div class="goal-review-kpi"><strong>${p.value===null?'ยังไม่มีข้อมูล':n(p.value,1)+' '+e(p.unit)}</strong><small>เป้าหมาย ${e(n(g.target,1))} ${e(p.unit)} · ${e(p.window)}</small></div><div class="form-grid"><label class="field"><span>ความรู้สึกต่อความคืบหน้า</span><select name="rating">${[1,2,3,4,5].map(v=>option(v,`${v}/5`,3)).join('')}</select></label><label class="field"><span>สิ่งที่ได้ลองปรับ / ข้อสังเกต</span><textarea name="note" required maxlength="300" rows="4" placeholder="เช่น ลองนอนเร็วขึ้น 15 นาที และตื่นสดชื่นกว่าเดิม"></textarea></label></div>${modalButtons('บันทึกการทบทวน')}</form>`,'บันทึกความคิดเห็นของคุณ ไม่แทนข้อมูลที่วัดได้จริง');
 }
 function insights(){
   const result=I.assemble(state,{days:ui.insightsDays}),domains=result.domains;
   const headings={sleep:['การนอน','moon','เวลานอน · ช่วงการนอน'],nutrition:['อาหารและพลังงาน','utensils','แคลอรี่ · โปรตีน'],weight:['น้ำหนักและเป้าหมาย','target','น้ำหนักเฉลี่ย · การเปลี่ยนแปลง'],workout:['การฝึกและกล้ามเนื้อ','dumbbell','Training Volume · RPE'],running:['การวิ่ง','route','ระยะทาง · Pace'],recovery:['การพักฟื้น','sparkles','พลังงาน · ความเหนื่อย'],cross:['ความสัมพันธ์ระหว่างข้อมูล','chart','Sleep × Recovery']};
   const stats=[
    ['sleep',domains.sleep.averageMinutes===null?'—':`${n(domains.sleep.averageMinutes/60,1)} ชม.`,'เวลานอนเฉลี่ย',`${domains.sleep.count}/${result.days} คืน`],
    ['nutrition',domains.nutrition.averageKcal===null?'—':`${n(domains.nutrition.averageKcal)} kcal`,'อาหารเฉลี่ย',`${domains.nutrition.count}/${result.days} วัน`],
    ['weight',domains.weight.averageKg===null?'—':`${n(domains.weight.averageKg,1)} kg`,'น้ำหนักเฉลี่ย',`${domains.weight.count} วัน`],
    ['workout',`${n(domains.workout.count)}`,'Session การฝึก',`${n(domains.workout.sets)} เซตที่บันทึก`],
    ['running',`${n(domains.running.totalKm,1)} km`,'ระยะทางวิ่ง',`${domains.running.count} ครั้ง`],
    ['recovery',domains.recovery.energy===null?'—':`${n(domains.recovery.energy,1)}/5`,'ความสดชื่นเฉลี่ย',`${domains.recovery.count} Check-in`]
   ];
   const dots={high:'ควรให้ความสำคัญ',mid:'ควรทบทวน',positive:'แนวโน้มเชิงบวก',info:'ข้อสังเกต'};
   const focuses=['all','sleep','nutrition','weight','workout','running','recovery','cross'];
   const visible=ui.insightsFocus==='all'?result.observations:result.observations.filter(item=>item.domain===ui.insightsFocus);
   function observationCard(o,index){return `<article class="deep-observation deep-${o.severity}"><div class="deep-observation-top"><span class="deep-domain">${ic(headings[o.domain][1],15)} ${e(headings[o.domain][0])}</span><span class="deep-status">${e(dots[o.severity])}</span></div><h3>${e(o.title)}</h3><div class="deep-evidence"><strong>สิ่งที่ข้อมูลบอก</strong><p>${e(o.evidence)}</p></div><div class="deep-next"><span>${ic('arrow',16)} แนวทางถัดไป</span><p>${e(o.next)}</p></div><div class="deep-footer"><span>ความเชื่อมั่น: ${e(o.confidence)}</span><span>จากข้อมูลที่คุณบันทึก</span></div></article>`;}
   function chartFor(key){const d=domains[key],opts={sleep:['ชั่วโมง/คืน',7],nutrition:['kcal/วัน',d.target],weight:['kg',d.targetKg],workout:['kg·reps',null],running:['km/วัน',null],recovery:['ระดับความสดชื่น 1–5',null]}[key];return `<div class="deep-chart-head"><strong>${e(headings[key][0])}</strong><span>${e(headings[key][2])}</span></div><div class="deep-chart-body">${C.lineChart(d.trend,{label:opts[0],target:opts[1]})}</div><p class="deep-chart-note">${key==='sleep'?'ค่าเป้าหมายบนกราฟคือขั้นต่ำ 7 ชม./คืน':key==='nutrition'?'เฉลี่ยเฉพาะวันที่มีการบันทึกอาหาร':key==='weight'?'กราฟใช้บันทึกล่าสุดของแต่ละวัน':key==='workout'?'แสดงเฉพาะเซตที่บันทึกจริง ไม่ใช่ท่าที่วางแผนไว้':key==='running'?'ระยะทางจากบันทึกที่กรอกเอง ไม่ใช่ GPS': 'แสดงเฉพาะวันที่ทำ Check-in'}</p>`;}
   const last=domains.sleep.latest,stages=domains.sleep.latestStage;
   const stageContent=stages?`<div class="deep-stage-band">${stages.values.map((v,i)=>v.minutes!==null?`<span class="deep-stage-${v.key}" style="width:${Math.min(100,Math.max(0,v.minutes/stages.duration*100))}%" title="${v.key}: ${Math.round(v.minutes)} นาที"></span>`:'').join('')}${stages.missing>0?`<span class="deep-stage-missing" style="width:${100*stages.missing/stages.duration}%" title="ไม่ระบุ"></span>`:''}</div><div class="deep-stage-legend">${stages.values.map(v=>`<div><span class="deep-dot deep-stage-${v.key}"></span>${e(v.key==='deep'?'หลับลึก':v.key==='light'?'หลับตื้น':'REM')} <b>${v.minutes===null?'—':`${n(v.minutes/stages.duration*100,1)}%`}</b> <small>${v.minutes===null?'ไม่ระบุ':`${n(v.minutes,0)} นาที`}</small></div>`).join('')}</div>`:empty('moon','ยังไม่มีข้อมูลช่วงการนอน','กรอก Deep/Light/REM เป็นเปอร์เซ็นต์หรือนาทีที่หน้าการนอน');
   return `<section class="deep-intro"><div class="deep-intro-main"><div class="deep-visual-icon">${ic('chart',27)}</div><h2>จากข้อมูลที่บันทึก<br><em>สู่แนวทางที่ทำได้จริง</em></h2><p>เปรียบเทียบการนอน การฝึก อาหาร การวิ่ง น้ำหนัก และความรู้สึก โดยแยกหลักฐานออกจากข้อสังเกต เพื่อช่วยให้คุณตัดสินใจว่าจะปรับอะไรต่อ</p><div class="deep-intro-meta"><span>${ic('calendar',15)} ${e(fmt(result.from))} – ${e(fmt(result.asOf))}</span><span>${ic('check',15)} มีข้อมูล ${result.summary.domainsWithData} จาก 6 หมวด</span></div></div><div class="deep-intro-side"><span>YOUR INSIGHTS</span><strong>${result.observations.length}</strong><small>ข้อสังเกตจากข้อมูล</small><div>${result.summary.high?`${result.summary.high} ประเด็นที่ควรให้ความสำคัญ`:'อ่านแนวโน้มร่วมกับความรู้สึกจริง'}</div></div></section>
   <div class="deep-controls"><div><strong>ช่วงเวลาที่วิเคราะห์</strong><small>ไม่รวมวันที่ไม่มีบันทึกเป็นศูนย์</small></div><div class="deep-periods">${[7,14,30].map(days=>`<button type="button" class="deep-period ${ui.insightsDays===days?'selected':''}" data-action="insights-days" data-value="${days}" aria-pressed="${ui.insightsDays===days}">${days} วัน</button>`).join('')}</div></div>
   <div class="deep-summary">${stats.map(([key,value,label,source])=>`<article><div class="deep-stat-head">${ic(headings[key][1],18)} <span>${e(label)}</span></div><strong>${e(value)}</strong><small>${e(source)}</small></article>`).join('')}</div>
   <div class="deep-analysis-grid"><section class="panel deep-sleep-feature">${sectionHead('เจาะลึกการนอน',last?`บันทึกล่าสุด ${fmt(last.date)} · ${domains.sleep.range.label}`:'ยังไม่มีบันทึกการนอนในช่วงนี้',`<button class="text-link" data-route="sleep">บันทึกการนอน ${ic('arrow',15)}</button>`)}<div class="deep-sleep-main"><div><span>คืนล่าสุด</span><strong>${last?`${n(C.sleepDuration(last)/60,1)} <small>ชั่วโมง</small>`:'—'}</strong><p>เป้าหมายที่ตั้งไว้: ${n(domains.sleep.goalMinutes/60,1)} ชม. · แนะนำขั้นต่ำสำหรับผู้ใหญ่: 7 ชม.</p></div><div class="deep-sleep-big">${domains.sleep.count?`${domains.sleep.shortNights}<small>/${domains.sleep.count}</small>`:'—'}<span>คืนที่นอนต่ำกว่า 7 ชม.</span></div></div><div class="deep-stage-title">${ic('moon',17)} สัดส่วนช่วงการนอนล่าสุด</div>${stageContent}<div class="deep-stage-caution">${ic('info',17)} <span>นาฬิกาประเมินช่วงการนอนคลาดเคลื่อนได้ จึงไม่ตัดสินคุณภาพการฟื้นตัวจาก Deep/REM/Light เพียงคืนเดียว และการนอนหลับตื้นเป็นส่วนหนึ่งของวงจรการนอนปกติ</span></div></section>
   <section class="panel deep-next-panel">${sectionHead('เรื่องที่ควรเริ่มปรับก่อน','เลือกจากข้อมูลที่มี ไม่ใช่คำสั่งอัตโนมัติ')}${result.observations.filter(x=>['high','mid'].includes(x.severity)).slice(0,3).length?result.observations.filter(x=>['high','mid'].includes(x.severity)).slice(0,3).map((o,i)=>`<div class="deep-priority"><span>0${i+1}</span><div><strong>${e(o.title)}</strong><p>${e(o.next)}</p></div></div>`).join(''):`<div class="deep-priority"><span>${ic('info',16)}</span><div><strong>เริ่มจากเก็บข้อมูลอย่างสม่ำเสมอ</strong><p>เมื่อมีบันทึกหลายวัน ระบบจะช่วยสรุปแนวโน้มและประเด็นที่ควรทบทวนได้ละเอียดขึ้น</p></div></div>`}<div class="deep-limits">ข้อสังเกตจากการกรอกเอง ไม่ใช่คะแนนสุขภาพ การวินิจฉัย หรือคำสั่งเพิ่มความหนัก/ปรับแคลอรี่</div></section></div>
   <section class="panel deep-insight-library">${sectionHead('รายงานวิเคราะห์และแนวทางถัดไป',`${result.observations.length} ข้อสังเกต · เลือกเจาะลึกแต่ละหมวดได้`)}<div class="deep-filters" role="group" aria-label="กรองหมวดวิเคราะห์">${focuses.map(key=>`<button class="deep-filter ${ui.insightsFocus===key?'active':''}" data-action="insights-focus" data-value="${key}" aria-pressed="${ui.insightsFocus===key}">${key==='all'?'ทั้งหมด':e(headings[key][0])}</button>`).join('')}</div><div class="deep-observations">${visible.map(observationCard).join('')||'<p class="small-muted">ยังไม่มีข้อสังเกตสำหรับหมวดนี้</p>'}</div></section>
   <section class="panel deep-trends">${sectionHead('กราฟข้อมูลย้อนหลัง','ใช้ข้อมูลที่บันทึกจริงเท่านั้น ไม่สร้างค่าของวันที่ไม่มีข้อมูล',`<button class="text-link" data-route="workoutAnalytics">วิเคราะห์การฝึกรายท่า ${ic('arrow',15)}</button>`)}<div class="deep-trend-grid">${['sleep','nutrition','weight','workout','running','recovery'].filter(key=>ui.insightsFocus==='all'||ui.insightsFocus==='cross'||ui.insightsFocus===key).map(key=>`<article class="deep-chart-panel">${chartFor(key)}</article>`).join('')||'<p class="small-muted">กรุณาเลือกหมวดที่มีกราฟ</p>'}</div></section>
   <section class="panel deep-data-quality">${sectionHead('ความครบถ้วนและข้อจำกัดของข้อมูล','ข้อมูลน้อยหมายถึงข้อสังเกตมีความไม่แน่นอนสูง')}<div class="deep-coverage-grid">${[['sleep','คืน'],['nutrition','วัน'],['weight','วัน'],['recovery','วัน']].map(([key,unit])=>{const d=domains[key],v=d.coverage;return `<div><div class="deep-quality-label"><strong>${e(headings[key][0])}</strong><span>${v.count}/${v.total} ${unit}</span></div><div class="deep-quality-track"><span style="width:${v.percent}%"></span></div><small>ความมั่นใจของข้อมูล: ${e(v.level)}</small></div>`;}).join('')}</div><p>การประเมินนี้อ้างอิงความครบถ้วนของการบันทึกเท่านั้น ไม่ใช่ความแม่นยำทางการแพทย์ของอุปกรณ์หรือความแน่นอนของความสัมพันธ์</p><div class="deep-source-links"><a href="https://www.cdc.gov/sleep/about/" target="_blank" rel="noopener noreferrer">CDC — ระยะเวลาการนอนตามอายุ ↗</a><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11511193/" target="_blank" rel="noopener noreferrer">การศึกษาความแม่นยำของ Wearables ↗</a></div></section>`;
 }

 function workoutAnalytics(){
   const report=WA.analyse(state,{days:ui.analyticsDays}),list=report.exercises;
   if(!list.some(x=>x.key===ui.analyticsExercise))ui.analyticsExercise=list[0]?.key||'';
   const selected=list.find(x=>x.key===ui.analyticsExercise);
   const maxWeekly=Math.max(1,...report.weeks.map(x=>x.sets));
   const groupMax=Math.max(1,...report.muscles.map(x=>x.sets));
   const metric=(label,value,description,icon)=>`<article class="panel wa-stat"><div class="wa-stat-label">${ic(icon,19)} <span>${e(label)}</span></div><strong>${e(value)}</strong><small>${e(description)}</small></article>`;
   const kindLabel=item=>item.measure==='time'?'จับเวลา':item.loadType==='external'?'อุปกรณ์/น้ำหนัก':'น้ำหนักตัว/นับครั้ง';
   const displayBest=item=>item.measure==='time'?C.formatDuration(item.maxSeconds):item.loadType==='external'?`${n(item.maxLoad,1)} kg`:`${n(item.maxReps)} ครั้ง`;
   const nextLabel=selected?.measure==='time'?'เวลาที่มากที่สุดในวัน':selected?.loadType==='external'?'น้ำหนักสูงสุดของวัน':'จำนวนครั้งสูงสุดของวัน';
   const chart=selected?C.lineChart(selected.byDate.map(d=>({date:d.date,value:selected.measure==='time'?d.bestSeconds:selected.loadType==='external'?d.bestLoad:d.bestReps})),{label:nextLabel}):'<div class="chart-empty">ยังไม่มีข้อมูลสำหรับเลือกท่า</div>';
   const activeSessionHint=report.sessions>report.activeSessions?` · อีก ${report.sessions-report.activeSessions} Session ยังไม่มีเซตที่ยืนยัน`:'';
   return `<div class="wa-header"><div><h2>พัฒนาการฝึกของคุณ</h2><p>วิเคราะห์เฉพาะเซตที่กด “ทำแล้ว” ไม่รวม Warm-up และไม่ใช้เซตในเทมเพลตมาสมมติว่าออกกำลังกายแล้ว</p></div><button class="button button-outline" data-route="workouts">${ic('dumbbell',16)} ไปบันทึกการฝึก</button></div>
   <div class="wa-timebar"><div><strong>ช่วงข้อมูลย้อนหลัง</strong><small>${fmt(report.from)} – ${fmt(report.asOf)}</small></div><div class="wa-range-buttons">${[30,90,180].map(days=>`<button class="deep-period ${ui.analyticsDays===days?'selected':''}" data-action="wa-range" data-value="${days}" aria-pressed="${ui.analyticsDays===days}">${days} วัน</button>`).join('')}</div></div>
   <div class="wa-kpis">${metric('เซตที่ทำจริง',`${n(report.workSets)} เซต`,`จาก ${report.loggedDays} วันฝึก${activeSessionHint}`,'check')}${metric('Volume (อุปกรณ์)',`${n(report.volume,1)}`, 'kg × ครั้ง · เฉพาะท่าถ่วงน้ำหนัก','dumbbell')}${metric('จำนวนครั้งน้ำหนักตัว',`${n(report.bodyweightReps)}`,'ไม่ประเมินน้ำหนักตัวเป็น kg','target')}${metric('เวลาท่าจับเวลา',`${n(report.timedSeconds/60,1)} นาที`,'นับเฉพาะเซตที่ทำจริง','clock')}</div>
   <div class="wa-analysis-grid"><section class="panel wa-week-panel">${sectionHead('ความสม่ำเสมอรายสัปดาห์','จำนวนเซตที่ยืนยันแล้ว · สัปดาห์จันทร์–อาทิตย์')}<div class="wa-weeks">${report.weeks.map(w=>`<div class="wa-week"><span class="wa-week-value">${w.sets||'—'}</span><div class="wa-week-track"><span style="height:${w.sets?Math.max(4,Math.round(w.sets/maxWeekly*100)):0}%"></span></div><small>${C.shortDate(w.start)}</small><span class="wa-week-day">${w.days} วัน</span></div>`).join('')}</div><p class="wa-help">แท่งจำนวนเซตเป็นภาพรวม ไม่ใช่เกณฑ์ว่าควรฝึกหนักขึ้นหรือน้อยลง สัปดาห์ปัจจุบันยังไม่ครบ</p></section>
   <section class="panel wa-muscle-panel">${sectionHead('สัดส่วนเซตตามกลุ่มท่า','จัดกลุ่มจากชื่อท่าและประเภทวันฝึกโดยประมาณ ไม่ใช่ปริมาณที่กล้ามเนื้อได้รับจริง')}${report.muscles.length?`<div class="wa-muscle-list">${report.muscles.map(g=>`<div class="wa-muscle-row"><span>${e(g.label)}</span><div class="wa-bar"><span style="width:${g.sets/groupMax*100}%"></span></div><b>${g.sets} เซต</b></div>`).join('')}</div>`:empty('dumbbell','ยังไม่มีข้อมูล','เริ่มบันทึกเซตจริงใน Workout Planner')}</section></div>
   <section class="panel wa-exercises">${sectionHead('ความแข็งแรงรายท่า & Personal Best','เลือกท่าที่เคยทำเพื่อเปรียบเทียบค่าสูงสุดและรายละเอียดต่อวัน')}
   ${list.length?`<div class="wa-exercise-control"><label for="wa-exercise-select">ท่าที่ต้องการวิเคราะห์</label><select id="wa-exercise-select" class="wa-select">${list.map(ex=>option(ex.key,`${ex.name} · ${ex.setCount} เซต`,ui.analyticsExercise)).join('')}</select></div>`:''}
   ${selected?`<div class="wa-detail-head"><div><h3>${e(selected.name)}</h3><span>${e(kindLabel(selected))} · ${selected.days} วันฝึก · ${selected.setCount} เซต</span></div><div class="wa-best"><small>Personal Best ในช่วงนี้</small><strong>${e(displayBest(selected))}</strong></div></div>
   <div class="wa-mini-kpis">${metric('จำนวนครั้งรวม',`${n(selected.totalReps)} ครั้ง`,'สำหรับท่านับครั้ง','check')}${metric('เวลาออกแรงรวม',`${n(selected.totalSeconds/60,1)} นาที`,'สำหรับท่าจับเวลา','clock')}${metric('Volume ของท่านี้',`${n(selected.volume,1)}`,'kg × ครั้ง เฉพาะอุปกรณ์','dumbbell')}${metric('Estimated 1RM',selected.maxEst1RM?`${n(selected.maxEst1RM,1)} kg`:'—','ประมาณด้วยสูตร Epley เมื่อ ≤ 10 reps','chart')}</div>
   <div class="wa-line-area"><div class="wa-line-title"><strong>${e(nextLabel)}</strong><span>ค่าสูงสุดของแต่ละวันที่บันทึก</span></div>${chart}</div>
   <div class="wa-exercise-note"><strong>${selected.days>=3?(selected.direction==='up'?'แนวโน้มเพิ่มขึ้น':selected.direction==='down'?'ผลล่าสุดต่ำกว่าครั้งแรก':'ค่าสูงสุดทรงตัว'):'รอข้อมูลเพิ่ม'}:</strong> ${e(selected.detail)} · การเปลี่ยนแปลงอาจเกี่ยวกับจำนวนครั้ง เทคนิค อุปกรณ์ ความเหนื่อย และระยะพัก จึงไม่ใช่ข้อสรุปสุขภาพ</div>
   <div class="wa-history-wrap"><table class="wa-table"><thead><tr><th>วันที่</th><th>เซต</th><th>จำนวนครั้งสูงสุด</th><th>น้ำหนักสูงสุด</th><th>เวลาสูงสุด</th><th>Volume</th></tr></thead><tbody>${selected.byDate.slice().reverse().slice(0,20).map(d=>`<tr><td>${fmt(d.date)}</td><td>${n(d.sets)}</td><td>${d.bestReps?n(d.bestReps):'—'}</td><td>${selected.loadType==='external'?`${n(d.bestLoad,1)} kg`:'—'}</td><td>${d.bestSeconds?C.formatDuration(d.bestSeconds):'—'}</td><td>${n(d.volume,1)}</td></tr>`).join('')}</tbody></table></div>`:empty('chart','ยังไม่มีสถิติรายท่า','เมื่อบันทึกเซตจริงแล้วจะเริ่มเห็นกราฟ Personal Best และตารางย้อนหลัง')}
   </section>
   <section class="panel wa-recommendations">${sectionHead('ข้อสังเกตและแนวทางถัดไป','อ้างอิงเฉพาะข้อมูลที่บันทึก ไม่ใช่คำสั่งให้เพิ่มน้ำหนักหรือฝึกหนักขึ้น')}<div class="wa-notes">${report.notes.map(x=>`<article class="wa-note"><div class="wa-note-icon">${ic(x.level==='good'?'check':'info',17)}</div><div><h3>${e(x.title)}</h3><p>${e(x.evidence)}</p><div><b>ลองทำต่อ:</b> ${e(x.next)}</div></div></article>`).join('')}</div><div class="wa-disclaimer">ข้อจำกัด: Volume เป็น kg × reps เฉพาะน้ำหนักอุปกรณ์; ไม่เทียบตรงกับท่าน้ำหนักตัวหรือจับเวลา · Estimated 1RM เป็นเพียงค่าประมาณ · กล้ามเนื้อจัดกลุ่มจากชื่อท่าจึงอาจไม่ตรงทุกกรณี · ไม่ได้ประเมินการบาดเจ็บหรือความพร้อมทางการแพทย์</div></section>`;
 }
 // Repaint only the affected reports when the category changes. Keep the filter DOM,
 // keyboard focus, horizontal filter scroll, and document's current reading position.
 function setInsightsFocus(value){
   if(!['all','sleep','nutrition','weight','workout','running','recovery','cross'].includes(value))return;
   ui.insightsFocus=value;
   const library=document.querySelector('.deep-insight-library'),trends=document.querySelector('.deep-trends');
   if(route!=='insights'||!library||!trends){render(true);return;}
   const oldTop=library.getBoundingClientRect().top;
   const fresh=document.createElement('div');fresh.innerHTML=insights();
   const newObservations=fresh.querySelector('.deep-observations'),newTrends=fresh.querySelector('.deep-trend-grid');
   if(!newObservations||!newTrends){render(true);return;}
   library.querySelector('.deep-observations').replaceWith(newObservations);
   trends.querySelector('.deep-trend-grid').replaceWith(newTrends);
   library.querySelectorAll('.deep-filter').forEach(btn=>{const on=btn.dataset.value===value;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));});
   // Preserve location if browser scroll anchoring adjusts for cards disappearing.
   const delta=library.getBoundingClientRect().top-oldTop;
   if(Math.abs(delta)>1)window.scrollBy(0,delta);
 }

 function dashboard(m){
   const today=C.today(),food=C.foodTotals(C.mealsFor(state,today));const target=m.target||0,percent=target?C.clamp(food.kcal/target*100,0,100):0;
   const todayDay=C.planOn(state,today),todayDone=state.sessions.some(s=>s.date===today),sleep=C.recentSleep(state,7).at(-1);
   const week=C.weekDates(today);const calMax=Math.max(2500,target, ...week.map(d=>C.foodTotals(C.mealsFor(state,d)).kcal));
   return `${dailyExperiencePanel(today,todayDay)}<div class="dashboard-hero"><div class="hero-copy"><div class="hero-date">${ic('sparkles',16)} ${e(new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long'}))}</div><h2>สร้างจังหวะที่ใช่<br><em>ในแบบของคุณ</em></h2><p>จัดสมดุลการฝึก อาหาร และการพักผ่อน ผ่านข้อมูลที่คุณเลือกบันทึกเอง</p><div class="hero-actions"><button class="button button-accent" data-action="hero-workout">${ic('dumbbell',18)} ดูแผนวันนี้</button><button class="button button-hero-light" data-action="hero-food">${ic('utensils',17)} บันทึกอาหาร</button></div></div><div class="hero-visual"><div class="hero-arc hero-arc-a"></div><div class="hero-arc hero-arc-b"></div><div class="hero-visual-inner"><small>YOUR CURRENT FOCUS</small><strong>${e(D.GOALS[state.profile.goal]?.title||'กำหนดเป้าหมาย')}</strong><div class="hero-visual-stat"><span>${m.ready?n(m.weight,1):'—'}<small> kg ปัจจุบัน</small></span><span>${state.profile.targetWeight?n(state.profile.targetWeight,1):'—'}<small> kg เป้าหมาย</small></span></div><span class="hero-visual-caption">ค่อย ๆ ปรับให้เหมาะกับตัวเอง</span></div></div></div>
   ${trendCards(m)}
   <div class="dashboard-duo"><section class="panel calorie-panel">${sectionHead('พลังงานวันนี้', 'บันทึกอาหารเทียบกับเป้าหมายที่คุณกำหนด',`<button class="text-link" data-action="hero-food">ไปหน้าอาหาร ${ic('arrow',15)}</button>`)}<div class="calorie-summary"><div class="energy-ring" style="--progress:${percent}%"><div class="energy-ring-inner"><span>รับประทานแล้ว</span><strong>${n(food.kcal)}</strong><small>kcal</small></div></div><div class="calorie-breakdown"><div class="energy-goal"><span>เป้าหมายพลังงาน</span><strong>${target?n(target):'—'} <small>kcal</small></strong></div>${macroRow('โปรตีน',food.protein,m.protein||0,'protein')}${macroRow('คาร์โบไฮเดรต',food.carbs,m.carbs||0,'carbs')}${macroRow('ไขมัน',food.fat,m.fat||0,'fat')}${food.estimatedItems?`<p class="food-macro-warning">${ic('info',15)} ${food.estimatedItems} รายการมี Macro โดยประมาณจากระบบ ควรตรวจส่วนผสมและฉลากจริง</p>`:''}${food.macroIncomplete?`<p class="food-macro-warning">${ic('info',14)} Macro ไม่ครบ ${food.incompleteItems} รายการ · แสดงเฉพาะค่าที่ทราบ ยังเทียบเป้าหมายไม่ได้</p>`:''}<p class="small-muted">${m.ready?`เป้าหมาย = TDEE ${m.adjust>=0?'+':''}${m.adjust} kcal`:'กรอกโปรไฟล์ก่อนเพื่อดูเป้าหมาย'}</p></div></div></section>
     <section class="panel today-plan">${sectionHead('แผนของวันนี้','ปรับหรือบันทึกการฝึกได้ทุกวัน',`<button class="text-link" data-route="workouts">จัดตาราง ${ic('arrow',15)}</button>`)}<div class="plan-feature"><div class="plan-feature-icon" style="--type-color:${D.TYPES[todayDay.type].color}">${ic(todayDay.type==='rest'?'moon':'dumbbell',28)}</div><div><span class="section-overline">${D.DAYS_FULL[C.weekday(today)]}</span><h3>${e(todayDay.title)}</h3><p>${e(D.TYPES[todayDay.type].desc)}</p></div></div><div class="plan-divider"></div><div class="today-plan-meta"><span>${ic('dumbbell',16)} ${todayDay.exercises.length} ท่า</span><span>${ic('check',16)} ${todayDone?'บันทึกแล้ว':'ยังไม่บันทึกวันนี้'}</span></div><button class="button ${todayDone?'button-outline':'button-dark'} full" data-action="today-workout">${todayDone?'ดู / แก้ไขบันทึก':'บันทึกการฝึกวันนี้'} ${ic('arrow',16)}</button></section></div>
   <div class="dashboard-duo bottom-duo"><section class="panel">${sectionHead('ภาพรวมอาหาร 7 วัน', 'แสดงเฉพาะวันที่มีการบันทึก ไม่ตีความเป็นวันอดอาหาร')}<div class="bar-chart">${week.map((d)=>{const f=C.foodTotals(C.mealsFor(state,d)),has=C.mealsFor(state,d).length>0;return `<div class="bar-col"><div class="bar-outer"><div class="bar-track"><div class="bar-fill ${has?'':'no-data'}" style="height:${has?Math.max(3,Math.min(100,f.kcal/calMax*100)):0}%" title="${has?`${n(f.kcal)} kcal`:'ไม่มีข้อมูล'}"></div>${target?`<div class="bar-target" style="bottom:${target/calMax*100}%"></div>`:''}</div></div><strong>${d===today?'วันนี้':D.DAYS[C.weekday(d)]}</strong></div>`;}).join('')}</div><div class="chart-key"><span><i class="key-fill"></i> แคลอรี่ที่บันทึก</span>${target?'<span><i class="key-dash"></i> เป้าหมาย</span>':''}</div></section>
     <section class="panel recovery-panel">${sectionHead('ฟื้นตัวให้ทันความตั้งใจ', 'ความต่อเนื่องและเวลาพักสำคัญพอกับการฝึก')}<div class="recovery-row"><div class="recovery-icon">${ic('moon',25)}</div><div><small>คืนล่าสุดที่บันทึก</small><strong>${sleep?formatHour(C.sleepDuration(sleep)):'ยังไม่มีข้อมูล'}</strong><span>${sleep?fmt(sleep.date):'เพิ่มบันทึกการนอนเพื่อเริ่มวิเคราะห์'}</span></div></div><div class="recovery-row"><div class="recovery-icon recovery-green">${ic('target',25)}</div><div><small>การฝึกครบตามแผนใน 7 วัน</small><strong>${C.workoutStats(state).completed} / ${C.workoutStats(state).planned} วัน</strong><span>วันพักไม่ถูกนับเป็นวันที่พลาดการฝึก</span></div></div><button class="button button-outline full" data-route="recovery">ดู Recovery & Lifestyle ${ic('arrow',16)}</button></section></div>
   <div class="goal-dashboard-prompt">${ic('target',19)} <span>พร้อมเปลี่ยนผลวิเคราะห์ให้เป็นแผนที่ทำได้จริงหรือยัง?</span><button class="button button-outline" data-route="goals">ดูเป้าหมายอัจฉริยะ ${ic('arrow',14)}</button></div><div class="insight-inline">${ic('info',18)}<p><b>จำไว้ว่า:</b> TDEE และสารอาหารเป็นค่าประมาณ เริ่มจากการบันทึกอย่างต่อเนื่อง แล้วปรับตามแนวโน้มจริงของคุณ</p></div>`;
 }
 function openDailyMealPicker(){
   const date=C.today(),suggested=Daily.topRepeated(state,date,8),t=templates();
   showModal('เพิ่มอาหารวันนี้ให้เร็วขึ้น',`<div class="daily-picker"><p class="form-help">เลือกมื้อหรืออาหารที่กินจริงวันนี้เพื่อคัดลอกค่าจากครั้งก่อน · ทุกการเพิ่มต้องยืนยันก่อนบันทึก</p>
     <div class="daily-picker-actions"><button type="button" class="button button-dark" data-action="daily-meal-new">${ic('plus',16)} เพิ่มอาหารใหม่ / ค้นหาคลังอาหาร</button><button type="button" class="button button-outline" data-action="daily-copy-meal">${ic('calendar',16)} ใช้มื้อก่อนหน้า</button></div>
     ${t.length?`<h3>Meal Templates</h3><div class="daily-picker-list">${t.slice(0,12).map(x=>`<button data-action="daily-template" data-id="${e(x.id)}"><strong>${e(x.name)}</strong><small>${e(D.MEALTYPES[x.meal])} · ${x.items.length} รายการ</small>${ic('plus',16)}</button>`).join('')}</div>`:''}
     ${suggested.length?`<h3>เมนูที่เคยกิน</h3><div class="daily-picker-list">${suggested.map(x=>`<button data-action="daily-repeat" data-id="${e(x.row.id)}"><strong>${e(x.row.name)}</strong><small>${n(x.row.servings,2)} × ${e(x.row.unit||'เสิร์ฟ')} · ${n(x.row.kcal*x.row.servings)} kcal</small>${ic('plus',16)}</button>`).join('')}</div>`:''}
   </div>`,'ทุกตัวเลขเป็นค่าตั้งต้นจากบันทึกเดิม · ตรวจปริมาณก่อนยืนยัน');
 }
 function openDailyCopyPicker(){
   const date=C.today(),options=Object.keys(D.MEALTYPES).map(type=>({type,rows:Daily.lastSameMeal(state,date,type)})).filter(x=>x.rows.length);
   if(!options.length){ui.foodDate=date;openDailyMealPicker();toast('ยังไม่มีมื้อก่อนหน้าให้คัดลอก');return;}
   showModal('คัดลอกมื้ออาหารที่เคยบันทึก',`<div class="daily-picker"><p class="form-help">เลือกมื้อที่ต้องการ ระบบจะคัดลอกทุกเมนูและปริมาณล่าสุดของมื้อนั้นมาวันนี้ โดยยังแก้ไขได้ภายหลัง</p><div class="daily-picker-list">${options.map(x=>`<button data-action="daily-copy-type" data-meal="${e(x.type)}"><strong>${e(D.MEALTYPES[x.type])}</strong><small>${e(C.shortDate(x.rows[0].date))} · ${x.rows.length} รายการ · ${n(C.foodTotals(x.rows).kcal)} kcal</small>${ic('plus',16)}</button>`).join('')}</div></div>`);
 }
 function dailyExperiencePanel(date,plan){
   const day=Daily.todaySummary(state,date,plan);
   const actions=[
    {key:'sleep',label:'การนอนเมื่อคืน',icon:'moon',detail:day.sleep?'บันทึกแล้ว · แก้ไขได้':'บันทึกตามวันที่ตื่น · ใช้เวลาเดิมเป็นตัวช่วยได้',action:'daily-sleep'},
    {key:'nutrition',label:'อาหารวันนี้',icon:'utensils',detail:day.meals.length?`${day.meals.length} รายการ · กดเพื่อเพิ่มมื้อ`:'เริ่มจากเมนูที่กินประจำหรือ Meal Template',action:'daily-meal'},
    {key:'workout',label:day.isRest?'วันนี้เป็นวันพัก':'ออกกำลังกาย',icon:day.isRest?'moon':'dumbbell',detail:day.isRest?'ไม่ต้องกรอก Workout ในวันพัก':day.session?'บันทึก Session แล้ว · แก้ไขได้':'ฝึกตามตาราง · ไม่ต้องกรอกเซตจากศูนย์',action:'daily-workout'},
    {key:'recovery',label:'Recovery Check-in',icon:'sparkles',detail:day.checkin?'บันทึกแล้ว · แก้ไขได้':'บันทึกความรู้สึกเมื่อสะดวก (ไม่บังคับ)',action:'daily-recovery'},
    {key:'weight',label:'น้ำหนัก',icon:'chart',detail:day.weight?`${n(day.weight.weight,1)} kg · แก้ไขได้`:'ใช้ค่าครั้งล่าสุดเป็นตัวตั้งต้น (ไม่บังคับ)',action:'daily-weight'}
   ];
   const status={sleep:!!day.sleep,nutrition:day.meals.length>0,workout:day.isRest||!!day.session,recovery:!!day.checkin,weight:!!day.weight};
   const counted=actions.filter(x=>!['recovery','weight'].includes(x.key)&&!(x.key==='workout'&&day.isRest));
   const complete=counted.filter(x=>status[x.key]).length;
   const latestMeals=Daily.topRepeated(state,date,3);
   const templatesShort=templates().slice(0,3);
   return `<section class="panel daily-experience" aria-label="ศูนย์บันทึกวันนี้"><div class="daily-experience-head"><div><span class="section-overline">DAILY EXPERIENCE</span><h2>วันนี้อยากบันทึกอะไร?</h2><p>เลือกเฉพาะสิ่งที่ทำจริง · ระบบไม่ถือว่าข้อมูลที่ไม่ได้กรอกเป็นศูนย์หรือเป็นวันที่พลาด</p></div><div class="daily-count"><strong>${complete}/${counted.length}</strong><small>หัวข้อหลักที่มีข้อมูล</small></div></div>
     <div class="daily-action-grid">${actions.map(x=>`<button type="button" class="daily-action ${status[x.key]?'daily-done':''}" data-action="${x.action}"><span class="daily-action-icon">${ic(x.icon,20)}</span><span class="daily-action-content"><strong>${e(x.label)}</strong><small>${e(x.detail)}</small></span><span class="daily-action-tail">${status[x.key]?ic('check',18):ic('plus',18)}</span></button>`).join('')}</div>
     <div class="daily-reuse"><div class="daily-reuse-title"><div><h3>ใช้ข้อมูลเดิมให้น้อยขั้นตอน</h3><p>แนะนำจากประวัติของคุณ · กดใช้เมื่อคุณกินหรือทำจริงเท่านั้น</p></div><button class="text-link" data-route="nutrition">ดูบันทึกอาหาร ${ic('arrow',15)}</button></div>
     ${templatesShort.length?`<div class="daily-quick-row"><span class="daily-reuse-label">มื้อที่บันทึกไว้</span>${templatesShort.map(t=>`<button type="button" class="daily-reuse-chip" data-action="daily-template" data-id="${e(t.id)}">${ic('utensils',14)} ${e(t.name)} <small>${t.items.length} รายการ</small></button>`).join('')}</div>`:''}
     ${latestMeals.length?`<div class="daily-quick-row"><span class="daily-reuse-label">เมนูที่กินบ่อย</span>${latestMeals.map(item=>`<button type="button" class="daily-reuse-chip" data-action="daily-repeat" data-id="${e(item.row.id)}">${ic('plus',14)} ${e(item.row.name)} <small>${n(item.row.kcal*item.row.servings)} kcal</small></button>`).join('')}</div>`:''}
     ${!templatesShort.length&&!latestMeals.length?`<p class="daily-placeholder">บันทึกอาหารครั้งแรกที่หน้าโภชนาการ แล้วจะมีปุ่มใช้ซ้ำปรากฏที่นี่</p>`:''}
     <div class="daily-reuse-foot"><button class="button button-outline" data-action="daily-copy-meal">${ic('calendar',16)} คัดลอกมื้อก่อนหน้า</button>${day.isRest?'<span class="source-hint">วันนี้เป็นวันพัก · ไม่จำเป็นต้องบันทึก Workout</span>':`<button class="button button-outline" data-action="daily-live">${ic('dumbbell',16)} เปิด Live Workout</button>`}<button class="button button-plain" data-route="guide">${ic('info',15)} คู่มือสำหรับมือใหม่</button></div></div></section>`;
 }
 function macroRow(title,value,target,cls){return `<div class="macro-row"><div><span>${title}</span><strong>${n(value,1)} <small>/ ${target?n(target):'—'} g</small></strong></div><div class="progress-track"><div class="progress-fill ${cls}" style="width:${target?C.clamp(value/target*100,0,100):0}%"></div></div></div>`;}
 function editablePlan(){return state.scheduleOverrides?.[ui.workoutDate]||state.plan[ui.workoutDay];}
 function exerciseLibrary(){
   const builtins=D.EXERCISES.map(ex=>({...ex,key:ex.id,section:'builtins'}));
   const customs=(state.customExercises||[]).map(ex=>({...ex,key:'custom:'+ex.id,section:'custom'}));
   const known=new Set([...builtins,...customs].map(x=>x.name.trim().toLocaleLowerCase()));
   const historic=[];
   for(const ex of [...state.plan.flatMap(day=>day.exercises),...Object.values(state.scheduleOverrides||{}).flatMap(day=>day.exercises||[])]){
     const key=String(ex.name||'').trim().toLocaleLowerCase();if(!key||known.has(key))continue;
     known.add(key);historic.push({...ex,key:'historic:'+historic.length,section:'historic'});
   }
   return [...customs,...historic,...builtins];
 }
 function exerciseGoal(ex){const mode=C.exerciseMode(ex);return mode.measure==='time'?C.formatDuration(C.exerciseSeconds(ex)||0):e(ex.reps);}
 function exerciseLoadLabel(ex){const kind=C.exerciseMode(ex);return kind.loadType==='bodyweight'?'น้ำหนักตัว':kind.loadType==='none'?'ไม่ใช้น้ำหนัก':`${n(ex.load||0,1)} kg`;}
 function syncExerciseInputs(form){
   if(!form)return;
   const timed=form.elements.measure.value==='time',usesKg=form.elements.loadType.value==='external';
   const reps=form.querySelector('.exercise-reps-field'),time=form.querySelector('.exercise-time-field'),weight=form.querySelector('.exercise-load-field');
   if(reps){reps.hidden=timed;form.elements.reps.required=!timed;}
   if(time){time.hidden=!timed;form.elements.targetMinutes.required=timed;form.elements.targetRemainingSeconds.required=timed;}
   if(weight){weight.hidden=!usesKg;form.elements.load.required=usesKg;}
   const note=form.querySelector('.exercise-mode-note');
   if(note)note.textContent=timed?'กรอกนาทีและวินาทีแยกกัน เช่น Plank 1 นาที 30 วินาที หรือวิ่ง 30 นาที (ช่องวินาทีต้องน้อยกว่า 60)':usesKg?'ใช้จำนวนครั้งและน้ำหนักอุปกรณ์จริง':'ท่าน้ำหนักตัวไม่ต้องระบุกิโลกรัม ระบบจะติดตามจำนวนครั้งแทน Training Volume';
 }
 function workouts(){
   const day=ui.workoutDay,dates=C.weekDates(ui.workoutDate),p=C.planOn(state,ui.workoutDate);
   const exists=state.sessions.find(s=>s.date===ui.workoutDate);
   const recent=C.sorted(state.sessions).slice(0,5);
   return `<div class="page-intro"><div><h2>ตารางฝึกประจำสัปดาห์</h2><p>ตารางนี้วนซ้ำทุกสัปดาห์ คุณเปลี่ยนชื่อวัน ประเภทการฝึก ท่า เซต และเวลาพักได้อิสระ</p></div><div class="inline-actions">${ghost('edit-day','แก้เทมเพลต','edit')}${ghost('reschedule','สลับวันฝึก','calendar')}</div></div>
    ${workoutTimerPanel()}<div class="week-strip">${D.DAYS.map((d,i)=>{const plan=C.planOn(state,dates[i]);return `<button class="week-day ${i===day?'selected':''}" data-action="select-workday" data-day="${i}"><span>${d} · ${C.shortDate(dates[i])}</span><span class="week-day-indicator" style="--dot:${D.TYPES[plan.type].color}"></span><strong>${e(D.TYPES[plan.type].title)}</strong><small>${plan.exercises.length} ท่า${state.scheduleOverrides?.[dates[i]]?' · ปรับวัน':''}</small></button>`;}).join('')}</div>
    ${livePanel()}${state.scheduleOverrides?.[ui.workoutDate]?`<div class="schedule-note">${ic('calendar',17)}<span>${fmt(ui.workoutDate)} · ใช้แผนเฉพาะวัน</span><button class="button button-mini" data-action="clear-override">คืนตารางปกติ</button></div>`:''}<div class="workout-layout"><section class="panel workout-detail">${sectionHead(e(p.title),e(D.TYPES[p.type].desc),`<div class="inline-actions">${ghost('edit-day','แก้เทมเพลต','edit')}${ghost('open-exercise','เพิ่มท่า','plus')}${ghost('open-exercise-library','คลังท่าของฉัน','dumbbell')}</div>`)}<div class="exercise-head"><span>ท่าออกกำลังกาย</span><span>เซต × ครั้ง/เวลา</span><span>ประเภท</span><span></span></div><div class="exercise-list">${p.exercises.length?p.exercises.map((ex,i)=>`<div class="exercise-row"><div class="exercise-main"><span class="exercise-no">${String(i+1).padStart(2,'0')}</span><div><strong>${e(ex.name)}</strong><small>พัก ${n(ex.rest||0)} วินาที</small></div></div><span class="exercise-sets">${e(ex.sets)} × ${exerciseGoal(ex)}</span><span class="exercise-load">${exerciseLoadLabel(ex)}</span><div class="row-buttons"><button class="tiny-icon" data-action="edit-exercise" data-id="${e(ex.id)}" title="แก้ไขท่า" aria-label="แก้ไขท่า">${ic('edit',16)}</button><button class="tiny-icon danger" data-action="delete-exercise" data-id="${e(ex.id)}" title="ลบท่า" aria-label="ลบท่า">${ic('trash',16)}</button></div></div>`).join(''):empty('moon','วันนี้สำหรับการพัก','คุณเลือกเพิ่มท่าออกกำลังกายได้หากเปลี่ยนแผน') }</div><div class="workout-foot"><span>${ic('info',16)} ตารางนี้เป็นเทมเพลต บันทึกการฝึกจริงอยู่ด้านขวา</span>${ghost('open-exercise','เพิ่มท่าใหม่')}</div></section>
    <div class="side-stack"><section class="panel session-panel">${sectionHead('บันทึกการฝึกจริง','บันทึกเซตจริงเพื่อดูสถิติความแข็งแรง')}<label class="field"><span>วันที่ฝึก</span><input type="date" id="workout-date" data-picker="workoutDate" max="${C.today()}" value="${e(ui.workoutDate)}" /></label><div class="session-status ${exists?'done':''}"><span>${ic(exists?'check':'clock',19)}</span><div><strong>${exists?'บันทึกแล้ว':'ยังไม่มีบันทึก'}</strong><small>${exists?`${e(exists.title)} • ${n(exists.duration)} นาที`:'บันทึกตามวันที่ ไม่ใช่แค่การกดเช็กชื่อ'}</small></div></div><button class="button button-dark full" data-action="open-session">${ic(exists?'edit':'plus',17)} ${exists?'แก้ไขบันทึกวันนี้':'เพิ่มบันทึกการฝึก'}</button>${exists?`<button class="button button-plain danger full" data-action="delete-session">ลบบันทึกวันนี้</button>`:''}</section>
     <section class="panel recent-sessions">${sectionHead('ประวัติล่าสุด','การฝึกที่บันทึกไว้จริง')} ${recent.length?recent.map(x=>`<div class="history-item"><span class="history-icon">${ic('dumbbell',16)}</span><div><strong>${e(x.title)}</strong><small>${fmt(x.date)} · ${n(x.duration)} นาที</small></div><button class="tiny-icon" data-action="edit-session-date" data-date="${e(x.date)}" title="เปิดบันทึก">${ic('chevron-right',18)}</button></div>`).join(''):empty('dumbbell','ยังไม่มีประวัติ','เริ่มบันทึกการฝึกครั้งแรกของคุณ')}</section></div></div>${intelligencePanel()}
    <div class="insight-inline">${ic('info',18)}<p>น้ำหนักที่ระบุในท่าเป็นเพียงค่าตัวอย่างของเทมเพลต ไม่ได้แนะนำให้เริ่มยกตามค่านั้น เลือกให้เหมาะกับความสามารถและเทคนิคของคุณ</p></div>`;
 }

 function workoutTimerPanel(){
   const t=workoutTimer.snapshot(),plan=C.planOn(state,ui.workoutDate),rest=plan?.exercises?.map(x=>x.rest).find(x=>x>0)||90,timed=(plan?.exercises||[]).filter(x=>C.exerciseMode(x).measure==='time'&&C.exerciseSeconds(x)>0).slice(0,3);
   const active=t.status==='running'||t.status==='paused';
   return `<section class="panel workout-timer-panel" aria-label="ตัวจับเวลาออกกำลังกาย">
     <div class="workout-timer-overview"><div class="timer-heading"><div class="timer-icon">${ic('clock',22)}</div><div><h2>Smart Workout Timer</h2><p>พักระหว่างเซต · จับเวลา Plank หรือวิ่ง (ตัวจับเวลาเก็บไว้เฉพาะแท็บนี้)</p></div></div><div class="timer-clock-wrap"><strong class="timer-clock" data-timer-display>${clockText(t.displaySeconds)}</strong><small data-timer-status aria-live="off">${timerStatus(t)}</small></div></div>
     <div class="timer-track"><div data-timer-progress style="width:${t.mode==='countdown'?100*t.remaining/t.duration:0}%"></div></div>
     <div class="timer-controls"><div class="timer-presets"><button class="button button-outline button-mini" data-action="timer-preset" data-seconds="60" ${active?'disabled':''}>พัก 1 นาที</button><button class="button button-outline button-mini" data-action="timer-preset" data-seconds="90" ${active?'disabled':''}>พัก 90 วินาที</button><button class="button button-outline button-mini" data-action="timer-preset" data-seconds="${e(rest)}" ${active?'disabled':''}>พักตามแผน (${C.formatDuration(rest)})</button>${timed.map(ex=>`<button class="button button-outline button-mini" data-action="timer-preset" data-seconds="${C.exerciseSeconds(ex)}" ${active?'disabled':''}> ${ic('clock',13)} ${e(ex.name)} · ${e(C.formatDuration(C.exerciseSeconds(ex)))}</button>`).join('')}</div>
     <div class="timer-custom"><label><span>นาที</span><input id="timer-minutes" type="number" inputmode="numeric" min="0" max="600" step="1" value="${C.durationParts(t.mode==='countdown'&&t.status!=='idle'?t.duration:rest).minutes}" ${active?'disabled':''} /></label><label><span>วินาที</span><input id="timer-seconds" type="number" inputmode="numeric" min="0" max="59" step="1" value="${C.durationParts(t.mode==='countdown'&&t.status!=='idle'?t.duration:rest).seconds}" ${active?'disabled':''} /></label></div>
     <div class="timer-buttons">${t.status==='running'?`<button class="button button-dark" data-action="timer-pause">${ic('pause',16)} หยุดชั่วคราว</button>`:t.status==='paused'?`<button class="button button-dark" data-action="timer-resume">${ic('play',16)} ทำต่อ</button>`:`<button class="button button-dark" data-action="timer-countdown">${ic('play',16)} นับถอยหลัง</button><button class="button button-outline" data-action="timer-stopwatch">${ic('clock',16)} จับเวลาเดินหน้า</button>`}<button class="button button-outline" data-action="timer-reset">${ic('refresh',16)} รีเซ็ต</button><button class="button button-plain" data-action="timer-notify">${ic('bell',16)} เปิดแจ้งเตือน</button></div></div>
     <p class="source-hint">เมื่อสลับแท็บ ระบบคำนวณเวลาจากนาฬิกาจริงและปรับเวลาให้ตรงเมื่อกลับมาอีกครั้ง · การแจ้งเตือน/เสียงขึ้นอยู่กับสิทธิ์และข้อจำกัดของเบราว์เซอร์ · ไม่บันทึกเวลานี้เป็น Workout Log อัตโนมัติ</p>
   </section>`;
 }
 function running(){
   const today=C.today(),runs=Run.records(state),stats=Run.stats(state,today),series=Run.weeklySeries(state,today),goal=Number(state.settings.runWeeklyGoalKm)||0;
   const best=runs.filter(x=>x.date<=today).sort((a,b)=>Run.paceSeconds(a.distanceKm,a.durationSeconds)-Run.paceSeconds(b.distanceKm,b.durationSeconds))[0];
   const todayRun=runs.filter(x=>x.date===ui.runDate);
   const history=runs.slice(0,40);
   return `<div class="page-intro running-intro"><div><h2>Running Tracker</h2><p>บันทึกการวิ่งจากนาฬิกาหรือผลที่วัดเอง ระยะทางและเวลาเป็นข้อมูลที่คุณกรอก ไม่ได้ติดตาม GPS อัตโนมัติ</p></div><div class="inline-actions"><button class="button button-dark" data-action="add-run">${ic('plus',16)} บันทึกการวิ่ง</button><button class="button button-outline" data-route="workouts">${ic('clock',16)} เปิด Timer</button></div></div>
    ${workoutTimerPanel()}<div class="running-kpis"><div class="running-kpi"><span>${ic('route',18)} ระยะทางในสัปดาห์นี้</span><strong>${n(stats.weeklyKm,2)} <small>km</small></strong><small>${stats.weeklyCount} ครั้ง · นับจันทร์–อาทิตย์</small></div><div class="running-kpi"><span>${ic('chart',18)} 7 วันที่ผ่านมา</span><strong>${n(stats.distanceKm,2)} <small>km</small></strong><small>${stats.count} ครั้ง</small></div><div class="running-kpi"><span>${ic('clock',18)} Pace รวม 7 วัน</span><strong>${e(stats.pace)}</strong><small>คำนวณจากเวลารวม ÷ ระยะรวม ไม่ใช่ค่าจาก GPS</small></div><div class="running-kpi"><span>${ic('bolt',18)} Pace เร็วสุดที่บันทึก</span><strong>${best?e(Run.pace(best.distanceKm,best.durationSeconds)):'—'}</strong><small>รายการที่เร็วที่สุด · ไม่เปรียบเทียบเส้นทาง</small></div></div>
    <div class="running-layout"><section class="panel">${sectionHead('ระยะทางย้อนหลัง 8 สัปดาห์','รวมจากบันทึกการวิ่ง (km)')} ${runs.length?`<div class="running-chart">${C.lineChart(series,{label:'km ต่อสัปดาห์'})}</div>`:empty('chart','ยังไม่มีข้อมูลการวิ่ง','เพิ่มบันทึกครั้งแรกเพื่อเริ่มเห็นแนวโน้ม')}
    <div class="run-goal-block"><div><strong>เป้าหมายระยะทางต่อสัปดาห์</strong><p class="form-help">ตัวเลขนี้ปรับเองได้ ระบบจะไม่ตั้งเป้าหมายการวิ่งให้โดยอัตโนมัติ</p></div><form id="run-goal-form" class="run-goal-form"><label class="field"><span>เป้าหมาย (km / สัปดาห์)</span><input name="goal" type="number" step="0.5" min="0" max="500" value="${e(goal)}" required /></label><button class="button button-outline" type="submit">บันทึกเป้าหมาย</button></form>${goal>0?`<div class="run-goal-progress"><div style="width:${Math.min(100,100*stats.weeklyKm/goal)}%"></div></div><small class="source-hint">${n(stats.weeklyKm,2)} / ${n(goal,1)} km · ${n(100*stats.weeklyKm/goal)}% ของเป้าหมาย</small>`:''}</div></section>
    <section class="panel running-log">${sectionHead('ประวัติการวิ่ง','เพิ่ม แก้ไข และลบบันทึกได้')}<div class="run-list">${history.length?history.map(x=>`<div class="run-item"><div class="run-item-icon">${ic('route',19)}</div><div class="run-item-main"><strong>${e(Run.TYPES[x.type])} · ${n(x.distanceKm,2)} km</strong><small>${fmt(x.date)} · ${e(Run.duration(x.durationSeconds))}${x.rpe?' · RPE '+e(x.rpe):''}</small>${x.notes?`<p>${e(x.notes)}</p>`:''}</div><div class="run-item-pace"><strong>${e(Run.pace(x.distanceKm,x.durationSeconds))}</strong><span>เฉลี่ย</span></div><div class="run-item-actions"><button class="tiny-icon" data-action="edit-run" data-id="${e(x.id)}" aria-label="แก้ไขการวิ่ง">${ic('edit',16)}</button><button class="tiny-icon danger" data-action="delete-run" data-id="${e(x.id)}" aria-label="ลบการวิ่ง">${ic('trash',16)}</button></div></div>`).join(''):empty('route','ยังไม่ได้บันทึกการวิ่ง','กรอกระยะทาง เวลาและประเภทการฝึก เพื่อคำนวณ Pace')} </div>${runs.length>40?'<p class="source-hint">แสดง 40 รายการล่าสุด ข้อมูลเก่ายังเก็บอยู่ในบัญชีและไฟล์สำรอง</p>':''}</section></div>
    <div class="insight-inline">${ic('info',18)}<p>ข้อมูล Pace เป็นความเร็วเฉลี่ยจากระยะทางและระยะเวลาที่กรอก รวมเวลาพักหากอยู่ในเวลาที่บันทึก ไม่มี GPS หรือข้อมูล Heart Rate อัตโนมัติ และไม่ใช้เพื่อวินิจฉัยสุขภาพ</p></div>`;
 }
 function openRun(id=null){
   const x=id?(state.runs||[]).find(x=>x.id===id):null,last=Daily.latest(state.runs,C.today(),true),t=workoutTimer.snapshot(),elapsed=t.mode==='stopwatch'&&t.elapsed>0?Math.round(t.elapsed):0,parts=Run.parts(x?.durationSeconds||elapsed||last?.durationSeconds||1800);
   showModal(x?'แก้ไขบันทึกการวิ่ง':'บันทึกการวิ่ง',`<form id="run-form" data-id="${e(x?.id||'')}"><div class="form-grid two"><label class="field"><span>วันที่วิ่ง *</span><input type="date" name="date" max="${C.today()}" required value="${e(x?.date||ui.runDate)}" /></label><label class="field"><span>ประเภทการวิ่ง</span><select name="type">${Object.entries(Run.TYPES).map(([k,v])=>option(k,v,x?.type||last?.type||'easy')).join('')}</select></label><label class="field"><span>ระยะทาง (กม.) *</span><input name="distanceKm" type="number" inputmode="decimal" min="0.01" max="500" step="0.01" placeholder="เช่น 5.00" required value="${e(x?.distanceKm??last?.distanceKm??'')}" /></label><div class="field"><span>เวลาที่ใช้จริง *</span><div class="duration-pair"><label><span>นาที</span><input name="minutes" type="number" min="0" max="2880" step="1" required value="${parts.hours*60+parts.minutes}" /></label><label><span>วินาที (0–59)</span><input name="seconds" type="number" min="0" max="59" step="1" required value="${parts.seconds}" /></label></div></div><label class="field"><span>RPE (1–10) · ไม่บังคับ</span><input name="rpe" type="number" min="1" max="10" step="1" value="${e(x?.rpe??'')}" placeholder="ความหนักที่รู้สึก" /></label></div><div class="run-live-preview">${ic('chart',18)} <span data-run-preview>กรอกระยะทางและเวลาเพื่อดู Pace เฉลี่ย</span></div><label class="field"><span>หมายเหตุ</span><textarea name="notes" rows="3" maxlength="700" placeholder="เช่น วิ่งรอบสวน อากาศดี ความรู้สึกระหว่างวิ่ง">${e(x?.notes||'')}</textarea></label><p class="form-help">${elapsed?`Stopwatch มีเวลาล่าสุด ${clockText(elapsed)} · ฟอร์มจะเติมเวลาให้เมื่อสร้างรายการใหม่ (แก้ไขได้)`: 'นำระยะทางและเวลาจากการวิ่งครั้งก่อนมาเป็นค่าเริ่มต้น (หากมี) · ต้องตรวจและแก้ตามที่วิ่งจริง ไม่มี GPS'} · สามารถบันทึกหลายรอบวิ่งในวันเดียวกันได้</p>${modalButtons(x?'อัปเดตการวิ่ง':'บันทึกการวิ่ง')}</form>`,'การวิ่งจะเก็บแยกจาก Workout Session เดิม');
   updateRunPreview();
 }
 function updateRunPreview(){const f=document.getElementById('run-form'),target=f?.querySelector('[data-run-preview]');if(!f||!target)return;const s=Run.parseDuration(f.elements.minutes.value,f.elements.seconds.value),d=Number(f.elements.distanceKm.value);target.textContent=s&&d>0?`ระยะทาง ${n(d,2)} km · เวลา ${Run.duration(s)} · Pace ${Run.pace(d,s)}`:'กรอกระยะทางและเวลาที่ถูกต้องเพื่อดู Pace เฉลี่ย';}
 function intelligencePanel(){
   const now=C.today();
   const cur=C.trainingStats(state.sessions.filter(x=>x.date>=C.shift(now,-6)&&x.date<=now));
   const prev=C.trainingStats(state.sessions.filter(x=>x.date>=C.shift(now,-13)&&x.date<=C.shift(now,-7)));
   const all=C.trainingStats(state.sessions),items=Object.values(all.byExercise).sort((a,b)=>b.sets-a.sets);
   if(!items.some(x=>x.name.trim().toLocaleLowerCase()===ui.exerciseFocus))ui.exerciseFocus=items[0]?.name.trim().toLocaleLowerCase()||'';
   const ex=all.byExercise[ui.exerciseFocus],history=ex?[...ex.history].sort((a,b)=>a.date.localeCompare(b.date)):[];
   const dates=[...new Set(history.map(x=>x.date))].slice(-12);
   const unit=ex?.measure==='time'?'วินาที':ex?.loadType==='external'?'kg·reps':'ครั้ง';
   const chart=dates.map(date=>({date,value:history.filter(x=>x.date===date).reduce((sum,x)=>sum+(ex.measure==='time'?x.seconds:ex.loadType==='external'?x.volume:x.reps),0)}));
   const last=history.at(-1),lastSets=last?history.filter(x=>x.date===last.date):[];
   const template=state.plan.flatMap(p=>p.exercises).find(x=>x.name.trim().toLocaleLowerCase()===ui.exerciseFocus);
   const goal=String(template?.reps||'').match(/^(\d+)\s*-\s*(\d+)$/);
   const upper=goal?Number(goal[2]):null;
   const advanced=ex?.measure==='reps'&&upper!==null&&lastSets.length>=2&&lastSets.every(x=>x.reps>=upper);
   const advice=!ex?'เริ่มบันทึกจำนวนครั้งหรือระยะเวลาจริงเป็นรายเซตเพื่อดูแนวโน้ม':ex.measure==='time'?'เพิ่มเวลาที่ทำจริงอย่างค่อยเป็นค่อยไป หากท่าทางและการพักฟื้นพร้อม':advanced?ex.loadType==='external'?`ครั้งล่าสุดทำได้อย่างน้อย ${upper} ครั้งทุกเซต ลองพิจารณาเพิ่มน้ำหนักอุปกรณ์เล็กน้อยเมื่อเทคนิคพร้อม`:`ครั้งล่าสุดทำได้อย่างน้อย ${upper} ครั้งทุกเซต ลองพิจารณาเพิ่มจำนวนครั้งหรือปรับความยากของท่าอย่างปลอดภัย`:'ปรับจำนวนครั้งหรือความยากตามความพร้อม คำนึงถึงเทคนิค RPE และการพัก';
   return `<section class="panel intelligence-section">${sectionHead('Workout Intelligence','วิเคราะห์เฉพาะเซตจริงที่เริ่มบันทึกใน V1.2.0 · ไม่เดาข้อมูลย้อนหลังจากเทมเพลต')}<div class="intelligence-kpis"><div><span>Training Volume · 7 วัน</span><strong>${n(cur.volume,1)} <small>kg·reps</small></strong><small>${prev.volume?`เทียบสัปดาห์ก่อน ${cur.volume>=prev.volume?'+':''}${n((cur.volume-prev.volume)/prev.volume*100,1)}%`:'ยังไม่มีข้อมูลสัปดาห์ก่อน'}</small></div><div><span>เซตที่บันทึกจริง</span><strong>${n(cur.sets)} <small>เซต</small></strong><small>ไม่รวม Warm-up</small></div><div><span>ท่าน้ำหนักตัว · 7 วัน</span><strong>${n(cur.bodyweightReps)} <small>ครั้ง</small></strong><small>ไม่คำนวณเป็น kg</small></div><div><span>ท่าจับเวลา · 7 วัน</span><strong>${e(C.formatDuration(cur.timedSeconds))}</strong><small>รวมระยะเวลาจริง</small></div><div><span>ท่าที่มีบันทึก</span><strong>${items.length}</strong><small>นับเฉพาะท่าที่มีข้อมูลจริง</small></div></div>${items.length?`<div class="insight-layout"><div><label class="field"><span>เลือกท่าที่ต้องการวิเคราะห์</span><select id="intelligence-exercise">${items.map(x=>option(x.name.trim().toLocaleLowerCase(),x.name,ui.exerciseFocus)).join('')}</select></label><div class="insight-chart">${C.lineChart(chart,{label:'${unit} ต่อครั้ง'})}</div></div><div class="pr-summary"><h3>Personal Records · ${e(ex.name)}</h3><div class="estimate-list">${ex.measure==='time'?`<div><span>เวลาต่อเซตสูงสุด</span><strong>${e(C.formatDuration(ex.maxSeconds))}</strong></div><div><span>เวลาสะสม</span><strong>${e(C.formatDuration(ex.totalSeconds))}</strong></div>`:ex.loadType==='external'?`<div><span>น้ำหนักอุปกรณ์สูงสุด</span><strong>${n(ex.maxLoad,1)} <small>kg</small></strong></div><div><span>1RM โดยประมาณ</span><strong>${ex.maxEst1RM?n(ex.maxEst1RM,1):'—'} <small>kg</small></strong></div><div><span>Volume สะสม</span><strong>${n(ex.volume,1)} <small>kg·reps</small></strong></div>`:`<div><span>จำนวนครั้งสะสม</span><strong>${n(ex.totalReps)} <small>ครั้ง</small></strong></div><div><span>จำนวนครั้งมากที่สุดต่อเซต</span><strong>${n(Math.max(0,...ex.history.map(x=>x.reps)))} <small>ครั้ง</small></strong></div>`}<div><span>เซตสะสม</span><strong>${n(ex.sets)}</strong></div></div><p class="source-hint">${ex.measure==='time'?'ท่าจับเวลาบันทึกเป็นวินาทีภายในเพื่อเก็บสถิติเดิม ไม่ประมาณค่า 1RM':ex.loadType==='external'?'1RM ใช้สูตร Epley เฉพาะเซต 1–10 ครั้ง ไม่ใช่ผลทดสอบจริง':'ท่าน้ำหนักตัวรายงานจำนวนครั้ง ไม่ตีค่าเป็นน้ำหนักอุปกรณ์หรือ 1RM'}</p></div></div>`:empty('dumbbell','ยังไม่มีเซตที่บันทึกจริง','เปิดบันทึกการฝึกแล้วเพิ่มเซต ใส่จำนวนครั้งและน้ำหนักที่ทำจริง')}<div class="insight-inline intelligence-tip">${ic('sparkles',18)}<p><b>แนวทางต่อไป:</b> ${e(advice)} · ไม่มีการเพิ่มน้ำหนักอัตโนมัติ</p></div></section>`;
 }
 function metabolism(){
   const result=M.analyse(state,{days:ui.metabolismDays}),m=result.metrics;
   const missing=result.days-result.loggedDays;
   const readable=x=>x===null?'—':n(x);
   const smallInfo=(title,value,unit,sub)=>`<div class="mt-kpi"><span>${title}</span><strong>${value} <small>${unit}</small></strong><p>${sub}</p></div>`;
   const macroCards=[['โปรตีน',result.totals.protein,m.ready?m.protein:null,'protein','g'],['คาร์โบไฮเดรต',result.totals.carbs,m.ready?m.carbs:null,'carbs','g'],['ไขมัน',result.totals.fat,m.ready?m.fat:null,'fat','g']];
   const dailyChart=result.daily.length?C.lineChart(result.daily.map(x=>({date:x.date,value:x.kcal})),{label:'kcal/วันที่บันทึก',target:result.calorieTarget??undefined}):empty('utensils','ยังไม่มีข้อมูลในช่วงนี้','บันทึกอาหารอย่างน้อยหนึ่งวันเพื่อเริ่มดูกราฟ');
   const weightChart=result.weights.length>=2?C.lineChart(result.weights.map(x=>({date:x.date,value:x.weight})),{label:'น้ำหนักที่บันทึก (kg)'}):empty('scale','ยังไม่มีแนวโน้มน้ำหนัก','ชั่งน้ำหนักหลายวันเพื่อแสดงกราฟ');
   const notes=result.notes.map(x=>`<article class="mt-note"><div class="mt-note-head"><span>${e(x.domain==='nutrition'?'การบันทึกอาหาร':x.domain==='energy'?'สมดุลพลังงาน':x.domain==='protein'?'โปรตีน':x.domain==='weight'?'น้ำหนัก':'พลังงานคงสภาพ')}</span><small>${e(x.level)}</small></div><h3>${e(x.title)}</h3><p><b>สิ่งที่ข้อมูลบอก:</b> ${e(x.evidence)}</p><div class="mt-next">${ic('arrow',16)} <span><b>แนวทางถัดไป:</b> ${e(x.next)}</span></div></article>`).join('');
   return `<div class="mt-page">
     <section class="mt-hero"><div><h2>${ic('flame',26)} Metabolism & Nutrition Insights</h2><p>มองภาพรวมพลังงานที่ใช้โดยประมาณ อาหารที่บันทึก และแนวโน้มน้ำหนัก เพื่อวางแผนต่ออย่างมีหลักฐาน</p></div><div class="mt-hero-side"><strong>${result.loggedDays}/${result.days}</strong><span>วันที่มีบันทึกอาหาร</span></div></section>
     <div class="mt-range"><div><strong>ช่วงเวลาที่วิเคราะห์</strong><span>นับย้อนหลังถึงวันนี้ · ไม่เติมค่า 0 ให้วันที่ไม่ได้บันทึก</span></div><div class="mt-range-options">${[14,28,56].map(x=>`<button type="button" class="mt-range-button ${x===ui.metabolismDays?'selected':''}" aria-pressed="${x===ui.metabolismDays}" data-action="metabolism-period" data-value="${x}">${x} วัน</button>`).join('')}</div></div>
     ${state.demo?'<div class="mt-demo-info">กำลังแสดงตัวอย่างข้อมูลจำลอง · ตัวเลขไม่ใช่ข้อมูลสุขภาพของคุณ</div>':''}
     <div class="mt-kpis">${smallInfo('TDEE · จากสูตร',readable(result.tdee),'kcal/วัน','Mifflin–St Jeor × ปัจจัยกิจกรรม')}${smallInfo('พลังงานเฉลี่ย',readable(result.totals.kcal),'kcal','เฉลี่ยเฉพาะ '+result.loggedDays+' วันที่บันทึก')}${smallInfo('เป้าหมายพลังงาน',readable(result.calorieTarget),'kcal/วัน','ตั้งค่าได้ในหน้าโปรไฟล์')}${smallInfo('การบันทึกอาหาร',n(result.coverage*100),'%','ขาดบันทึก '+missing+' วันจาก '+result.days+' วัน')}</div>
     <div class="mt-charts"><section class="panel mt-chart-panel">${sectionHead('แนวโน้มพลังงานที่บันทึก', 'กราฟแสดงเฉพาะวันที่มีข้อมูล · เส้นเป้าหมายเป็นค่าคำนวณจากโปรไฟล์')}<div class="mt-chart">${dailyChart}</div><p class="mt-hint">แม้มีรายการอาหารในหนึ่งวัน ก็ไม่ได้หมายความว่าบันทึกครบทุกมื้อ: ค่าเฉลี่ยอาจต่ำกว่าที่กินจริง</p></section><section class="panel mt-chart-panel">${sectionHead('แนวโน้มน้ำหนัก', 'ใช้รายการชั่งจริง ไม่แทนวันว่างด้วยการคาดเดา')}<div class="mt-chart">${weightChart}</div><p class="mt-hint">น้ำหนักรายวันเปลี่ยนจากน้ำ อาหาร และการออกกำลังกายได้ ควรดูค่าเฉลี่ยหลายสัปดาห์</p></section></div>
     <div class="mt-middle"><section class="panel"><h2>สารอาหารเฉลี่ยในวันที่บันทึก</h2><p class="mt-sub">เทียบเป้าหมายจากข้อมูลโปรไฟล์ (ไม่ได้หมายถึงปริมาณที่กินจริงครบทุกวัน)</p><div class="mt-macros">${macroCards.map(([title,value,target,color,unit])=>`<div class="mt-macro"><div class="mt-macro-row"><b>${title}</b><span>${value===null?'—':n(value,1)} / ${target===null?'—':n(target)} ${unit}</span></div><div class="mt-bar"><span class="mt-fill mt-${color}" style="width:${target&&value!==null?C.clamp(value/target*100,0,100):0}%"></span></div></div>`).join('')}</div><p class="mt-hint">แคลอรี่และสารอาหารเป็นค่าประมาณจากอาหารที่ผู้ใช้กรอก ควรตรวจจากฉลากหรือปริมาณจริง</p></section>
     <section class="panel"><h2>แนวโน้มน้ำหนักและการใช้พลังงาน</h2><div class="mt-summary-line"><span>เฉลี่ยต้นช่วง / ปลายช่วง</span><strong>${result.trendReady?`${n(result.firstAverage,2)} → ${n(result.lastAverage,2)} kg`:'ข้อมูลไม่พอ'}</strong></div><div class="mt-summary-line"><span>เปลี่ยนแปลงโดยประมาณ</span><strong>${result.weeklyKg===null?'—':`${result.weeklyKg>=0?'+':''}${n(result.weeklyKg,2)} kg/สัปดาห์`}</strong></div><div class="mt-summary-line"><span>แบบจำลอง TDEE จากบันทึก</span><strong>${result.empiricalTdee===null?'—':n(result.empiricalTdee)+' kcal/วัน'}</strong></div><p class="mt-hint">แบบจำลองจากอาหารและน้ำหนักใช้สมมติฐานพลังงานต่อมวลที่เปลี่ยน 1 kg อย่างหยาบมาก เปิดแสดงเฉพาะข้อมูลครอบคลุมเพียงพอ ไม่ใช่การวัดอัตราเผาผลาญและไม่ควรใช้ปรับแคลอรี่อัตโนมัติ</p></section></div>
     <div class="mt-middle"><section class="panel"><h2>รูปแบบการบันทึกอาหาร</h2>${result.mealMix.length?`<div class="mt-meal-list">${result.mealMix.map(x=>`<div class="mt-meal-item"><div><b>${e(D.MEALTYPES[x.name]||x.name)}</b><span>${n(x.share*100)}%</span></div><div class="mt-bar"><span class="mt-fill mt-carbs" style="width:${C.clamp(x.share*100,0,100)}%"></span></div></div>`).join('')}</div>`:empty('utensils','ยังไม่มีข้อมูลมื้ออาหาร','เริ่มบันทึกอาหารเพื่อดูการกระจายพลังงาน')}<p class="mt-hint">สัดส่วนจากอาหารที่บันทึกเท่านั้น ไม่ใช่คำแนะนำว่าควรกินมื้อใดมากกว่า</p></section><section class="panel"><h2>เมนูที่บันทึกบ่อย</h2>${result.topFoods.length?`<ol class="mt-top-foods">${result.topFoods.map(x=>`<li><span>${e(x.name)}</span><b>${n(x.count)} ครั้ง</b></li>`).join('')}</ol>`:empty('utensils','ไม่มีรายการอาหาร','บันทึกอาหารเพื่อดูเมนูที่กินบ่อย')}<p class="mt-hint">นับจำนวนรายการที่บันทึก ไม่ใช่ปริมาณสารอาหารต่อมื้อ</p></section></div>
     <section class="panel mt-observations">${sectionHead('รายงานวิเคราะห์และแนวทางถัดไป','แยกข้อเท็จจริงจากข้อมูล ข้อสังเกต และสิ่งที่ควรลองปรับ')}<div class="mt-notes">${notes}</div><p class="mt-disclaimer">ข้อสรุปเป็นเพียงการประเมินเพื่อวางแผน ไม่ใช่การตรวจสุขภาพหรือการวัด TDEE ทางคลินิก ระบบจะไม่แก้เป้าหมายแคลอรี่หรือข้อมูล Cloud ให้เอง</p></section>
     </div>`;
 }
 function nutrition(m){
   const day=ui.foodDate,entries=C.mealsFor(state,day),food=C.foodTotals(entries),target=m.target||0,remain=target?target-food.kcal:null;
   const allFoods=[...D.FOOD_LIBRARY,...state.customFoods];
   const query=ui.search.trim().toLocaleLowerCase(),favorites=state.favoriteFoodIds||[];
   const filtered=allFoods.filter(x=>(ui.foodCategory==='ทั้งหมด'||(ui.foodCategory==='รายการโปรด'?favorites.includes(x.id):x.group===ui.foodCategory))&&(`${x.name} ${x.unit} ${x.group}`.toLocaleLowerCase().includes(query)));
   const groups=['ทั้งหมด','รายการโปรด',...new Set(allFoods.map(x=>x.group))];
   const overview=C.nutritionSummary(state,C.today(),14),trend=C.weightTrend(state);
   const goalTitle=D.GOALS[state.profile.goal]?.title||'เป้าหมายของคุณ';
   const balance=overview.average!==null&&target?overview.average-target:null;
   const guidance=overview.loggedDays<10?'บันทึกอาหารให้ครบอย่างน้อย 10 จาก 14 วันก่อนประเมินแนวโน้ม (วันที่ไม่มีรายการไม่ได้แปลว่ากิน 0 kcal)'
     :!trend.ready?'อาหารเริ่มมีข้อมูลแล้ว ควรบันทึกน้ำหนักอย่างน้อย 2 วันในแต่ละสัปดาห์เพื่อเทียบแนวโน้มอย่างระมัดระวัง'
     :`น้ำหนักเฉลี่ย 7 วันล่าสุด ${trend.delta>=0?'เพิ่ม':'ลด'}ประมาณ ${n(Math.abs(trend.delta),2)} kg เมื่อเทียบกับ 7 วันก่อน · ค่าเฉลี่ยพลังงานจากวันที่บันทึก ${n(overview.average)} kcal/วัน${balance===null?'':` (${balance>=0?'+':''}${n(balance)} จากเป้าหมาย)`} · ทบทวนร่วมกับความครบถ้วนของมื้ออาหาร การฝึก และความพร้อมของร่างกายก่อนปรับแผน`;
   const yesterday=C.shift(day,-1),previous=C.mealsFor(state,yesterday);
   const seen=new Set(),recentMeals=[];
   for(const row of (state.meals||[]).filter(x=>x.date<day&&x.date>=C.shift(day,-28)).sort((a,b)=>b.date.localeCompare(a.date))){
     const key=[row.name,row.unit,row.meal].join('::').toLocaleLowerCase();
     if(!seen.has(key)){seen.add(key);recentMeals.push(row);}
     if(recentMeals.length===6)break;
   }
   return `<div class="page-intro"><div><h2>Smart Nutrition</h2><p>เลือกอาหารไทยและวัตถุดิบ บันทึกตามกรัมหรือเสิร์ฟ และติดตามน้ำหนักเทียบกับแผน</p></div>${ghost('open-meal','เพิ่มอาหารเอง')}</div>
    <div class="nutrition-overview"><div class="panel food-total"><div class="food-total-top"><span>พลังงานที่บันทึก</span><label class="date-compact">${ic('calendar',16)} <input type="date" value="${e(day)}" data-picker="foodDate" max="${C.today()}" aria-label="วันที่อาหาร" /></label></div><strong>${n(food.kcal)}<small> / ${target?n(target):'—'} kcal</small></strong><div class="progress-track large"><div class="progress-fill" style="width:${target?C.clamp(food.kcal/target*100,0,100):0}%"></div></div><p>${remain===null?'กรอกโปรไฟล์เพื่อดูเป้าหมายพลังงาน':remain>=0?`ยังห่างจากเป้าหมายประมาณ ${n(remain)} kcal`:`มากกว่าเป้าหมายประมาณ ${n(-remain)} kcal`}</p></div><div class="panel food-macro-total">${macroRow('โปรตีน',food.protein,m.protein||0,'protein')}${macroRow('คาร์บ',food.carbs,m.carbs||0,'carbs')}${macroRow('ไขมัน',food.fat,m.fat||0,'fat')}${food.macroIncomplete?`<p class="food-macro-warning">${ic('info',15)} มีอาหาร ${food.incompleteItems} รายการที่ทราบเฉพาะแคลอรี่ · Macro ด้านบนเป็นยอดที่ทราบบางส่วน ยังใช้เทียบเป้าหมายรายวันไม่ได้</p>`:''}</div></div>
    <section class="panel nutrition-insights">${sectionHead('Nutrition & Weight Goals',goalTitle+' · ค่าประมาณจากบันทึกของคุณ')}<div class="nutrition-insight-grid"><div><span>อาหารเฉลี่ย 14 วัน</span><strong>${overview.average===null?'—':n(overview.average)} <small>kcal / วันที่บันทึก</small></strong><small>มีข้อมูล ${overview.loggedDays} / 14 วัน</small></div><div><span>น้ำหนักเฉลี่ย 7 วัน</span><strong>${trend.currentAverage===null?'—':n(trend.currentAverage,2)} <small>kg</small></strong><small>ชั่ง ${trend.currentDays} วัน (ก่อนหน้า ${trend.previousDays} วัน)</small></div><div><span>เป้าหมายพลังงาน</span><strong>${target?n(target):'—'} <small>kcal / วัน</small></strong><small>${m.ready?'คำนวณจากโปรไฟล์และกิจกรรม':'กรอกโปรไฟล์ก่อน'}</small></div></div><div class="insight-inline nutrition-advice">${ic('sparkles',18)}<p>${e(guidance)}</p></div><p class="source-hint">เป็นแนวโน้มเชิงข้อมูล ไม่ใช่การวินิจฉัยหรือคำสั่งปรับแคลอรี่อัตโนมัติ ค่าเฉลี่ยอาหารนับเฉพาะวันที่มีบันทึกและอาจต่ำกว่าที่กินจริงหากบันทึกไม่ครบ</p></section>
    <div class="nutrition-layout"><section class="panel">${sectionHead('คลังอาหาร',`${allFoods.length} รายการ · เลือก ⭐ เพื่อเก็บรายการโปรด`)}<div class="food-filter"><label class="search-field">${ic('search',18)}<input id="food-search" type="search" placeholder="ค้นหาเมนู วัตถุดิบ หรือหมวด..." value="${e(ui.search)}" autocomplete="off" /></label><select id="food-group" aria-label="หมวดอาหาร">${groups.map(g=>option(g,g,ui.foodCategory)).join('')}</select></div><p class="food-count">แสดง ${Math.min(filtered.length,ui.foodLimit)} จาก ${filtered.length} รายการ · ${favorites.length} รายการโปรด</p><div class="food-library-list" id="food-library-list">${renderFoodList(filtered)}</div><p class="source-hint">* เพิ่มเมนูต่อจาน/ชาม/ชิ้นจาก <a href="https://hdmall.co.th/health-tools/food-calorie-table.html" target="_blank" rel="noopener noreferrer">ตารางแคลอรี่ HDmall</a> เป็นค่าประมาณตามหน่วยที่ระบุ <b>ไม่แปลงกรัมโดยเดา</b> และค่า Macro ของเมนูใหม่เป็นการคาดประมาณตามสัดส่วนพลังงาน (ไม่ใช่ข้อมูลจาก HDmall) · เมนูเดิมมี Macro ประมาณการ กรุณาตรวจฉลากจริงก่อนบันทึก</p></section>
     <section class="panel food-diary">${sectionHead('บันทึกประจำวัน',`${entries.length} รายการ · ${fmt(day)}`,`<button class="tiny-square" data-action="open-meal" title="เพิ่มอาหาร">${ic('plus',19)}</button>`)}<div class="food-diary-actions"><button class="button button-dark" data-action="meal-templates">${ic('utensils',15)} Meal Templates · บันทึกทั้งมื้อ</button><button class="button button-outline" data-action="copy-yesterday" ${previous.length?'':'disabled'}>${ic('calendar',15)} คัดลอกอาหารจาก ${e(C.shortDate(yesterday))} (${previous.length})</button></div>${recentMeals.length?`<div class="repeat-meals"><div><strong>บันทึกเมนูที่เคยกินอีกครั้ง</strong><small>กดครั้งเดียวเพื่อใช้ปริมาณเดิม · แก้ไขได้หลังเพิ่ม</small></div><div class="repeat-meal-list">${recentMeals.map(row=>`<button class="repeat-meal-button" data-action="repeat-meal" data-id="${e(row.id)}" title="บันทึกซ้ำ ${e(row.name)}"><span>${ic('plus',13)} ${e(row.name)}</span><small>${n(row.kcal*row.servings)} kcal</small></button>`).join('')}</div></div>`:``}${entries.length?Object.keys(D.MEALTYPES).map(meal=>{const rows=entries.filter(x=>x.meal===meal);return rows.length?`<div class="meal-group"><h3>${D.MEALTYPES[meal]} <span>${n(C.foodTotals(rows).kcal)} kcal</span><button type="button" class="mini-save-template" data-action="meal-template-from-group" data-meal="${meal}">${ic('plus',13)} เก็บเป็นเทมเพลต</button></h3>${rows.map(x=>`<div class="meal-item"><div><strong>${e(x.name)}</strong><small>${x.quantityMode==='grams'&&x.quantityGrams?`${n(x.quantityGrams,1)} กรัม`:n(x.servings,2)+' × '+e(x.unit||'เสิร์ฟ')}${x.macroKnown===false?' · ไม่ทราบ Macro':x.macroEstimated?' · Macro ประมาณ':''}</small></div><div class="meal-right"><strong>${n(num(x.kcal)*num(x.servings))}</strong><button class="tiny-icon" data-action="edit-meal" data-id="${e(x.id)}" aria-label="แก้ไขอาหาร">${ic('edit',15)}</button><button class="tiny-icon danger" data-action="delete-meal" data-id="${e(x.id)}" aria-label="ลบอาหาร">${ic('trash',15)}</button></div></div>`).join('')}</div>`:'';}).join(''):empty('utensils','ยังไม่มีมื้ออาหาร','เลือกอาหารจากคลังด้านซ้ายเพื่อเริ่มบันทึก')}</section></div>`;
 }
 function renderFoodList(foods){
   const favs=state.favoriteFoodIds||[];
   const customIds=new Set(state.customFoods.map(food=>food.id));
   return foods.length?`${foods.slice(0,ui.foodLimit).map(f=>`<div class="food-list-item"><button class="food-star ${favs.includes(f.id)?'selected':''}" data-action="food-favorite" data-id="${e(f.id)}" aria-label="${favs.includes(f.id)?'เอาออกจากรายการโปรด':'เพิ่มในรายการโปรด'}: ${e(f.name)}" title="${favs.includes(f.id)?'เอาออกจากรายการโปรด':'เพิ่มในรายการโปรด'}">${favs.includes(f.id)?'★':'☆'}</button><div class="food-title"><strong>${e(f.name)}</strong><small>${e(f.unit)} · ${e(f.group)} ${f.source==='HDmall'?'· HDmall':''}</small>${f.macroKnown===false?'<small class="food-kcal-only">มีเฉพาะ kcal · ไม่มีข้อมูล Macro</small>':f.macroEstimated?'<small class="food-kcal-only">Macro ประมาณโดยระบบ · ไม่ใช่ค่าจาก HDmall</small>':''}</div><div class="food-number"><strong>${n(f.kcal)}</strong><span>kcal</span></div><div class="food-item-actions">${customIds.has(f.id)?`<button type="button" class="food-edit-button" data-action="food-library-edit" data-id="${e(f.id)}" title="แก้ไขข้อมูล ${e(f.name)}" aria-label="แก้ไขเมนู ${e(f.name)}">${ic('edit',17)}</button>`:''}<button type="button" class="add-circle" data-action="food-add" data-id="${e(f.id)}" aria-label="เพิ่ม ${e(f.name)}">${ic('plus',17)}</button></div></div>`).join('')}${foods.length>ui.foodLimit?`<button class="button button-outline food-more" data-action="food-more">แสดงเพิ่มอีก ${Math.min(60,foods.length-ui.foodLimit)} รายการ (${ui.foodLimit}/${foods.length})</button>`:''}`:empty('search','ไม่พบเมนู','ลองเปลี่ยนคำค้นหาหรือเพิ่มเมนูของตัวเอง');
 }
 function sleep(){
   const entries=C.sorted(state.sleeps),avg=C.sleepStats(state),latest=entries[0],goal=num(state.profile.sleepGoal,8);
   const day=ui.sleepDate,selected=state.sleeps.find(x=>x.date===day),smin=selected?C.sleepDuration(selected):null;
   const totalStages=selected?['deep','light','rem'].reduce((sum,k)=>sum+(C.sleepStageMinutes(selected,k)||0),0):0;
   const nights=Array.from({length:7},(_,i)=>C.shift(C.today(),i-6));
   return `<div class="page-intro"><div><h2>Sleep & Recovery</h2><p>บันทึกเวลาเข้านอน–ตื่นนอน การตื่นกลางคืน และระยะการนอนจากอุปกรณ์ (ถ้ามี)</p></div>${ghost('open-sleep','บันทึกการนอน')}</div>
     <div class="sleep-overview"><div class="sleep-main panel"><div class="sleep-graphic"><span class="sleep-moon">${ic('moon',56)}</span><span class="sleep-stars">✦ &nbsp; · &nbsp; ✦</span></div><div><span class="section-overline">7-DAY AVERAGE</span><h2>${avg.avg===null?'ยังไม่มีข้อมูล':`${n(avg.avg/60,1)} <small>ชั่วโมง / คืน</small>`}</h2><p>เป้าหมายที่ตั้งไว้ ${n(goal,1)} ชั่วโมงต่อคืน · มีบันทึก ${avg.entries.length} คืน</p></div></div><div class="panel sleep-quick"><span>บันทึกคืนล่าสุด</span><strong>${latest?formatHour(C.sleepDuration(latest)):'—'}</strong><small>${latest?`วันที่ตื่น ${fmt(latest.date)}`:'ยังไม่มีรายการ'}</small><button class="text-link" data-action="open-sleep">แก้ไข / เพิ่มข้อมูล ${ic('arrow',15)}</button></div></div>
     <div class="sleep-layout"><section class="panel">${sectionHead('เวลานอนย้อนหลัง 7 วัน','แสดงชั่วโมงหลับจริงที่คำนวณจากเวลาบนเตียงหักช่วงที่ตื่น')}<div class="sleep-bars">${nights.map(d=>{const row=state.sleeps.find(x=>x.date===d),mins=row?C.sleepDuration(row):null;return `<div class="sleep-bar-col"><span>${mins===null?'—':n(mins/60,1)+'h'}</span><div class="sleep-bar-shell"><div class="sleep-bar-fill" style="height:${mins===null?0:Math.min(100,mins/(Math.max(goal,8)*60)*100)}%"></div><div class="sleep-target" style="bottom:${Math.min(100,goal/Math.max(goal,8)*100)}%"></div></div><strong>${D.DAYS[C.weekday(d)]}</strong></div>`;}).join('')}</div><div class="chart-key"><span><i class="key-fill"></i> ชั่วโมงที่บันทึก</span><span><i class="key-dash"></i> เป้าหมาย</span></div></section>
     <section class="panel">${sectionHead('รายละเอียดคืนที่เลือก','แสดงค่าจากอุปกรณ์ได้ทั้งเปอร์เซ็นต์และนาที')}<label class="field"><span>วันที่ตื่นนอน</span><input type="date" data-picker="sleepDate" max="${C.today()}" value="${e(day)}" /></label>${selected?`<div class="stage-total"><span>หลับจริง</span><strong>${formatHour(smin)}</strong><small>${e(selected.bed)} → ${e(selected.wake)} · ตื่น ${n(selected.awake)} นาที</small></div><div class="stage-stack"><div class="stage-bar deep" style="width:${smin?(C.sleepStageMinutes(selected,'deep')||0)/smin*100:0}%"></div><div class="stage-bar light" style="width:${smin?(C.sleepStageMinutes(selected,'light')||0)/smin*100:0}%"></div><div class="stage-bar rem" style="width:${smin?(C.sleepStageMinutes(selected,'rem')||0)/smin*100:0}%"></div></div><div class="stage-legend">${[['Deep','deep'],['Light','light'],['REM','rem']].map(([title,key])=>`<div><i class="stage-dot ${key}"></i><span>${title}</span><strong>${selected[key]===''||selected[key]===null?'ไม่ได้ระบุ':selected.stageUnit==='percent'?n(selected[key],1)+'% (≈'+n(C.sleepStageMinutes(selected,key))+' นาที)':n(selected[key])+' นาที ('+n(C.sleepStagePercent(selected,key),1)+'%)'}</strong></div>`).join('')}</div>${smin!==null&&totalStages<smin?`<p class="source-hint">เหลืออีก ${n(smin-totalStages)} นาที (≈${n(100-totalStages/smin*100,1)}%) ที่ไม่ระบุระยะการนอน (ไม่เติมค่าให้อัตโนมัติ)</p>`:''}`:empty('moon','ยังไม่มีข้อมูลวันนี้','กดบันทึกการนอนเพื่อเพิ่มข้อมูล')}<button class="button button-outline full" data-action="open-sleep">${ic(selected?'edit':'plus',16)} ${selected?'แก้ไขคืนนี้':'เพิ่มบันทึกใหม่'}</button></section></div>
      <div class="panel sleep-history">${sectionHead('ประวัติการนอน','บันทึกย้อนหลังและลบรายการได้')}${entries.length?entries.slice(0,12).map(x=>`<div class="history-item"><span class="history-icon">${ic('moon',17)}</span><div><strong>${fmt(x.date)}</strong><small>${e(x.bed)}–${e(x.wake)} · ${formatHour(C.sleepDuration(x))}</small></div><button class="tiny-icon" data-action="edit-sleep" data-date="${e(x.date)}" aria-label="แก้ไข">${ic('edit',17)}</button><button class="tiny-icon danger" data-action="delete-sleep" data-date="${e(x.date)}" aria-label="ลบ">${ic('trash',17)}</button></div>`).join(''):empty('moon','ยังไม่มีประวัติ','บันทึกการนอนเพื่อดูแนวโน้ม')}</div><div class="insight-inline">${ic('info',18)}<p>อุปกรณ์ติดตามการนอนสามารถประเมิน REM / Deep / Light ได้ แต่ความแม่นยำแตกต่างกัน ไม่ใช้เพื่อวินิจฉัยโรคการนอน</p></div>`;
 }

 function recovery(){
   const date=ui.recoveryDate,stat=R.insights(state,date),feel=stat.feel,log=stat.entry;
   const entries=R.trend(state,14,C.today()),average=entries.length?entries.reduce((sum,x)=>sum+x.score,0)/entries.length:null;
   const sessions14=state.sessions.filter(x=>x.date>=C.shift(C.today(),-13)&&x.date<=C.today());
   const rpeKnown=sessions14.filter(x=>Number.isFinite(Number(x.rpe))&&x.rpe!==null&&x.rpe!==undefined);
   const avgRpe=rpeKnown.length?rpeKnown.reduce((s,x)=>s+Number(x.rpe),0)/rpeKnown.length:null;
   const days7=Array.from({length:7},(_,i)=>C.shift(C.today(),i-6));
   const dataPoints=entries.map(x=>({date:x.date,value:x.score}));
   return `<div class="recovery-intro"><div><span class="section-overline">Move • Fuel • Recover</span><h2>รับฟังร่างกาย ก่อนปรับแผน</h2><p>บันทึกความรู้สึกอย่างสม่ำเสมอ แล้วดูแนวโน้มร่วมกับการนอนและการฝึก ไม่ใช่การคำนวณความเสี่ยงทางการแพทย์</p></div><button class="button button-dark" data-action="open-checkin">${ic('plus',18)} ${log?'แก้ไข Check-in':'บันทึก Check-in'}</button></div>
   <div class="recovery-kpis">
     <div class="panel recovery-kpi"><span>${ic('sparkles',19)} ความรู้สึก ${fmt(date)}</span><strong>${feel?n(feel.score,1)+' <small>/ 5</small>':'—'}</strong><p>${feel?e(feel.label):'ยังไม่มี Check-in ของวันนี้'}</p></div>
     <div class="panel recovery-kpi"><span>${ic('moon',19)} เวลานอนเฉลี่ย 7 คืน</span><strong>${stat.sleepSummary.averageMinutes===null?'—':n(stat.sleepSummary.averageMinutes/60,1)+' <small>ชม.</small>'}</strong><p>จาก ${stat.sleepSummary.count} คืนที่มีบันทึก ไม่แทนคืนที่ขาดด้วย 0</p></div>
     <div class="panel recovery-kpi"><span>${ic('clock',19)} ความแปรปรวนเวลาเข้านอน</span><strong>${stat.sleepSummary.bedtimeDeviationMinutes===null?'—':n(stat.sleepSummary.bedtimeDeviationMinutes)+' <small>นาที</small>'}</strong><p>ค่าเบี่ยงเบนเฉลี่ยของเวลาเข้านอน ต้องมีอย่างน้อย 3 คืน</p></div>
     <div class="panel recovery-kpi"><span>${ic('dumbbell',19)} RPE เฉลี่ย 14 วัน</span><strong>${avgRpe===null?'—':n(avgRpe,1)+' <small>/ 10</small>'}</strong><p>${rpeKnown.length} เซสชันที่มีบันทึก RPE</p></div>
   </div>
   <div class="recovery-columns"><section class="panel">${sectionHead('เช็กอินความรู้สึก','เลือกวันแล้วบันทึกข้อมูลจริงของคุณ')}
      <div class="recovery-datebox"><label class="field"><span>วันที่บันทึก</span><input type="date" data-picker="recoveryDate" max="${C.today()}" value="${e(date)}" /></label>${log?`<button class="button button-outline danger" data-action="delete-checkin" data-date="${e(date)}">${ic('trash',15)} ลบวันนี้</button>`:''}</div>
      ${log?`<div class="recovery-feelings">${[['energy','ความสดชื่น'],['fatigue','ความเหนื่อย'],['soreness','ปวดเมื่อยกล้ามเนื้อ'],['stress','ความเครียด'],['mood','อารมณ์']].map(([k,label])=>`<div><span>${label}</span><strong>${e(log[k])} / 5</strong><div class="recovery-track"><i style="width:${Number(log[k])*20}%"></i></div></div>`).join('')}</div><div class="recovery-meta">${log.waterMl!==null&&log.waterMl!==undefined?`น้ำที่ดื่ม ${n(log.waterMl)} มล.`:''} ${log.steps!==null&&log.steps!==undefined?` · ก้าวเดิน ${n(log.steps)}`:''}</div>${log.note?`<p class="recovery-note">${e(log.note)}</p>`:''}`:empty('moon','ยังไม่มีข้อมูลวันนี้','บันทึกระดับความรู้สึก 1–5 เพื่อเริ่มเห็นรูปแบบของคุณ')}
      <button class="button button-outline full" data-action="open-checkin">${ic('edit',16)} ${log?'แก้ไข Check-in วันนี้':'เพิ่ม Check-in วันนี้'}</button></section>
    <section class="panel">${sectionHead('ข้อสังเกตสำหรับวันที่เลือก','สร้างจากข้อมูลที่คุณบันทึก ไม่ใช่คำสั่งทางการแพทย์')}
      <div class="recovery-advice">${stat.points.map((text,i)=>`<div class="recovery-advice-item"><span>${ic(i===0?'sparkles':'info',19)}</span><p>${e(text)}</p></div>`).join('')}</div>
      <div class="recovery-context"><div><span>การนอน (วันที่ตื่น)</span><b>${stat.sleepMinutes===null?'ยังไม่บันทึก':formatHour(stat.sleepMinutes)}</b></div><div><span>เป้าหมายการนอน</span><b>${n(stat.sleepGoalMinutes/60,1)} ชม.</b></div><div><span>การฝึกหนัก RPE ≥ 8 ใน 3 วัน</span><b>${stat.hardSessions} ครั้ง</b></div></div><p class="source-hint">คะแนนความรู้สึกเป็นค่าเฉลี่ยจากการประเมินตนเอง ไม่ใช้แทนการประเมินสุขภาพ ไม่สามารถประเมินโรคหรือการบาดเจ็บได้</p></section></div>
   <div class="recovery-columns"><section class="panel">${sectionHead('แนวโน้มความรู้สึก 14 วัน',`มีข้อมูล ${entries.length} วัน · ค่าเฉลี่ย ${average===null?'—':n(average,1)+'/5'}`)}${C.lineChart(dataPoints,{label:'แนวโน้มการประเมินตนเอง 14 วัน'})}</section>
      <section class="panel">${sectionHead('จังหวะชีวิตใน 7 วัน','แสดงข้อมูลที่บันทึกจริง ไม่เติมค่าของวันที่ไม่มีข้อมูล')}<div class="recovery-calendar">${days7.map(d=>{const c=R.checkins(state).find(x=>x.date===d),sl=state.sleeps.find(x=>x.date===d),wo=state.sessions.some(x=>x.date===d);return `<div class="recovery-calendar-day"><strong>${e(D.DAYS[C.weekday(d)])}</strong><small>${e(C.shortDate(d))}</small><span class="${c?'rc-dot has':''}" title="${c?'Check-in แล้ว':'ไม่มี Check-in'}"></span><span>${c?'เช็กอินแล้ว':'—'}</span><span>${sl&&C.sleepDuration(sl)!==null?n(C.sleepDuration(sl)/60,1)+' ชม.':'ไม่มีนอน'}</span><span>${wo?'ฝึกแล้ว':'ไม่บันทึกฝึก'}</span></div>`;}).join('')}</div><p class="source-hint">การไม่มีบันทึกการฝึกไม่ได้หมายความว่าพลาดวันฝึก เช่น วันพักตามแผน</p></section></div>`;
 }
 function openCheckin(){
   const date=ui.recoveryDate,old=R.checkins(state).find(x=>x.date===date);
   const fields=[['energy','ความสดชื่น / พลังงาน','1 = ไม่ค่อยมีแรง · 5 = สดชื่น'],['fatigue','ความเหนื่อยล้า','1 = ไม่เหนื่อย · 5 = เหนื่อยมาก'],['soreness','ปวดเมื่อยกล้ามเนื้อ','1 = ไม่ปวด · 5 = ปวดมาก'],['stress','ความเครียด','1 = ต่ำ · 5 = สูง'],['mood','อารมณ์โดยรวม','1 = ไม่ค่อยดี · 5 = ดีมาก']];
   showModal(old?'แก้ไข Recovery Check-in':'Recovery Check-in',`<form id="checkin-form"><div class="form-grid"><label class="field"><span>วันที่บันทึก *</span><input type="date" name="date" required max="${C.today()}" value="${e(date)}" /></label><div class="checkin-fields">${fields.map(([key,label,hint])=>`<label class="field"><span>${label}</span><select name="${key}" required>${[1,2,3,4,5].map(v=>option(v,String(v),old?.[key]??3)).join('')}</select><small>${hint}</small></label>`).join('')}</div><div class="form-grid two"><label class="field"><span>น้ำดื่ม (มล.) · ไม่บังคับ</span><input type="number" name="waterMl" min="0" max="12000" step="1" value="${e(val(old,'waterMl'))}" placeholder="เช่น 2000" /></label><label class="field"><span>ก้าวเดิน · ไม่บังคับ</span><input type="number" name="steps" min="0" max="100000" step="1" value="${e(val(old,'steps'))}" placeholder="เช่น 8000" /></label></div><label class="field"><span>หมายเหตุ</span><textarea name="note" maxlength="600" rows="3" placeholder="เช่น ขาเมื่อยหลัง Leg Day">${e(old?.note||'')}</textarea></label></div><p class="form-help">ข้อมูลนี้เป็นการประเมินตัวเองและบันทึกเฉพาะวันที่เลือก แก้ไขย้อนหลังได้ ไม่วัดค่าจากสมาร์ตวอทช์อัตโนมัติ</p>${modalButtons('บันทึก Check-in')}</form>`);
 }
 function routine(){
   const day=ui.routineDay,entries=state.routines.filter(x=>x.days.includes(day)).sort((a,b)=>a.start.localeCompare(b.start));
   return `<div class="page-intro"><div><h2>Design your day</h2><p>กำหนดช่วงเวลาตื่น กิน งาน ฝึก และพักผ่อนได้เอง เลือกใช้กับบางวันหรือทั้งสัปดาห์</p></div>${ghost('open-routine','เพิ่มกิจกรรม')}</div>
     <div class="routine-hero panel"><div><span class="section-overline">DAILY ROUTINE</span><h2>เวลาของคุณ<br>เป็นสิ่งที่ออกแบบได้</h2><p>จองเวลาให้สิ่งสำคัญ แต่เปิดพื้นที่ให้ชีวิตจริงเปลี่ยนแผนได้</p></div><div class="routine-clock">${ic('clock',95)}</div></div>
     <section class="panel routine-panel">${sectionHead('ตารางกิจวัตร','เลือกวันที่จะดูหรือแก้ไขกิจกรรม')}<div class="day-pills">${D.DAYS.map((name,i)=>`<button data-action="routine-day" data-day="${i}" class="day-pill ${i===day?'active':''}">${name}</button>`).join('')}</div><div class="timeline">${entries.length?entries.map(item=>`<div class="timeline-item"><div class="timeline-time"><strong>${e(item.start)}</strong><small>${e(item.end)}</small></div><div class="timeline-line"><i></i></div><div class="timeline-block cat-${e(item.category)}"><div><span class="category-text">${e(D.CATEGORIES[item.category]||'อื่น ๆ')}</span><h3>${e(item.title)}</h3><small>${timeSpan(item.start,item.end)} นาที · ใช้ ${item.days.length===7?'ทุกวัน':item.days.length+' วัน/สัปดาห์'}</small></div><div class="inline-actions"><button class="tiny-icon" data-action="edit-routine" data-id="${e(item.id)}" aria-label="แก้ไข">${ic('edit',17)}</button><button class="tiny-icon danger" data-action="delete-routine" data-id="${e(item.id)}" aria-label="ลบ">${ic('trash',17)}</button></div></div></div>`).join(''):empty('clock','วันนี้ยังไม่มีตาราง','เริ่มวางกิจวัตรของตัวเองได้เลย',ghost('open-routine','เพิ่มกิจกรรม'))}</div></section><div class="insight-inline">${ic('info',18)}<p>ตารางชีวิตเป็นรายการที่กำหนดเอง ไม่ได้สร้างบันทึกอาหารหรือการออกกำลังกายอัตโนมัติ เพื่อไม่ให้ระบบนับกิจกรรมที่ยังไม่ได้ทำจริง</p></div>`;
 }
 function timeSpan(a,b){const x=C.timeMin(a),y=C.timeMin(b);return x===null||y===null?0:(y-x+1440)%1440;}
 function progress(m){
   const arr=C.weightSeries(state,ui.weightPeriod),all=C.sorted(state.weights),sleep=C.sleepStats(state),wk=C.workoutStats(state),food=C.calorieAverage(state,7),targetWeight=num(state.profile.targetWeight);
   const first=arr[0],last=arr.at(-1),diff=first&&last&&arr.length>=2?(num(last.weight)-num(first.weight)):null;
   const dated=arr.length>=2?(new Date(`${last.date}T12:00:00`)-new Date(`${first.date}T12:00:00`))/864e5:0;
   const perWeek=diff!==null&&dated>=7?diff/dated*7:null;
   const windowTrend=C.weightTrend(state),nutrition14=C.nutritionSummary(state,C.today(),14);
   let insights=[];
   if(windowTrend.ready)insights.push(['เปรียบเทียบน้ำหนักเฉลี่ย 7 วัน',`สัปดาห์ล่าสุด ${n(windowTrend.currentAverage,2)} kg เทียบกับสัปดาห์ก่อน ${n(windowTrend.previousAverage,2)} kg (${windowTrend.delta>=0?'+':''}${n(windowTrend.delta,2)} kg) ใช้ค่าเฉลี่ยลดผลการแกว่งตัวรายวัน · เป็นแนวโน้มไม่ใช่การเปลี่ยนไขมันโดยตรง`]);
   if(nutrition14.loggedDays<10)insights.push(['ความครบถ้วนของ Food Journal',`มีบันทึกอาหาร ${nutrition14.loggedDays}/14 วัน ระบบไม่นับวันที่ไม่มีข้อมูลว่าได้รับพลังงาน 0 kcal`]);
   if(!m.ready)insights.push(['เริ่มจากโปรไฟล์','กรอกอายุ ส่วนสูง น้ำหนัก และกิจกรรมก่อน เพื่อดูค่าประมาณพลังงาน']);
   if(perWeek!==null)insights.push(['น้ำหนักเปลี่ยนอย่างไร',`จากข้อมูลที่บันทึก น้ำหนัก ${perWeek>=0?'เพิ่ม':'ลด'}เฉลี่ยประมาณ ${n(Math.abs(perWeek),2)} กก./สัปดาห์ (${dated} วัน) ควรดูร่วมกับความสม่ำเสมอของการชั่ง`]);
   else insights.push(['เก็บน้ำหนักต่อเนื่อง','บันทึกน้ำหนักห่างกันอย่างน้อย 7 วัน จึงจะแสดงอัตราการเปลี่ยนต่อสัปดาห์']);
   if(food.days>=3&&m.ready)insights.push(['พลังงานจากวันที่บันทึก',`ค่าเฉลี่ย ${n(food.value)} kcal/วัน จาก ${food.days} วันที่มีรายการ เทียบกับเป้าหมาย ${n(m.target)} kcal — ใช้ทบทวนแผน ไม่ใช่การทำนายผลน้ำหนัก`]);
   else insights.push(['บันทึกอาหารเพิ่ม','เพิ่มบันทึกอย่างน้อย 3 วันเพื่อดูค่าเฉลี่ยอาหารที่รับประทาน']);
   if(sleep.entries.length>=3)insights.push(['เวลาในการพักผ่อน',`เวลานอนเฉลี่ย ${n(sleep.avg/60,1)} ชม. จาก ${sleep.entries.length} คืน เป้าหมายที่ตั้งไว้ ${n(state.profile.sleepGoal||8,1)} ชม.`]);
   else insights.push(['การนอนยังมีข้อมูลน้อย','เก็บข้อมูลอย่างน้อย 3 คืนก่อนเปรียบเทียบเวลาเฉลี่ย']);
   return `<div class="page-intro"><div><h2>Progress, not perfection.</h2><p>น้ำหนัก ปริมาณอาหาร การฝึก และการนอน ค่อย ๆ เล่าเรื่องของการเปลี่ยนแปลง</p></div>${ghost('quick-add','บันทึกน้ำหนัก')}</div>
    <div class="progress-overview"><div class="panel progress-highlight"><span>น้ำหนักล่าสุด</span><strong>${m.weight?n(m.weight,1):'—'} <small>kg</small></strong><p>${all.length?`บันทึกล่าสุด ${fmt(all[0].date)}`:'ยังไม่บันทึกน้ำหนัก'}</p></div><div class="panel progress-small"><span>เป้าหมายน้ำหนัก</span><strong>${targetWeight?n(targetWeight,1):'—'} <small>kg</small></strong><p>${m.weight&&targetWeight?`ต่าง ${n(Math.abs(targetWeight-m.weight),1)} kg`:'ตั้งได้ในหน้าโปรไฟล์'}</p></div><div class="panel progress-small"><span>ตามแผน 7 วัน</span><strong>${wk.completed} <small>/ ${wk.planned} วัน</small></strong><p>นับเฉพาะวันฝึก ไม่รวมวันพัก</p></div><div class="panel progress-small"><span>แคลอรี่เฉลี่ย 7 วัน</span><strong>${food.value===null?'—':n(food.value)} <small>kcal</small></strong><p>จาก ${food.days} วันที่มีบันทึก</p></div></div>
    <section class="panel trend-panel">${sectionHead('แนวโน้มน้ำหนัก','การชั่งในช่วงเวลาที่เลือก',`<div class="segmented">${[7,30,90].map(p=>`<button class="${ui.weightPeriod===p?'selected':''}" data-action="period" data-value="${p}">${p} วัน</button>`).join('')}</div>`)}${C.lineChart(arr.map(x=>({date:x.date,value:num(x.weight)})),{label:'แนวโน้มน้ำหนัก',target:targetWeight||undefined})}<div class="chart-key"><span><i class="key-fill"></i> น้ำหนักที่บันทึก</span>${targetWeight?'<span><i class="key-dash"></i> เป้าหมาย</span>':''}</div>${perWeek!==null?`<div class="trend-stat">${perWeek>=0?'เพิ่ม':'ลด'}โดยเฉลี่ย <b>${n(Math.abs(perWeek),2)} kg / สัปดาห์</b> จากช่วงที่มีข้อมูล</div>`:''}</section>
    <div class="dashboard-duo"><section class="panel">${sectionHead('บันทึกน้ำหนักล่าสุด','เลือกแก้ไขหรือเพิ่มบันทึกย้อนหลัง',ghost('quick-add','เพิ่มบันทึก'))}${all.length?all.slice(0,7).map(x=>`<div class="history-item"><span class="history-icon">${ic('scale',17)}</span><div><strong>${n(x.weight,1)} kg</strong><small>${fmt(x.date)} ${x.bodyFat!==null&&x.bodyFat!==''&&x.bodyFat!==undefined?`· ไขมัน ${n(x.bodyFat,1)}%`:''}</small></div><button class="tiny-icon" data-action="edit-weight" data-id="${e(x.id)}" aria-label="แก้ไข">${ic('edit',17)}</button><button class="tiny-icon danger" data-action="delete-weight" data-id="${e(x.id)}" aria-label="ลบ">${ic('trash',17)}</button></div>`).join(''):empty('scale','ยังไม่มีบันทึกน้ำหนัก','เริ่มจากการชั่งน้ำหนักครั้งแรก')}</section>
    <section class="panel insight-panel">${sectionHead('สรุปจากข้อมูลของคุณ','แสดงข้อมูลที่มีจริงและบอกเมื่อข้อมูลยังไม่พอ')}${insights.map(([heading,desc])=>`<div class="insight-item"><span class="insight-bullet">${ic('sparkles',18)}</span><div><strong>${heading}</strong><p>${desc}</p></div></div>`).join('')}</section></div><div class="insight-inline">${ic('info',18)}<p>ความเปลี่ยนแปลงของน้ำหนักไม่เป็นเส้นตรง ขึ้นอยู่กับน้ำ สารอาหาร การฟื้นตัว และปัจจัยอื่น ๆ ไม่มีการทำนายวันถึงเป้าหมายจากสูตร 7,700 kcal/kg</p></div>`;
 }
 function userGuide(m){
   const now=C.today(),from=C.shift(now,-13),between=x=>x.date>=from&&x.date<=now;
   const mealDays=new Set((state.meals||[]).filter(between).map(x=>x.date)).size;
   const sleepDays=(state.sleeps||[]).filter(between).length;
   const weightDays=(state.weights||[]).filter(between).length;
   const sessions=(state.sessions||[]).filter(between);
   const verified=sessions.reduce((sum,x)=>sum+(x.exercises||[]).reduce((total,ex)=>total+(ex.setLog||[]).filter(y=>C.validPerformedSet(ex,y)&&!y.warmup).length,0),0);
   const runCount=(state.runs||[]).filter(between).length;
   const checkinDays=(state.checkins||[]).filter(between).length;
   const mealLogs=(state.meals||[]).filter(between),macroDays=new Set(mealLogs.map(x=>x.date).filter(d=>mealLogs.filter(y=>y.date===d).every(z=>z.macroKnown!==false&&z.macroEstimated!==true))).size;
   const items=[
     {key:'profile',label:'โปรไฟล์และพื้นฐาน',icon:'user',value:m.ready?'ตั้งค่าแล้ว':'ยังไม่ครบ',ready:m.ready,entry:'อายุ น้ำหนัก ส่วนสูง ค่าคงที่สูตร BMR และระดับกิจกรรม',analysis:'BMI, BMR, TDEE และเป้าหมายพลังงานเบื้องต้น',why:'จำเป็นสำหรับรายงานที่เทียบกับเป้าหมายส่วนตัว'},
     {key:'nutrition',label:'อาหารและโภชนาการ',icon:'utensils',value:`${mealDays}/14 วัน`,ready:mealDays>=4,entry:'เมนู มื้อ ปริมาณที่กินจริง (กรัมหรือเสิร์ฟ) และแคลอรี่',analysis:'พลังงานเฉลี่ยเทียบเป้า และความสม่ำเสมอ; Macro ต้องมีข้อมูลโปรตีน/คาร์บ/ไขมันครบ',why:`เริ่มสรุปค่าเฉลี่ยเมื่อมีอาหารหลายวัน · Macro ครบ ${macroDays} วัน`},
     {key:'sleep',label:'การนอน',icon:'moon',value:`${sleepDays}/14 คืน`,ready:sleepDays>=3,entry:'วันที่ตื่น เวลาเข้านอน และเวลาตื่น; Deep/Light/REM ไม่บังคับ',analysis:'เวลานอนเฉลี่ย คืนที่นอนสั้น ความสม่ำเสมอ และแนวโน้ม',why:'บันทึกอย่างน้อย 3 คืนช่วยดูแนวโน้มเบื้องต้น; สัดส่วนจากนาฬิกาเป็นเพียงค่าประมาณ'},
     {key:'workouts',label:'การฝึกและกล้ามเนื้อ',icon:'dumbbell',value:`${sessions.length} ครั้ง / ${verified} เซต`,ready:verified>=3,entry:'แผนออกกำลังกาย → บันทึกการฝึกจริง → ทำเครื่องหมาย “ทำแล้ว” สำหรับเซตที่ทำจริง',analysis:'Volume, จำนวนครั้ง, Personal Best และกราฟรายท่า',why:'เซตที่ไม่ได้ยืนยันและ Warm-up ไม่ใช่ Volume ฝึกจริง'},
     {key:'progress',label:'น้ำหนักและแนวโน้ม',icon:'scale',value:`${weightDays}/14 วัน`,ready:weightDays>=2,entry:'วันที่และน้ำหนักที่ชั่ง; เปอร์เซ็นต์ไขมันเป็นทางเลือก',analysis:'น้ำหนักล่าสุด ค่าเฉลี่ย และแนวโน้มเทียบเป้าหมาย',why:'ควรชั่งในเงื่อนไขใกล้เคียงกัน และใช้ข้อมูลหลายสัปดาห์ประกอบ'},
     {key:'running',label:'การวิ่ง',icon:'route',value:`${runCount} รอบ`,ready:runCount>=2,entry:'ระยะทางกิโลเมตร เวลาเป็นนาที/วินาที และ RPE หากทราบ',analysis:'Pace ระยะรวม และความเปลี่ยนแปลงของการวิ่ง',why:'ต้องมีมากกว่าหนึ่งรอบเพื่อดูแนวโน้ม; GPS ไม่ได้บันทึกอัตโนมัติ'},
     {key:'recovery',label:'การพักฟื้น',icon:'sparkles',value:`${checkinDays}/14 วัน`,ready:checkinDays>=3,entry:'ความสดชื่น ความเหนื่อย ปวดเมื่อย ความเครียดและอารมณ์ (1–5)',analysis:'แนวโน้มความรู้สึก และข้อมูลประกอบการทบทวนวันพัก',why:'Cross-Insights การนอนกับความเหนื่อยต้องมี Sleep และ Check-in จับคู่วันกัน'},
   ];
   const ready=items.filter(x=>x.ready).length;
   return `<div class="guide-hero"><div><h2>ใช้ RHYTHM ให้คล่อง เริ่มจากสิ่งที่สำคัญ</h2><p>ไม่ต้องกรอกทุกอย่างในวันเดียว · เลือกบันทึกเฉพาะสิ่งที่ต้องการติดตาม แล้วค่อยเพิ่มข้อมูลเมื่ออยากวิเคราะห์ลึกขึ้น</p></div><button class="button button-accent" data-action="quick-menu">${ic('plus',17)} บันทึกข้อมูลตอนนี้</button></div>
      <section class="panel guide-overview"><div><span class="section-overline">DATA READINESS · ย้อนหลัง 14 วัน</span><h2>พร้อมวิเคราะห์เบื้องต้น ${ready} / ${items.length} ด้าน</h2><p>ตัวเลขนี้วัดเพียงปริมาณข้อมูลขั้นต่ำ ไม่ได้แปลว่าบันทึกครบทุกมื้อหรือผลวิเคราะห์แม่นยำแล้ว</p></div><div class="guide-progress"><span style="width:${ready/items.length*100}%"></span></div></section>
      <section class="panel guide-steps">${sectionHead('เริ่มต้น 3 ขั้นตอน','เน้นกรอกครั้งเดียวแล้วใช้ข้อมูลร่วมกันหลายหน้า')}<div class="guide-steps-grid"><div><span>01</span><h3>ตั้งโปรไฟล์</h3><p>กรอกอายุ ส่วนสูง น้ำหนัก และระดับกิจกรรมเพื่อประเมินเป้าหมายพลังงาน</p><button class="text-link" data-action="wizard-start">ตั้งค่าแบบทีละขั้น ${ic('arrow',15)}</button></div><div><span>02</span><h3>บันทึกสิ่งที่ทำจริง</h3><p>อาหาร การนอน น้ำหนัก และการฝึก เพิ่มข้อมูลที่สำคัญกับเป้าหมายของคุณ</p><button class="text-link" data-action="quick-menu">เปิดบันทึกด่วน ${ic('arrow',15)}</button></div><div><span>03</span><h3>อ่านผลและตั้งเป้าหมาย</h3><p>เริ่มจากวิเคราะห์เชิงลึก แล้วไปดูรายละเอียดด้านที่สนใจหรือตั้งเป้าหมาย</p><button class="text-link" data-route="insights">ดูผลวิเคราะห์ ${ic('arrow',15)}</button></div></div></section>
      <section class="panel guide-data-section">${sectionHead('แต่ละระบบต้องกรอกอะไรบ้าง?','แสดงข้อมูลจริงในช่วง 14 วันล่าสุด · เปิดหน้าบันทึกหรือดูผลได้ทันที')}<div class="guide-data-grid">${items.map(x=>`<article class="guide-data-card"><div class="guide-data-title"><span class="guide-data-icon">${ic(x.icon,19)}</span><div><h3>${x.label}</h3><small>${e(x.value)}</small></div><span class="guide-status ${x.ready?'is-ready':''}">${x.ready?'มีข้อมูลเริ่มต้น':'ควรบันทึกเพิ่ม'}</span></div><div class="guide-data-info"><strong>ต้องกรอก</strong><p>${e(x.entry)}</p><strong>ระบบนำไปวิเคราะห์</strong><p>${e(x.analysis)}</p><small>${e(x.why)}</small></div><div class="guide-data-actions"><button class="button button-outline" data-route="${x.key}">เปิดหน้านี้ ${ic('arrow',14)}</button>${x.key==='profile'?'':`<button class="button button-plain" data-route="${x.key==='nutrition'?'metabolism':x.key==='workouts'?'workoutAnalytics':'insights'}">ดูวิเคราะห์</button>`}</div></article>`).join('')}</div></section>
      <section class="panel guide-clarity">${sectionHead('หน้าวิเคราะห์ที่หน้าตาคล้ายกัน ต่างกันอย่างไร?','เลือกจากสิ่งที่ต้องการรู้ ไม่ต้องเข้าไปทุกหน้าทุกวัน')}<div class="guide-analysis-links"><button data-route="insights">${ic('sparkles',19)}<span><strong>วิเคราะห์เชิงลึก</strong><small>ภาพรวมสุขภาพและความสัมพันธ์ข้ามข้อมูล</small></span>${ic('arrow',15)}</button><button data-route="workoutAnalytics">${ic('dumbbell',19)}<span><strong>วิเคราะห์การฝึก</strong><small>เซต น้ำหนัก ความแข็งแรง และ Personal Best</small></span>${ic('arrow',15)}</button><button data-route="metabolism">${ic('flame',19)}<span><strong>วิเคราะห์พลังงาน</strong><small>TDEE บันทึกอาหาร Macro และแนวโน้มน้ำหนัก</small></span>${ic('arrow',15)}</button><button data-route="goals">${ic('target',19)}<span><strong>เป้าหมายอัจฉริยะ</strong><small>นำข้อสังเกตมาสร้างเป้าหมายและทบทวนผล</small></span>${ic('arrow',15)}</button></div></section>
      <div class="insight-inline">${ic('info',18)}<p>ข้อมูลที่ไม่ได้บันทึกไม่ใช่ค่า 0 · จำนวนวันมีบันทึกไม่ยืนยันว่าครบทุกมื้อ · TDEE และสัดส่วนการนอนจากอุปกรณ์เป็นค่าประมาณ · ข้อสังเกตไม่ใช่คำวินิจฉัย</p></div>`;
 }
 function profile(m){
   const p=state.profile;
   return `<div class="page-intro"><div><h2>Make it yours.</h2><p>ข้อมูลในฟอร์มนี้ใช้คำนวณเท่านั้น ${sync.isCloud?'บัญชี Cloud จะซิงค์กับ Supabase':'โหมดในเครื่องจะยังไม่ซิงค์กับอุปกรณ์อื่น'}</p></div></div>
    <div class="profile-layout"><section class="panel profile-form-panel">${sectionHead('โปรไฟล์และเป้าหมาย','คำนวณสำหรับผู้ใหญ่ อายุ 18 ปีขึ้นไป',`<button class="button button-dark" data-action="wizard-start">${ic('sparkles',16)} ตั้งค่าแบบทีละขั้น</button>`)}<form id="profile-form"><div class="form-grid two"><label class="field"><span>ชื่อเล่น</span><input type="text" name="name" maxlength="60" value="${e(p.name)}" placeholder="เช่น ชื่อของคุณ" /></label><label class="field"><span>อายุ (ปี) <b>*</b></span><input type="number" required min="18" max="100" name="age" value="${e(p.age)}" placeholder="18–100" /></label><label class="field"><span>น้ำหนักตั้งต้น (kg) <b>*</b></span><input type="number" required min="25" max="400" step="0.1" name="weight" value="${e(p.weight)}" /></label><label class="field"><span>ส่วนสูง (cm) <b>*</b></span><input type="number" required min="100" max="250" step="0.1" name="height" value="${e(p.height)}" /></label><label class="field"><span>สูตรสมการพลังงานพื้นฐาน <b>*</b></span><select name="sex">${option('male','ค่าคงที่สูตรสำหรับผู้ชาย',p.sex)}${option('female','ค่าคงที่สูตรสำหรับผู้หญิง',p.sex)}</select><small>ใช้เลือกค่าคงที่ของสูตร ไม่ได้ระบุอัตลักษณ์ทางเพศ</small></label><label class="field"><span>ระดับกิจกรรม <b>*</b></span><select name="activity">${Object.entries(D.ACTIVITY).map(([key,v])=>option(key,`${v.label} (×${v.factor})`,p.activity)).join('')}</select></label><label class="field"><span>เป้าหมายหลัก</span><select name="goal" id="goal-select">${Object.entries(D.GOALS).map(([k,v])=>option(k,v.title,p.goal)).join('')}</select></label><label class="field"><span>น้ำหนักเป้าหมาย (kg) · ไม่บังคับ</span><input type="number" name="targetWeight" min="25" max="400" step="0.1" value="${e(p.targetWeight)}" placeholder="เช่น 72" /></label><label class="field"><span>ปรับ kcal จาก TDEE</span><input type="number" name="calorieAdjust" id="calorie-adjust" min="-750" max="750" step="25" value="${e(p.calorieAdjust)}" /><small>ค่าบวก = มากกว่าค่า TDEE / ค่าลบ = น้อยกว่า</small></label><label class="field"><span>โปรตีนที่ต้องการ (g/kg)</span><input type="number" name="proteinPerKg" min="0.8" max="2.5" step="0.1" value="${e(p.proteinPerKg)}" /></label><label class="field"><span>สัดส่วนพลังงานจากไขมัน (%)</span><input type="number" name="fatPercent" min="15" max="40" step="1" value="${e(p.fatPercent)}" /></label><label class="field"><span>เป้าหมายการนอน (ชั่วโมง)</span><input type="number" name="sleepGoal" min="6" max="12" step="0.5" value="${e(p.sleepGoal)}" /></label></div><p class="form-help">น้ำหนักในบันทึกล่าสุด (หากมี) จะใช้เป็นน้ำหนักปัจจุบันในการคำนวณ โดยค่าน้ำหนักตั้งต้นจะไม่เปลี่ยนย้อนหลัง</p><button class="button button-dark save-profile" type="submit">${ic('check',18)} บันทึกโปรไฟล์</button></form><form id="font-form"><section class="font-panel"><h3>ตั้งค่าแบบอักษร</h3><p class="form-help">รายชื่อเดียวกับ Workday Journey · บันทึกพร้อมโปรไฟล์และซิงค์บน Cloud</p><label class="field"><span>ฟอนต์ทั้งเว็บ</span><select name="font" id="font-select"><optgroup label="แนะนำสำหรับระบบงาน">${['sarabun','bai','noto','ibm'].map(k=>option(k,FONTS[k],state.settings.font||'ibm')).join('')}</optgroup><optgroup label="อ่านง่าย / ใช้งานทั่วไป">${['leelawadee','tahoma','segoe','prompt','kanit','mitr','anakotmai','athiti'].map(k=>option(k,FONTS[k],state.settings.font||'ibm')).join('')}</optgroup><optgroup label="ฟอนต์สไตล์ / เน้นเอกลักษณ์">${['trirong','itim','pattaya','chonburi'].map(k=>option(k,FONTS[k],state.settings.font||'ibm')).join('')}</optgroup></select></label><p id="font-preview" class="font-preview">RHYTHM · สุขภาพดีทุกวัน 1234567890</p><p class="source-hint">Leelawadee UI และ Anakotmai ใช้ฟอนต์ที่มีในอุปกรณ์เท่านั้น หากไม่มีจะใช้ฟอนต์สำรอง ส่วน Google Fonts ต้องเชื่อมอินเทอร์เน็ต</p></section><button class="button button-outline" type="submit">${ic('check',18)} บันทึกฟอนต์</button></form></section>
    <div class="side-stack"><section class="panel profile-result">${sectionHead('ผลคำนวณปัจจุบัน','เปลี่ยนตามโปรไฟล์และบันทึกน้ำหนักล่าสุด')}<div class="estimate-list">${[['BMI',m.ready?n(m.bmi,1):'—','kg/m²'],['BMR',m.ready?n(m.bmr):'—','kcal / วัน'],['TDEE',m.ready?n(m.tdee):'—','kcal / วัน'],['พลังงานเป้าหมาย',m.ready?n(m.target):'—','kcal / วัน'],['โปรตีน',m.ready?n(m.protein):'—','g / วัน'],['คาร์โบไฮเดรต',m.ready?n(m.carbs):'—','g / วัน'],['ไขมัน',m.ready?n(m.fat):'—','g / วัน']].map(([k,v,u])=>`<div><span>${k}</span><strong>${v}<small> ${u}</small></strong></div>`).join('')}</div><p class="source-hint">สูตร Mifflin–St Jeor และตัวคูณกิจกรรมเป็นค่าโดยประมาณ BMI เป็นเพียงเครื่องมือคัดกรอง และเป้าหมายสารอาหารปรับได้เอง</p></section>
    <section class="panel backup-panel">${sectionHead('จัดการข้อมูล',sync.isCloud?'บัญชี Cloud และไฟล์สำรองของคุณ':'ข้อมูลในเครื่องและไฟล์สำรอง')}<div class="backup-actions"><button class="button button-outline full" data-action="export">${ic('download',17)} สำรองข้อมูล (.json)</button><label class="button button-outline full file-label">${ic('upload',17)} นำเข้าข้อมูล (.json)<input id="import-file" type="file" accept="application/json,.json" /></label><button class="button button-plain full danger" data-action="reset">${ic('trash',17)} ล้างข้อมูลและเริ่มใหม่</button></div><p class="source-hint">${sync.isCloud?'ข้อมูลที่ซิงค์แล้วอยู่ใน Supabase; ข้อมูลที่ยังไม่ซิงค์รอในเครื่องและอาจสูญหายเมื่อเคลียร์ข้อมูลเว็บไซต์ ควรสำรอง JSON':'ข้อมูลยังอยู่ในเครื่องนี้เท่านั้น หากล้างข้อมูลเบราว์เซอร์อาจสูญหาย'}</p>${sync.isCloud&&!C.load().demo?'<button class="button button-outline full" data-action="auth-migrate-local">ย้ายข้อมูล LocalStorage เดิมไป Cloud</button>':''}</section></div></div>`;
 }
 function showModal(title,body,sub=''){
   document.getElementById('modal-root').innerHTML=`<div class="modal-backdrop" id="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${e(title)}"><div class="modal-head"><div><h2>${e(title)}</h2>${sub?`<p>${e(sub)}</p>`:''}</div><button class="icon-button" data-action="close-modal" aria-label="ปิดหน้าต่าง">${ic('close')}</button></div><div class="modal-body">${body}</div></div></div>`;
   document.body.classList.add('modal-open');
   const first=document.querySelector('#modal-root input:not([type=hidden]), #modal-root select, #modal-root textarea');if(first)first.focus({preventScroll:true});
 }
 function closeModal(){document.getElementById('modal-root').innerHTML='';document.body.classList.remove('modal-open');}
 const modalButtons=(text='บันทึก')=>`<div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">ยกเลิก</button><button type="submit" class="button button-dark">${ic('check',17)} ${text}</button></div>`;
 // Profile Wizard keeps fields in memory until the last step; never overwrites an account on cancel.
 function wizardFields(){
   const p=ui.wizardDraft||state.profile;
   if(ui.wizardStep===0)return `<div class="form-grid two"><label class="field"><span>ชื่อเล่น</span><input name="name" maxlength="60" value="${e(p.name||'')}" /></label><label class="field"><span>อายุ (18–100 ปี) *</span><input name="age" type="number" min="18" max="100" required value="${e(p.age)}" /></label><label class="field"><span>ส่วนสูง (ซม.) *</span><input name="height" type="number" min="100" max="250" step="0.1" required value="${e(p.height)}" /></label><label class="field"><span>น้ำหนักเริ่มต้น (กก.) *</span><input name="weight" type="number" min="25" max="400" step="0.1" required value="${e(p.weight)}" /></label><label class="field"><span>ค่าคงที่สูตร BMR *</span><select name="sex">${option('male','ค่าคงที่ชาย',p.sex)}${option('female','ค่าคงที่หญิง',p.sex)}</select></label></div><p class="form-help">ค่าคงที่ใช้เฉพาะสมการ BMR ไม่ได้หมายถึงอัตลักษณ์ทางเพศ</p>`;
   if(ui.wizardStep===1)return `<div class="form-grid two"><label class="field"><span>ระดับกิจกรรม *</span><select name="activity">${Object.entries(D.ACTIVITY).map(([k,v])=>option(k,v.label,p.activity)).join('')}</select></label><label class="field"><span>เป้าหมายหลัก *</span><select name="goal">${Object.entries(D.GOALS).map(([k,v])=>option(k,v.title,p.goal)).join('')}</select></label><label class="field"><span>น้ำหนักเป้าหมาย (กก.) · ไม่บังคับ</span><input name="targetWeight" type="number" min="25" max="400" step="0.1" value="${e(p.targetWeight??'')}" /></label><label class="field"><span>เป้าหมายการนอน (ชั่วโมง)</span><input name="sleepGoal" type="number" min="6" max="12" step="0.5" value="${e(p.sleepGoal)}" /></label></div><p class="form-help">สามารถเปลี่ยนเป้าหมายได้ภายหลัง ไม่ต้องตั้งค่าทุกอย่างในครั้งแรก</p>`;
   return `<div class="form-grid two"><label class="field"><span>ส่วนต่างพลังงานจาก TDEE (kcal)</span><input name="calorieAdjust" type="number" min="-750" max="750" step="25" required value="${e(p.calorieAdjust)}" /></label><label class="field"><span>โปรตีนเป้าหมาย (g/kg)</span><input name="proteinPerKg" type="number" min="0.8" max="2.5" step="0.1" required value="${e(p.proteinPerKg)}" /></label><label class="field"><span>ไขมัน (% ของพลังงาน)</span><input name="fatPercent" type="number" min="15" max="40" step="1" required value="${e(p.fatPercent)}" /></label></div><p class="form-help">ขั้นสูงเป็นเพียงค่าตั้งต้น คุณกลับมาปรับได้เสมอ และ TDEE เป็นค่าประมาณ</p>`;
 }
 function openWizard(step=0){
   ui.wizardStep=step;
   if(!ui.wizardDraft)ui.wizardDraft={...state.profile};
   const labels=['ข้อมูลพื้นฐาน','กิจกรรมและเป้าหมาย','ตั้งค่าพลังงาน (ขั้นสูง)'];
   showModal('ตั้งโปรไฟล์แบบทีละขั้น',`<form id="wizard-form" novalidate><div class="wizard-progress"><strong>ขั้นตอน ${step+1} จาก 3 · ${labels[step]}</strong><div class="wizard-track"><span style="width:${(step+1)/3*100}%"></span></div></div>${wizardFields()}<div class="modal-actions"><button type="button" class="button button-outline" data-action="${step===0?'close-modal':'wizard-back'}">${step===0?'ยกเลิก':'ย้อนกลับ'}</button>${step<2?'<button type="button" class="button button-dark" data-action="wizard-next">ถัดไป →</button>':`<button type="submit" class="button button-dark">${ic('check',16)} บันทึกโปรไฟล์</button>`}</div></form>`,'ไม่บันทึกข้อมูลจนกว่าจะกดเสร็จสิ้นในขั้นสุดท้าย');
 }
 function collectWizard(){
   const form=document.getElementById('wizard-form');if(!form)return false;
   if(!form.checkValidity()){form.reportValidity();return false;}
   const fd=new FormData(form);for(const [k,v] of fd){const numberKeys=['age','height','weight','targetWeight','sleepGoal','calorieAdjust','proteinPerKg','fatPercent'];ui.wizardDraft[k]=numberKeys.includes(k)?(v===''?'':Number(v)):String(v).trim();}
   return true;
 }
 function templates(){return Array.isArray(state.mealTemplates)?state.mealTemplates:[];}
 function mealTemplatesDialog(){
   const rows=templates();showModal('Meal Templates · เมนูทั้งมื้อ',`<div class="meal-template-panel"><p class="form-help">บันทึกอาหารหลายรายการพร้อมกันจากมื้อที่เคยบันทึกไว้ หรือเลือกเทมเพลตเพื่อนำไปเพิ่มในวันที่เลือก ไม่เปลี่ยนรายการเก่า</p><button class="button button-dark" data-action="meal-template-create">${ic('plus',16)} สร้างเทมเพลตจากอาหารที่บันทึก</button><div class="meal-template-list">${rows.length?rows.map(t=>`<div class="meal-template-row"><div><strong>${e(t.name)}</strong><small>${e(D.MEALTYPES[t.meal])} · ${t.items.length} รายการ · ${n(C.foodTotals(t.items).kcal)} kcal</small></div><div class="inline-actions"><button class="button button-outline" data-action="meal-template-apply" data-id="${e(t.id)}">ใช้มื้อนี้</button><button class="tiny-icon danger" data-action="meal-template-delete" data-id="${e(t.id)}" aria-label="ลบเทมเพลต">${ic('trash',16)}</button></div></div>`).join(''):empty('utensils','ยังไม่มีเทมเพลต','บันทึกมื้ออาหารสักมื้อก่อน แล้วใช้ปุ่มสร้างเทมเพลต')}</div></div>`);
 }
 function openTemplateCreate(selectedMeal='breakfast'){
   const rows=C.mealsFor(state,ui.foodDate);showModal('สร้าง Meal Template',`<form id="meal-template-form"><div class="form-grid"><label class="field"><span>ตั้งชื่อมื้อที่ใช้ซ้ำ *</span><input name="name" required maxlength="100" placeholder="เช่น มื้อเช้าไข่ต้ม + ขนมปัง" /></label><label class="field"><span>เลือกมื้อที่มีบันทึกในวันที่ ${e(C.shortDate(ui.foodDate))}</span><select name="meal">${Object.entries(D.MEALTYPES).map(([k,v])=>option(k,`${v} · ${rows.filter(r=>r.meal===k).length} รายการ`,selectedMeal)).join('')}</select></label></div><p class="form-help">ระบบจะคัดลอกชื่ออาหาร จำนวนเสิร์ฟ และสารอาหารจากมื้อที่เลือกมาเก็บในเทมเพลต โดยจะไม่ลบหรือแก้รายการเดิม</p>${modalButtons('สร้างเทมเพลต')}</form>`);
 }
 // Live session drafts are ephemeral, account-scoped, and kept inside the current browser tab.
 function liveKey(){
   const token=sync.isCloud?(sync.email||'unverified'):'guest';let hash=2166136261;
   for(let i=0;i<token.length;i++)hash=Math.imul(hash^token.charCodeAt(i),16777619)>>>0;
   return 'rhythm-live-v193-'+hash+'-'+ui.workoutDate;
 }
 function liveLoad(){try{return U.parseRows(sessionStorage.getItem(liveKey()));}catch(_){return null;}}
 function liveStore(){try{if(ui.liveDraft)sessionStorage.setItem(liveKey(),JSON.stringify(ui.liveDraft));}catch(_){toast('ไม่สามารถเก็บ Draft ในแท็บได้ กรุณาจบการฝึกก่อนปิด','error');}}
 function liveClear(){try{sessionStorage.removeItem(liveKey());}catch(_){}ui.liveDraft=null;ui.liveActive=false;}
 function liveStart(){
   const date=ui.workoutDate,existing=state.sessions.find(x=>x.date===date),plan=C.planOn(state,date);
   if(date>C.today()||!plan.exercises.length&&!existing?.exercises.length){toast('เลือกวันที่มีแผนฝึกและไม่ใช่วันในอนาคต','error');return;}
   let draft=liveLoad();if(!draft||draft.date!==date){const s=existing||plan;draft={date,title:s.title,type:s.type,duration:existing?.duration??60,rpe:existing?.rpe??7,notes:existing?.notes||'',active:0,exercises:s.exercises.map(ex=>({...ex,setLog:[...(ex.setLog||[])]}))};}
   ui.liveDraft=draft;ui.liveActive=true;render(true);
 }
 function livePanel(){
   const saved=liveLoad(),d=ui.liveActive?(ui.liveDraft||saved):null;
   if(!d)return `<section class="panel live-cta">${sectionHead('Live Workout Mode','ทำเซต → กดเสร็จ → เริ่ม Rest Timer อัตโนมัติ โดยไม่ต้องเปิดฟอร์มใหญ่',`<button class="button button-dark" data-action="live-start">${ic('play',16)} ${saved?'ฝึกต่อจาก Draft':'เริ่มฝึกจากเทมเพลต'}</button>`)}<p class="source-hint">Draft เก็บเฉพาะแท็บและบัญชีปัจจุบัน เซตจะยังไม่เข้า Cloud จนกด “จบและบันทึก”</p></section>`;
   const active=Math.max(0,Math.min(d.exercises.length-1,Number(d.active)||0));d.active=active;
   const ex=d.exercises[active],kind=C.exerciseMode(ex),count=d.exercises.reduce((sum,x)=>sum+(x.setLog||[]).length,0),total=d.exercises.reduce((sum,x)=>sum+Number(x.sets||0),0);
   const history=Daily.previousExercise(state,d.date,ex);
   const prev=C.prefillSessionSets(ex,[])[0];const rep=history?.set?.reps||prev?.reps||10,secs=history?.set?.seconds||prev?.seconds||45;
   const part=C.durationParts(secs);
   const t=workoutTimer.snapshot();
   return `<section class="panel live-workout"><div class="live-heading"><div><h2>${ic('dumbbell',19)} Live Workout · ${e(d.title)}</h2><p>ทำแล้ว ${count}/${total} เซตตามแผน · เซตใหม่จะนับหลังจากกดยืนยัน</p></div><button class="button button-outline" data-action="live-exit">ปิดชั่วคราว</button></div><div class="live-exercise-tabs">${d.exercises.map((x,i)=>`<button class="live-ex-tab ${i===active?'selected':''}" data-action="live-select" data-index="${i}">${e(x.name)} <small>${x.setLog?.length||0}/${x.sets}</small></button>`).join('')}</div><div class="live-detail"><div><h3>${e(ex.name)}</h3><p>เป้าหมาย ${e(ex.sets)} × ${exerciseGoal(ex)} · ${exerciseLoadLabel(ex)} · พัก ${e(ex.rest)} วินาที</p></div>${history?`<div class="live-last-reference">${ic('history',16)} <span>ครั้งก่อน ${e(C.shortDate(history.date))}: ${kind.measure==='time'?C.formatDuration(history.set.seconds):`${n(history.set.reps)} ครั้ง`}${kind.loadType==='external'?` · ${n(history.set.load,1)} kg`:''} · ค่าเริ่มต้นแก้ได้ก่อนกดจบเซต</span></div>`:''}<div class="live-existing">${(ex.setLog||[]).map((s,i)=>`<span>เซต ${i+1}: ${kind.measure==='time'?C.formatDuration(s.seconds):e(s.reps)+' ครั้ง'}${kind.loadType==='external'?' · '+e(s.load)+' kg':''}</span>`).join('')||'<small>ยังไม่มีเซตที่ยืนยัน</small>'}</div><div class="live-fields">${kind.measure==='time'?`<label class="field"><span>นาที</span><input id="live-minutes" type="number" min="0" max="600" step="1" value="${part.minutes}" /></label><label class="field"><span>วินาที</span><input id="live-seconds" type="number" min="0" max="59" step="1" value="${part.seconds}" /></label>`:`<label class="field"><span>จำนวนครั้งจริง</span><input id="live-reps" type="number" min="1" max="100" step="1" value="${rep}" /></label>`}${kind.loadType==='external'?`<label class="field"><span>น้ำหนักอุปกรณ์ (kg)</span><input id="live-load" type="number" min="0" max="1000" step="0.5" value="${e(history?.set?.load??ex.load??0)}" /></label>`:''}<label class="check-field"><input id="live-warmup" type="checkbox" /><span>Warm-up</span></label></div><div class="inline-actions"><button class="button button-dark" data-action="live-complete">${ic('check',16)} จบเซตนี้ + เริ่มพัก</button><button class="button button-outline" data-action="live-undo" ${(ex.setLog||[]).length?'':'disabled'}>ย้อนเซตล่าสุด</button></div><div class="live-rest"><strong data-timer-display>${clockText(t.displaySeconds)}</strong><span data-timer-status>${timerStatus(t)}</span><button class="button button-outline" data-action="timer-reset">หยุดพัก</button></div></div><div class="live-footer"><label class="field"><span>เวลาฝึก (นาที)</span><input id="live-duration" type="number" min="0" max="600" value="${e(d.duration)}" /></label><label class="field"><span>RPE 1–10</span><input id="live-rpe" type="number" min="1" max="10" value="${e(d.rpe)}" /></label><button class="button button-primary" data-action="live-finish">${ic('check',16)} จบและบันทึก Session</button></div></section>`;
 }

 function openDay(){const p=state.plan[ui.workoutDay];showModal('ปรับแผนประจำวัน',`<form id="day-form"><div class="form-grid"><label class="field"><span>วันในสัปดาห์</span><input value="${e(D.DAYS_FULL[ui.workoutDay])}" disabled /></label><label class="field"><span>ประเภทของการฝึก</span><select name="type">${Object.entries(D.TYPES).map(([k,v])=>option(k,v.title,p.type)).join('')}</select></label><label class="field"><span>ชื่อโปรแกรม</span><input name="title" required maxlength="90" value="${e(p.title)}" /></label></div><p class="form-help">แก้ไขประเภทและชื่อได้โดยไม่ลบท่าที่มีอยู่ หากต้องการเปลี่ยนท่า ให้แก้จากรายการหลังบันทึก</p>${modalButtons('อัปเดตแผน')}</form>`,D.DAYS_FULL[ui.workoutDay]);}
 function openExercise(id=null,selectedKey=''){
   const plan=editablePlan(),existing=id?plan.exercises.find(x=>x.id===id):null;
   const list=exerciseLibrary();
   const selected=list.find(x=>x.key===selectedKey);
   const ex=existing||selected||{name:'',sets:3,reps:'8-12',load:0,rest:90,measure:'reps',loadType:'external'};
   const kind=C.exerciseMode(ex),timeParts=C.durationParts(C.exerciseSeconds(ex)||45);
   const group=(label,items)=>items.length?`<optgroup label="${e(label)}">${items.map(x=>option(x.key,x.name,selectedKey)).join('')}</optgroup>`:'';
   showModal(existing?'แก้ไขท่าออกกำลังกาย':'เพิ่มท่าออกกำลังกาย',`<form id="exercise-form" data-id="${e(existing?.id||'')}"><div class="form-grid"><label class="field"><span>เลือกจากคลังท่า (ใช้ซ้ำได้ทุกวัน)</span><select id="exercise-template"><option value="">— สร้างท่าใหม่ด้วยตัวเอง —</option>${group('⭐ ท่าที่ฉันบันทึกไว้',list.filter(x=>x.section==='custom'))}${group('จากตารางฝึกเดิมของฉัน',list.filter(x=>x.section==='historic'))}${group('ท่าตัวอย่าง RHYTHM',list.filter(x=>x.section==='builtins'))}</select></label><label class="field"><span>ชื่อท่า *</span><input name="name" required maxlength="90" value="${e(ex.name)}" placeholder="เช่น Incline Bench Press / Push-up" /></label><div class="form-grid two"><label class="field"><span>รูปแบบการทำ</span><select name="measure" id="exercise-measure">${option('reps','จำนวนครั้ง (Repetitions)',kind.measure)}${option('time','จับเวลา (นาที + วินาที)',kind.measure)}</select></label><label class="field"><span>ประเภทน้ำหนัก</span><select name="loadType" id="exercise-load-type">${option('external','ใช้น้ำหนักอุปกรณ์ (kg)',kind.loadType)}${option('bodyweight','ใช้น้ำหนักตัว (ไม่กรอก kg)',kind.loadType)}${option('none','ไม่มีน้ำหนัก เช่น วิ่ง/เดิน',kind.loadType)}</select></label></div><div class="form-grid two"><label class="field"><span>จำนวนเซต *</span><input type="number" name="sets" required min="1" max="30" value="${e(ex.sets)}" /></label><label class="field exercise-reps-field"><span>จำนวนครั้งต่อเซต *</span><input name="reps" maxlength="30" value="${e(kind.measure==='reps'?ex.reps:'')}" placeholder="เช่น 8-12" /></label><div class="field exercise-time-field" hidden><span>เวลาต่อเซต *</span><div class="duration-pair"><label><span>นาที</span><input name="targetMinutes" type="number" inputmode="numeric" min="0" max="600" step="1" value="${timeParts.minutes}" placeholder="0" /></label><label><span>วินาที (0–59)</span><input name="targetRemainingSeconds" type="number" inputmode="numeric" min="0" max="59" step="1" value="${timeParts.seconds}" placeholder="0" /></label></div></div><label class="field exercise-load-field"><span>น้ำหนักอุปกรณ์ (kg) *</span><input type="number" name="load" min="0" max="1000" step="0.5" value="${e(kind.loadType==='external'?ex.load:0)}" /></label><label class="field"><span>พักระหว่างเซต (วินาที)</span><input type="number" name="rest" min="0" max="1800" step="5" value="${e(ex.rest)}" /></label></div><p class="form-help exercise-mode-note"></p><label class="check-field"><input name="rememberExercise" type="checkbox" ${existing?'':'checked'} /><span>บันทึก/อัปเดตท่านี้ในคลังของฉัน เพื่อเลือกใช้ในวันอื่น</span></label><div class="info-small">แก้ไขตารางวันนี้จะไม่เปลี่ยนเซตที่เคยฝึกจริง และไม่เปลี่ยนท่าในวันอื่นโดยอัตโนมัติ</div></div>${modalButtons(existing?'บันทึกการแก้ไข':'เพิ่มท่า')}</form>`,D.DAYS_FULL[ui.workoutDay]);
   syncExerciseInputs(document.getElementById('exercise-form'));
 }
 function openExerciseLibrary(){
   const list=state.customExercises||[];
   showModal('คลังท่าออกกำลังกายของฉัน',`<div class="my-exercise-library"><p class="form-help">ท่าที่คุณบันทึกจะอยู่ในบัญชี RHYTHM และใช้ซ้ำในทุกวันได้ · การลบออกจากคลังไม่ลบแผนหรือประวัติเดิม</p>${list.length?list.map(x=>`<div class="library-exercise-row"><div><strong>${e(x.name)}</strong><small>${e(x.sets)} × ${exerciseGoal(x)} · ${exerciseLoadLabel(x)}</small></div><div class="row-buttons"><button class="button button-outline" data-action="library-use" data-id="${e(x.id)}">เลือกใช้วันนี้</button><button class="tiny-icon danger" data-action="library-delete" data-id="${e(x.id)}" aria-label="ลบออกจากคลัง">${ic('trash',16)}</button></div></div>`).join(''):empty('dumbbell','ยังไม่มีท่าส่วนตัว','กดเพิ่มท่า แล้วเลือก “บันทึกท่านี้ในคลัง” เพื่อใช้ซ้ำในวันอื่น')}<div class="modal-actions"><button class="button button-outline" data-action="close-modal">ปิด</button><button class="button button-dark" data-action="open-exercise">${ic('plus',16)} สร้างท่าใหม่</button></div></div>`);
 }
 function openReschedule(){
   const date=ui.workoutDate>=C.today()?ui.workoutDate:C.today();
   showModal('Adaptive Planner · สลับวันฝึก',`<form id="reschedule-form"><div class="form-grid two"><label class="field"><span>วันต้นทาง</span><input name="source" type="date" min="${C.today()}" value="${e(date)}" required /></label><label class="field"><span>วันปลายทาง</span><input name="target" type="date" min="${C.today()}" value="${e(C.shift(date,1))}" required /></label></div><div class="info-small">ระบบจะสลับโปรแกรมของสองวันนี้ เช่น Legs กับ Rest โดยไม่เปลี่ยนเทมเพลตสัปดาห์หรือประวัติการฝึก และไม่อนุญาตหากวันใดมีบันทึกการฝึกแล้ว</div>${modalButtons('สลับโปรแกรม')}</form>`);
 }
 function sessionSetItem(row,ex){
   const kind=C.exerciseMode(ex),timed=kind.measure==='time',weighted=kind.loadType==='external';
   const draft=row?row._template===true:false,parts=C.durationParts(row?.seconds??0),done=row&&!draft;
   return `<div class="set-entry set-entry-adaptive ${draft?'set-entry-suggested':''}" data-template="${draft?'true':'false'}"><span class="set-number" aria-hidden="true">เซต</span>${timed?`<div class="session-duration-field"><span>เวลาจริงต่อเซต</span><div class="duration-pair"><label><span>นาที</span><input data-set="minutes" type="number" inputmode="numeric" min="0" max="600" step="1" placeholder="0" value="${row?parts.minutes:''}" /></label><label><span>วินาที (0–59)</span><input data-set="remaining-seconds" type="number" inputmode="numeric" min="0" max="59" step="1" placeholder="0" value="${row?parts.seconds:''}" /></label></div></div>`:`<label><span>จำนวนครั้งจริง</span><input data-set="reps" type="number" min="1" max="100" step="1" placeholder="เช่น 10" value="${row?e(row.reps??''):''}" /></label>`}${weighted?`<label><span>น้ำหนักอุปกรณ์ (kg)</span><input data-set="load" type="number" min="0" max="1000" step="0.5" placeholder="เช่น 20" value="${row?e(row.load??''):''}" /></label>`:(timed?'':`<div class="set-bodyweight-label">${kind.loadType==='bodyweight'?'น้ำหนักตัว · ไม่ต้องกรอก kg':'ไม่มีน้ำหนักอุปกรณ์'}</div>`)}<div class="set-flags"><label class="set-completed"><input data-set="completed" type="checkbox" ${done?'checked':''}/><span>ทำแล้ว</span></label><label class="set-warmup"><input data-set="warmup" type="checkbox" ${row?.warmup?'checked':''}/><span>Warm-up</span></label></div><button type="button" class="tiny-icon danger remove-set" data-action="session-remove-set" aria-label="ลบเซต">${ic('trash',15)}</button></div>`;
 }

 function openSession(){
   const date=ui.workoutDate,plan=C.planOn(state,date),existing=state.sessions.find(s=>s.date===date),exercises=existing?.exercises||plan.exercises;
   showModal(existing?'แก้ไขบันทึกการฝึก':'บันทึกการฝึกจริง',`<form id="session-form"><div class="form-grid two"><label class="field"><span>วันที่ฝึก</span><input name="date" type="date" max="${C.today()}" required value="${e(date)}" /></label><label class="field"><span>เวลา (นาที)</span><input name="duration" type="number" min="0" max="600" required value="${e(existing?.duration??(plan.type==='rest'?0:60))}" /></label><label class="field"><span>RPE (1–10)</span><input name="rpe" type="number" min="1" max="10" value="${e(existing?.rpe??7)}" /></label><label class="field"><span>โปรแกรม</span><input value="${e(existing?.title||plan.title)}" disabled /></label></div><h3 class="modal-subheading">เซตที่ทำจริง</h3><p class="form-help"><b>ดึงจำนวนเซตและค่าเป้าหมายจากเทมเพลตแล้ว</b> · ช่องที่เพิ่มมาใหม่ยังไม่ถือว่าฝึกจริง กรุณาตรวจค่าและติ๊ก ‘ทำแล้ว’ เฉพาะเซตที่ฝึกสำเร็จ จึงจะนับในสถิติ</p><p class="form-help">ท่าน้ำหนักตัว เช่น Push-up ให้กรอกจำนวนครั้งอย่างเดียว · ท่าจับเวลา เช่น Plank กรอกนาทีและวินาทีแยกกัน · คำนวณ Volume kg·reps เฉพาะท่าที่ใช้น้ำหนักอุปกรณ์</p><div class="session-exercises">${exercises.length?exercises.map((ex,i)=>`<div class="session-ex" data-exindex="${i}"><div class="session-ex-title"><strong>${e(ex.name)}</strong><small>เป้าหมาย ${e(ex.sets)} × ${exerciseGoal(ex)} · ${exerciseLoadLabel(ex)}</small></div><div class="set-list">${C.prefillSessionSets(ex,ex.setLog||[]).map(row=>sessionSetItem(row,ex)).join('')}</div><button type="button" class="button button-outline set-add" data-action="session-add-set">${ic('plus',14)} เพิ่มเซตจริง</button></div>`).join(''):'<p class="form-help">ไม่มีท่าในแผน บันทึกเวลาพักหรือกิจกรรมได้ตามปกติ</p>'}</div><label class="field"><span>บันทึกเพิ่มเติม</span><textarea name="notes" maxlength="600" rows="3">${e(existing?.notes||'')}</textarea></label>${modalButtons(existing?'อัปเดต':'บันทึกการฝึก')}</form>`,`${fmt(date)} · ${existing?.title||plan.title}`);
 }
 function openMeal(foodId=null,mealId=null){
   const existing=mealId?state.meals.find(x=>x.id===mealId):null;
   const base=foodId?[...D.FOOD_LIBRARY,...state.customFoods].find(x=>x.id===foodId):null;
   const f=existing||base||{name:'',unit:'1 เสิร์ฟ',kcal:0,protein:0,carbs:0,fat:0,servings:1,meal:'lunch',date:ui.foodDate};
   const macroKnown=f.macroKnown!==false;
   const baseGrams=num(f.baseGrams,0),mode=f.quantityMode==='grams'?'grams':'servings';
   const quantity=mode==='grams'?num(f.quantityGrams,baseGrams*num(f.servings,1)):num(f.servings,1);
   showModal(existing?'แก้ไขอาหารที่บันทึก':'เพิ่มรายการอาหาร',`<form id="meal-form" data-id="${e(existing?.id||'')}" data-foodid="${e(existing?.foodId||foodId||'')}" data-foodsource="${base?.source==='HDmall'||existing?.source==='HDmall'?'HDmall':''}" data-estimated="${f.macroEstimated===true?'true':'false'}"><div class="form-grid"><div class="form-grid two"><label class="field"><span>วันที่ *</span><input name="date" type="date" value="${e(existing?.date||ui.foodDate)}" max="${C.today()}" required /></label><label class="field"><span>มื้ออาหาร *</span><select name="meal">${Object.entries(D.MEALTYPES).map(([k,v])=>option(k,v,f.meal||'lunch')).join('')}</select></label></div><label class="field"><span>ชื่ออาหาร *</span><input name="name" required maxlength="100" value="${e(f.name)}" placeholder="เช่น ข้าวสวย / ไข่ต้ม" /></label><div class="form-grid two"><label class="field"><span>หน่วยต่อเสิร์ฟ</span><input name="unit" maxlength="70" value="${e(f.unit||'1 เสิร์ฟ')}" required /></label><label class="field"><span>น้ำหนักต่อหนึ่งเสิร์ฟ (กรัม) · ถ้าทราบ</span><input name="baseGrams" type="number" min="1" max="10000" step="0.1" value="${baseGrams?e(baseGrams):''}" placeholder="เช่น 100" /></label></div><div class="form-grid two"><label class="field"><span>กรอกปริมาณแบบ</span><select name="quantityMode" id="meal-quantity-mode">${option('servings','จำนวนเสิร์ฟ',mode)}${option('grams','น้ำหนักเป็นกรัม',mode)}</select></label><label class="field"><span id="meal-quantity-label">${mode==='grams'?'ปริมาณที่กิน (กรัม)':'จำนวนเสิร์ฟ'} *</span><input id="meal-quantity" name="quantity" type="number" min="0.1" max="${mode==='grams'?'3000':'30'}" step="0.1" value="${e(quantity)}" required /></label></div><p class="form-help">ถ้ากรอกเป็นกรัม กรุณาใส่ “น้ำหนักต่อหนึ่งเสิร์ฟ” ก่อน เช่น 100 กรัมต่อเสิร์ฟ → กิน 150 กรัม = 1.5 เสิร์ฟ</p>${base?.source==='HDmall'||existing?.source==='HDmall'?'<p class="form-help food-source-note">แคลอรี่ต่อหน่วยอ้างอิงจาก <a href="https://hdmall.co.th/health-tools/food-calorie-table.html" target="_blank" rel="noopener noreferrer">HDmall</a> · แคลอรี่จาก HDmall; โปรตีน/คาร์บ/ไขมันจากสูตรคาดการณ์ตามประเภทเมนู ไม่ใช่ข้อมูลจาก HDmall · ตรวจหน่วยและส่วนผสมจริง</p>':''}<label class="field"><span>ข้อมูลสารอาหารหลักของรายการนี้</span><select name="macroStatus" id="meal-macro-status">${option('known',f.macroEstimated?'ตัวเลข Macro โดยประมาณจากระบบ (แก้ไขได้)':'มีตัวเลข Macro จากฉลากหรือสูตร',macroKnown?'known':'unknown')}${option('unknown','ยังไม่ทราบ · บันทึกเฉพาะแคลอรี่',macroKnown?'known':'unknown')}</select></label><p class="form-help bold-help">สารอาหารต่อ 1 เสิร์ฟ · ถ้ายังไม่ทราบให้เว้นว่างและเลือก “บันทึกเฉพาะแคลอรี่”</p><div class="form-grid two"><label class="field"><span>พลังงาน (kcal)</span><input name="kcal" type="number" required min="0" max="10000" step="0.1" value="${e(f.kcal)}" /></label><label class="field"><span>โปรตีน (g)</span><input name="protein" type="number" min="0" max="1000" step="0.1" value="${macroKnown?e(f.protein):''}" /></label><label class="field"><span>คาร์โบไฮเดรต (g)</span><input name="carbs" type="number" min="0" max="1000" step="0.1" value="${macroKnown?e(f.carbs):''}" /></label><label class="field"><span>ไขมัน (g)</span><input name="fat" type="number" min="0" max="1000" step="0.1" value="${macroKnown?e(f.fat):''}" /></label></div><div id="meal-preview" class="meal-preview" role="status" aria-live="polite">คำนวณพลังงานตามปริมาณที่กรอก</div>${!existing&&!foodId?'<label class="check-field"><input type="checkbox" name="remember" checked /><span>บันทึกเมนูนี้ไว้ในคลังส่วนตัว</span></label>':''}</div>${modalButtons(existing?'อัปเดตรายการ':'เพิ่มลงในบันทึก')}</form>`,'ค่าต่อหนึ่งเสิร์ฟจะคูณกับปริมาณจริง · ตรวจฉลากก่อนบันทึก');
   refreshMealPreview();
 }
 function openCustomFoodEditor(id){
   const food=state.customFoods.find(f=>f.id===id);
   if(!food){toast('ไม่พบเมนูที่สร้างเอง กรุณาโหลดรายการใหม่','error');return;}
   const known=food.macroKnown!==false;
   showModal('แก้ไขเมนูอาหารในคลัง',`<form id="custom-food-form" data-id="${e(food.id)}"><div class="form-grid"><label class="field"><span>ชื่อเมนู *</span><input type="text" name="name" required maxlength="100" value="${e(food.name)}" /></label><div class="form-grid two"><label class="field"><span>หน่วยต่อหนึ่งเสิร์ฟ *</span><input type="text" name="unit" required maxlength="70" value="${e(food.unit)}" placeholder="เช่น 1 จาน" /></label><label class="field"><span>น้ำหนักต่อเสิร์ฟ (กรัม) · ไม่บังคับ</span><input name="baseGrams" type="number" min="1" max="10000" step="0.1" value="${food.baseGrams==null?'':e(food.baseGrams)}" placeholder="เช่น 150" /></label></div><label class="field"><span>สถานะข้อมูลสารอาหาร</span><select name="macroStatus" id="custom-food-macro-status">${option('known','ระบุค่าโปรตีน คาร์บ และไขมัน',known?'known':'unknown')}${option('unknown','ยังไม่ทราบ Macro · เก็บเฉพาะแคลอรี่',known?'known':'unknown')}</select></label><div class="form-grid two"><label class="field"><span>พลังงานต่อเสิร์ฟ (kcal) *</span><input name="kcal" type="number" min="0" max="10000" step="0.1" required value="${e(food.kcal)}" /></label><label class="field"><span>โปรตีนต่อเสิร์ฟ (g)</span><input name="protein" type="number" min="0" max="1000" step="0.1" value="${known?e(food.protein):''}" /></label><label class="field"><span>คาร์บต่อเสิร์ฟ (g)</span><input name="carbs" type="number" min="0" max="1000" step="0.1" value="${known?e(food.carbs):''}" /></label><label class="field"><span>ไขมันต่อเสิร์ฟ (g)</span><input name="fat" type="number" min="0" max="1000" step="0.1" value="${known?e(food.fat):''}" /></label></div><p class="info-small">เปลี่ยนค่าของเมนูนี้ในคลังเพื่อใช้บันทึกมื้อถัดไปเท่านั้น <b>ประวัติมื้ออาหารและ Meal Templates ที่บันทึกไว้ก่อนหน้าจะไม่เปลี่ยน</b> · ค่า Macro ที่คุณแก้เองจะถือเป็นข้อมูลที่ผู้ใช้ระบุ ไม่ใช่ค่าที่ตรวจสอบทางห้องปฏิบัติการ</p></div>${modalButtons('บันทึกเมนูที่แก้ไข')}</form><div class="custom-food-delete"><button type="button" class="button button-plain danger" data-action="food-library-delete" data-id="${e(food.id)}">${ic('trash',15)} ลบเมนูนี้จากคลังส่วนตัว</button></div>`,'แก้ไขข้อมูลต่อ 1 เสิร์ฟ · ข้อมูลเก่าจะคงค่าเดิม');
 }
 function refreshMealPreview(){
   const form=document.getElementById('meal-form');if(!form)return;
   const mode=form.elements.quantityMode.value,grams=num(form.elements.baseGrams.value),quantity=num(form.elements.quantity.value);
   const out=document.getElementById('meal-preview');if(!out)return;
   if(mode==='grams'&&grams<=0){out.textContent='กรุณาระบุน้ำหนักต่อหนึ่งเสิร์ฟก่อนกรอกเป็นกรัม';return;}
   const servings=mode==='grams'?quantity/grams:quantity;
   out.textContent=servings>0?(form.elements.macroStatus?.value==='unknown'?`ปริมาณที่กิน ≈ ${n(servings,2)} เสิร์ฟ · ${n(num(form.elements.kcal.value)*servings)} kcal · ไม่ทราบ Macro (ไม่ใช่ 0 g)`:`ปริมาณที่กิน ≈ ${n(servings,2)} เสิร์ฟ · ${n(num(form.elements.kcal.value)*servings)} kcal · โปรตีน ${n(num(form.elements.protein.value)*servings,1)} g · คาร์บ ${n(num(form.elements.carbs.value)*servings,1)} g · ไขมัน ${n(num(form.elements.fat.value)*servings,1)} g`):'กรอกปริมาณเพื่อดูสารอาหารรวม';
 }
 function openSleep(){
   const last=Daily.latest(state.sleeps,ui.sleepDate,true);
   const x=state.sleeps.find(s=>s.date===ui.sleepDate)||{date:ui.sleepDate,bed:last?.bed||'23:00',wake:last?.wake||'07:00',awake:0,deep:null,light:null,rem:null,note:'',stageUnit:last?.stageUnit||'percent'};
   const unit=x.stageUnit==='percent'?'percent':'minutes',percent=unit==='percent';
   showModal('บันทึกการนอน',`<form id="sleep-form"><div class="form-grid two"><label class="field"><span>วันที่ตื่นนอน *</span><input type="date" name="date" max="${C.today()}" required value="${e(x.date)}" /></label><label class="field"><span>ตื่นระหว่างคืน (นาที)</span><input type="number" name="awake" min="0" max="1200" required value="${e(x.awake)}" /></label><label class="field"><span>เวลาเข้านอน *</span><input type="time" name="bed" required value="${e(x.bed)}" /></label><label class="field"><span>เวลาตื่น *</span><input type="time" name="wake" required value="${e(x.wake)}" /></label></div><h3 class="modal-subheading">ระยะการนอน (ไม่บังคับ)</h3><label class="field"><span>หน่วยจากสมาร์ตวอทช์</span><select id="sleep-stage-unit" name="stageUnit">${option('percent','เปอร์เซ็นต์ (%)',unit)}${option('minutes','นาที',unit)}</select></label><p id="sleep-stage-help" class="form-help">${percent?'กรอกเปอร์เซ็นต์ตามนาฬิกา รวมกันไม่เกิน 100%':'กรอกจำนวนนาทีตามอุปกรณ์ รวมกันไม่เกินเวลานอนจริง'} · ค่าไม่ครบสามารถเว้นว่าง ไม่ควรคาดเดา</p><div class="form-grid three">${['deep','light','rem'].map(k=>`<label class="field"><span>${k==='deep'?'Deep':k==='light'?'Light':'REM'} (<span data-unit-label>${percent?'%':'นาที'}</span>)</span><input name="${k}" type="number" min="0" max="${percent?'100':'1200'}" step="${percent?'0.1':'1'}" placeholder="ไม่ระบุ" value="${e(val(x,k))}" /></label>`).join('')}</div><label class="field"><span>โน้ตการนอน</span><textarea name="note" maxlength="500" rows="2">${e(x.note||'')}</textarea></label><div class="info-small">ระบบใช้เวลาบนเตียง − นาทีตื่น คำนวณเวลานอนจริง จากนั้นจึงแปลงเปอร์เซ็นต์เป็นนาทีโดยประมาณเพื่อแสดงผลเท่านั้น</div>${modalButtons('บันทึกการนอน')}</form>`,'เวลาเริ่มต้นอาจมาจากคืนก่อนหน้าเพื่อช่วยกรอก · ต้องตรวจและยืนยันเวลาจริง (วันที่ตื่นนอน)');
 }
 function openWeight(id){
   const x=id?state.weights.find(x=>x.id===id):null;
   const last=Daily.latest(state.weights,C.today(),true);
   showModal(x?'แก้ไขบันทึกน้ำหนัก':'บันทึกน้ำหนัก',`<form id="weight-form" data-id="${e(x?.id||'')}"><div class="form-grid two"><label class="field"><span>วันที่ชั่ง *</span><input type="date" name="date" max="${C.today()}" required value="${e(x?.date||C.today())}" /></label><label class="field"><span>น้ำหนัก (kg) *</span><input type="number" name="weight" step="0.1" min="25" max="400" required value="${e(x?.weight??last?.weight??state.profile.weight??'')}" placeholder="เช่น 68.4" /></label><label class="field"><span>ไขมันในร่างกาย (%) · ไม่บังคับ</span><input type="number" name="bodyFat" min="1" max="70" step="0.1" placeholder="จากอุปกรณ์วัด" value="${e(x?val(x,'bodyFat'):val(last,'bodyFat'))}" /></label></div><p class="form-help">การบันทึกในวันเดียวกันจะอัปเดตค่าเดิม ไม่มีการสร้างหลายรายการในวันเดียว</p>${modalButtons('บันทึกน้ำหนัก')}</form>`);
 }
 function openRoutine(id){
   const r=id?state.routines.find(x=>x.id===id):null;
   const x=r||{title:'',start:'07:00',end:'08:00',category:'personal',days:[ui.routineDay]};
   showModal(r?'แก้ไขกิจวัตร':'เพิ่มกิจวัตร',`<form id="routine-form" data-id="${e(r?.id||'')}"><div class="form-grid"><label class="field"><span>ชื่อกิจกรรม *</span><input type="text" name="title" maxlength="100" required value="${e(x.title)}" placeholder="เช่น ออกกำลังกาย / อ่านหนังสือ" /></label><div class="form-grid two"><label class="field"><span>เริ่ม *</span><input type="time" name="start" value="${e(x.start)}" required /></label><label class="field"><span>สิ้นสุด *</span><input type="time" name="end" value="${e(x.end)}" required /></label></div><label class="field"><span>ประเภท</span><select name="category">${Object.entries(D.CATEGORIES).map(([key,v])=>option(key,v,x.category)).join('')}</select></label><fieldset class="weekday-field"><legend>ใช้ในวันไหนบ้าง *</legend><div class="weekday-checkboxes">${D.DAYS.map((day,i)=>`<label><input type="checkbox" name="days" value="${i}" ${x.days.includes(i)?'checked':''}/><span>${day}</span></label>`).join('')}</div></fieldset></div>${modalButtons(r?'อัปเดตกิจกรรม':'เพิ่มกิจกรรม')}</form>`);
 }
 function toast(message,type='success'){
   const root=document.getElementById('toast-root');root.innerHTML=`<div class="toast ${type==='error'?'toast-error':''}">${ic(type==='error'?'info':'check',18)} ${e(message)}</div>`;
   clearTimeout(toast.timer);toast.timer=setTimeout(()=>root.innerHTML='',3500);
 }
 function confirmed(message){return window.confirm(message);}
 function removeItem(collection,pred,message){if(!confirmed(message))return;state[collection]=(state[collection]||[]).filter(x=>!pred(x));update();toast('ลบรายการแล้ว');}
 document.addEventListener('click',event=>{
   if(event.target.id==='modal-backdrop'){closeModal();return;}
   const nav=event.target.closest('[data-route]');if(nav){event.preventDefault();navigate(nav.dataset.route);return;}
   const el=event.target.closest('[data-action]');if(!el)return;
   const a=el.dataset.action,id=el.dataset.id,date=el.dataset.date;
   if(a==='close-modal'){closeModal();return;}
   if(a==='wizard-start'){ui.wizardDraft={...state.profile};openWizard(0);return;}
   if(a==='wizard-next'){if(collectWizard())openWizard(Math.min(2,ui.wizardStep+1));return;}
   if(a==='wizard-back'){if(collectWizard())openWizard(Math.max(0,ui.wizardStep-1));return;}
   if(a==='meal-templates'){mealTemplatesDialog();return;}
   if(a==='meal-template-create'){openTemplateCreate();return;}
   if(a==='meal-template-from-group'){openTemplateCreate(el.dataset.meal);return;}
   if(a==='meal-template-delete'){
     if(!confirmed('ลบเฉพาะเทมเพลตนี้? บันทึกอาหารจริงที่เคยเพิ่มจะไม่ถูกลบ'))return;
     state.mealTemplates=templates().filter(t=>t.id!==id);update();mealTemplatesDialog();toast('ลบเทมเพลตแล้ว');return;
   }
   if(a==='meal-template-apply'){
     const t=templates().find(x=>x.id===id);if(!t||!U.validMealTemplate(t)){toast('เทมเพลตไม่ถูกต้อง','error');return;}
     if(ui.foodDate>C.today()){toast('ไม่สามารถบันทึกอาหารในอนาคต','error');return;}
     const already=C.mealsFor(state,ui.foodDate).some(x=>x.fromTemplate===t.id);
     if(already&&!confirmed('เทมเพลตนี้ถูกใช้ในวันที่เลือกแล้ว ต้องการเพิ่มรายการซ้ำอีกครั้งหรือไม่?'))return;
     if(!already&&!confirmed(`เพิ่ม ${t.items.length} รายการจาก “${t.name}” ลงวันที่ ${C.shortDate(ui.foodDate)} ใช่หรือไม่?`))return;
     state.meals.push(...U.applyTemplate(t,ui.foodDate,C.uid));closeModal();update();toast('เพิ่มอาหารจากเทมเพลตทั้งมื้อแล้ว');return;
   }
   if(a==='live-start'){liveStart();return;}
   if(a==='live-exit'){ui.liveActive=false;ui.liveDraft=null;render(true);return;}
   if(a==='live-select'){
     if(ui.liveDraft){ui.liveDraft.duration=Number(document.getElementById('live-duration')?.value??ui.liveDraft.duration);ui.liveDraft.rpe=Number(document.getElementById('live-rpe')?.value??ui.liveDraft.rpe);}
     const i=Number(el.dataset.index);if(!ui.liveDraft||!Number.isInteger(i)||i<0||i>=ui.liveDraft.exercises.length)return;
     ui.liveDraft.active=i;liveStore();render(true);return;
   }
   if(a==='live-complete'){
     const d=ui.liveDraft;if(!d)return;
     const ex=d.exercises[d.active],kind=C.exerciseMode(ex);let row={warmup:!!document.getElementById('live-warmup')?.checked,load:kind.loadType==='external'?Number(document.getElementById('live-load')?.value):0};
     if(kind.measure==='time'){
       const seconds=C.parseDurationParts(document.getElementById('live-minutes')?.value,document.getElementById('live-seconds')?.value);
       row.seconds=seconds;
     }else row.reps=Number(document.getElementById('live-reps')?.value);
     if(!C.validPerformedSet(ex,row)){toast('กรุณาตรวจจำนวนครั้ง/เวลา/น้ำหนักของเซตจริง','error');return;}
     if(ex.setLog.length>=30){toast('สูงสุด 30 เซตต่อท่า','error');return;}
     ex.setLog.push(row);
     const rest=Number(ex.rest)||0;
     if(ex.setLog.length>=Number(ex.sets)&&d.active<d.exercises.length-1)d.active++;
     liveStore();if(rest>0){workoutTimer.start('countdown',rest);try{timerSound??=new (window.AudioContext||window.webkitAudioContext)();timerSound.resume();}catch(_){}}
     render(true);toast('บันทึกเซตใน Draft · จบ Session เพื่อซิงค์');return;
   }
   if(a==='live-undo'){
     const d=ui.liveDraft;if(!d)return;const ex=d.exercises[d.active];if(!ex?.setLog?.length)return;
     ex.setLog.pop();liveStore();render(true);toast('ย้อนเซตล่าสุดแล้ว');return;
   }
   if(a==='live-finish'){
     const d=ui.liveDraft;if(!d||!C.isDate(d.date)||d.date>C.today())return;
     const duration=Number(document.getElementById('live-duration')?.value),rpe=Number(document.getElementById('live-rpe')?.value);
     if(!Number.isFinite(duration)||duration<0||duration>600||!Number.isInteger(rpe)||rpe<1||rpe>10){toast('ตรวจสอบเวลาฝึกและ RPE','error');return;}
     if(!d.exercises.some(x=>x.setLog?.length)&&!confirmed('ยังไม่ได้จบเซตใด ต้องการบันทึก Session ที่ไม่มีเซตจริงหรือไม่?'))return;
     if(!confirmed('บันทึกเซตที่ยืนยันแล้ว และแทนที่ Session เดิมในวันที่เลือก (ถ้ามี)?'))return;
     const old=state.sessions.find(x=>x.date===d.date);
     const newEntry={id:old?.id||C.uid(),date:d.date,day:C.weekday(d.date),type:d.type,title:d.title,duration,rpe,notes:d.notes||'',exercises:d.exercises.map(x=>({...x,setLog:[...(x.setLog||[])]}))};
     state.sessions=state.sessions.filter(x=>x.date!==d.date);state.sessions.push(newEntry);liveClear();workoutTimer.reset();update();toast('จบการฝึกและบันทึก Session แล้ว');return;
   }

   if(a==='auth-open'){ui.authMode='login';showAuthModal();return;}
   if(a==='auth-mode'){ui.authMode=el.dataset.mode;showAuthModal();return;}
   if(a==='auth-sync'){void withCloudAction(async()=>{await sync.refresh();render(true);toast(sync.status==='error'||sync.pending?'ยังซิงค์ไม่สำเร็จ กรุณาตรวจสถานะด้านบน':'ตรวจสอบ Cloud แล้ว');});return;}
   if(a==='auth-logout'){void withCloudAction(async()=>{await sync.signout();render(false);toast('ออกจากระบบแล้ว ข้อมูลบัญชีไม่แสดงในหน้านี้');});return;}
   if(a==='auth-initial-local'){void withCloudAction(async()=>{await sync.chooseInitial(true);render(false);toast('นำเข้าข้อมูล LocalStorage ไป Cloud แล้ว');});return;}
   if(a==='auth-initial-blank'){if(!confirmed('เริ่มบัญชี Cloud ด้วยข้อมูลเปล่า? ข้อมูลเดิมในเครื่องจะยังอยู่ และยังไม่ได้ถูกอัปโหลด'))return;void withCloudAction(async()=>{await sync.chooseInitial(false);render(false);toast('เริ่มบัญชี Cloud ใหม่แล้ว');});return;}
   if(a==='auth-backup-raw'){
     const raw=sync.rawDraft();if(raw!==null){const file=new Blob([raw],{type:'application/json'});const url=URL.createObjectURL(file);const anchor=document.createElement('a');anchor.href=url;anchor.download='RHYTHM-unreadable-pending-draft.json';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}return;
   }
   if(a==='auth-clear-raw'){
     if(!confirmed('ดาวน์โหลดไฟล์ดิบค้างส่งเก็บไว้แล้วหรือยัง? การลบอาจทำให้ข้อมูลที่ยังไม่ขึ้น Cloud หาย')||!confirmed('ยืนยันลบข้อมูล Draft เสีย แล้วลองโหลด Cloud ใหม่หรือไม่?'))return;
     void withCloudAction(async()=>{await sync.clearCorruptDraft();render(false);toast('ตรวจสอบ Cloud หลังล้าง Draft เสียแล้ว');});return;
   }
   if(a==='auth-backup-guest'){C.exportData(C.load());return;}
   if(a==='auth-backup-draft'){if(sync.conflict?.draft?.data)C.exportData(sync.conflict.draft.data);return;}
   if(a==='auth-backup-remote'){if(sync.conflict?.remote?.data)C.exportData(sync.conflict.remote.data);return;}
   if(a==='auth-resolve-remote'){
     if(!confirmed('ยืนยันใช้ข้อมูล Cloud? การแก้ไขในเครื่องที่ยังไม่ซิงค์จะถูกแทนที่ (ระบบจะดาวน์โหลดสำรองข้อมูลเครื่องนี้ให้ก่อน)'))return;
     if(sync.conflict?.draft?.data)C.exportData(sync.conflict.draft.data);
     void withCloudAction(async()=>{await sync.resolveConflict('remote');render(false);toast('ใช้ข้อมูล Cloud แล้ว');});return;
   }
   if(a==='auth-resolve-local'){
     if(!confirmed('ยืนยันใช้ข้อมูลเครื่องนี้แทน Cloud? ข้อมูล Cloud ปัจจุบันจะถูกแทนที่ (ระบบจะดาวน์โหลดสำรอง Cloud ก่อน)'))return;
     if(sync.conflict?.remote?.data)C.exportData(sync.conflict.remote.data);
     void withCloudAction(async()=>{await sync.resolveConflict('local');render(false);toast(sync.mode==='conflict'?'มีข้อมูลเปลี่ยนอีกครั้ง กรุณาเลือกรอบใหม่':'อัปโหลดข้อมูลเครื่องนี้แล้ว');});return;
   }
   if(a==='auth-migrate-local'){
     if(!confirmed('ย้ายข้อมูลจาก LocalStorage เดิมแทนข้อมูล Cloud ทั้งหมดใช่หรือไม่? ระบบจะดาวน์โหลดสำรองข้อมูล Cloud ก่อน'))return;
     C.exportData(state);
     void withCloudAction(async()=>{const ok=await sync.useGuestAsCloud();render(false);toast(ok?'ย้ายข้อมูลเดิมไป Cloud แล้ว':'ยังย้ายไม่ได้ กรุณาตรวจสถานะซิงค์','error');});return;
   }

   if(a==='mobile-open'){ui.mobileOpen=true;render(true);return;}
   if(a==='mobile-close'){ui.mobileOpen=false;render(true);return;}
   if(a==='toggle-theme'){state.settings.theme=state.settings.theme==='dark'?'light':'dark';update();return;}
   if(sync.isBlocked){toast('กรุณาจัดการข้อมูล Cloud ก่อน','error');return;}
   if(a==='start-real'){if(confirmed('เริ่มใช้งานจริง? ข้อมูลตัวอย่างทั้งหมดจะถูกล้าง แล้วเปิดโปรไฟล์ให้กรอกข้อมูลของคุณ (สามารถสำรองข้อมูลตัวอย่างก่อน)')){state=D.blankState();ui.search='';update();navigate('profile');ui.wizardDraft={...state.profile};openWizard(0);toast('เริ่มต้นด้วยข้อมูลของคุณได้เลย');}return;}
   if(a==='add-run'){ui.runDate=C.today();openRun();return;}
   if(a==='edit-run'){openRun(id);return;}
   if(a==='delete-run'){if(confirmed('ลบบันทึกการวิ่งนี้? การลบไม่กระทบ Workout Session')){state.runs=(state.runs||[]).filter(r=>r.id!==id);update();toast('ลบประวัติการวิ่งแล้ว');}return;}
   if(a==='timer-preset'){const s=Number(el.dataset.seconds);if(!workoutTimer.start('countdown',s)){toast('เวลาพักไม่ถูกต้อง','error');return;}try{timerSound??=new (window.AudioContext||window.webkitAudioContext)();timerSound.resume();}catch(_){/* no sound */}render(true);return;}
   if(a==='timer-countdown'){const m=document.getElementById('timer-minutes')?.value,sec=document.getElementById('timer-seconds')?.value,duration=C.parseDurationParts(m,sec);if(!duration){toast('กรอกนาทีและวินาทีให้ถูกต้อง (สูงสุด 600 นาที)','error');return;}workoutTimer.start('countdown',duration);try{timerSound??=new (window.AudioContext||window.webkitAudioContext)();timerSound.resume();}catch(_){/* no sound */}render(true);return;}
   if(a==='timer-stopwatch'){workoutTimer.start('stopwatch');render(true);return;}
   if(a==='timer-pause'){workoutTimer.pause();render(true);return;}
   if(a==='timer-resume'){workoutTimer.resume();render(true);return;}
   if(a==='timer-reset'){workoutTimer.reset();render(true);return;}
   if(a==='timer-notify'){if(typeof Notification==='undefined'||!window.isSecureContext){toast('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน หรือไม่ได้เปิดด้วย HTTPS','error');return;}Notification.requestPermission().then(p=>toast(p==='granted'?'เปิดแจ้งเตือนแล้ว':'ไม่ได้รับสิทธิ์แจ้งเตือน',p==='granted'?'success':'error'));return;}
   if(a==='goal-new'){openGoal();return;}
   if(a==='goal-filter'){ui.goalStatusFilter=el.dataset.value;render(true);return;}
   if(a==='goal-from-suggestion'){const kind=el.dataset.kind,rec=G.suggestions(state).find(x=>x.kind===kind);if(rec)openGoal(null,rec);return;}
   if(a==='goal-edit'){const g=(state.goals||[]).find(g=>g.id===id);if(g)openGoal(g);return;}
   if(a==='goal-review'){const g=(state.goals||[]).find(g=>g.id===id);if(g)openGoalReview(g);return;}
   if(a==='goal-status'){const g=(state.goals||[]).find(g=>g.id===id),status=el.dataset.status;if(!g||!['active','paused','completed'].includes(status))return;if(status==='completed'&&!confirmed('จบเป้าหมายนี้? สถานะจะเปลี่ยนเป็นสำเร็จโดยผู้ใช้ ไม่ใช่การยืนยันจากข้อมูลอัตโนมัติ'))return;g.status=status;update();toast('อัปเดตสถานะเป้าหมายแล้ว');return;}
   if(a==='goal-delete'){if(!confirmed('ลบเป้าหมายนี้พร้อมบันทึกการทบทวน? ประวัติอาหาร/การฝึก/การนอนจะไม่ถูกลบ'))return;state.goals=(state.goals||[]).filter(g=>g.id!==id);update();toast('ลบเป้าหมายแล้ว');return;}
   if(a==='hero-workout'){navigate('workouts');return;}
   if(a==='hero-food'){navigate('nutrition');return;}
   if(a==='quick-add'){openWeight();return;}
   if(a==='daily-sleep'){ui.sleepDate=C.today();openSleep();return;}
   if(a==='daily-meal'){ui.foodDate=C.today();openDailyMealPicker();return;}
   if(a==='daily-workout'){ui.workoutDate=C.today();ui.workoutDay=C.weekday(ui.workoutDate);navigate('workouts');return;}
   if(a==='daily-recovery'){ui.recoveryDate=C.today();openCheckin();return;}
   if(a==='daily-weight'){const today=C.today(),found=state.weights.find(x=>x.date===today);openWeight(found?.id);return;}
   if(a==='daily-live'){ui.workoutDate=C.today();ui.workoutDay=C.weekday(ui.workoutDate);navigate('workouts');liveStart();return;}
   if(a==='daily-meal-new'){closeModal();ui.foodDate=C.today();navigate('nutrition');openMeal();return;}
   if(a==='daily-repeat'){
     const source=state.meals.find(x=>x.id===id&&x.date<C.today());if(!source)return;
     const already=state.meals.some(x=>x.date===C.today()&&(x.copiedFrom===source.id));
     if(!confirmed(`${already?'คุณเคยคัดลอกรายการนี้ในวันนี้แล้ว\n':' '}เพิ่ม “${source.name}” ${n(source.servings,2)} × ${source.unit||'เสิร์ฟ'} (${n(source.kcal*source.servings)} kcal) ลงบันทึกวันนี้หรือไม่?`))return;
     state.meals.push(...Daily.safeCopyRows([source],C.today(),C.uid));ui.foodDate=C.today();closeModal();update();toast('นำเมนูเดิมมาบันทึกวันนี้แล้ว · แก้ไขปริมาณได้ที่หน้าโภชนาการ');return;
   }
   if(a==='daily-template'){
     const t=templates().find(t=>t.id===id);if(!t||!U.validMealTemplate(t))return;
     const count=C.mealsFor(state,C.today()).filter(x=>x.fromTemplate===t.id).length;
     if(!confirmed(`${count?'เคยใช้เทมเพลตนี้วันนี้แล้ว\n':''}เพิ่ม “${t.name}” ทั้ง ${t.items.length} รายการลงในวันนี้ใช่หรือไม่?`))return;
     state.meals.push(...U.applyTemplate(t,C.today(),C.uid));ui.foodDate=C.today();closeModal();update();toast('เพิ่มทั้งมื้อจากเทมเพลตแล้ว');return;
   }
   if(a==='daily-copy-meal'){openDailyCopyPicker();return;}
   if(a==='daily-copy-type'){
     const meal=el.dataset.meal;if(!D.MEALTYPES[meal])return;
     const rows=Daily.lastSameMeal(state,C.today(),meal);if(!rows.length)return;
     const duplicated=state.meals.some(x=>x.date===C.today()&&rows.some(r=>r.id===x.copiedFrom));
     if(!confirmed(`${duplicated?'รายการบางส่วนเคยถูกคัดลอกวันนี้แล้ว\n':''}ใช้ ${D.MEALTYPES[meal]} จากวันที่ ${C.shortDate(rows[0].date)} ทั้ง ${rows.length} รายการในวันนี้ใช่หรือไม่?`))return;
     state.meals.push(...Daily.safeCopyRows(rows,C.today(),C.uid));ui.foodDate=C.today();closeModal();update();toast('คัดลอกมื้อแล้ว · แก้ไขปริมาณได้ในหน้าโภชนาการ');return;
   }
   if(a==='quick-menu'){openQuickLog();return;}
   if(a==='quick-log'){quickLog(el.dataset.kind);return;}
   if(a==='nav-group'){const group=el.dataset.group;if(!ui.menuOpen.hasOwnProperty(group))return;ui.menuOpen[group]=!ui.menuOpen[group];const region=document.getElementById(`nav-${group}`);if(region)region.hidden=!ui.menuOpen[group];el.setAttribute('aria-expanded',String(ui.menuOpen[group]));return;}
   if(a==='select-workday'){ui.workoutDay=Number(el.dataset.day);ui.workoutDate=C.weekDates(ui.workoutDate)[ui.workoutDay];render(true);return;}
   if(a==='reschedule'){openReschedule();return;}
   if(a==='clear-override'){if(!confirmed('คืนตารางวันที่เลือกตามเทมเพลตปกติ? (ไม่ลบประวัติการฝึก)'))return;if(state.scheduleOverrides)delete state.scheduleOverrides[ui.workoutDate];update();toast('คืนตารางปกติแล้ว');return;}
   if(a==='session-add-set'){const list=el.closest('.session-ex')?.querySelector('.set-list');if(!list)return;if(list.children.length>=30){toast('ไม่เกิน 30 เซตต่อท่า','error');return;}const block=el.closest('.session-ex'),i=Number(block?.dataset.exindex),date=ui.workoutDate,previous=state.sessions.find(x=>x.date===date)?.exercises||C.planOn(state,date).exercises;list.insertAdjacentHTML('beforeend',sessionSetItem(null,previous[i]));return;}
   if(a==='session-remove-set'){el.closest('.set-entry')?.remove();return;}
   if(a==='edit-day'){openDay();return;}
   if(a==='open-exercise'){openExercise();return;}
   if(a==='open-exercise-library'){openExerciseLibrary();return;}
   if(a==='library-use'){openExercise(null,'custom:'+id);return;}
   if(a==='library-delete'){if(!confirmed('ลบท่านี้ออกจากคลังส่วนตัว? ตารางที่เคยเพิ่มและประวัติการฝึกจะยังอยู่'))return;state.customExercises=(state.customExercises||[]).filter(x=>x.id!==id);update();openExerciseLibrary();toast('ลบออกจากคลังแล้ว');return;}
   if(a==='edit-exercise'){openExercise(id);return;}
   if(a==='delete-exercise'){const p=editablePlan();if(confirmed('ลบท่านี้ออกจากเทมเพลตวันฝึก? (ไม่ลบประวัติการฝึกเดิม)')){p.exercises=p.exercises.filter(x=>x.id!==id);update();toast('ลบท่าเรียบร้อย');}return;}
   if(a==='open-session'){openSession();return;}
   if(a==='today-workout'){ui.workoutDate=C.today();ui.workoutDay=C.weekday(C.today());openSession();return;}
   if(a==='edit-session-date'){ui.workoutDate=date;ui.workoutDay=C.weekday(date);openSession();return;}
   if(a==='delete-session'){removeItem('sessions',x=>x.date===ui.workoutDate,'ลบบันทึกการฝึกของวันที่เลือก?');return;}
   if(a==='food-library-edit'){openCustomFoodEditor(id);return;}
   if(a==='food-library-delete'){
     const food=state.customFoods.find(x=>x.id===id);if(!food)return;
     if(!confirmed(`ลบ “${food.name}” ออกจากคลังอาหารส่วนตัว? ประวัติอาหารที่บันทึกแล้วจะยังอยู่ แต่จะเลือกเมนูนี้จากคลังไม่ได้อีก`))return;
     state.customFoods=state.customFoods.filter(x=>x.id!==id);
     state.favoriteFoodIds=(state.favoriteFoodIds||[]).filter(x=>x!==id);
     closeModal();update();toast('ลบเมนูออกจากคลังส่วนตัวแล้ว · ประวัติมื้ออาหารยังอยู่');return;
   }
   if(a==='food-favorite'){
     if(!id)return;
     const all=[...D.FOOD_LIBRARY,...state.customFoods];if(!all.some(x=>x.id===id))return;
     state.favoriteFoodIds=state.favoriteFoodIds||[];
     state.favoriteFoodIds=state.favoriteFoodIds.includes(id)?state.favoriteFoodIds.filter(x=>x!==id):[...state.favoriteFoodIds,id];
     update();return;
   }
   if(a==='food-more'){ui.foodLimit+=60;render(true);return;}
   if(a==='copy-yesterday'){
     const sourceDate=C.shift(ui.foodDate,-1),source=C.mealsFor(state,sourceDate);
     if(!source.length){toast('วันก่อนหน้ายังไม่มีอาหารที่บันทึก','error');return;}
     if(C.mealsFor(state,ui.foodDate).length&&!confirmed(`เพิ่มรายการจาก ${C.shortDate(sourceDate)} เข้าไปในวันที่ ${C.shortDate(ui.foodDate)} โดยไม่ลบรายการเดิม?`))return;
     let added=0;
     for(const row of source){if(state.meals.some(x=>x.date===ui.foodDate&&x.copiedFrom===row.id))continue;
       state.meals.push({...row,id:C.uid(),date:ui.foodDate,copiedFrom:row.id});added++;
     }
     if(added){update();toast(`คัดลอกอาหาร ${added} รายการแล้ว`);}else toast('คัดลอกไว้แล้ว ไม่มีรายการใหม่');return;
   }
   if(a==='repeat-meal'){
     const original=(state.meals||[]).find(x=>x.id===id);
     if(!original||original.date>=ui.foodDate){toast('ไม่พบมื้ออาหารย้อนหลังที่เลือก','error');return;}
     if(state.meals.some(x=>x.date===ui.foodDate&&x.copiedFrom===original.id)){toast('เมนูนี้ถูกบันทึกซ้ำจากรายการนี้ในวันที่เลือกแล้ว หากกินอีกมื้อให้เพิ่มผ่านคลังอาหาร');return;}
     state.meals.push({...original,id:C.uid(),date:ui.foodDate,copiedFrom:original.id});update();toast(`เพิ่ม ${original.name} จากประวัติแล้ว · ตรวจปริมาณอีกครั้ง`);return;
   }
   if(a==='open-meal'){openMeal();return;}
   if(a==='food-add'){openMeal(id);return;}
   if(a==='edit-meal'){openMeal(null,id);return;}
   if(a==='delete-meal'){removeItem('meals',x=>x.id===id,'ลบรายการอาหารนี้?');return;}
   if(a==='open-checkin'){openCheckin();return;}
   if(a==='delete-checkin'){removeItem('checkins',x=>x.date===date,'ลบ Check-in ของวันที่เลือก?');return;}
   if(a==='open-sleep'){openSleep();return;}
   if(a==='edit-sleep'){ui.sleepDate=date;openSleep();return;}
   if(a==='delete-sleep'){removeItem('sleeps',x=>x.date===date,'ลบบันทึกการนอนคืนนี้?');return;}
   if(a==='routine-day'){ui.routineDay=Number(el.dataset.day);render(true);return;}
   if(a==='open-routine'){openRoutine();return;}
   if(a==='edit-routine'){openRoutine(id);return;}
   if(a==='delete-routine'){removeItem('routines',x=>x.id===id,'ลบกิจกรรมนี้จากทุกวันที่เลือกไว้?');return;}
   if(a==='insights-days'){ui.insightsDays=Number(el.dataset.value);render(true);return;}
   if(a==='insights-focus'){setInsightsFocus(el.dataset.value);return;}
   if(a==='wa-range'){if(![30,90,180].includes(Number(el.dataset.value)))return;ui.analyticsDays=Number(el.dataset.value);render(true);return;}
   if(a==='metabolism-period'){ui.metabolismDays=Number(el.dataset.value);render(true);return;}
   if(a==='period'){ui.weightPeriod=Number(el.dataset.value);render(true);return;}
   if(a==='edit-weight'){openWeight(id);return;}
   if(a==='delete-weight'){removeItem('weights',x=>x.id===id,'ลบบันทึกน้ำหนักนี้?');return;}
   if(a==='export'){C.exportData(state);toast('สร้างไฟล์สำรองข้อมูลแล้ว');return;}
   if(a==='reset'){
     if(confirmed(sync.isCloud?'ล้างข้อมูลในบัญชี Cloud? ระบบจะดาวน์โหลดสำรองข้อมูลก่อน':'ล้างข้อมูลทั้งหมดในเครื่องนี้? แนะนำให้สำรองข้อมูลก่อน')&&confirmed('ยืนยันการล้างข้อมูลอีกครั้ง?')){
       if(sync.isCloud)C.exportData(state);
       state=D.blankState();update();navigate('profile');toast(sync.isCloud?'ล้างข้อมูลที่แสดงแล้ว · กำลังซิงค์ Cloud':'เริ่มต้นใหม่เรียบร้อย');
     }return;
   }
 });
 document.addEventListener('input',event=>{
   if(event.target.closest('#run-form')){updateRunPreview();return;}
   if(event.target.closest('#meal-form')){refreshMealPreview();return;}
   if(event.target.id==='food-search'){
     ui.search=event.target.value;
     const all=[...D.FOOD_LIBRARY,...state.customFoods];
     const q=ui.search.toLocaleLowerCase().trim();
     const favs=state.favoriteFoodIds||[];ui.foodLimit=60;
     const arr=all.filter(x=>(ui.foodCategory==='ทั้งหมด'||(ui.foodCategory==='รายการโปรด'?favs.includes(x.id):x.group===ui.foodCategory))&&(`${x.name} ${x.unit} ${x.group}`.toLocaleLowerCase().includes(q)));
     const list=document.getElementById('food-library-list');if(list)list.innerHTML=renderFoodList(arr);
     const count=document.querySelector('.food-count');if(count)count.textContent=`แสดง ${Math.min(arr.length,ui.foodLimit)} จาก ${arr.length} รายการ · ${(state.favoriteFoodIds||[]).length} รายการโปรด`;
   }
 });
 document.addEventListener('change',async event=>{
   const el=event.target;
   if(el.id==='wa-exercise-select'){ui.analyticsExercise=el.value;render(true);return;}
   if(el.dataset.picker&&C.isDate(el.value)){ui[el.dataset.picker]=el.value;if(el.dataset.picker==='workoutDate')ui.workoutDay=C.weekday(el.value);render(true);return;}
   if(el.id==='goal-kind'){
     const spec=G.KINDS[el.value],f=el.closest('form');if(!spec||!f)return;
     const target=f.querySelector('#goal-target'),label=f.querySelector('#goal-target-label');
     if(target){target.value=spec.min;target.min=spec.min;target.max=spec.max;target.step=spec.step;}
     if(label)label.textContent=`ค่าเป้าหมาย (${spec.unit})`;
     const titleInput=f.elements.title; if(titleInput&&Object.values(G.KINDS).some(x=>x.label===titleInput.value))titleInput.value=spec.label;
     return;
   }
   if(el.id==='sleep-stage-unit'){
     const form=el.closest('form');if(!form)return;
     for(const key of ['deep','light','rem']){const inp=form.elements[key];if(inp){inp.value='';inp.max=el.value==='percent'?'100':'1200';inp.step=el.value==='percent'?'0.1':'1';}}
     form.querySelectorAll('[data-unit-label]').forEach(node=>node.textContent=el.value==='percent'?'%':'นาที');
     const help=form.querySelector('#sleep-stage-help');if(help)help.textContent='เปลี่ยนหน่วยแล้วระบบล้างตัวเลขเดิมในฟอร์มเพื่อป้องกันการตีความผิด กรุณากรอกข้อมูลจากอุปกรณ์ใหม่ (Deep + Light + REM รวมได้ไม่เกิน '+(el.value==='percent'?'100%':'เวลานอนจริง')+')';return;
   }
   if(el.id==='food-group'){ui.foodCategory=el.value;ui.foodLimit=60;render(true);return;}
   if(el.id==='meal-macro-status'){refreshMealPreview();return;}
   if(el.id==='meal-quantity-mode'){const f=el.closest('form'),input=f?.elements.quantity;if(input){input.value=el.value==='grams'?(num(f.elements.baseGrams.value,0)*num(input.value,1)||''):num(input.value)/(num(f.elements.baseGrams.value)||1);input.max=el.value==='grams'?'3000':'30';const lab=f.querySelector('#meal-quantity-label');if(lab)lab.textContent=el.value==='grams'?'ปริมาณที่กิน (กรัม) *':'จำนวนเสิร์ฟ *';}refreshMealPreview();return;}
   if(el.id==='font-select'){const preview=document.getElementById('font-preview');if(preview)preview.style.fontFamily=({sarabun:'Sarabun',bai:'Bai Jamjuree',noto:'Noto Sans Thai',ibm:'IBM Plex Sans Thai',leelawadee:'Leelawadee UI',tahoma:'Tahoma',segoe:'Segoe UI',prompt:'Prompt',kanit:'Kanit',mitr:'Mitr',anakotmai:'Anakotmai',athiti:'Athiti',trirong:'Trirong',itim:'Itim',pattaya:'Pattaya',chonburi:'Chonburi'})[el.value]||'inherit';return;}
   if(el.id==='intelligence-exercise'){ui.exerciseFocus=el.value;render(true);return;}
   if(el.id==='goal-select'){const adj=document.getElementById('calorie-adjust');if(adj)adj.value=D.GOALS[el.value]?.adjust??0;return;}
   if(el.id==='exercise-template'){const ex=exerciseLibrary().find(x=>x.key===el.value),form=el.closest('form');if(!ex||!form)return;const kind=C.exerciseMode(ex);for(const k of ['name','sets','rest'])form.elements[k].value=ex[k];form.elements.reps.value=kind.measure==='reps'?ex.reps:'';const parts=C.durationParts(C.exerciseSeconds(ex)||45);form.elements.targetMinutes.value=parts.minutes;form.elements.targetRemainingSeconds.value=parts.seconds;form.elements.load.value=kind.loadType==='external'?ex.load:0;form.elements.measure.value=kind.measure;form.elements.loadType.value=kind.loadType;syncExerciseInputs(form);return;}
   if(el.id==='exercise-measure'||el.id==='exercise-load-type'){syncExerciseInputs(el.closest('form'));return;}
   if(el.id==='import-file'&&el.files?.length){
     const file=el.files[0];if(file.size>5*1024*1024){toast('ไฟล์มีขนาดเกิน 5 MB','error');return;}
     try{const data=JSON.parse(await file.text());if(!C.validateImported(data)){toast('รูปแบบไฟล์สำรองไม่ถูกต้อง หรือเวอร์ชันไม่รองรับ','error');return;}
       if(confirmed('นำเข้าข้อมูลนี้แทนข้อมูลปัจจุบันทั้งหมด? ระบบจะดาวน์โหลดสำรองข้อมูลเดิมก่อน')){C.exportData(state);state=data;update();render(false);toast(sync.isCloud?'นำเข้าแล้ว · กรุณาตรวจสถานะการซิงค์ Cloud':'นำเข้าข้อมูลสำเร็จ');}
     }catch(err){console.error(err);toast('นำเข้าไม่สำเร็จ: ไฟล์ไม่ถูกต้องหรือบันทึกไม่ได้','error');}
   }
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.getElementById('modal-root').children.length)closeModal();});
 document.addEventListener('submit',event=>{
   const form=event.target;if(!form.id)return;
   event.preventDefault();
   if(form.id==='auth-form'||form.id==='auth-password-form'){void handleAuthForm(form);return;}
   if(sync.isBlocked){toast('กรุณาแก้ไขสถานะ Cloud ก่อนบันทึก','error');return;}
   const fd=new FormData(form),get=k=>String(fd.get(k)??'').trim();
   const metric=k=>Number(get(k));
   if(form.id==='run-goal-form'){
     const goal=metric('goal');if(!Number.isFinite(goal)||goal<0||goal>500){toast('เป้าหมายต้องอยู่ระหว่าง 0–500 km','error');return;}
     state.settings.runWeeklyGoalKm=goal;update();toast('บันทึกเป้าหมายการวิ่งแล้ว');return;
   }
   if(form.id==='run-form'){
     const durationSeconds=Run.parseDuration(get('minutes'),get('seconds'));
     const existing=(state.runs||[]).find(r=>r.id===form.dataset.id);
     const entry={id:existing?.id||C.uid(),date:get('date'),type:get('type'),distanceKm:metric('distanceKm'),durationSeconds,rpe:get('rpe')===''?null:metric('rpe'),notes:get('notes')};
     if(!Run.validRun(entry)||entry.date>C.today()){toast('ตรวจสอบวันที่ ระยะทาง นาที/วินาที และ RPE อีกครั้ง','error');return;}
     state.runs=(state.runs||[]).filter(r=>r.id!==entry.id);state.runs.push(entry);ui.runDate=entry.date;
     closeModal();update();toast('บันทึกการวิ่งแล้ว · Pace '+Run.pace(entry.distanceKm,entry.durationSeconds));return;
   }
   if(form.id==='wizard-form'){
     if(!collectWizard())return;
     const p=ui.wizardDraft;
     if(!p||p.age<18||p.age>100||p.height<100||p.height>250||p.weight<25||p.weight>400||!D.ACTIVITY[p.activity]||!D.GOALS[p.goal]||!['male','female'].includes(p.sex)||p.targetWeight!==''&&(p.targetWeight<25||p.targetWeight>400)||p.calorieAdjust< -750||p.calorieAdjust>750||p.proteinPerKg<.8||p.proteinPerKg>2.5||p.fatPercent<15||p.fatPercent>40||p.sleepGoal<6||p.sleepGoal>12){toast('ข้อมูลโปรไฟล์ไม่ถูกต้อง','error');return;}
     state.profile={...p};ui.wizardDraft=null;closeModal();update();toast('ตั้งโปรไฟล์ครบ 3 ขั้นแล้ว');return;
   }
   if(form.id==='meal-template-form'){
     const name=get('name'),meal=get('meal'),rows=C.mealsFor(state,ui.foodDate).filter(x=>x.meal===meal);
     if(!name||name.length>100||!D.MEALTYPES[meal]||rows.length===0){toast('กรุณาเลือกมื้อที่มีรายการอาหารอย่างน้อย 1 รายการ','error');return;}
     if(rows.length>30||templates().length>=120){toast('เทมเพลตเกินจำนวนที่กำหนด','error');return;}
     const template=U.makeTemplate(name,meal,rows,C.uid());
     if(!U.validMealTemplate(template)){toast('ข้อมูลเทมเพลตไม่ถูกต้อง','error');return;}
     state.mealTemplates=[...templates(),template];closeModal();update();toast('บันทึกเทมเพลตทั้งมื้อแล้ว');return;
   }
   if(form.id==='font-form'){const font=get('font');if(!FONTS[font]){toast('ฟอนต์ไม่ถูกต้อง','error');return;}state.settings.font=font;update();toast('บันทึกแบบอักษรแล้ว');return;}
   if(form.id==='profile-form'){
     const p={name:get('name'),age:metric('age'),height:metric('height'),weight:metric('weight'),sex:get('sex'),activity:get('activity'),goal:get('goal'),targetWeight:get('targetWeight')===''?'':metric('targetWeight'),calorieAdjust:metric('calorieAdjust'),proteinPerKg:metric('proteinPerKg'),fatPercent:metric('fatPercent'),sleepGoal:metric('sleepGoal')};
     if(p.age<18||p.age>100||p.weight<25||p.weight>400||p.height<100||p.height>250||!D.GOALS[p.goal]||!D.ACTIVITY[p.activity]||!['male','female'].includes(p.sex)){toast('กรุณาตรวจสอบข้อมูลโปรไฟล์','error');return;}
     if(p.targetWeight!==''&&(p.targetWeight<25||p.targetWeight>400)){toast('น้ำหนักเป้าหมายไม่ถูกต้อง','error');return;}
     const font=get('font')||state.settings.font||'ibm';if(!FONTS[font]){toast('ฟอนต์ไม่ถูกต้อง','error');return;}state.settings.font=font;state.profile=p;update();toast('อัปเดตโปรไฟล์และฟอนต์แล้ว');return;
   }
   if(form.id==='reschedule-form'){
     const a=get('source'),b=get('target');
     if(!C.isDate(a)||!C.isDate(b)||a===b||a<C.today()||b<C.today()){toast('เลือกวันต้นทางและปลายทางให้ถูกต้องและไม่ใช่วันในอดีต','error');return;}
     if(state.sessions.some(x=>x.date===a||x.date===b)){toast('วันที่เลือกมีประวัติการฝึกแล้ว เพื่อความปลอดภัยจึงไม่สามารถสลับแผน','error');return;}
     const clone=x=>({type:x.type,title:x.title,exercises:x.exercises.map(ex=>({...ex}))});
     const first=clone(C.planOn(state,a)),second=clone(C.planOn(state,b));
     if(!confirmed(`สลับโปรแกรม ${a}: ${first.title} กับ ${b}: ${second.title} ใช่หรือไม่?`))return;
     state.scheduleOverrides=state.scheduleOverrides||{};
     state.scheduleOverrides[a]=second;state.scheduleOverrides[b]=first;
     ui.workoutDate=a;ui.workoutDay=C.weekday(a);closeModal();update();toast('สลับแผนเฉพาะสองวันแล้ว');return;
   }
   if(form.id==='day-form'){
     const p=state.plan[ui.workoutDay],title=get('title'),type=get('type');
     if(!title||!D.TYPES[type])return;
     p.title=title;p.type=type;closeModal();update();toast('อัปเดตแผนวันฝึกแล้ว');return;
   }
   if(form.id==='exercise-form'){
     const measure=['reps','time'].includes(get('measure'))?get('measure'):'reps';
     const loadType=['external','bodyweight','none'].includes(get('loadType'))?get('loadType'):C.exerciseMode({name:get('name'),reps:get('reps'),load:metric('load')}).loadType;
     // Older headless regression fixtures may still supply `targetSeconds`.
     // The real editor always renders targetMinutes + targetRemainingSeconds.
     const seconds=measure==='time'?(fd.has('targetMinutes')||fd.has('targetRemainingSeconds')?C.parseDurationParts(get('targetMinutes'),get('targetRemainingSeconds')):(fd.has('targetSeconds')?metric('targetSeconds'):null)):null;
     const reps=measure==='time'&&seconds!==null?`${seconds} วินาที`:get('reps');
     const ex={id:form.dataset.id||C.uid(),name:get('name'),sets:metric('sets'),reps,load:loadType==='external'?metric('load'):0,rest:metric('rest'),measure,loadType};
     if(measure==='time')ex.targetSeconds=seconds;
     if(!ex.name||!ex.reps||ex.sets<1||ex.sets>30||ex.load<0||ex.load>1000||ex.rest<0||ex.rest>1800||!C.validExerciseExtra(ex)||(measure==='time'&&(!Number.isInteger(seconds)||seconds<1||seconds>36000))){toast('กรุณาตรวจสอบรายละเอียดท่าและประเภทการนับ','error');return;}
     const plan=editablePlan();const at=plan.exercises.findIndex(x=>x.id===ex.id);
     if(at===-1){if(plan.exercises.length>=150){toast('ท่าในหนึ่งวันได้ไม่เกิน 150 ท่า','error');return;}plan.exercises.push(ex);}else plan.exercises[at]=ex;
     if(fd.has('rememberExercise')){
       state.customExercises=state.customExercises||[];
       const found=state.customExercises.findIndex(x=>x.name.trim().toLocaleLowerCase()===ex.name.trim().toLocaleLowerCase());
       const saved={...ex,id:found>=0?state.customExercises[found].id:C.uid()};
       if(found>=0)state.customExercises[found]=saved;
       else if(state.customExercises.length<1500)state.customExercises.push(saved);
     }
     closeModal();update();toast('บันทึกท่าแล้ว · เลือกใช้จากคลังได้ในวันอื่น');return;
   }
   if(form.id==='goal-form'){
     const old=(state.goals||[]).find(x=>x.id===form.dataset.id),kind=old?.kind||get('kind');
     const candidate={id:old?.id||C.uid(),kind,title:get('title'),target:Number(get('target')),startDate:get('startDate'),endDate:get('endDate'),status:old?.status||'active',note:get('note'),reviews:old?.reviews||[]};
     if(candidate.title.length<1||candidate.title.length>100||!G.validGoal(candidate)||candidate.startDate>C.today()){toast('ตรวจสอบชื่อเป้าหมาย ค่าเป้าหมาย และช่วงวันที่ (ไม่เกิน 365 วัน)','error');return;}
     if(!old&&(state.goals||[]).length>=100){toast('จำนวนเป้าหมายถึงขีดจำกัดแล้ว','error');return;}
     state.goals=(state.goals||[]).filter(x=>x.id!==candidate.id);state.goals.push(candidate);
     closeModal();ui.goalStatusFilter='active';update();toast('บันทึกเป้าหมายแล้ว');return;
   }
   if(form.id==='goal-review-form'){
     const goal=(state.goals||[]).find(x=>x.id===form.dataset.id),note=get('note'),rating=Number(get('rating'));
     if(!goal||!note||note.length>300||!Number.isInteger(rating)||rating<1||rating>5||(goal.reviews||[]).length>=120){toast('ตรวจสอบบันทึกและคะแนนอีกครั้ง','error');return;}
     goal.reviews=goal.reviews||[];goal.reviews.push({date:C.today(),note,rating});closeModal();update();toast('บันทึกการทบทวนแล้ว');return;
   }
   if(form.id==='session-form'){
     const date=get('date'),day=C.weekday(date),old=state.sessions.find(x=>x.date===ui.workoutDate),plan=C.planOn(state,date);
     if(!C.isDate(date)||date>C.today()||(!old&&date!==ui.workoutDate&&state.sessions.some(x=>x.date===date))){toast('วันที่บันทึกไม่ถูกต้อง หรือมีบันทึกอยู่แล้ว','error');return;}
     if(date!==ui.workoutDate&&state.sessions.some(x=>x.date===date)){toast('วันที่ใหม่มีบันทึกอยู่แล้ว','error');return;}
     const previous=old?.exercises||plan.exercises;let invalid=false;
     let exercises;
     if(typeof form.querySelectorAll==='function'){
       const blocks=[...form.querySelectorAll('.session-ex')];
       exercises=previous.map((ex,i)=>{
         const block=blocks.find(b=>Number(b.dataset.exindex)===i),rows=[];
         const kind=C.exerciseMode(ex);
         if(block)for(const line of block.querySelectorAll('.set-entry')){
           const timed=kind.measure==='time';
           const field=line.querySelector(timed?'[data-set="minutes"]':'[data-set="reps"]');
           const entryText=field?.value.trim()||'';
           const remainderText=timed?(line.querySelector('[data-set="remaining-seconds"]')?.value.trim()||''):'';
           const weightField=line.querySelector('[data-set="load"]');
           const loadText=weightField?.value.trim()||'';
           if(!line.querySelector('[data-set="completed"]')?.checked)continue;
           if(!entryText&&!remainderText&&!loadText){invalid=true;continue;}
           const value=timed?C.parseDurationParts(entryText,remainderText):Number(entryText);
           const load=kind.loadType==='external'?Number(loadText):0;
           if(value===null||!Number.isInteger(value)||value<1||value>(timed?36000:100)||!Number.isFinite(load)||load<0||load>1000){invalid=true;continue;}
           rows.push({...timed?{seconds:value}:{reps:value},load,warmup:!!line.querySelector('[data-set="warmup"]')?.checked});
         }
         if(rows.length>30)invalid=true;
         return {...ex,setLog:rows};
       });
     }else{
       // Only used by DOM-less regression tests. Real browsers always use per-set rows.
       exercises=previous.map((ex,i)=>({...ex,sets:Number(get(`sets-${i}`))||ex.sets,reps:get(`reps-${i}`)||ex.reps,load:Number(get(`load-${i}`))||ex.load}));
     }
     if(exercises.some(x=>Number(x.sets)>0)&&!exercises.some(x=>(x.setLog||[]).length)&&!confirmed('คุณยังไม่ได้ยืนยันว่า “ทำแล้ว” สำหรับเซตใดเลย ต้องการบันทึก Session โดยไม่มีเซตจริงหรือไม่?'))return;
     const duration=metric('duration'),rpe=get('rpe')?metric('rpe'):null;
     if(invalid||!Number.isFinite(duration)||duration<0||duration>600||(rpe!==null&&(rpe<1||rpe>10))){toast('ตรวจสอบจำนวนครั้ง นาที/วินาที (วินาทีต้องน้อยกว่า 60) น้ำหนัก หรือ RPE','error');return;}
     const session={id:old?.id||C.uid(),date,day,type:old?.type||plan.type,title:old?.title||plan.title,duration,rpe,notes:get('notes'),exercises};
     if(old)state.sessions=state.sessions.filter(x=>x.id!==old.id);state.sessions.push(session);
     ui.workoutDate=date;ui.workoutDay=day;closeModal();update();toast('บันทึกการฝึกแล้ว');return;
   }
   if(form.id==='custom-food-form'){
     const existing=state.customFoods.find(x=>x.id===form.dataset.id);
     if(!existing){toast('ไม่พบเมนูที่ต้องการแก้ไข','error');return;}
     try{
       const updated=FoodEdit.update(existing,Object.fromEntries(fd),state.customFoods);
       state.customFoods=state.customFoods.map(x=>x.id===existing.id?updated:x);
       closeModal();update();toast('อัปเดตเมนูในคลังแล้ว · ประวัติบันทึกเก่าไม่เปลี่ยน');
     }catch(err){toast(err.message||'กรุณาตรวจสอบข้อมูลเมนูอาหาร','error');}
     return;
   }
   if(form.id==='meal-form'){
     const mode=get('quantityMode'),quantity=metric('quantity'),baseGrams=get('baseGrams')===''?null:metric('baseGrams');
     if(!['grams','servings'].includes(mode)||!Number.isFinite(quantity)||quantity<0.1||(mode==='grams'&&quantity>3000)||(mode==='servings'&&quantity>30)||(baseGrams!==null&&(!Number.isFinite(baseGrams)||baseGrams<1||baseGrams>10000))||(mode==='grams'&&baseGrams===null)){
       toast('ตรวจสอบปริมาณอาหารและน้ำหนักต่อหนึ่งเสิร์ฟ','error');return;
     }
     const servings=mode==='grams'?Number((quantity/baseGrams).toFixed(6)):quantity;
     if(servings<=0||servings>30){toast('ปริมาณอาหารเกินขอบเขตที่รองรับ','error');return;}
     const macroStatus=get('macroStatus')||'known',macroKnown=macroStatus!=='unknown';
     if(macroKnown&&['protein','carbs','fat'].some(k=>get(k)==='')){toast('กรุณากรอก Macro ให้ครบ หรือเลือกบันทึกเฉพาะแคลอรี่','error');return;}
     const food={name:get('name'),unit:get('unit'),servings,baseGrams,quantityMode:mode,quantityGrams:mode==='grams'?quantity:null,kcal:metric('kcal'),protein:macroKnown?metric('protein'):0,carbs:macroKnown?metric('carbs'):0,fat:macroKnown?metric('fat'):0,macroKnown,macroEstimated:macroKnown&&form.dataset.estimated==='true',source:form.dataset.foodsource==='HDmall'?'HDmall':undefined,date:get('date'),meal:get('meal')};
     if(!food.name||!food.unit||!C.isDate(food.date)||food.date>C.today()||!D.MEALTYPES[food.meal]||['kcal','protein','carbs','fat'].some(k=>food[k]<0||!Number.isFinite(food[k]))){toast('กรุณาตรวจสอบรายการอาหาร','error');return;}
     const prev=state.meals.find(x=>x.id===form.dataset.id);
     state.meals=state.meals.filter(x=>x.id!==form.dataset.id);
     state.meals.push({id:prev?.id||C.uid(),foodId:prev?.foodId||form.dataset.foodid||null,copiedFrom:prev?.copiedFrom,...food});
     if(!prev&&!form.dataset.foodid&&fd.has('remember'))state.customFoods.push({id:C.uid(),name:food.name,unit:food.unit,baseGrams:food.baseGrams,kcal:food.kcal,protein:food.protein,carbs:food.carbs,fat:food.fat,macroKnown:food.macroKnown,macroEstimated:food.macroEstimated,group:'เมนูของฉัน'});
     ui.foodDate=food.date;closeModal();update();toast('บันทึกอาหารเรียบร้อย');return;
   }
   if(form.id==='checkin-form'){
     const date=get('date'),old=R.checkins(state).find(x=>x.date===date);
     const optional=k=>get(k)===''?null:metric(k);
     const entry={id:old?.id||C.uid(),date,energy:metric('energy'),fatigue:metric('fatigue'),soreness:metric('soreness'),stress:metric('stress'),mood:metric('mood'),waterMl:optional('waterMl'),steps:optional('steps'),note:get('note')};
     if(!R.validCheckin(entry)||date>C.today()){toast('กรุณาตรวจสอบข้อมูล Recovery (ระดับ 1–5) และวันที่','error');return;}
     state.checkins=(state.checkins||[]).filter(x=>x.date!==date);state.checkins.push(entry);
     ui.recoveryDate=date;closeModal();update();toast('บันทึก Recovery Check-in แล้ว');return;
   }
   if(form.id==='sleep-form'){
     const date=get('date'),stageUnit=get('stageUnit')||'minutes',entry={id:C.uid(),date,bed:get('bed'),wake:get('wake'),awake:metric('awake'),stageUnit,deep:get('deep')===''?null:metric('deep'),light:get('light')===''?null:metric('light'),rem:get('rem')===''?null:metric('rem'),note:get('note')};
     const dur=C.sleepDuration(entry);
     if(!C.isDate(date)||date>C.today()||dur===null||dur<=0){toast('ตรวจสอบเวลาเข้านอนและนาทีที่ตื่น','error');return;}
     if(!C.validSleepStages(entry)){toast(stageUnit==='percent'?'Deep + Light + REM รวมกันต้องไม่เกิน 100%':'Deep + Light + REM รวมกันต้องไม่เกินเวลานอนจริง','error');return;}
     state.sleeps=state.sleeps.filter(x=>x.date!==date&&x.date!==ui.sleepDate);state.sleeps.push(entry);ui.sleepDate=date;
     closeModal();update();toast(`บันทึกการนอนแล้ว (${formatHour(dur)})`);return;
   }
   if(form.id==='weight-form'){
     const date=get('date'),weight=metric('weight'),bodyFat=get('bodyFat')===''?null:metric('bodyFat');
     if(!C.isDate(date)||date>C.today()||weight<25||weight>400||(bodyFat!==null&&(bodyFat<1||bodyFat>70))){toast('ค่าหรือวันที่ชั่งน้ำหนักไม่ถูกต้อง','error');return;}
     const old=state.weights.find(x=>x.id===form.dataset.id||x.date===date);
     state.weights=state.weights.filter(x=>x.id!==form.dataset.id&&x.date!==date);
     state.weights.push({id:old?.id||C.uid(),date,weight,bodyFat});closeModal();update();toast('บันทึกน้ำหนักและอัปเดตข้อมูลแล้ว');return;
   }
   if(form.id==='routine-form'){
     const days=fd.getAll('days').map(Number),entry={id:form.dataset.id||C.uid(),title:get('title'),start:get('start'),end:get('end'),category:get('category'),days};
     if(!entry.title||!days.length||!CATEGORIES_OK(entry.category)||C.timeMin(entry.start)===null||C.timeMin(entry.end)===null||entry.start===entry.end){toast('ตรวจสอบชื่อกิจกรรม เวลา และเลือกอย่างน้อยหนึ่งวัน','error');return;}
     const at=state.routines.findIndex(x=>x.id===entry.id);if(at<0)state.routines.push(entry);else state.routines[at]=entry;
     closeModal();update();toast('บันทึกตารางชีวิตแล้ว');return;
   }
 });
 function CATEGORIES_OK(key){return Object.prototype.hasOwnProperty.call(D.CATEGORIES,key);}
 window.addEventListener('hashchange',()=>{const next=location.hash.slice(1)||'dashboard';for(const group of NAV_GROUPS)if(group.items.includes(next))ui.menuOpen[group.id]=true;route=next;render(false);});
 render(false);
 void sync.init().finally(()=>{cloudBooting=false;lastSyncMode=sync.mode;render(false);});
})();
