/* RHYTHM v1.2.0 — Thai-first, optional Supabase account and cloud sync */
(function(){
 'use strict';
 const C=window.FitCore,D=window.FitData;
 let state=C.load();
 const sync=window.FitSync.create({
   getLocal:()=>C.load(),blank:()=>D.blankState(),validate:C.validateImported,
   onData:data=>{state=data||D.blankState();render(false);},
   onStatus:manager=>{
     if(cloudBooting)return;
     const label=document.getElementById('sync-state-label');
     if(label)label.textContent=manager.describe();
     const current=manager.mode;
     if(current!==lastSyncMode){lastSyncMode=current;render(true);}
   },
   onRecovery:()=>{ui.authMode='new-password';showAuthModal();}
 });
 let lastSyncMode='guest';
 let cloudBooting=!!(window.RHYTHM_SUPABASE_CONFIG?.url && window.RHYTHM_SUPABASE_CONFIG?.publishableKey);
 let route=location.hash.replace('#','')||'dashboard';
 const pages={dashboard:{label:'ภาพรวม',icon:'layout',caption:'มองภาพรวมของการฝึก อาหาร และการพักฟื้น'},workouts:{label:'แผนออกกำลังกาย',icon:'dumbbell',caption:'จัดตาราง Push / Pull / Legs / Run ได้ตามชีวิตจริง'},nutrition:{label:'โภชนาการ',icon:'utensils',caption:'บันทึกอาหารและติดตามพลังงานอย่างยืดหยุ่น'},sleep:{label:'การนอน',icon:'moon',caption:'ติดตามชั่วโมงนอนและระยะการนอนจากข้อมูลที่บันทึก'},routine:{label:'ตารางชีวิต',icon:'clock',caption:'ออกแบบวันของคุณ ตั้งแต่ตื่นจนเข้านอน'},progress:{label:'แนวโน้มและเป้าหมาย',icon:'chart',caption:'เรียนรู้จากแนวโน้ม ไม่ตัดสินด้วยข้อมูลวันเดียว'},profile:{label:'โปรไฟล์และตั้งค่า',icon:'user',caption:'ปรับค่าตั้งต้น เป้าหมาย และการจัดการข้อมูล'}};
 const ui={exerciseFocus:'',authMode:'login',workoutDay:C.weekday(C.today()),workoutDate:C.today(),foodDate:C.today(),sleepDate:C.today(),routineDay:C.weekday(C.today()),weightPeriod:30,search:'',foodCategory:'ทั้งหมด',mobileOpen:false};
 const FONTS={sarabun:'Sarabun · Recommended',bai:'Bai Jamjuree',noto:'Noto Sans Thai',ibm:'IBM Plex Sans Thai',leelawadee:'Leelawadee UI',tahoma:'Tahoma',segoe:'Segoe UI / System',prompt:'Prompt',kanit:'Kanit',mitr:'Mitr',anakotmai:'Anakotmai',athiti:'Athiti',trirong:'Trirong (Serif)',itim:'Itim (Handwriting)',pattaya:'Pattaya (Display)',chonburi:'Chonburi (Display)'};
 const e=C.esc,ic=C.icon,n=C.nfmt,num=C.num,fmt=C.pretty;
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

 function navigate(page){if(!pages[page])page='dashboard';route=page;ui.mobileOpen=false;if(location.hash!==`#${page}`)history.replaceState(null,'',`#${page}`);render(false);}
 function render(preserve=true){
   if(cloudBooting){document.getElementById('app').innerHTML='<div class="boot"><div class="boot-mark">R.</div><p>กำลังตรวจสอบเซสชัน RHYTHM…</p></div>';return;}
   if(!pages[route])route='dashboard'; const y=preserve?window.scrollY:0;
   document.documentElement.dataset.theme=state.settings.theme==='dark'?'dark':'light';
   document.documentElement.dataset.font=FONTS[state.settings.font]?state.settings.font:'ibm';
   const m=C.metrics(state),pg=pages[route];
   document.getElementById('app').innerHTML=`<div class="app-shell">
    <aside class="sidebar ${ui.mobileOpen?'sidebar-open':''}" id="sidebar">
      <div class="brand"><div class="brand-mark">R<span>.</span></div><div class="brand-copy"><strong>RHYTHM</strong><small>Move • Fuel • Recover</small></div><button class="mob-close icon-button" data-action="mobile-close" aria-label="ปิดเมนู">${ic('close')}</button></div>
      <p class="side-label">YOUR SPACE</p>
      <nav class="side-nav" aria-label="เมนูหลัก">${Object.keys(pages).map((key,i)=>`<a href="#${key}" class="nav-item ${route===key?'active':''}" data-route="${key}" ${route===key?'aria-current="page"':''}>${ic(pages[key].icon,19)}<span>${pages[key].label}</span>${i===0?'<span class="nav-dot"></span>':''}</a>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="side-mantra"><span class="mantra-icon">${ic('bolt',19)}</span><strong>Small steps.<br>Real progress.</strong><p>ก้าวเล็ก ๆ ที่ทำได้ทุกวัน มีค่ากว่าความสมบูรณ์แบบ</p></div><div class="side-profile"><div class="avatar">${e((sync.isBlocked?'R':(state.profile.name||'R')).slice(0,1).toUpperCase())}</div><div><strong>${e(sync.isBlocked?'กำลังตรวจสอบบัญชี':(state.profile.name||'ผู้ใช้ RHYTHM'))}</strong><small>${sync.isCloud?'บัญชี Cloud':'ข้อมูลเก็บในเครื่องนี้'}</small></div></div></div>
    </aside><div class="mobile-mask ${ui.mobileOpen?'visible':''}" data-action="mobile-close"></div>
    <div class="workspace"><header class="topbar"><div class="topbar-left"><button class="mob-menu icon-button" data-action="mobile-open" aria-label="เปิดเมนู">${ic('menu')}</button><div><div class="breadcrumb">RHYTHM <span>/</span> ${pg.label}</div><h1>${pg.label}</h1><p>${pg.caption}</p></div></div><div class="topbar-actions"><div class="today-chip">${ic('calendar',16)}<span>${e(fmt(C.today(),true))}</span></div><button class="icon-button theme-toggle" data-action="toggle-theme" aria-label="สลับธีม" title="สลับธีม">${ic(state.settings.theme==='dark'?'sun':'moon')}</button><button class="button button-primary top-quick" data-action="quick-add">${ic('plus',16)} <span>บันทึกน้ำหนัก</span></button></div></header>
     <div class="content">${cloudStrip()}${sync.isBlocked?cloudBlocker():state.demo?`<div class="demo-banner">${ic('info',17)} <div><strong>โหมดทดลอง:</strong> ตัวเลขและบันทึกที่เห็นเป็นข้อมูลสมมติสำหรับทดสอบเว็บ</div><button class="button button-mini" data-action="start-real">เริ่มใช้ข้อมูลของฉัน ${ic('arrow',15)}</button></div>`:''}${renderPage(m)}</div>
     <footer class="footer"><span>RHYTHM <b>v1.2.0</b> · Personal Wellness Workspace</span><span>ประมาณการเพื่อการวางแผน ไม่ใช่คำแนะนำทางการแพทย์</span></footer>
    </div></div>`;
   window.scrollTo(0,y);
 }
 function renderPage(m){return ({dashboard:()=>dashboard(m),workouts, nutrition:()=>nutrition(m), sleep, routine, progress:()=>progress(m),profile:()=>profile(m)})[route]();}
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
 function dashboard(m){
   const today=C.today(),food=C.foodTotals(C.mealsFor(state,today));const target=m.target||0,percent=target?C.clamp(food.kcal/target*100,0,100):0;
   const todayDay=C.planOn(state,today),todayDone=state.sessions.some(s=>s.date===today),sleep=C.recentSleep(state,7).at(-1);
   const week=C.weekDates(today);const calMax=Math.max(2500,target, ...week.map(d=>C.foodTotals(C.mealsFor(state,d)).kcal));
   return `<div class="dashboard-hero"><div class="hero-copy"><div class="hero-date">${ic('sparkles',16)} ${e(new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long'}))}</div><h2>สร้างจังหวะที่ใช่<br><em>ในแบบของคุณ</em></h2><p>จัดสมดุลการฝึก อาหาร และการพักผ่อน ผ่านข้อมูลที่คุณเลือกบันทึกเอง</p><div class="hero-actions"><button class="button button-accent" data-action="hero-workout">${ic('dumbbell',18)} ดูแผนวันนี้</button><button class="button button-hero-light" data-action="hero-food">${ic('utensils',17)} บันทึกอาหาร</button></div></div><div class="hero-visual"><div class="hero-arc hero-arc-a"></div><div class="hero-arc hero-arc-b"></div><div class="hero-visual-inner"><small>YOUR CURRENT FOCUS</small><strong>${e(D.GOALS[state.profile.goal]?.title||'กำหนดเป้าหมาย')}</strong><div class="hero-visual-stat"><span>${m.ready?n(m.weight,1):'—'}<small> kg ปัจจุบัน</small></span><span>${state.profile.targetWeight?n(state.profile.targetWeight,1):'—'}<small> kg เป้าหมาย</small></span></div><span class="hero-visual-caption">ค่อย ๆ ปรับให้เหมาะกับตัวเอง</span></div></div></div>
   ${trendCards(m)}
   <div class="dashboard-duo"><section class="panel calorie-panel">${sectionHead('พลังงานวันนี้', 'บันทึกอาหารเทียบกับเป้าหมายที่คุณกำหนด',`<button class="text-link" data-action="hero-food">ไปหน้าอาหาร ${ic('arrow',15)}</button>`)}<div class="calorie-summary"><div class="energy-ring" style="--progress:${percent}%"><div class="energy-ring-inner"><span>รับประทานแล้ว</span><strong>${n(food.kcal)}</strong><small>kcal</small></div></div><div class="calorie-breakdown"><div class="energy-goal"><span>เป้าหมายพลังงาน</span><strong>${target?n(target):'—'} <small>kcal</small></strong></div>${macroRow('โปรตีน',food.protein,m.protein||0,'protein')}${macroRow('คาร์โบไฮเดรต',food.carbs,m.carbs||0,'carbs')}${macroRow('ไขมัน',food.fat,m.fat||0,'fat')}<p class="small-muted">${m.ready?`เป้าหมาย = TDEE ${m.adjust>=0?'+':''}${m.adjust} kcal`:'กรอกโปรไฟล์ก่อนเพื่อดูเป้าหมาย'}</p></div></div></section>
     <section class="panel today-plan">${sectionHead('แผนของวันนี้','ปรับหรือบันทึกการฝึกได้ทุกวัน',`<button class="text-link" data-route="workouts">จัดตาราง ${ic('arrow',15)}</button>`)}<div class="plan-feature"><div class="plan-feature-icon" style="--type-color:${D.TYPES[todayDay.type].color}">${ic(todayDay.type==='rest'?'moon':'dumbbell',28)}</div><div><span class="section-overline">${D.DAYS_FULL[C.weekday(today)]}</span><h3>${e(todayDay.title)}</h3><p>${e(D.TYPES[todayDay.type].desc)}</p></div></div><div class="plan-divider"></div><div class="today-plan-meta"><span>${ic('dumbbell',16)} ${todayDay.exercises.length} ท่า</span><span>${ic('check',16)} ${todayDone?'บันทึกแล้ว':'ยังไม่บันทึกวันนี้'}</span></div><button class="button ${todayDone?'button-outline':'button-dark'} full" data-action="today-workout">${todayDone?'ดู / แก้ไขบันทึก':'บันทึกการฝึกวันนี้'} ${ic('arrow',16)}</button></section></div>
   <div class="dashboard-duo bottom-duo"><section class="panel">${sectionHead('ภาพรวมอาหาร 7 วัน', 'แสดงเฉพาะวันที่มีการบันทึก ไม่ตีความเป็นวันอดอาหาร')}<div class="bar-chart">${week.map((d)=>{const f=C.foodTotals(C.mealsFor(state,d)),has=C.mealsFor(state,d).length>0;return `<div class="bar-col"><div class="bar-outer"><div class="bar-track"><div class="bar-fill ${has?'':'no-data'}" style="height:${has?Math.max(3,Math.min(100,f.kcal/calMax*100)):0}%" title="${has?`${n(f.kcal)} kcal`:'ไม่มีข้อมูล'}"></div>${target?`<div class="bar-target" style="bottom:${target/calMax*100}%"></div>`:''}</div></div><strong>${d===today?'วันนี้':D.DAYS[C.weekday(d)]}</strong></div>`;}).join('')}</div><div class="chart-key"><span><i class="key-fill"></i> แคลอรี่ที่บันทึก</span>${target?'<span><i class="key-dash"></i> เป้าหมาย</span>':''}</div></section>
     <section class="panel recovery-panel">${sectionHead('ฟื้นตัวให้ทันความตั้งใจ', 'ความต่อเนื่องและเวลาพักสำคัญพอกับการฝึก')}<div class="recovery-row"><div class="recovery-icon">${ic('moon',25)}</div><div><small>คืนล่าสุดที่บันทึก</small><strong>${sleep?formatHour(C.sleepDuration(sleep)):'ยังไม่มีข้อมูล'}</strong><span>${sleep?fmt(sleep.date):'เพิ่มบันทึกการนอนเพื่อเริ่มวิเคราะห์'}</span></div></div><div class="recovery-row"><div class="recovery-icon recovery-green">${ic('target',25)}</div><div><small>การฝึกครบตามแผนใน 7 วัน</small><strong>${C.workoutStats(state).completed} / ${C.workoutStats(state).planned} วัน</strong><span>วันพักไม่ถูกนับเป็นวันที่พลาดการฝึก</span></div></div><button class="button button-outline full" data-route="progress">ดูแนวโน้มทั้งหมด ${ic('arrow',16)}</button></section></div>
   <div class="insight-inline">${ic('info',18)}<p><b>จำไว้ว่า:</b> TDEE และสารอาหารเป็นค่าประมาณ เริ่มจากการบันทึกอย่างต่อเนื่อง แล้วปรับตามแนวโน้มจริงของคุณ</p></div>`;
 }
 function macroRow(title,value,target,cls){return `<div class="macro-row"><div><span>${title}</span><strong>${n(value,1)} <small>/ ${target?n(target):'—'} g</small></strong></div><div class="progress-track"><div class="progress-fill ${cls}" style="width:${target?C.clamp(value/target*100,0,100):0}%"></div></div></div>`;}
 function workouts(){
   const day=ui.workoutDay,dates=C.weekDates(ui.workoutDate),p=C.planOn(state,ui.workoutDate);
   const exists=state.sessions.find(s=>s.date===ui.workoutDate);
   const recent=C.sorted(state.sessions).slice(0,5);
   return `<div class="page-intro"><div><h2>ตารางฝึกประจำสัปดาห์</h2><p>ตารางนี้วนซ้ำทุกสัปดาห์ คุณเปลี่ยนชื่อวัน ประเภทการฝึก ท่า เซต และเวลาพักได้อิสระ</p></div><div class="inline-actions">${ghost('edit-day','แก้เทมเพลต','edit')}${ghost('reschedule','สลับวันฝึก','calendar')}</div></div>
    <div class="week-strip">${D.DAYS.map((d,i)=>{const plan=C.planOn(state,dates[i]);return `<button class="week-day ${i===day?'selected':''}" data-action="select-workday" data-day="${i}"><span>${d} · ${C.shortDate(dates[i])}</span><span class="week-day-indicator" style="--dot:${D.TYPES[plan.type].color}"></span><strong>${e(D.TYPES[plan.type].title)}</strong><small>${plan.exercises.length} ท่า${state.scheduleOverrides?.[dates[i]]?' · ปรับวัน':''}</small></button>`;}).join('')}</div>
    ${state.scheduleOverrides?.[ui.workoutDate]?`<div class="schedule-note">${ic('calendar',17)}<span>${fmt(ui.workoutDate)} · ใช้แผนเฉพาะวัน</span><button class="button button-mini" data-action="clear-override">คืนตารางปกติ</button></div>`:''}<div class="workout-layout"><section class="panel workout-detail">${sectionHead(e(p.title),e(D.TYPES[p.type].desc),`<div class="inline-actions">${ghost('edit-day','แก้เทมเพลต','edit')}${ghost('open-exercise','เพิ่มท่า','plus')}</div>`)}<div class="exercise-head"><span>ท่าออกกำลังกาย</span><span>เซต × ครั้ง</span><span>น้ำหนัก</span><span></span></div><div class="exercise-list">${p.exercises.length?p.exercises.map((ex,i)=>`<div class="exercise-row"><div class="exercise-main"><span class="exercise-no">${String(i+1).padStart(2,'0')}</span><div><strong>${e(ex.name)}</strong><small>พัก ${n(ex.rest||0)} วินาที</small></div></div><span class="exercise-sets">${e(ex.sets)} × ${e(ex.reps)}</span><span class="exercise-load">${n(ex.load||0)} kg</span><div class="row-buttons"><button class="tiny-icon" data-action="edit-exercise" data-id="${e(ex.id)}" title="แก้ไขท่า" aria-label="แก้ไขท่า">${ic('edit',16)}</button><button class="tiny-icon danger" data-action="delete-exercise" data-id="${e(ex.id)}" title="ลบท่า" aria-label="ลบท่า">${ic('trash',16)}</button></div></div>`).join(''):empty('moon','วันนี้สำหรับการพัก','คุณเลือกเพิ่มท่าออกกำลังกายได้หากเปลี่ยนแผน') }</div><div class="workout-foot"><span>${ic('info',16)} ตารางนี้เป็นเทมเพลต บันทึกการฝึกจริงอยู่ด้านขวา</span>${ghost('open-exercise','เพิ่มท่าใหม่')}</div></section>
    <div class="side-stack"><section class="panel session-panel">${sectionHead('บันทึกการฝึกจริง','บันทึกเซตจริงเพื่อดูสถิติความแข็งแรง')}<label class="field"><span>วันที่ฝึก</span><input type="date" id="workout-date" data-picker="workoutDate" max="${C.today()}" value="${e(ui.workoutDate)}" /></label><div class="session-status ${exists?'done':''}"><span>${ic(exists?'check':'clock',19)}</span><div><strong>${exists?'บันทึกแล้ว':'ยังไม่มีบันทึก'}</strong><small>${exists?`${e(exists.title)} • ${n(exists.duration)} นาที`:'บันทึกตามวันที่ ไม่ใช่แค่การกดเช็กชื่อ'}</small></div></div><button class="button button-dark full" data-action="open-session">${ic(exists?'edit':'plus',17)} ${exists?'แก้ไขบันทึกวันนี้':'เพิ่มบันทึกการฝึก'}</button>${exists?`<button class="button button-plain danger full" data-action="delete-session">ลบบันทึกวันนี้</button>`:''}</section>
     <section class="panel recent-sessions">${sectionHead('ประวัติล่าสุด','การฝึกที่บันทึกไว้จริง')} ${recent.length?recent.map(x=>`<div class="history-item"><span class="history-icon">${ic('dumbbell',16)}</span><div><strong>${e(x.title)}</strong><small>${fmt(x.date)} · ${n(x.duration)} นาที</small></div><button class="tiny-icon" data-action="edit-session-date" data-date="${e(x.date)}" title="เปิดบันทึก">${ic('chevron-right',18)}</button></div>`).join(''):empty('dumbbell','ยังไม่มีประวัติ','เริ่มบันทึกการฝึกครั้งแรกของคุณ')}</section></div></div>${intelligencePanel()}
    <div class="insight-inline">${ic('info',18)}<p>น้ำหนักที่ระบุในท่าเป็นเพียงค่าตัวอย่างของเทมเพลต ไม่ได้แนะนำให้เริ่มยกตามค่านั้น เลือกให้เหมาะกับความสามารถและเทคนิคของคุณ</p></div>`;
 }
 function intelligencePanel(){
   const now=C.today();
   const cur=C.trainingStats(state.sessions.filter(x=>x.date>=C.shift(now,-6)&&x.date<=now));
   const prev=C.trainingStats(state.sessions.filter(x=>x.date>=C.shift(now,-13)&&x.date<=C.shift(now,-7)));
   const all=C.trainingStats(state.sessions),items=Object.values(all.byExercise).sort((a,b)=>b.sets-a.sets);
   if(!items.some(x=>x.name.trim().toLocaleLowerCase()===ui.exerciseFocus))ui.exerciseFocus=items[0]?.name.trim().toLocaleLowerCase()||'';
   const ex=all.byExercise[ui.exerciseFocus],history=ex?[...ex.history].sort((a,b)=>a.date.localeCompare(b.date)):[];
   const dates=[...new Set(history.map(x=>x.date))].slice(-12);
   const chart=dates.map(date=>({date,value:history.filter(x=>x.date===date).reduce((sum,x)=>sum+x.volume,0)}));
   const last=history.at(-1),lastSets=last?history.filter(x=>x.date===last.date):[];
   const template=state.plan.flatMap(p=>p.exercises).find(x=>x.name.trim().toLocaleLowerCase()===ui.exerciseFocus);
   const goal=String(template?.reps||'').match(/^(\d+)\s*-\s*(\d+)$/);
   const upper=goal?Number(goal[2]):null;
   const advanced=upper!==null&&lastSets.length>=2&&lastSets.every(x=>x.reps>=upper);
   const advice=!ex?'เริ่มบันทึกจำนวนครั้งและน้ำหนักจริงเป็นรายเซตเพื่อดูแนวโน้ม':advanced?`ในครั้งล่าสุดคุณทำได้อย่างน้อย ${upper} ครั้งทุกเซตที่บันทึก ลองพิจารณาเพิ่มน้ำหนักเล็กน้อยเมื่อเทคนิคและการฟื้นตัวพร้อม`:'เพิ่มจำนวนครั้งหรือน้ำหนักทีละน้อยตามความพร้อม คำนึงถึงเทคนิค RPE และการพักระหว่างวัน';
   return `<section class="panel intelligence-section">${sectionHead('Workout Intelligence','วิเคราะห์เฉพาะเซตจริงที่เริ่มบันทึกใน V1.2.0 · ไม่เดาข้อมูลย้อนหลังจากเทมเพลต')}<div class="intelligence-kpis"><div><span>Training Volume · 7 วัน</span><strong>${n(cur.volume,1)} <small>kg·reps</small></strong><small>${prev.volume?`เทียบสัปดาห์ก่อน ${cur.volume>=prev.volume?'+':''}${n((cur.volume-prev.volume)/prev.volume*100,1)}%`:'ยังไม่มีข้อมูลสัปดาห์ก่อน'}</small></div><div><span>เซตที่บันทึกจริง</span><strong>${n(cur.sets)} <small>เซต</small></strong><small>ไม่รวม Warm-up</small></div><div><span>ท่าที่มีบันทึก</span><strong>${items.length}</strong><small>นับเฉพาะท่าที่มีข้อมูลจริง</small></div></div>${items.length?`<div class="insight-layout"><div><label class="field"><span>เลือกท่าที่ต้องการวิเคราะห์</span><select id="intelligence-exercise">${items.map(x=>option(x.name.trim().toLocaleLowerCase(),x.name,ui.exerciseFocus)).join('')}</select></label><div class="insight-chart">${C.lineChart(chart,{label:'Volume แต่ละครั้ง'})}</div></div><div class="pr-summary"><h3>Personal Records · ${e(ex.name)}</h3><div class="estimate-list"><div><span>น้ำหนักสูงสุด</span><strong>${n(ex.maxLoad,1)} <small>kg</small></strong></div><div><span>1RM โดยประมาณ</span><strong>${ex.maxEst1RM?n(ex.maxEst1RM,1):'—'} <small>kg</small></strong></div><div><span>Volume สะสม</span><strong>${n(ex.volume,1)} <small>kg·reps</small></strong></div><div><span>เซตสะสม</span><strong>${n(ex.sets)}</strong></div></div><p class="source-hint">1RM ใช้สูตร Epley เฉพาะเซต 1–10 ครั้ง ไม่ใช่ผลทดสอบจริง Volume จากน้ำหนัก × ครั้ง (ไม่นับน้ำหนักตัว)</p></div></div>`:empty('dumbbell','ยังไม่มีเซตที่บันทึกจริง','เปิดบันทึกการฝึกแล้วเพิ่มเซต ใส่จำนวนครั้งและน้ำหนักที่ทำจริง')}<div class="insight-inline intelligence-tip">${ic('sparkles',18)}<p><b>แนวทางต่อไป:</b> ${e(advice)} · ไม่มีการเพิ่มน้ำหนักอัตโนมัติ</p></div></section>`;
 }
 function nutrition(m){
   const day=ui.foodDate,entries=C.mealsFor(state,day),food=C.foodTotals(entries),target=m.target||0,remain=target?target-food.kcal:null;
   const allFoods=[...D.FOOD_LIBRARY,...state.customFoods];
   const query=ui.search.trim().toLocaleLowerCase();
   const filtered=allFoods.filter(x=>(ui.foodCategory==='ทั้งหมด'||x.group===ui.foodCategory)&&(`${x.name} ${x.unit}`.toLocaleLowerCase().includes(query)));
   const groups=['ทั้งหมด',...new Set(allFoods.map(x=>x.group))];
   return `<div class="page-intro"><div><h2>Food Journal</h2><p>เลือกจากคลังอาหารหรือเพิ่มเมนูของตัวเอง คำนวณตามจำนวนเสิร์ฟที่รับประทานจริง</p></div>${ghost('open-meal','เพิ่มอาหารเอง')}</div>
    <div class="nutrition-overview"><div class="panel food-total"><div class="food-total-top"><span>พลังงานที่บันทึก</span><label class="date-compact">${ic('calendar',16)} <input type="date" value="${e(day)}" data-picker="foodDate" max="${C.today()}" aria-label="วันที่อาหาร" /></label></div><strong>${n(food.kcal)}<small> / ${target?n(target):'—'} kcal</small></strong><div class="progress-track large"><div class="progress-fill" style="width:${target?C.clamp(food.kcal/target*100,0,100):0}%"></div></div><p>${remain===null?'กรอกโปรไฟล์เพื่อดูเป้าหมายพลังงาน':remain>=0?`ยังห่างจากเป้าหมายประมาณ ${n(remain)} kcal`:`มากกว่าเป้าหมายประมาณ ${n(-remain)} kcal`}</p></div><div class="panel food-macro-total">${macroRow('โปรตีน',food.protein,m.protein||0,'protein')}${macroRow('คาร์บ',food.carbs,m.carbs||0,'carbs')}${macroRow('ไขมัน',food.fat,m.fat||0,'fat')}</div></div>
    <div class="nutrition-layout"><section class="panel">${sectionHead('คลังอาหาร','คุณสามารถปรับค่าทางโภชนาการก่อนบันทึกได้')}<div class="food-filter"><label class="search-field">${ic('search',18)}<input id="food-search" type="search" placeholder="ค้นหาเมนู / วัตถุดิบ..." value="${e(ui.search)}" autocomplete="off" /></label><select id="food-group" aria-label="หมวดอาหาร">${groups.map(g=>option(g,g,ui.foodCategory)).join('')}</select></div><div class="food-library-list" id="food-library-list">${renderFoodList(filtered)}</div><p class="source-hint">* ค่าพลังงานและสารอาหารในคลังเป็นตัวอย่างประมาณการต่อเสิร์ฟ อาจแตกต่างตามสูตร ปริมาณ และยี่ห้อ</p></section>
     <section class="panel food-diary">${sectionHead('บันทึกประจำวัน',`${entries.length} รายการ · ${fmt(day)}`,`<button class="tiny-square" data-action="open-meal" title="เพิ่มอาหาร">${ic('plus',19)}</button>`)}${entries.length?Object.keys(D.MEALTYPES).map(meal=>{const rows=entries.filter(x=>x.meal===meal);return rows.length?`<div class="meal-group"><h3>${D.MEALTYPES[meal]} <span>${n(C.foodTotals(rows).kcal)} kcal</span></h3>${rows.map(x=>`<div class="meal-item"><div><strong>${e(x.name)}</strong><small>${n(x.servings,2)} × ${e(x.unit||'เสิร์ฟ')}</small></div><div class="meal-right"><strong>${n(num(x.kcal)*num(x.servings))}</strong><button class="tiny-icon" data-action="edit-meal" data-id="${e(x.id)}" aria-label="แก้ไขอาหาร">${ic('edit',15)}</button><button class="tiny-icon danger" data-action="delete-meal" data-id="${e(x.id)}" aria-label="ลบอาหาร">${ic('trash',15)}</button></div></div>`).join('')}</div>`:'';}).join(''):empty('utensils','ยังไม่มีมื้ออาหาร','เลือกอาหารจากคลังด้านซ้ายเพื่อเริ่มบันทึก')}</section></div>`;
 }
 function renderFoodList(foods){return foods.length?foods.slice(0,60).map(f=>`<div class="food-list-item"><div class="food-square">${ic('utensils',19)}</div><div class="food-title"><strong>${e(f.name)}</strong><small>${e(f.unit)} · ${e(f.group)}</small></div><div class="food-number"><strong>${n(f.kcal)}</strong><span>kcal</span></div><button class="add-circle" data-action="food-add" data-id="${e(f.id)}" aria-label="เพิ่ม ${e(f.name)}">${ic('plus',17)}</button></div>`).join(''):empty('search','ไม่พบเมนู','ลองเปลี่ยนคำค้นหาหรือเพิ่มเมนูของตัวเอง');}
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
   let insights=[];
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
 function profile(m){
   const p=state.profile;
   return `<div class="page-intro"><div><h2>Make it yours.</h2><p>ข้อมูลในฟอร์มนี้ใช้คำนวณเท่านั้น ${sync.isCloud?'บัญชี Cloud จะซิงค์กับ Supabase':'โหมดในเครื่องจะยังไม่ซิงค์กับอุปกรณ์อื่น'}</p></div></div>
    <div class="profile-layout"><section class="panel profile-form-panel">${sectionHead('โปรไฟล์และเป้าหมาย','คำนวณสำหรับผู้ใหญ่ อายุ 18 ปีขึ้นไป')}<form id="profile-form"><div class="form-grid two"><label class="field"><span>ชื่อเล่น</span><input type="text" name="name" maxlength="60" value="${e(p.name)}" placeholder="เช่น ชื่อของคุณ" /></label><label class="field"><span>อายุ (ปี) <b>*</b></span><input type="number" required min="18" max="100" name="age" value="${e(p.age)}" placeholder="18–100" /></label><label class="field"><span>น้ำหนักตั้งต้น (kg) <b>*</b></span><input type="number" required min="25" max="400" step="0.1" name="weight" value="${e(p.weight)}" /></label><label class="field"><span>ส่วนสูง (cm) <b>*</b></span><input type="number" required min="100" max="250" step="0.1" name="height" value="${e(p.height)}" /></label><label class="field"><span>สูตรสมการพลังงานพื้นฐาน <b>*</b></span><select name="sex">${option('male','ค่าคงที่สูตรสำหรับผู้ชาย',p.sex)}${option('female','ค่าคงที่สูตรสำหรับผู้หญิง',p.sex)}</select><small>ใช้เลือกค่าคงที่ของสูตร ไม่ได้ระบุอัตลักษณ์ทางเพศ</small></label><label class="field"><span>ระดับกิจกรรม <b>*</b></span><select name="activity">${Object.entries(D.ACTIVITY).map(([key,v])=>option(key,`${v.label} (×${v.factor})`,p.activity)).join('')}</select></label><label class="field"><span>เป้าหมายหลัก</span><select name="goal" id="goal-select">${Object.entries(D.GOALS).map(([k,v])=>option(k,v.title,p.goal)).join('')}</select></label><label class="field"><span>น้ำหนักเป้าหมาย (kg) · ไม่บังคับ</span><input type="number" name="targetWeight" min="25" max="400" step="0.1" value="${e(p.targetWeight)}" placeholder="เช่น 72" /></label><label class="field"><span>ปรับ kcal จาก TDEE</span><input type="number" name="calorieAdjust" id="calorie-adjust" min="-750" max="750" step="25" value="${e(p.calorieAdjust)}" /><small>ค่าบวก = มากกว่าค่า TDEE / ค่าลบ = น้อยกว่า</small></label><label class="field"><span>โปรตีนที่ต้องการ (g/kg)</span><input type="number" name="proteinPerKg" min="0.8" max="2.5" step="0.1" value="${e(p.proteinPerKg)}" /></label><label class="field"><span>สัดส่วนพลังงานจากไขมัน (%)</span><input type="number" name="fatPercent" min="15" max="40" step="1" value="${e(p.fatPercent)}" /></label><label class="field"><span>เป้าหมายการนอน (ชั่วโมง)</span><input type="number" name="sleepGoal" min="6" max="12" step="0.5" value="${e(p.sleepGoal)}" /></label></div><p class="form-help">น้ำหนักในบันทึกล่าสุด (หากมี) จะใช้เป็นน้ำหนักปัจจุบันในการคำนวณ โดยค่าน้ำหนักตั้งต้นจะไม่เปลี่ยนย้อนหลัง</p><button class="button button-dark save-profile" type="submit">${ic('check',18)} บันทึกโปรไฟล์</button></form><form id="font-form"><section class="font-panel"><h3>ตั้งค่าแบบอักษร</h3><p class="form-help">รายชื่อเดียวกับ Workday Journey · บันทึกพร้อมโปรไฟล์และซิงค์บน Cloud</p><label class="field"><span>ฟอนต์ทั้งเว็บ</span><select name="font" id="font-select"><optgroup label="แนะนำสำหรับระบบงาน">${['sarabun','bai','noto','ibm'].map(k=>option(k,FONTS[k],state.settings.font||'ibm')).join('')}</optgroup><optgroup label="อ่านง่าย / ใช้งานทั่วไป">${['leelawadee','tahoma','segoe','prompt','kanit','mitr','anakotmai','athiti'].map(k=>option(k,FONTS[k],state.settings.font||'ibm')).join('')}</optgroup><optgroup label="ฟอนต์สไตล์ / เน้นเอกลักษณ์">${['trirong','itim','pattaya','chonburi'].map(k=>option(k,FONTS[k],state.settings.font||'ibm')).join('')}</optgroup></select></label><p id="font-preview" class="font-preview">RHYTHM · สุขภาพดีทุกวัน 1234567890</p><p class="source-hint">Leelawadee UI และ Anakotmai ใช้ฟอนต์ที่มีในอุปกรณ์เท่านั้น หากไม่มีจะใช้ฟอนต์สำรอง ส่วน Google Fonts ต้องเชื่อมอินเทอร์เน็ต</p></section><button class="button button-outline" type="submit">${ic('check',18)} บันทึกฟอนต์</button></form></section>
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
 function openDay(){const p=state.plan[ui.workoutDay];showModal('ปรับแผนประจำวัน',`<form id="day-form"><div class="form-grid"><label class="field"><span>วันในสัปดาห์</span><input value="${e(D.DAYS_FULL[ui.workoutDay])}" disabled /></label><label class="field"><span>ประเภทของการฝึก</span><select name="type">${Object.entries(D.TYPES).map(([k,v])=>option(k,v.title,p.type)).join('')}</select></label><label class="field"><span>ชื่อโปรแกรม</span><input name="title" required maxlength="90" value="${e(p.title)}" /></label></div><p class="form-help">แก้ไขประเภทและชื่อได้โดยไม่ลบท่าที่มีอยู่ หากต้องการเปลี่ยนท่า ให้แก้จากรายการหลังบันทึก</p>${modalButtons('อัปเดตแผน')}</form>`,D.DAYS_FULL[ui.workoutDay]);}
 function openExercise(id){
   const plan=state.plan[ui.workoutDay],existing=id?plan.exercises.find(x=>x.id===id):null;
   const defaults=D.EXERCISES.find(x=>x.group===plan.type)||D.EXERCISES[0],ex=existing||{...defaults,name:'',sets:3,reps:'8-12',load:0,rest:90};
   const list=[...D.EXERCISES].sort((a,b)=>a.group===plan.type?-1:b.group===plan.type?1:0);
   showModal(existing?'แก้ไขท่าออกกำลังกาย':'เพิ่มท่าออกกำลังกาย',`<form id="exercise-form" data-id="${e(existing?.id||'')}"><div class="form-grid"><label class="field"><span>เลือกท่าตัวอย่าง (ไม่บังคับ)</span><select id="exercise-template"><option value="">— พิมพ์ท่าของตัวเอง —</option>${list.map(x=>option(x.id,`${x.name} · ${D.TYPES[x.group]?.title||'Other'}`,'' )).join('')}</select></label><label class="field"><span>ชื่อท่า *</span><input name="name" required maxlength="90" value="${e(ex.name)}" placeholder="เช่น Incline Bench Press" /></label><div class="form-grid two"><label class="field"><span>จำนวนเซต</span><input type="number" name="sets" required min="1" max="30" value="${e(ex.sets)}" /></label><label class="field"><span>ครั้งต่อเซต / เวลา</span><input name="reps" maxlength="30" required value="${e(ex.reps)}" placeholder="เช่น 8-12 หรือ 30 นาที" /></label><label class="field"><span>น้ำหนัก (kg)</span><input type="number" name="load" min="0" max="1000" step="0.5" value="${e(ex.load)}" /></label><label class="field"><span>พักระหว่างเซต (วินาที)</span><input type="number" name="rest" min="0" max="1800" step="5" value="${e(ex.rest)}" /></label></div></div>${modalButtons(existing?'บันทึกการแก้ไข':'เพิ่มท่า')}</form>`,D.DAYS_FULL[ui.workoutDay]);
 }
 function openReschedule(){
   const date=ui.workoutDate>=C.today()?ui.workoutDate:C.today();
   showModal('Adaptive Planner · สลับวันฝึก',`<form id="reschedule-form"><div class="form-grid two"><label class="field"><span>วันต้นทาง</span><input name="source" type="date" min="${C.today()}" value="${e(date)}" required /></label><label class="field"><span>วันปลายทาง</span><input name="target" type="date" min="${C.today()}" value="${e(C.shift(date,1))}" required /></label></div><div class="info-small">ระบบจะสลับโปรแกรมของสองวันนี้ เช่น Legs กับ Rest โดยไม่เปลี่ยนเทมเพลตสัปดาห์หรือประวัติการฝึก และไม่อนุญาตหากวันใดมีบันทึกการฝึกแล้ว</div>${modalButtons('สลับโปรแกรม')}</form>`);
 }
 function sessionSetItem(row){return `<div class="set-entry"><label><span>จำนวนครั้งจริง</span><input data-set="reps" type="number" min="1" max="100" step="1" placeholder="เช่น 10" value="${row?e(row.reps):''}" /></label><label><span>น้ำหนักจริง (kg)</span><input data-set="load" type="number" min="0" max="1000" step="0.5" placeholder="เช่น 20" value="${row?e(row.load):''}" /></label><label class="set-warmup"><input data-set="warmup" type="checkbox" ${row?.warmup?'checked':''}/><span>Warm-up</span></label><button type="button" class="tiny-icon danger remove-set" data-action="session-remove-set" aria-label="ลบเซต">${ic('trash',15)}</button></div>`;}
 function openSession(){
   const date=ui.workoutDate,plan=C.planOn(state,date),existing=state.sessions.find(s=>s.date===date),exercises=existing?.exercises||plan.exercises;
   showModal(existing?'แก้ไขบันทึกการฝึก':'บันทึกการฝึกจริง',`<form id="session-form"><div class="form-grid two"><label class="field"><span>วันที่ฝึก</span><input name="date" type="date" max="${C.today()}" required value="${e(date)}" /></label><label class="field"><span>เวลา (นาที)</span><input name="duration" type="number" min="0" max="600" required value="${e(existing?.duration??(plan.type==='rest'?0:60))}" /></label><label class="field"><span>RPE (1–10)</span><input name="rpe" type="number" min="1" max="10" value="${e(existing?.rpe??7)}" /></label><label class="field"><span>โปรแกรม</span><input value="${e(existing?.title||plan.title)}" disabled /></label></div><h3 class="modal-subheading">เซตที่ทำจริง</h3><p class="form-help">กรอกเฉพาะเซตที่ทำจริง ข้อมูลเก่าที่เป็น 3 × 8–12 เป็นแค่แผน ไม่ถูกนำมานับเป็นเซตจริง คุณสามารถบันทึกน้ำหนัก 0 kg สำหรับท่าน้ำหนักตัวได้</p><div class="session-exercises">${exercises.length?exercises.map((ex,i)=>`<div class="session-ex" data-exindex="${i}"><div class="session-ex-title"><strong>${e(ex.name)}</strong><small>เป้าหมาย ${e(ex.sets)} × ${e(ex.reps)} · ${n(ex.load||0)} kg</small></div><div class="set-list">${(ex.setLog||[]).map(row=>sessionSetItem(row)).join('')}</div><button type="button" class="button button-outline set-add" data-action="session-add-set">${ic('plus',14)} เพิ่มเซตจริง</button></div>`).join(''):'<p class="form-help">ไม่มีท่าในแผน บันทึกเวลาพักหรือกิจกรรมได้ตามปกติ</p>'}</div><label class="field"><span>บันทึกเพิ่มเติม</span><textarea name="notes" maxlength="600" rows="3">${e(existing?.notes||'')}</textarea></label>${modalButtons(existing?'อัปเดต':'บันทึกการฝึก')}</form>`,`${fmt(date)} · ${existing?.title||plan.title}`);
 }
 function openMeal(foodId=null,mealId=null){
   const existing=mealId?state.meals.find(x=>x.id===mealId):null;
   const base=foodId?[...D.FOOD_LIBRARY,...state.customFoods].find(x=>x.id===foodId):null;
   const f=existing||base||{name:'',unit:'1 เสิร์ฟ',kcal:0,protein:0,carbs:0,fat:0,servings:1,meal:'lunch',date:ui.foodDate};
   showModal(existing?'แก้ไขอาหารที่บันทึก':'เพิ่มรายการอาหาร',`<form id="meal-form" data-id="${e(existing?.id||'')}" data-foodid="${e(foodId||'')}"><div class="form-grid"><div class="form-grid two"><label class="field"><span>วันที่ *</span><input name="date" type="date" value="${e(existing?.date||ui.foodDate)}" max="${C.today()}" required /></label><label class="field"><span>มื้ออาหาร *</span><select name="meal">${Object.entries(D.MEALTYPES).map(([k,v])=>option(k,v,f.meal||'lunch')).join('')}</select></label></div><label class="field"><span>ชื่ออาหาร *</span><input name="name" required maxlength="100" value="${e(f.name)}" placeholder="เช่น ข้าวสวย / ไข่ต้ม" /></label><div class="form-grid two"><label class="field"><span>หน่วยต่อเสิร์ฟ</span><input name="unit" maxlength="70" value="${e(f.unit||'1 เสิร์ฟ')}" required /></label><label class="field"><span>จำนวนเสิร์ฟ *</span><input name="servings" type="number" min="0.1" max="30" step="0.1" value="${e(f.servings||1)}" required /></label></div><p class="form-help bold-help">ข้อมูลโภชนาการต่อ 1 เสิร์ฟ (ปรับแก้จากฉลากอาหารได้)</p><div class="form-grid two"><label class="field"><span>พลังงาน (kcal)</span><input name="kcal" type="number" required min="0" max="10000" step="0.1" value="${e(f.kcal)}" /></label><label class="field"><span>โปรตีน (g)</span><input name="protein" type="number" min="0" max="1000" step="0.1" value="${e(f.protein)}" required /></label><label class="field"><span>คาร์โบไฮเดรต (g)</span><input name="carbs" type="number" min="0" max="1000" step="0.1" value="${e(f.carbs)}" required /></label><label class="field"><span>ไขมัน (g)</span><input name="fat" type="number" min="0" max="1000" step="0.1" value="${e(f.fat)}" required /></label></div>${!existing&&!foodId?'<label class="check-field"><input type="checkbox" name="remember" checked /><span>บันทึกเมนูนี้ไว้ในคลังส่วนตัว</span></label>':''}</div>${modalButtons(existing?'อัปเดตรายการ':'เพิ่มลงในบันทึก')}</form>`,'ตัวเลขต่อหนึ่งเสิร์ฟจะคูณกับจำนวนที่รับประทาน');
 }
 function openSleep(){
   const x=state.sleeps.find(s=>s.date===ui.sleepDate)||{date:ui.sleepDate,bed:'23:00',wake:'07:00',awake:0,deep:null,light:null,rem:null,note:'',stageUnit:'percent'};
   const unit=x.stageUnit==='percent'?'percent':'minutes',percent=unit==='percent';
   showModal('บันทึกการนอน',`<form id="sleep-form"><div class="form-grid two"><label class="field"><span>วันที่ตื่นนอน *</span><input type="date" name="date" max="${C.today()}" required value="${e(x.date)}" /></label><label class="field"><span>ตื่นระหว่างคืน (นาที)</span><input type="number" name="awake" min="0" max="1200" required value="${e(x.awake)}" /></label><label class="field"><span>เวลาเข้านอน *</span><input type="time" name="bed" required value="${e(x.bed)}" /></label><label class="field"><span>เวลาตื่น *</span><input type="time" name="wake" required value="${e(x.wake)}" /></label></div><h3 class="modal-subheading">ระยะการนอน (ไม่บังคับ)</h3><label class="field"><span>หน่วยจากสมาร์ตวอทช์</span><select id="sleep-stage-unit" name="stageUnit">${option('percent','เปอร์เซ็นต์ (%)',unit)}${option('minutes','นาที',unit)}</select></label><p id="sleep-stage-help" class="form-help">${percent?'กรอกเปอร์เซ็นต์ตามนาฬิกา รวมกันไม่เกิน 100%':'กรอกจำนวนนาทีตามอุปกรณ์ รวมกันไม่เกินเวลานอนจริง'} · ค่าไม่ครบสามารถเว้นว่าง ไม่ควรคาดเดา</p><div class="form-grid three">${['deep','light','rem'].map(k=>`<label class="field"><span>${k==='deep'?'Deep':k==='light'?'Light':'REM'} (<span data-unit-label>${percent?'%':'นาที'}</span>)</span><input name="${k}" type="number" min="0" max="${percent?'100':'1200'}" step="${percent?'0.1':'1'}" placeholder="ไม่ระบุ" value="${e(val(x,k))}" /></label>`).join('')}</div><label class="field"><span>โน้ตการนอน</span><textarea name="note" maxlength="500" rows="2">${e(x.note||'')}</textarea></label><div class="info-small">ระบบใช้เวลาบนเตียง − นาทีตื่น คำนวณเวลานอนจริง จากนั้นจึงแปลงเปอร์เซ็นต์เป็นนาทีโดยประมาณเพื่อแสดงผลเท่านั้น</div>${modalButtons('บันทึกการนอน')}</form>`,'เลือกวันตามวันที่ตื่นนอน (รองรับเข้านอนข้ามเที่ยงคืน)');
 }
 function openWeight(id){
   const x=id?state.weights.find(x=>x.id===id):null;
   showModal(x?'แก้ไขบันทึกน้ำหนัก':'บันทึกน้ำหนัก',`<form id="weight-form" data-id="${e(x?.id||'')}"><div class="form-grid two"><label class="field"><span>วันที่ชั่ง *</span><input type="date" name="date" max="${C.today()}" required value="${e(x?.date||C.today())}" /></label><label class="field"><span>น้ำหนัก (kg) *</span><input type="number" name="weight" step="0.1" min="25" max="400" required value="${e(x?.weight||state.profile.weight||'')}" placeholder="เช่น 68.4" /></label><label class="field"><span>ไขมันในร่างกาย (%) · ไม่บังคับ</span><input type="number" name="bodyFat" min="1" max="70" step="0.1" placeholder="จากอุปกรณ์วัด" value="${e(val(x,'bodyFat'))}" /></label></div><p class="form-help">การบันทึกในวันเดียวกันจะอัปเดตค่าเดิม ไม่มีการสร้างหลายรายการในวันเดียว</p>${modalButtons('บันทึกน้ำหนัก')}</form>`);
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
 function removeItem(collection,pred,message){if(!confirmed(message))return;state[collection]=state[collection].filter(x=>!pred(x));update();toast('ลบรายการแล้ว');}
 document.addEventListener('click',event=>{
   if(event.target.id==='modal-backdrop'){closeModal();return;}
   const nav=event.target.closest('[data-route]');if(nav){event.preventDefault();navigate(nav.dataset.route);return;}
   const el=event.target.closest('[data-action]');if(!el)return;
   const a=el.dataset.action,id=el.dataset.id,date=el.dataset.date;
   if(a==='close-modal'){closeModal();return;}
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
   if(a==='start-real'){if(confirmed('เริ่มใช้งานจริง? ข้อมูลตัวอย่างทั้งหมดจะถูกล้าง แล้วเปิดโปรไฟล์ให้กรอกข้อมูลของคุณ (สามารถสำรองข้อมูลตัวอย่างก่อน)')){state=D.blankState();ui.search='';update();navigate('profile');toast('เริ่มต้นด้วยข้อมูลของคุณได้เลย');}return;}
   if(a==='hero-workout'){navigate('workouts');return;}
   if(a==='hero-food'){navigate('nutrition');return;}
   if(a==='quick-add'){openWeight();return;}
   if(a==='select-workday'){ui.workoutDay=Number(el.dataset.day);ui.workoutDate=C.weekDates(ui.workoutDate)[ui.workoutDay];render(true);return;}
   if(a==='reschedule'){openReschedule();return;}
   if(a==='clear-override'){if(!confirmed('คืนตารางวันที่เลือกตามเทมเพลตปกติ? (ไม่ลบประวัติการฝึก)'))return;if(state.scheduleOverrides)delete state.scheduleOverrides[ui.workoutDate];update();toast('คืนตารางปกติแล้ว');return;}
   if(a==='session-add-set'){const list=el.closest('.session-ex')?.querySelector('.set-list');if(!list)return;if(list.children.length>=30){toast('ไม่เกิน 30 เซตต่อท่า','error');return;}list.insertAdjacentHTML('beforeend',sessionSetItem(null));return;}
   if(a==='session-remove-set'){el.closest('.set-entry')?.remove();return;}
   if(a==='edit-day'){openDay();return;}
   if(a==='open-exercise'){openExercise();return;}
   if(a==='edit-exercise'){openExercise(id);return;}
   if(a==='delete-exercise'){const p=state.plan[ui.workoutDay];if(confirmed('ลบท่านี้ออกจากเทมเพลตวันฝึก? (ไม่ลบประวัติการฝึกเดิม)')){p.exercises=p.exercises.filter(x=>x.id!==id);update();toast('ลบท่าเรียบร้อย');}return;}
   if(a==='open-session'){openSession();return;}
   if(a==='today-workout'){ui.workoutDate=C.today();ui.workoutDay=C.weekday(C.today());openSession();return;}
   if(a==='edit-session-date'){ui.workoutDate=date;ui.workoutDay=C.weekday(date);openSession();return;}
   if(a==='delete-session'){removeItem('sessions',x=>x.date===ui.workoutDate,'ลบบันทึกการฝึกของวันที่เลือก?');return;}
   if(a==='open-meal'){openMeal();return;}
   if(a==='food-add'){openMeal(id);return;}
   if(a==='edit-meal'){openMeal(null,id);return;}
   if(a==='delete-meal'){removeItem('meals',x=>x.id===id,'ลบรายการอาหารนี้?');return;}
   if(a==='open-sleep'){openSleep();return;}
   if(a==='edit-sleep'){ui.sleepDate=date;openSleep();return;}
   if(a==='delete-sleep'){removeItem('sleeps',x=>x.date===date,'ลบบันทึกการนอนคืนนี้?');return;}
   if(a==='routine-day'){ui.routineDay=Number(el.dataset.day);render(true);return;}
   if(a==='open-routine'){openRoutine();return;}
   if(a==='edit-routine'){openRoutine(id);return;}
   if(a==='delete-routine'){removeItem('routines',x=>x.id===id,'ลบกิจกรรมนี้จากทุกวันที่เลือกไว้?');return;}
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
   if(event.target.id==='food-search'){
     ui.search=event.target.value;
     const all=[...D.FOOD_LIBRARY,...state.customFoods];
     const q=ui.search.toLocaleLowerCase().trim();
     const arr=all.filter(x=>(ui.foodCategory==='ทั้งหมด'||x.group===ui.foodCategory)&&(`${x.name} ${x.unit}`.toLocaleLowerCase().includes(q)));
     const list=document.getElementById('food-library-list');if(list)list.innerHTML=renderFoodList(arr);
   }
 });
 document.addEventListener('change',async event=>{
   const el=event.target;
   if(el.dataset.picker&&C.isDate(el.value)){ui[el.dataset.picker]=el.value;if(el.dataset.picker==='workoutDate')ui.workoutDay=C.weekday(el.value);render(true);return;}
   if(el.id==='sleep-stage-unit'){
     const form=el.closest('form');if(!form)return;
     for(const key of ['deep','light','rem']){const inp=form.elements[key];if(inp){inp.value='';inp.max=el.value==='percent'?'100':'1200';inp.step=el.value==='percent'?'0.1':'1';}}
     form.querySelectorAll('[data-unit-label]').forEach(node=>node.textContent=el.value==='percent'?'%':'นาที');
     const help=form.querySelector('#sleep-stage-help');if(help)help.textContent='เปลี่ยนหน่วยแล้วระบบล้างตัวเลขเดิมในฟอร์มเพื่อป้องกันการตีความผิด กรุณากรอกข้อมูลจากอุปกรณ์ใหม่ (Deep + Light + REM รวมได้ไม่เกิน '+(el.value==='percent'?'100%':'เวลานอนจริง')+')';return;
   }
   if(el.id==='food-group'){ui.foodCategory=el.value;render(true);return;}
   if(el.id==='font-select'){const preview=document.getElementById('font-preview');if(preview)preview.style.fontFamily=({sarabun:'Sarabun',bai:'Bai Jamjuree',noto:'Noto Sans Thai',ibm:'IBM Plex Sans Thai',leelawadee:'Leelawadee UI',tahoma:'Tahoma',segoe:'Segoe UI',prompt:'Prompt',kanit:'Kanit',mitr:'Mitr',anakotmai:'Anakotmai',athiti:'Athiti',trirong:'Trirong',itim:'Itim',pattaya:'Pattaya',chonburi:'Chonburi'})[el.value]||'inherit';return;}
   if(el.id==='intelligence-exercise'){ui.exerciseFocus=el.value;render(true);return;}
   if(el.id==='goal-select'){const adj=document.getElementById('calorie-adjust');if(adj)adj.value=D.GOALS[el.value]?.adjust??0;return;}
   if(el.id==='exercise-template'){const ex=D.EXERCISES.find(x=>x.id===el.value);const form=el.closest('form');if(!ex||!form)return;for(const k of ['name','sets','reps','load','rest'])form.elements[k].value=ex[k];return;}
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
     const ex={id:form.dataset.id||C.uid(),name:get('name'),sets:metric('sets'),reps:get('reps'),load:metric('load'),rest:metric('rest')};
     if(!ex.name||!ex.reps||ex.sets<1||ex.sets>30||ex.load<0||ex.rest<0){toast('กรุณาตรวจสอบรายละเอียดท่า','error');return;}
     const plan=state.plan[ui.workoutDay];const at=plan.exercises.findIndex(x=>x.id===ex.id);
     if(at===-1)plan.exercises.push(ex);else plan.exercises[at]=ex;
     closeModal();update();toast('บันทึกท่าออกกำลังกายแล้ว');return;
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
         if(block)for(const line of block.querySelectorAll('.set-entry')){
           const repsText=line.querySelector('[data-set="reps"]').value.trim(),loadText=line.querySelector('[data-set="load"]').value.trim();
           if(repsText===''&&loadText==='')continue;
           const reps=Number(repsText),load=Number(loadText);
           if(!repsText||!loadText||!Number.isInteger(reps)||reps<1||reps>100||!Number.isFinite(load)||load<0||load>1000){invalid=true;continue;}
           rows.push({reps,load,warmup:!!line.querySelector('[data-set="warmup"]').checked});
         }
         if(rows.length>30)invalid=true;
         return {...ex,setLog:rows};
       });
     }else{
       // Only used by DOM-less regression tests. Real browsers always use per-set rows.
       exercises=previous.map((ex,i)=>({...ex,sets:Number(get(`sets-${i}`))||ex.sets,reps:get(`reps-${i}`)||ex.reps,load:Number(get(`load-${i}`))||ex.load}));
     }
     const duration=metric('duration'),rpe=get('rpe')?metric('rpe'):null;
     if(invalid||!Number.isFinite(duration)||duration<0||duration>600||(rpe!==null&&(rpe<1||rpe>10))){toast('ตรวจสอบจำนวนครั้ง น้ำหนักจริง ระยะเวลาหรือ RPE','error');return;}
     const session={id:old?.id||C.uid(),date,day,type:old?.type||plan.type,title:old?.title||plan.title,duration,rpe,notes:get('notes'),exercises};
     if(old)state.sessions=state.sessions.filter(x=>x.id!==old.id);state.sessions.push(session);
     ui.workoutDate=date;ui.workoutDay=day;closeModal();update();toast('บันทึกการฝึกแล้ว');return;
   }
   if(form.id==='meal-form'){
     const food={name:get('name'),unit:get('unit'),servings:metric('servings'),kcal:metric('kcal'),protein:metric('protein'),carbs:metric('carbs'),fat:metric('fat'),date:get('date'),meal:get('meal')};
     if(!food.name||!food.unit||!C.isDate(food.date)||food.date>C.today()||food.servings<=0||food.servings>30||!D.MEALTYPES[food.meal]||['kcal','protein','carbs','fat'].some(k=>food[k]<0||!Number.isFinite(food[k]))){toast('กรุณาตรวจสอบรายการอาหาร','error');return;}
     const prev=state.meals.find(x=>x.id===form.dataset.id);
     state.meals=state.meals.filter(x=>x.id!==form.dataset.id);
     state.meals.push({id:prev?.id||C.uid(),foodId:prev?.foodId||form.dataset.foodid||null,...food});
     if(!prev&&!form.dataset.foodid&&fd.has('remember'))state.customFoods.push({id:C.uid(),name:food.name,unit:food.unit,kcal:food.kcal,protein:food.protein,carbs:food.carbs,fat:food.fat,group:'เมนูของฉัน'});
     ui.foodDate=food.date;closeModal();update();toast('บันทึกอาหารเรียบร้อย');return;
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
 window.addEventListener('hashchange',()=>{route=location.hash.slice(1)||'dashboard';render(false);});
 render(false);
 void sync.init().finally(()=>{cloudBooting=false;lastSyncMode=sync.mode;render(false);});
})();
