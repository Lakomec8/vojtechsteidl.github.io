"use strict";
(function(global){
  const G=9.81;
  const model={
    relative(person,boat,current){return {boatShore:boat+current,personShore:person+boat+current};},
    averageEqualDistance(v1,v2,d){const t=d/v1+d/v2;return {distance:2*d,time:t,speed:2*d/t,vector:0};},
    averageEqualTime(v1,v2,t){const distance=(v1+v2)*t;return {distance,time:2*t,speed:distance/(2*t),vector:(v1-v2)/2};},
    horizontal(mass,pull,mu){const normal=mass*G,friction=Math.min(mu*normal,pull),net=pull-friction;return {normal,friction,net,acceleration:net/mass};},
    incline(mass,angle,mu){const rad=angle*Math.PI/180,parallel=mass*G*Math.sin(rad),perpendicular=mass*G*Math.cos(rad),friction=Math.min(mu*perpendicular,parallel),net=parallel-friction;return {parallel,perpendicular,friction,net,acceleration:net/mass};}
  };
  global.MechanicsModel=model;
  if(typeof document==="undefined")return;

  const $=id=>document.getElementById(id), num=id=>Number($(id).value);
  const fmt=(n,d=1)=>Number(n).toLocaleString("cs-CZ",{minimumFractionDigits:d,maximumFractionDigits:d});
  const arrow=n=>Math.abs(n)<.005?"•":n>0?"→":"←";
  const signed=n=>`${fmt(Math.abs(n))} m/s ${arrow(n)}`;
  const state={tab:"relative",frame:"shore",playing:!matchMedia("(prefers-reduced-motion: reduce)").matches,time:0,avgMode:"distance",inclineStep:1,quiz:0,answers:Array(4).fill(null)};

  function canvasSetup(canvas){
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(global.devicePixelRatio||1,2);
    const w=Math.max(320,rect.width),h=Math.max(220,rect.height);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const c=canvas.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);return {c,w,h};
  }
  function line(c,x1,y1,x2,y2,color="#718696",width=1,dash=[]){c.save();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();}
  function text(c,value,x,y,color="#456174",size=12,align="left",weight=600){c.save();c.fillStyle=color;c.font=`${weight} ${size}px DM Sans, sans-serif`;c.textAlign=align;c.fillText(value,x,y);c.restore();}
  function roundRect(c,x,y,w,h,r,fill,stroke){c.save();c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}c.restore();}
  function vector(c,x,y,dx,dy,color,label){const len=Math.hypot(dx,dy);if(len<1)return;const ux=dx/len,uy=dy/len,px=-uy,py=ux;line(c,x,y,x+dx,y+dy,color,3);c.save();c.fillStyle=color;c.beginPath();c.moveTo(x+dx,y+dy);c.lineTo(x+dx-10*ux+5*px,y+dy-10*uy+5*py);c.lineTo(x+dx-10*ux-5*px,y+dy-10*uy-5*py);c.fill();c.restore();if(label)text(c,label,x+dx/2+px*12,y+dy/2+py*12,color,11,"center",700);}
  function water(c,w,y){c.fillStyle="#dff4f6";c.fillRect(0,y,w,86);c.strokeStyle="#2e9fc0";c.lineWidth=1.5;c.beginPath();for(let x=-15;x<w+20;x+=20){c.moveTo(x,y+9);c.quadraticCurveTo(x+5,y+3,x+10,y+9);c.quadraticCurveTo(x+15,y+15,x+20,y+9);}c.stroke();}

  function updateRelative(){
    const boat=num("boat-speed"),current=num("current-speed"),person=num("person-speed"),r=model.relative(person,boat,current);
    $("boat-speed-out").textContent=signed(boat);$("current-speed-out").textContent=signed(current);$("person-speed-out").textContent=signed(person);
    $("boat-water-value").textContent=signed(boat);$("water-shore-value").textContent=signed(current);$("person-boat-value").textContent=signed(person);$("person-shore-value").textContent=signed(r.personShore);
    $("relative-equation").textContent=`${fmt(person)} + ${fmt(boat)} + ${fmt(current)} = ${fmt(r.personShore)} m/s ${arrow(r.personShore)}`;
    const motion=Math.abs(r.personShore)<.01?"stojí vůči břehu":`se pohybuje ${r.personShore>0?"doprava":"doleva"} rychlostí ${fmt(Math.abs(r.personShore))} m/s`;
    $("relative-meaning").textContent=`Pozorovatel na břehu vidí, že člověk ${motion}.`;
    drawRelative();
  }
  function drawRelative(){
    const {c,w,h}=canvasSetup($("relative-canvas")),boat=num("boat-speed"),current=num("current-speed"),person=num("person-speed"),r=model.relative(person,boat,current);
    const reference=state.frame==="shore"?0:r.boatShore;const scale=Math.min(35,w/23),baseY=h*.64;
    c.fillStyle="#f8fbfc";c.fillRect(0,0,w,h);water(c,w,baseY+35);c.fillStyle="#d7c8a8";c.fillRect(0,baseY+121,w,h-baseY-121);
    for(let x=0;x<w;x+=44)line(c,x,baseY+129,x+18,baseY+129,"#a99a7d",2);
    const bx=w*.5+((r.boatShore-reference)*state.time*scale%(w+260));let boatX=((bx+130)%(w+260))-130;
    c.save();c.translate(boatX,baseY);c.fillStyle="#0d3146";c.beginPath();c.moveTo(-92,0);c.lineTo(88,0);c.lineTo(65,31);c.lineTo(-68,31);c.closePath();c.fill();c.fillStyle="#fff";c.fillRect(-39,-27,83,27);c.fillStyle="#0b8a83";c.fillRect(36,-50,5,23);c.fillStyle="#e45d4f";c.beginPath();c.moveTo(41,-50);c.lineTo(71,-39);c.lineTo(41,-28);c.fill();
    const walk=((person*state.time*scale+70)%140)-70;c.fillStyle="#d98a24";c.beginPath();c.arc(walk,-37,7,0,Math.PI*2);c.fill();line(c,walk,-30,walk,-10,"#d98a24",4);line(c,walk,-21,walk-7,-2,"#d98a24",3);line(c,walk,-21,walk+8,-4,"#d98a24",3);c.restore();
    text(c,state.frame==="shore"?"POZOROVATEL NA BŘEHU":"POZOROVATEL NA LODI",18,26,"#718696",10,"left",800);roundRect(c,18,41,30,40,4,"#071827");c.fillStyle="#e45d4f";c.beginPath();c.arc(33,34,7,0,Math.PI*2);c.fill();
    const y1=110,x0=Math.max(88,w*.18);text(c,"Vektory rychlosti",x0,y1-35,"#12283b",12,"left",800);vector(c,x0,y1,(boat)*scale,0,"#0b8a83","loď / voda");vector(c,x0,y1+44,current*scale,0,"#2e9fc0","voda / břeh");vector(c,x0,y1+88,person*scale,0,"#d98a24","člověk / loď");vector(c,x0,y1+132,r.personShore*scale,0,"#e45d4f","člověk / břeh");
    $("relative-note").textContent=state.frame==="shore"?"Vztažná soustava: břeh je v klidu":"Vztažná soustava: loď je v klidu; břeh se pohybuje opačně";
  }

  function updateAverage(){
    const a=num("speed-a"),b=num("speed-b"),distance=num("distance"),legTime=num("leg-time");let r,steps;
    if(state.avgMode==="distance"){
      r=model.averageEqualDistance(a,b,distance);steps=[`Dráha: s = ${distance} + ${distance} = ${fmt(r.distance,0)} m`,`Čas: t = ${distance}/${fmt(a)} + ${distance}/${fmt(b)} = ${fmt(r.time,2)} s`,`vₚ = ${fmt(r.distance,0)}/${fmt(r.time,2)} = ${fmt(r.speed,2)} m/s`];
      $("average-trap").textContent=`Při stejných vzdálenostech není výsledek (${fmt(a)} + ${fmt(b)})/2. Pomalejší část trvá déle, a proto má větší váhu.`;
    }else{
      r=model.averageEqualTime(a,b,legTime);steps=[`Dráha: s = ${fmt(a)}·${legTime} + ${fmt(b)}·${legTime} = ${fmt(r.distance,0)} m`,`Čas: t = ${legTime} + ${legTime} = ${2*legTime} s`,`vₚ = ${fmt(r.distance,0)}/${2*legTime} = ${fmt(r.speed,2)} m/s`];
      $("average-trap").textContent=`Při stejných časech je rychlostní průměr aritmetický: (${fmt(a)} + ${fmt(b)})/2 = ${fmt(r.speed,2)} m/s.`;
    }
    $("speed-a-out").textContent=`${fmt(a)} m/s`;$("speed-b-out").textContent=`${fmt(b)} m/s`;$("distance-out").textContent=`${distance} m`;$("leg-time-out").textContent=`${legTime} s`;
    $("avg-speed-value").textContent=`${fmt(r.speed,2)} m/s`;$("avg-vector-value").textContent=`${fmt(r.vector,2)} m/s`;
    $("average-calculation").querySelector("ol").innerHTML=steps.map(x=>`<li>${x}</li>`).join("");
    $("average-note").textContent=state.avgMode==="distance"?"Po návratu: Δx = 0 m, ale dráha s > 0 m":"Stejný čas neznamená stejnou vzdálenost";drawAverage(r);
  }
  function drawAverage(r){
    const {c,w,h}=canvasSetup($("average-canvas"));c.fillStyle="#f8fbfc";c.fillRect(0,0,w,h);const left=70,right=w-70,y=h*.47;
    line(c,left,y,right,y,"#9cb1bd",4);for(let i=0;i<=4;i++){const x=left+(right-left)*i/4;line(c,x,y-8,x,y+8,"#718696",2);}
    roundRect(c,left-18,y-55,36,36,6,"#071827");text(c,"START",left,y+35,"#718696",10,"center",800);roundRect(c,right-18,y-55,36,36,6,"#0b8a83");text(c,"OBRAT",right,y+35,"#718696",10,"center",800);
    const progress=(state.time*.12)%2,p=progress<=1?progress:2-progress,x=left+(right-left)*p;roundRect(c,x-17,y-17,34,22,5,"#e45d4f");c.fillStyle="#071827";c.beginPath();c.arc(x-9,y+8,6,0,Math.PI*2);c.arc(x+9,y+8,6,0,Math.PI*2);c.fill();
    vector(c,left,y-82,(right-left)*.38,0,"#0b8a83",`tam ${fmt(num("speed-a"))} m/s`);vector(c,right,y+83,-(right-left)*.38,0,"#d98a24",`zpět ${fmt(num("speed-b"))} m/s`);
    text(c,`celková dráha ${fmt(r.distance,0)} m`,w*.5,h-35,"#12283b",13,"center",800);text(c,`celkový čas ${fmt(r.time,2)} s`,w*.5,h-15,"#718696",11,"center",600);
  }

  function updateForces(){
    const mass=num("mass"),pull=num("pull"),mu=num("mu"),r=model.horizontal(mass,pull,mu);
    $("mass-out").textContent=`${mass} kg`;$("pull-out").textContent=`${pull} N`;$("mu-out").textContent=fmt(mu,2);$("net-force").textContent=`${fmt(r.net)} N ${arrow(r.net)}`;$("acceleration").textContent=`${fmt(r.acceleration,2)} m/s² ${arrow(r.acceleration)}`;
    $("force-calc").textContent=`Fₜř = μN = ${fmt(r.friction)} N; Fᵣ = ${pull} − ${fmt(r.friction)} = ${fmt(r.net)} N`;
    $("force-state").textContent=r.net<.05?"Rovnováha: a = 0":"Zrychluje doprava";drawForces(r);
  }
  function drawForces(r){
    const {c,w,h}=canvasSetup($("forces-canvas")),cx=w*.5,cy=h*.53,scale=Math.min(1.15,w/520);c.fillStyle="#f8fbfc";c.fillRect(0,0,w,h);line(c,35,cy+63,w-35,cy+63,"#9cb1bd",3);roundRect(c,cx-70,cy-55,140,110,10,"#fff","#071827");text(c,"m = "+num("mass")+" kg",cx,cy+5,"#12283b",14,"center",800);
    vector(c,cx+70,cy,num("pull")*scale,0,"#0b8a83","F");vector(c,cx-70,cy,-r.friction*scale,0,"#d98a24","Fₜř");vector(c,cx,cy-55,0,-Math.min(r.normal*scale*.55,130),"#2e9fc0","N");vector(c,cx,cy+55,0,Math.min(r.normal*scale*.55,130),"#e45d4f","Fᴳ");c.fillStyle="#071827";c.beginPath();c.arc(cx,cy,5,0,Math.PI*2);c.fill();text(c,"Síly působící na bednu",20,27,"#718696",10,"left",800);
  }

  const inclineSteps=[
    "Tíha Fᴳ = mg míří vždy svisle dolů, ne kolmo k rovině.",
    "Zvol osy: x podél roviny, y kolmo k rovině. Tíhu rozlož na dvě složky.",
    "Kolmo k rovině není zrychlení: N = Fᴳ⊥ = mg cos α. Tření míří proti skluzu.",
    "Sečti síly podél roviny: Fᵣ = mg sin α − μmg cos α a použij Fᵣ = ma."
  ];
  function updateIncline(){
    const mass=num("incline-mass"),angle=num("angle"),mu=num("incline-mu"),r=model.incline(mass,angle,mu);
    $("angle-out").textContent=`${angle}°`;$("incline-mass-out").textContent=`${mass} kg`;$("incline-mu-out").textContent=fmt(mu,2);$("parallel-force").textContent=`${fmt(r.parallel)} N`;$("perp-force").textContent=`${fmt(r.perpendicular)} N`;$("friction-force").textContent=`${fmt(r.friction)} N`;$("incline-accel").textContent=`${fmt(r.acceleration,2)} m/s²`;
    $("incline-step-label").textContent=`Krok ${state.inclineStep} / 4 · ${["Nakresli tíhu","Rozlož tíhu","Přidej N a tření","Použij F = ma"][state.inclineStep-1]}`;
    $("incline-step-text").querySelector("span").textContent=state.inclineStep;$("incline-step-text").querySelector("p").textContent=inclineSteps[state.inclineStep-1];$("incline-prev").disabled=state.inclineStep===1;$("incline-next").textContent=state.inclineStep===4?"Znovu od kroku 1":"Další krok →";
    const a=angle;$("incline-calculation").querySelector("ol").innerHTML=[`F∥ = mg sin ${a}° = ${fmt(r.parallel)} N`,`N = mg cos ${a}° = ${fmt(r.perpendicular)} N`,`Fₜř = μN = ${fmt(r.friction)} N`,`a = (F∥ − Fₜř)/m = ${fmt(r.acceleration,2)} m/s²`].map(x=>`<li>${x}</li>`).join("");drawIncline(r);
  }
  function drawIncline(r){
    const {c,w,h}=canvasSetup($("incline-canvas")),angle=num("angle")*Math.PI/180,cx=w*.5,cy=h*.56,L=Math.min(w*.76,430);c.fillStyle="#f8fbfc";c.fillRect(0,0,w,h);const x1=cx-L*.5*Math.cos(angle),y1=cy+L*.5*Math.sin(angle),x2=cx+L*.5*Math.cos(angle),y2=cy-L*.5*Math.sin(angle);line(c,x1,y1,x2,y2,"#071827",7);c.save();c.translate(cx,cy);c.rotate(-angle);roundRect(c,-48,-68,96,68,8,"#fff","#071827");c.restore();text(c,`${num("angle")}°`,x1+37,y1-6,"#0b8a83",13,"center",800);
    vector(c,cx,cy-34,0,Math.min(r.parallel+r.perpendicular,120),"#e45d4f","Fᴳ");
    if(state.inclineStep>=2){vector(c,cx,cy-34,-Math.cos(angle)*Math.min(r.parallel,115),Math.sin(angle)*Math.min(r.parallel,115),"#d98a24","Fᴳ∥");vector(c,cx,cy-34,Math.sin(angle)*Math.min(r.perpendicular,115),Math.cos(angle)*Math.min(r.perpendicular,115),"#7e69bd","Fᴳ⊥");}
    if(state.inclineStep>=3){vector(c,cx,cy-34,-Math.sin(angle)*Math.min(r.perpendicular,115),-Math.cos(angle)*Math.min(r.perpendicular,115),"#2e9fc0","N");vector(c,cx,cy-34,Math.cos(angle)*Math.min(r.friction,105),-Math.sin(angle)*Math.min(r.friction,105),"#0b8a83","Fₜř");}
    if(state.inclineStep>=4){text(c,`a = ${fmt(r.acceleration,2)} m/s² po rovině dolů`,w*.5,h-24,"#071827",13,"center",800);}
  }

  const quiz=[
    {topic:"Vztažné soustavy",q:"Loď jede vůči vodě 5 m/s doprava, proud 2 m/s doleva a člověk jde po palubě 1 m/s doleva. Jakou rychlost člověka vidí břeh?",a:["2 m/s doprava","4 m/s doprava","6 m/s doprava","2 m/s doleva"],correct:0,why:"Zvol doprava jako kladný směr: 5 + (−2) + (−1) = 2 m/s doprava."},
    {topic:"Průměrná rychlost",q:"Cyklista ujede stejnou vzdálenost rychlostí 30 km/h a zpět 10 km/h. Jaká je průměrná rychlost pohybu?",a:["20 km/h","15 km/h","12 km/h","0 km/h"],correct:1,why:"Pro stejné vzdálenosti použij harmonický průměr: 2·30·10/(30+10) = 15 km/h. Hodnota 0 patří průměrné vektorové rychlosti po návratu."},
    {topic:"Newtonovy zákony",q:"Kniha leží v klidu na stole. Které tvrzení je fyzikálně správné?",a:["Tíha a normálová síla jsou akce a reakce.","Na knihu nepůsobí žádná síla.","Tíha a normálová síla se na knize vyruší, ale nejsou dvojicí akce–reakce.","Normálová síla je vždy větší než tíha."],correct:2,why:"Obě síly působí na stejnou knihu a jejich výslednice je nulová. Dvojice akce–reakce musí působit na dvě různá tělesa."},
    {topic:"Nakloněná rovina",q:"Jak se při zvětšování úhlu α mění složka tíhy podél roviny mg·sin α?",a:["Zmenšuje se","Roste","Nemění se","Je vždy rovna mg"],correct:1,why:"Sinus úhlu od 0° do 90° roste, takže roste i složka tíhy táhnoucí těleso po svahu dolů."}
  ];
  function renderQuiz(){const item=quiz[state.quiz],answered=state.answers[state.quiz];$("quiz-topic").textContent=item.topic;$("quiz-question").textContent=item.q;$("quiz-progress").textContent=`Úloha ${state.quiz+1} / ${quiz.length}`;$("quiz-meter").style.width=`${(state.quiz+1)/quiz.length*100}%`;$("quiz-score").textContent=`${state.answers.filter((x,i)=>x===quiz[i].correct).length} správně`;$("quiz-answers").innerHTML=item.a.map((a,i)=>`<button type="button" class="quiz-answer ${answered===null?"":i===item.correct?"good":i===answered?"bad":""}" data-answer="${i}" ${answered===null?"":"disabled"}>${a}</button>`).join("");$("quiz-feedback").className="quiz-feedback";$("quiz-solution").hidden=answered===null;if(answered===null){$("quiz-feedback").textContent="";$("quiz-solution").textContent="";}else{const good=answered===item.correct;$("quiz-feedback").textContent=good?"Správně — vektorový nebo silový model sedí.":"Zatím ne. Podívej se na znaménka, definici nebo na těleso, pro které kreslíš síly.";$("quiz-feedback").classList.add(good?"good":"bad");$("quiz-solution").textContent=item.why;}$("quiz-prev").disabled=state.quiz===0;$("quiz-next").textContent=state.quiz===quiz.length-1?"Zpět na první úlohu":"Další úloha →";document.querySelectorAll(".quiz-answer").forEach(b=>b.addEventListener("click",()=>{state.answers[state.quiz]=Number(b.dataset.answer);renderQuiz();}));}

  document.querySelectorAll(".tab").forEach(button=>button.addEventListener("click",()=>{state.tab=button.dataset.tab;document.querySelectorAll(".tab").forEach(b=>{const on=b===button;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));});document.querySelectorAll(".lesson").forEach(section=>{const on=section.id===`lab-${state.tab}`;section.hidden=!on;section.classList.toggle("active",on);});redraw();}));
  document.querySelectorAll(".frame").forEach(b=>b.addEventListener("click",()=>{state.frame=b.dataset.frame;document.querySelectorAll(".frame").forEach(x=>x.classList.toggle("active",x===b));drawRelative();}));
  for(const id of ["boat-speed","current-speed","person-speed"])$(id).addEventListener("input",updateRelative);
  $("relative-play").addEventListener("click",()=>{state.playing=!state.playing;$("relative-play").textContent=state.playing?"Pozastavit animaci":"Spustit animaci";});
  $("relative-reset").addEventListener("click",()=>{[["boat-speed",4],["current-speed",1],["person-speed",2]].forEach(([id,v])=>$(id).value=v);state.time=0;updateRelative();});
  document.querySelectorAll("[data-relative]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.relative==="opposite"){$("boat-speed").value=5;$("current-speed").value=1;$("person-speed").value=-3;}else{$("boat-speed").value=2;$("current-speed").value=1;$("person-speed").value=-3;}updateRelative();}));
  document.querySelectorAll(".avg-mode").forEach(b=>b.addEventListener("click",()=>{state.avgMode=b.dataset.mode;document.querySelectorAll(".avg-mode").forEach(x=>x.classList.toggle("active",x===b));$("distance-control").classList.toggle("hidden",state.avgMode!=="distance");$("time-control").classList.toggle("hidden",state.avgMode!=="time");updateAverage();}));
  for(const id of ["speed-a","speed-b","distance","leg-time"])$(id).addEventListener("input",updateAverage);
  for(const id of ["mass","pull","mu"])$(id).addEventListener("input",updateForces);
  document.querySelectorAll(".force-preset").forEach(b=>b.addEventListener("click",()=>{const p=b.dataset.force;if(p==="balanced"){$("mass").value=20;$("mu").value=.25;$("pull").value=49;}if(p==="heavy"){$("mass").value=40;$("mu").value=.1;$("pull").value=90;}if(p==="smooth"){$("mass").value=20;$("mu").value=0;$("pull").value=90;}updateForces();}));
  for(const id of ["angle","incline-mass","incline-mu"])$(id).addEventListener("input",updateIncline);
  $("incline-prev").addEventListener("click",()=>{state.inclineStep=Math.max(1,state.inclineStep-1);updateIncline();});$("incline-next").addEventListener("click",()=>{state.inclineStep=state.inclineStep===4?1:state.inclineStep+1;updateIncline();});
  $("quiz-prev").addEventListener("click",()=>{state.quiz=Math.max(0,state.quiz-1);renderQuiz();});$("quiz-next").addEventListener("click",()=>{state.quiz=(state.quiz+1)%quiz.length;renderQuiz();});
  function redraw(){if(state.tab==="relative")drawRelative();if(state.tab==="average")updateAverage();if(state.tab==="forces")drawForces(model.horizontal(num("mass"),num("pull"),num("mu")));if(state.tab==="incline")drawIncline(model.incline(num("incline-mass"),num("angle"),num("incline-mu")));}
  let last=0,lastDraw=0;function frame(now){const dt=last?Math.min((now-last)/1000,.08):0;last=now;if(state.playing&&!document.hidden)state.time+=dt;if(state.playing&&now-lastDraw>35&&(state.tab==="relative"||state.tab==="average")){redraw();lastDraw=now;}requestAnimationFrame(frame);}window.addEventListener("resize",redraw,{passive:true});document.addEventListener("visibilitychange",()=>{last=0;});
  updateRelative();updateAverage();updateForces();updateIncline();renderQuiz();if(!state.playing)$("relative-play").textContent="Spustit animaci";requestAnimationFrame(frame);
})(typeof window!=="undefined"?window:globalThis);
