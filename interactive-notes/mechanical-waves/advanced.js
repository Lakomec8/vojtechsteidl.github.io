"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  if (!$("lab-space") || !$("lab-practice")) return;
  const TAU = 2 * Math.PI;
  const DATA = {
    A: 2, T: 1.5, lambda: 4, x: 2, t: 1.0,
    playing: false, selected: 0, shownSteps: Array(13).fill(0),
    answers: {}, attempts: {}, mastered: new Set()
  };
  const fixed = (n, decimals = 2) => Number(n).toLocaleString("cs-CZ", {maximumFractionDigits: decimals});
  const wave = (x, t) => DATA.A * Math.sin(TAU * (t / DATA.T - x / DATA.lambda));
  const phi = (x, t) => TAU * (t / DATA.T - x / DATA.lambda);
  const col = {navy:"#14324a",wave:"#1a7a9c",orange:"#d37842",muted:"#6c8090",grid:"#d9e4ed",teal:"#137f77"};
  function setup(canvas) {
    const bounds=canvas.getBoundingClientRect();
    if (bounds.width < 30 || bounds.height < 30) return null;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w=bounds.width, h=bounds.height;
    if (canvas.width!==Math.round(w*dpr) || canvas.height!==Math.round(h*dpr)) {
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    }
    const c=canvas.getContext("2d");
    c.setTransform(dpr,0,0,dpr,0,0);
    c.clearRect(0,0,w,h);
    return {c,w,h};
  }
  function label(c,txt,x,y,color=col.muted,size=11,align="left") {
    c.fillStyle=color;c.font="600 "+size+"px system-ui,sans-serif";c.textAlign=align;c.fillText(txt,x,y);
  }
  function point(c,x,y,color=col.orange,r=6) {
    c.beginPath();c.arc(x,y,r+2,0,TAU);c.fillStyle="#ffffff";c.fill();
    c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();
  }
  function stroke(c,x,y,x2,y2,color=col.grid,width=1,dash=[]) {
    c.beginPath();c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=width;c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);
  }
  function graph(id,axis,limit,value,legend) {
    const cv=$(id),ctx=setup(cv);
    if(!ctx)return;
    const {c,w,h}=ctx;
    const left=47,right=w-22,top=25,bottom=h-39,center=(top+bottom)/2;
    const px = z=>left+(right-left)*z/limit;
    const py = z=>center-z/3.3*(bottom-top)/2;
    c.fillStyle="#fbfdff";c.fillRect(0,0,w,h);
    for(let j=-3;j<=3;j++){
      let y=py(j);stroke(c,left,y,right,y,col.grid,j===0?1.6:.75,j===0?[]:[3,5]);
      if(j%2===0)label(c,String(j),left-12,y+4,col.muted,10,"right");
    }
    for(let i=0;i<=6;i++){
      const pos=limit*i/6,xx=px(pos);
      stroke(c,xx,top,xx,bottom,col.grid,.7,[3,5]);
      label(c,fixed(pos,1),xx,bottom+15,col.muted,10,"center");
    }
    label(c,legend,right,bottom+30,col.navy,11,"right");
    label(c,"y [cm]",12,15,col.navy,10);
    c.beginPath();
    for(let i=0;i<=340;i++){
      const u=i/340*limit;
      const val=axis==="x"?wave(u,DATA.t):wave(DATA.x,u);
      const xx=px(u),yy=py(val);
      if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
    }
    c.strokeStyle=col.wave;c.lineWidth=3;c.stroke();
    const highlight=axis==="x"?DATA.x:DATA.t;
    const y=wave(DATA.x,DATA.t),xx=px(highlight),yy=py(y);
    stroke(c,xx,top,xx,bottom,col.orange,1.4,[5,4]);
    stroke(c,left,yy,xx,yy,col.orange,1,[4,4]);
    point(c,xx,yy);
    label(c,axis==="x"?"P(x₀, t₀)":"P(t₀, x₀)",Math.min(right-3,xx+12),Math.max(top+13,yy-13),col.orange,11,xx>right-90?"right":"left");
    if(axis==="x"){
      const xx1=px(.55),xx2=px(Math.min(limit,.55+DATA.lambda)),cy=top+10;
      stroke(c,xx1,cy,xx2,cy,col.teal,1.5);stroke(c,xx1,cy-4,xx1,cy+4,col.teal,1.5);stroke(c,xx2,cy-4,xx2,cy+4,col.teal,1.5);
      label(c,"λ",.5*(xx1+xx2),cy-6,col.teal,13,"center");
    }else{
      const xx1=px(.25),xx2=px(Math.min(limit,.25+DATA.T)),cy=top+10;
      stroke(c,xx1,cy,xx2,cy,col.teal,1.5);stroke(c,xx1,cy-4,xx1,cy+4,col.teal,1.5);stroke(c,xx2,cy-4,xx2,cy+4,col.teal,1.5);
      label(c,"T",.5*(xx1+xx2),cy-6,col.teal,13,"center");
    }
  }
  function spacetime() {
    const ctx=setup($("space-map"));
    if(!ctx)return;
    const {c,w,h}=ctx,left=47,right=w-22,top=19,bottom=h-34,pw=right-left,ph=bottom-top;
    const cols=160,rows=72;
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const phase=phi(12*(i+.5)/cols,5*(j+.5)/rows);
      const s=Math.sin(phase);
      c.fillStyle=s>=0 ? "rgba(17,133,151,"+(0.12+0.72*s).toFixed(3)+")" : "rgba(220,137,79,"+(0.12+0.69*-s).toFixed(3)+")";
      c.fillRect(left+pw*i/cols,top+ph*j/rows,pw/cols+1,ph/rows+1);
    }
    for(let j=0;j<=5;j++){
      const y=top+ph*j/5;stroke(c,left,y,right,y,"rgba(255,255,255,.75)",.8);
      label(c,String(j),left-12,y+4,col.muted,10,"right");
    }
    for(let i=0;i<=6;i++){
      const x=left+pw*i/6;stroke(c,x,top,x,bottom,"rgba(255,255,255,.70)",.8);
      label(c,String(2*i),x,bottom+15,col.muted,10,"center");
    }
    label(c,"t [s]",7,15,col.navy,10);
    label(c,"x [m]",right,bottom+30,col.navy,11,"right");
    const x=left+pw*DATA.x/12,y=top+ph*DATA.t/5;
    stroke(c,x,top,x,bottom,"#123048",1.3,[4,3]);
    stroke(c,left,y,right,y,"#123048",1.3,[4,3]);
    point(c,x,y,"#172e46",5);
  }
  function renderSpace() {
    const controls=[["space-A","A","cm"],["space-T","T","s"],["space-lambda","lambda","m"],["space-x","x","m"],["space-t","t","s"]];
    for(const [id,key,unit] of controls){
      $(id).value=String(DATA[key]);
      $(id+"-out").textContent=fixed(DATA[key],2)+" "+unit;
    }
    const speed=DATA.lambda/DATA.T, frequency=1/DATA.T, val=wave(DATA.x,DATA.t);
    $("space-readings").innerHTML=
      '<div><span>Frekvence</span><strong>'+fixed(frequency,3)+' Hz</strong></div>'+
      '<div><span>Rychlost</span><strong>'+fixed(speed,2)+' m/s</strong></div>'+
      '<div><span>Fáze bodu P</span><strong>'+fixed(phi(DATA.x,DATA.t),2)+' rad</strong></div>'+
      '<div><span>Výchylka</span><strong>'+fixed(val,2)+' cm</strong></div>';
    $("space-phase-formula").textContent="y("+fixed(DATA.x,1)+" m; "+fixed(DATA.t,2)+" s) = "+fixed(DATA.A,1)+" · sin[2π("+fixed(DATA.t/DATA.T,3)+" − "+fixed(DATA.x/DATA.lambda,3)+")] = "+fixed(val,3)+" cm";
    $("space-propagation").textContent="Stejný stav v bodě x = "+fixed(DATA.x,1)+" m nastane proti zdroji se zpožděním τ = x/v = "+fixed(DATA.x/speed,3)+" s. V našem modelu předpokládáme již ustálené harmonické vlnění.";
    $("space-play").textContent=DATA.playing?"Pozastavit čas":"Spustit čas";
    graph("space-graph-x","x",12,DATA.x,"x [m] · t = "+fixed(DATA.t,1)+" s");
    graph("space-graph-t","t",5,DATA.t,"t [s] · x = "+fixed(DATA.x,1)+" m");
    spacetime();
  }
  ["A","T","lambda","x","t"].forEach(key=>{
    $("space-"+key).addEventListener("input", e=>{
      DATA[key]=Number(e.target.value);if(key==="t")DATA.playing=false;renderSpace();
    });
  });
  $("space-play").addEventListener("click",()=>{DATA.playing=!DATA.playing;renderSpace();});
  $("space-reset").addEventListener("click",()=>{
    Object.assign(DATA,{A:2,T:1.5,lambda:4,x:2,t:1,playing:false});renderSpace();
  });
  document.querySelectorAll("[data-space-preset]").forEach(el=>el.addEventListener("click",()=>{
    const mode=el.dataset.spacePreset;
    if(mode==="same"){DATA.x=2;DATA.lambda=4;DATA.t=1.3;}
    if(mode==="opposite"){DATA.x=DATA.lambda/2;DATA.t=.2;}
    if(mode==="travel"){DATA.x=8;DATA.t=2;}
    DATA.playing=false;renderSpace();
  }));
  let then=0;
  function frame(now) {
    const dt=then?Math.min(.065,(now-then)/1000):0;then=now;
    if(DATA.playing&&!document.hidden&&$("lab-space").classList.contains("active")){
      DATA.t=(DATA.t+dt)%5;
      renderSpace();
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener("resize",()=>{
    if($("lab-space").classList.contains("active"))renderSpace();
  });
  document.querySelectorAll('[data-tab="space"]').forEach(el=>el.addEventListener("click",()=>requestAnimationFrame(renderSpace)));
  const q = [
    {tag:"Rychlost",title:"Rychlost zvuku ve vodě",prompt:"Perioda T = 2,0 ms, vlnová délka λ = 2,9 m. Vypočti fázovou rychlost v.",unit:"m/s",value:1450,tol:1,
      hint:"Převeď milisekundy na sekundy. Jaký úsek urazí vlna za jednu periodu?",steps:["T = 2,0 ms = 0,002 s","v = λ / T = 2,9 / 0,002","v = 1 450 m/s"]},
    {tag:"Vlnová délka",title:"Zvuk o frekvenci 200 Hz",prompt:"Frekvence f = 200 Hz, rychlost v = 1 450 m/s. Urči vlnovou délku λ.",unit:"m",value:7.25,tol:.015,
      hint:"Použij v = fλ a vyjádři λ.",steps:["λ = v / f","λ = 1 450 / 200","λ = 7,25 m"]},
    {tag:"Fáze · více řešení",title:"Bod má polovinu amplitudy",prompt:"Vlnění s periodou T postupuje v kladném směru osy x. Pro x = 4 cm a t = T/6 platí y = A/2; y(0,0) = 0 a λ > 4 cm. Který závěr je matematicky správný?",options:["Jediná možná vlnová délka je 48 cm.","Pro sinusovou vlnu existují λ = 48 cm a λ = 16/3 cm; při požadavku, aby vlna již dorazila od zdroje, platí pouze 48 cm.","Nelze určit žádnou hodnotu λ."],correct:1,
      hint:"Řeš sin(π/3 − 8π/λ) = 1/2. Funkce sinus je pro danou výchylku víceznačná.",steps:["φ = 2π(t/T − x/λ) = π/3 − 8π/λ (λ v cm).","sin φ = 1/2 ⇒ φ = π/6 nebo φ = −7π/6 v přípustném intervalu.","První větev: λ = 48 cm; druhá: λ = 16/3 cm ≈ 5,33 cm.","Pokud zdroj začal v t = 0, do bodu x = 4 cm musí vlna dorazit do T/6. Druhá větev nevyhoví (x/v = 3T/4)."],note:"Podmínky prezentace samy neříkají, zda jde o ustálenou vlnu, nebo o vlnu právě vyslanou v t = 0. Proto je důležité rozlišit obě interpretace."},
    {tag:"Okamžitá výchylka",title:"y = 0,03 sin(20πt)",prompt:"Zdroj kmitá podle y = 0,03 sin(20πt) v metrech. Rychlost v = 200 m/s. Jaká je výchylka (v cm) v bodě x = 5,0 m v čase t = 0,10 s?",unit:"cm",value:-3,tol:.03,
      hint:"Urči f z ω = 2πf, potom použij časové zpoždění τ = x/v.",steps:["ω = 20π rad/s ⇒ f = 10 Hz, T = 0,10 s.","τ = x/v = 5/200 = 0,025 s.","y(5;0,10) = 0,03 sin[20π(0,10 − 0,025)] = −0,03 m.","Výsledek: −3,0 cm."]},
    {tag:"Rozhraní",title:"Změna prostředí",prompt:"Vlna přejde z prostředí s rychlostí v₁ a vlnovou délkou λ₁ do prostředí s délkou λ₂. Který vztah správně vyjadřuje v₂?",options:["v₂ = v₁ · λ₁/λ₂","v₂ = v₁ · λ₂/λ₁","v₂ = v₁ + λ₂ − λ₁"],correct:1,
      hint:"Při přechodu rozhraním zůstává frekvence zdroje stejná.",steps:["f₁ = f₂ a v₁ = fλ₁, v₂ = fλ₂.","v₁/λ₁ = v₂/λ₂","v₂ = v₁ · (λ₂/λ₁)."]},
    {tag:"Fázový rozdíl",title:"Dva body vzdálené 20 cm",prompt:"f = 450 Hz, v = 360 m/s, vzdálenost Δx = 20 cm. Urči velikost prostorového fázového rozdílu v radiánech (desetinně).",unit:"rad",value:Math.PI/2,tol:.02,
      hint:"λ = v/f a |Δφ| = 2π·Δx/λ.",steps:["λ = 360/450 = 0,80 m.","Δx/λ = 0,20/0,80 = 1/4.","|Δφ| = 2π/4 = π/2 ≈ 1,571 rad."]},
    {tag:"Rychlost z fáze",title:"Bod 12 m a bod 14,7 m",prompt:"T = 1,0 ms, vzdálenosti bodů od zdroje 12,0 m a 14,7 m, fázový rozdíl 3π/2. Urči rychlost v m/s při obvyklém výkladu nezabaleného rozdílu.",unit:"m/s",value:3600,tol:2,
      hint:"Δx = 2,7 m; z 2π·Δx/λ = 3π/2 vyjádři λ.",steps:["Δx = 14,7 − 12,0 = 2,7 m.","2π·2,7/λ = 3π/2 ⇒ λ = 3,6 m.","v = λ/T = 3,6 / 0,001 = 3 600 m/s."],note:"Pokud by 3π/2 označovalo jen fázový rozdíl modulo 2π, existují také další řešení s rozdílem 3π/2 + 2πn. Zadání zde interpretujeme jako nezabalený fázový rozdíl."},
    {tag:"Opačná fáze",title:"Nejbližší opačné fáze",prompt:"Ve vodě se vlna šíří rychlostí 1 450 m/s a má frekvenci 725 Hz. Jaká je nejmenší vzdálenost bodů kmitajících v opačných fázích?",unit:"m",value:1,tol:.02,
      hint:"Opačné fáze mají rozdíl π, tedy nejmenší vzdálenost λ/2.",steps:["λ = v/f = 1 450 / 725 = 2 m.","Δφ = π ⇒ Δx = λ/2.","Δxₘᵢₙ = 1 m."]},
    {tag:"Kritické zadání",title:"Znáš jednu výchylku. Stačí to?",prompt:"T = 0,25 s, v = 68 m/s. V čase t = 10 s má bod x₁ = 43 m výchylku y₁ = 3 cm. Urči výchylku v bodě x₂ = 45 m a fázový rozdíl. Co lze určit jednoznačně pouze ze zadaných údajů?",options:["Obojí: y₂ = 3 cm a fázový rozdíl je 0.","Fázový rozdíl 4π/17 rad; okamžitá výchylka druhého bodu potřebuje informaci o počáteční fázi nebo jiné další údaje.","Nic nelze vypočítat."],correct:1,
      hint:"Z T a v určíš λ a tedy fázový rozdíl. Jedna okamžitá výchylka však neurčuje amplitudu ani fázi zdroje.",steps:["λ = vT = 68·0,25 = 17 m.","|Δφ| = 2π·(45−43)/17 = 4π/17 ≈ 0,739 rad (42,35°).","Bez počáteční fáze zdroje a amplitudy nemá y₂ jednoznačnou hodnotu.","Například při dodatečném předpokladu y(x,t)=A sin[2π(t/T−x/λ)] by vyšlo y₂≈13,03 cm."],note:"Tento úkol v předloze nemá jednoznačně určitelné y₂ bez dalšího předpokladu. Materiál proto nepodsouvá jednu hodnotu jako obecně platnou."},
    {tag:"Stejná fáze",title:"Nejbližší shodné fáze",prompt:"Frekvence f = 100 Hz, rychlost v = 5 000 m/s. Jaká je nejmenší kladná vzdálenost dvou různých bodů se stejnou fází?",unit:"m",value:50,tol:.05,
      hint:"Nejbližší různá místa ve stejné fázi jsou vzdálená jednu vlnovou délku.",steps:["λ = v/f = 5 000/100.","λ = 50 m.","Nejmenší kladná vzdálenost je 50 m."]},
    {tag:"Lano",title:"Vlna po svislém laně",prompt:"Spodní konec lana kmitá s T = 1,2 s, A = 20 cm a v = 15 m/s. Jaká je VELIKOST okamžité výchylky v bodě 45 m nad zdrojem v čase 4,0 s? Předpokládej sinusový začátek v nulové výchylce.",unit:"cm",value:10*Math.sqrt(3),tol:.12,
      hint:"Od zdroje se rozkmitání k bodu dostane až za τ = x/v.",steps:["τ = 45/15 = 3,0 s; bod kmitá již 1,0 s.","φ = 2π(4,0−3,0)/1,2 = 5π/3.","y = 20 sin(5π/3) = −10√3 cm.","Velikost výchylky |y| = 10√3 ≈ 17,32 cm."],note:"Absolutní velikost 17,32 cm platí při sinusovém kmitání s nulovou počáteční fází, která není v samotném zadání úplně specifikována."},
    {tag:"Amplituda",title:"Najdi amplitudu z jedné výchylky",prompt:"V čase 0,50T má bod ve vzdálenosti λ/3 od zdroje výchylku 5,0 cm. Urči amplitudu v cm pro sinusový model s nulovou počáteční fází.",unit:"cm",value:10/Math.sqrt(3),tol:.06,
      hint:"Vypočti fázi pro t/T = 1/2 a x/λ = 1/3.",steps:["φ = 2π(1/2 − 1/3) = π/3.","5,0 = A sin(π/3) = A√3/2.","A = 10/√3 ≈ 5,77 cm."],note:"Výsledek vychází pro obvyklou rovnici s nulovou počáteční fází."},
    {tag:"Zvuk · šíření",title:"Záblesk a zvuk výstřelu",prompt:"Pozorovatel je 4 000 m od střelce. Zvuk vnímá 12,0 s po záblesku. Vypočti rychlost zvuku v m/s; zanedbej dobu letu světla.",unit:"m/s",value:4000/12,tol:.6,
      hint:"Použij v = s/t.",steps:["s = 4 000 m; t = 12,0 s.","v = 4 000/12,0.","v ≈ 333,3 m/s (zanedbaná doba letu světla)."]}
  ];
  const quizState={choice:-1,feedback:"",good:false};
  function taskIndex(){
    $("practice-nav").innerHTML=q.map((item,i)=>
      '<button type="button" class="exercise-tile '+(DATA.selected===i?"chosen ":"")+(DATA.mastered.has(i)?"mastered":"")+'" data-q="'+i+'" aria-pressed="'+(DATA.selected===i)+'"><small>'+(i+1).toString().padStart(2,"0")+' / '+item.tag+'</small><strong>'+item.title+'</strong>'+(DATA.mastered.has(i)?'<span class="tick">✓</span>':"")+'</button>'
    ).join("");
    $("practice-counter").textContent=DATA.mastered.size+" / 13 vyřešeno";
    $("practice-meter").style.width=(DATA.mastered.size/13*100)+"%";
  }
  function renderTask(){
    const item=q[DATA.selected];
    taskIndex();
    $("exercise-label").textContent="Úloha "+(DATA.selected+1)+" / 13 · "+item.tag;
    $("exercise-name").textContent=item.title;
    $("exercise-prompt").textContent=item.prompt;
    $("exercise-note").textContent=item.note||"Zadání a číselné údaje odpovídají prezentaci Mechanické vlnění. Výpočty pracují s ideálním harmonickým modelem, není-li řečeno jinak.";
    $("exercise-hint").hidden=!DATA.hintShown;
    $("exercise-hint").textContent=item.hint;
    const choices=item.options;
    if(choices){
      $("exercise-response").innerHTML='<fieldset class="exercise-choices"><legend>Vyber správný závěr</legend>'+choices.map((txt,i)=>
        '<label><input type="radio" name="exercise-choice" value="'+i+'" '+(DATA.answers[DATA.selected]===String(i)?"checked":"")+'><span>'+txt+'</span></label>').join("")+'</fieldset>';
    }else{
      $("exercise-response").innerHTML='<label class="exercise-answer-label" for="exercise-answer">Tvůj výsledek <span>['+item.unit+']</span></label>'+
      '<input id="exercise-answer" type="text" autocomplete="off" inputmode="decimal" placeholder="Např. 7,25" value="'+(DATA.answers[DATA.selected]||"")+'">'+
      '<p class="exercise-mini">Zadej pouze číslo, případně desetinnou čárku. Znaménko je důležité, pokud úloha požaduje orientovanou výchylku.</p>';
    }
    const total=item.steps.length,count=Math.min(total,DATA.shownSteps[DATA.selected]);
    $("exercise-steps").innerHTML=count?item.steps.slice(0,count).map((txt,i)=>
      '<div class="exercise-step"><span>'+(i+1)+'</span><p>'+txt+'</p></div>').join(""):"";
    $("exercise-steps-btn").textContent=count===0?"Odhalit první krok":count>=total?"Skrýt postup":"Odhalit další krok";
    $("exercise-feedback").textContent=quizState.feedback;
    $("exercise-feedback").className="exercise-feedback "+(quizState.feedback?(quizState.good?"is-good":"is-error"):"");
    $("exercise-hint-btn").textContent=DATA.hintShown?"Skrýt nápovědu":"Nápověda";
    $("exercise-prev").disabled=DATA.selected===0;
    $("exercise-next").disabled=DATA.selected===q.length-1;
  }
  $("practice-nav").addEventListener("click",e=>{
    const button=e.target.closest("[data-q]");if(!button)return;
    DATA.selected=Number(button.dataset.q);DATA.hintShown=false;quizState.feedback="";renderTask();
  });
  $("exercise-response").addEventListener("change",e=>{
    if(e.target.name==="exercise-choice"){DATA.answers[DATA.selected]=e.target.value;quizState.feedback="";$("exercise-feedback").textContent="";}
  });
  $("exercise-response").addEventListener("input",e=>{
    if(e.target.id==="exercise-answer"){DATA.answers[DATA.selected]=e.target.value;quizState.feedback="";$("exercise-feedback").textContent="";}
  });
  $("exercise-hint-btn").addEventListener("click",()=>{DATA.hintShown=!DATA.hintShown;renderTask();});
  $("exercise-steps-btn").addEventListener("click",()=>{
    const n=q[DATA.selected].steps.length;
    DATA.shownSteps[DATA.selected]=DATA.shownSteps[DATA.selected]>=n?0:DATA.shownSteps[DATA.selected]+1;
    renderTask();
  });
  function validNumber(value) {
    const str=String(value).trim().replace(",",".").replace(/\s/g,"");
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(str))return NaN;
    return Number(str);
  }
  $("exercise-submit").addEventListener("click",()=>{
    const item=q[DATA.selected],ans=DATA.answers[DATA.selected];
    if(ans===undefined||String(ans).trim()===""){
      quizState.feedback="Nejdřív zadej odpověď.";quizState.good=false;renderTask();return;
    }
    const success=item.options?Number(ans)===item.correct:Math.abs(validNumber(ans)-item.value)<=item.tol;
    quizState.good=success;
    quizState.feedback=success?"Správně. Nyní si můžeš projít celý postup.":"Zatím ne. Zkontroluj převody jednotek, znaménko, fázi a nápovědu.";
    if(success)DATA.mastered.add(DATA.selected);
    renderTask();
  });
  $("exercise-prev").addEventListener("click",()=>{if(DATA.selected>0){DATA.selected--;DATA.hintShown=false;quizState.feedback="";renderTask();}});
  $("exercise-next").addEventListener("click",()=>{if(DATA.selected<q.length-1){DATA.selected++;DATA.hintShown=false;quizState.feedback="";renderTask();}});
  function selectQuestionFromKeyboard(e){
    if(e.key==="Enter" && e.target.id==="exercise-answer")$("exercise-submit").click();
  }
  $("exercise-response").addEventListener("keydown",selectQuestionFromKeyboard);
  renderTask();
  renderSpace();
  requestAnimationFrame(frame);
  window.__waveAdvancedTest={problems:q,model:wave,phase:phi,state:DATA,renderSpace,renderTask};
})();