/* RHYTHM v1.0.0 — Seed data and editable local food / exercise references.
   Food nutrition is an APPROXIMATE example per serving; check labels or verified sources. */
(function () {
  'use strict';
  const FOOD_LIBRARY = [
    {id:'f-rice',name:'ข้าวสวย',unit:'1 ทัพพี (80 กรัม)',kcal:104,protein:2,carbs:23,fat:0.2,group:'แป้ง'},
    {id:'f-brown',name:'ข้าวกล้อง',unit:'1 ทัพพี (80 กรัม)',kcal:110,protein:2.5,carbs:23,fat:0.9,group:'แป้ง'},
    {id:'f-chicken',name:'อกไก่สุกไม่ติดหนัง',unit:'100 กรัม',kcal:165,protein:31,carbs:0,fat:3.6,group:'โปรตีน'},
    {id:'f-egg',name:'ไข่ต้ม',unit:'1 ฟอง',kcal:78,protein:6.3,carbs:0.6,fat:5.3,group:'โปรตีน'},
    {id:'f-milk',name:'นมจืด',unit:'250 มล.',kcal:150,protein:8,carbs:12,fat:8,group:'เครื่องดื่ม'},
    {id:'f-soy',name:'นมถั่วเหลืองไม่หวาน',unit:'250 มล.',kcal:100,protein:7,carbs:5,fat:5,group:'เครื่องดื่ม'},
    {id:'f-banana',name:'กล้วยหอม',unit:'1 ผลกลาง',kcal:105,protein:1.3,carbs:27,fat:0.4,group:'ผลไม้'},
    {id:'f-oat',name:'ข้าวโอ๊ตแห้ง',unit:'40 กรัม',kcal:150,protein:5,carbs:27,fat:3,group:'แป้ง'},
    {id:'f-bread',name:'ขนมปังโฮลวีต',unit:'2 แผ่น',kcal:160,protein:7,carbs:28,fat:2,group:'แป้ง'},
    {id:'f-peanut',name:'เนยถั่ว',unit:'1 ช้อนโต๊ะ',kcal:95,protein:4,carbs:3.5,fat:8,group:'ไขมัน'},
    {id:'f-tuna',name:'ทูน่าในน้ำแร่ (สะเด็ดน้ำ)',unit:'100 กรัม',kcal:116,protein:26,carbs:0,fat:1,group:'โปรตีน'},
    {id:'f-tofu',name:'เต้าหู้แข็ง',unit:'100 กรัม',kcal:145,protein:15,carbs:4,fat:9,group:'โปรตีน'},
    {id:'f-yogurt',name:'โยเกิร์ตรสธรรมชาติ',unit:'150 กรัม',kcal:100,protein:8,carbs:12,fat:2.5,group:'ผลิตภัณฑ์นม'},
    {id:'f-ricechick',name:'ข้าวกะเพราไก่ (ประมาณ)',unit:'1 จาน',kcal:560,protein:27,carbs:65,fat:20,group:'อาหารจานเดียว'},
    {id:'f-noodles',name:'ก๋วยเตี๋ยวน้ำ (ประมาณ)',unit:'1 ชาม',kcal:330,protein:17,carbs:50,fat:7,group:'อาหารจานเดียว'},
    {id:'f-salmon',name:'แซลมอนสุก',unit:'100 กรัม',kcal:206,protein:22,carbs:0,fat:12,group:'โปรตีน'},
    {id:'f-apple',name:'แอปเปิล',unit:'1 ผลกลาง',kcal:95,protein:0.5,carbs:25,fat:0.3,group:'ผลไม้'},
    {id:'f-almond',name:'อัลมอนด์',unit:'28 กรัม',kcal:164,protein:6,carbs:6,fat:14,group:'ไขมัน'}
  ];
  const EXERCISES = [
    {id:'ex-bench',name:'Bench Press',group:'push',sets:4,reps:'6-10',load:40,rest:120},
    {id:'ex-incline',name:'Incline Dumbbell Press',group:'push',sets:3,reps:'8-12',load:16,rest:90},
    {id:'ex-shoulder',name:'Shoulder Press',group:'push',sets:3,reps:'8-12',load:12,rest:90},
    {id:'ex-lateral',name:'Lateral Raise',group:'push',sets:3,reps:'12-15',load:6,rest:60},
    {id:'ex-tricep',name:'Triceps Pushdown',group:'push',sets:3,reps:'10-15',load:20,rest:60},
    {id:'ex-pullup',name:'Pull-up / Assisted',group:'pull',sets:3,reps:'6-10',load:0,rest:120},
    {id:'ex-lat',name:'Lat Pulldown',group:'pull',sets:3,reps:'8-12',load:35,rest:90},
    {id:'ex-row',name:'Seated Cable Row',group:'pull',sets:3,reps:'8-12',load:30,rest:90},
    {id:'ex-face',name:'Face Pull',group:'pull',sets:3,reps:'12-15',load:12,rest:60},
    {id:'ex-curl',name:'Dumbbell Curl',group:'pull',sets:3,reps:'10-12',load:10,rest:60},
    {id:'ex-squat',name:'Barbell Squat',group:'legs',sets:4,reps:'6-10',load:45,rest:150},
    {id:'ex-rdl',name:'Romanian Deadlift',group:'legs',sets:3,reps:'8-12',load:35,rest:120},
    {id:'ex-lunge',name:'Walking Lunge',group:'legs',sets:3,reps:'10/ข้าง',load:12,rest:75},
    {id:'ex-legpress',name:'Leg Press',group:'legs',sets:3,reps:'10-12',load:80,rest:90},
    {id:'ex-calf',name:'Standing Calf Raise',group:'legs',sets:3,reps:'12-20',load:20,rest:60},
    {id:'ex-run',name:'วิ่งเบา / Zone 2',group:'run',sets:1,reps:'30 นาที',load:0,rest:0},
    {id:'ex-interval',name:'วิ่ง Interval',group:'run',sets:6,reps:'2 นาที',load:0,rest:90},
    {id:'ex-walk',name:'เดินเร็ว / Active Recovery',group:'recovery',sets:1,reps:'30 นาที',load:0,rest:0},
    {id:'ex-plank',name:'Plank',group:'full',sets:3,reps:'45 วินาที',load:0,rest:45}
  ];
  const DAYS = ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'];
  const DAYS_FULL = ['วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์','วันอาทิตย์'];
  const TYPES = {
    push:{title:'Push Day',desc:'อก • ไหล่ • หลังแขน',color:'#f2a672'},
    pull:{title:'Pull Day',desc:'หลัง • หน้าแขน',color:'#8db3f2'},
    legs:{title:'Leg Day',desc:'ขา • สะโพก • น่อง',color:'#c7abef'},
    run:{title:'Run Day',desc:'คาร์ดิโอ • วิ่ง',color:'#7bbfb0'},
    full:{title:'Full Body',desc:'กล้ามเนื้อทั่วร่างกาย',color:'#e4b95e'},
    recovery:{title:'Active Recovery',desc:'เดิน • ยืดเหยียด',color:'#a5bda4'},
    rest:{title:'Rest Day',desc:'ฟื้นฟูร่างกาย',color:'#a6afad'}
  };
  const GOALS = {
    gain:{title:'เพิ่มน้ำหนัก',adjust:250,copy:'ตั้งเป้าพลังงานมากกว่าค่ารักษาน้ำหนัก'},
    muscle:{title:'เพิ่มมวลกล้ามเนื้อ',adjust:200,copy:'ฝึกแรงต้าน + ติดตามโปรตีนและการฟื้นตัว'},
    lose:{title:'ลดน้ำหนัก',adjust:-300,copy:'ประเมินแนวโน้มตามข้อมูลหลายสัปดาห์'},
    fat:{title:'ลดไขมัน',adjust:-250,copy:'เน้นพฤติกรรมที่ทำได้ต่อเนื่อง'},
    maintain:{title:'รักษาน้ำหนัก',adjust:0,copy:'ติดตามสมดุลพลังงานและกิจกรรม'}
  };
  const ACTIVITY = {sedentary:{label:'นั่งทำงาน / เคลื่อนไหวน้อย',factor:1.2},light:{label:'ออกกำลังเบา 1–3 วัน/สัปดาห์',factor:1.375},moderate:{label:'ออกกำลัง 3–5 วัน/สัปดาห์',factor:1.55},active:{label:'ออกกำลังหนัก 6–7 วัน/สัปดาห์',factor:1.725},very:{label:'งานใช้แรง + ออกกำลังมาก',factor:1.9}};
  const CATEGORIES = {work:'งาน / เรียน',workout:'ออกกำลังกาย',meal:'อาหาร',rest:'พักผ่อน',personal:'กิจวัตร',other:'อื่น ๆ'};
  const MEALTYPES = {breakfast:'มื้อเช้า',lunch:'มื้อกลางวัน',dinner:'มื้อเย็น',snack:'มื้อว่าง'};
  const freshProfile = () => ({name:'',age:'',height:'',weight:'',sex:'male',activity:'moderate',goal:'muscle',targetWeight:'',calorieAdjust:200,proteinPerKg:1.6,fatPercent:25,sleepGoal:8});
  const plan = () => [
    {day:0,type:'push',title:'Push Day — Strength',exercises:['ex-bench','ex-incline','ex-shoulder','ex-lateral','ex-tricep']},
    {day:1,type:'pull',title:'Pull Day — Back & Biceps',exercises:['ex-pullup','ex-lat','ex-row','ex-face','ex-curl']},
    {day:2,type:'run',title:'Easy Run + Mobility',exercises:['ex-run','ex-plank']},
    {day:3,type:'legs',title:'Leg Day — Strength',exercises:['ex-squat','ex-rdl','ex-lunge','ex-calf']},
    {day:4,type:'push',title:'Push Day — Volume',exercises:['ex-incline','ex-shoulder','ex-lateral','ex-tricep']},
    {day:5,type:'recovery',title:'Active Recovery',exercises:['ex-walk']},
    {day:6,type:'rest',title:'Rest & Recharge',exercises:[]}
  ].map(p => ({...p,exercises:p.exercises.map(id => ({...EXERCISES.find(x=>x.id===id), id:`p-${id}-${p.day}`}))}));
  const routines = () => [
    {id:'r1',days:[0,1,2,3,4],start:'06:30',end:'07:00',title:'ตื่นนอนและเตรียมตัว',category:'personal'},
    {id:'r2',days:[0,1,2,3,4],start:'07:00',end:'08:00',title:'อาหารเช้า + เดินทาง',category:'meal'},
    {id:'r3',days:[0,1,2,3,4],start:'08:00',end:'12:00',title:'งาน / เรียน',category:'work'},
    {id:'r4',days:[0,1,2,3,4],start:'12:00',end:'13:00',title:'มื้อกลางวัน',category:'meal'},
    {id:'r5',days:[0,1,2,3,4],start:'13:00',end:'17:00',title:'งาน / เรียน',category:'work'},
    {id:'r6',days:[0,1,2,3,4],start:'18:00',end:'19:15',title:'ฝึกตามโปรแกรม / Recovery',category:'workout'},
    {id:'r7',days:[0,1,2,3,4,5,6],start:'22:30',end:'23:00',title:'ลดแสงหน้าจอและเตรียมนอน',category:'rest'},
    {id:'r8',days:[5,6],start:'08:00',end:'09:00',title:'ตื่นนอน / อาหารเช้า',category:'personal'},
    {id:'r9',days:[5,6],start:'10:00',end:'11:00',title:'กิจกรรมส่วนตัว / เดิน',category:'workout'}
  ];
  function localDate(offset=0) {
    const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function dayOf(date) { const d = new Date(`${date}T12:00:00`); return (d.getDay()+6)%7; }
  function demoState() {
    const p = plan();
    const meals = [];
    for(let i=-6;i<=0;i++) {
      const date=localDate(i);
      for(const [foodId,meal,servings] of [['f-oat','breakfast',1],['f-milk','breakfast',1],['f-ricechick','lunch',1],['f-chicken','dinner',1.5],['f-rice','dinner',2],['f-banana','snack',1]]) {
        const food=FOOD_LIBRARY.find(f=>f.id===foodId);
        meals.push({id:`demo-meal-${i}-${foodId}`,date,meal,foodId,name:food.name,unit:food.unit,servings,kcal:food.kcal,protein:food.protein,carbs:food.carbs,fat:food.fat});
      }
    }
    const weights = Array.from({length:9},(_,i)=>({id:`demo-weight-${i}`,date:localDate(-28+i*3),weight:Number((66.9+i*0.18).toFixed(1)),bodyFat:null}));
    weights.push({id:'demo-weight-today',date:localDate(0),weight:68.4,bodyFat:17.6});
    const sleeps = Array.from({length:6},(_,i)=>{
      const date=localDate(-5+i); const duration=[445,460,415,485,450,465][i];
      return {id:`demo-sleep-${i}`,date,bed:'22:40',wake:'07:00',awake:500-duration,deep:[95,85,72,104,92,88][i],light:[245,265,255,275,250,267][i],rem:[105,110,88,106,108,110][i],note:''};
    });
    const sessions=[];
    for(let i=-6;i<=-1;i++){
      const date=localDate(i); const d=dayOf(date); const todayPlan=p[d];
      if(todayPlan.type==='rest'||todayPlan.type==='recovery') continue;
      sessions.push({id:`demo-session-${i}`,date,day:d,type:todayPlan.type,title:todayPlan.title,duration:todayPlan.type==='run'?38:65,rpe:7,notes:'ตัวอย่างการบันทึก',exercises:todayPlan.exercises.map(ex=>({...ex}))});
    }
    return {version:1,demo:true,profile:{name:'Alex',age:25,height:175,weight:68,sex:'male',activity:'moderate',goal:'muscle',targetWeight:72,calorieAdjust:200,proteinPerKg:1.6,fatPercent:25,sleepGoal:8},plan:p,meals,sleeps,sessions,weights,routines:routines(),customFoods:[],settings:{theme:'light',font:'ibm'}};
  }
  function blankState() {
    return {version:1,demo:false,profile:freshProfile(),plan:plan(),meals:[],sleeps:[],sessions:[],weights:[],routines:routines(),customFoods:[],settings:{theme:'light',font:'ibm'}};
  }
  window.FitData = {FOOD_LIBRARY,EXERCISES,DAYS,DAYS_FULL,TYPES,GOALS,ACTIVITY,CATEGORIES,MEALTYPES,freshProfile,plan,routines,demoState,blankState};
})();
