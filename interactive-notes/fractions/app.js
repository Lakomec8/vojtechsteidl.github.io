"use strict";

const $=id=>document.getElementById(id);
const num=(id)=>Number($(id).value);
const fmt=(x,places=3)=>new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:places}).format(Math.abs(x)<1e-12?0:x);
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return a;};
const frac=(n,d)=>'<math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="'+n+' lomeno '+d+'"><mfrac><mn>'+n+'</mn><mn>'+d+'</mn></mfrac></math>';
const equation=(n,d,n2,d2)=>'<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mfrac><mn>'+n+'</mn><mn>'+d+'</mn></mfrac><mo>=</mo><mfrac><mn>'+n2+'</mn><mn>'+d2+'</mn></mfrac></math>';
const strip=(n,d,alt=false)=>'<div class="fraction-strip" role="img" aria-label="'+n+' z '+d+' stejných dílů vybarveno">'+Array.from({length:d},(_,i)=>'<span class="strip-cell '+(i<n?'filled':'')+(alt?' alt':'')+'"></span>').join('')+'</div>';
const tiles=(n,d)=>'<div class="tile-model" role="img" aria-label="'+n+' z '+d+' stejných dílků">'+Array.from({length:d},(_,i)=>'<span class="tile '+(i<n?'filled':'')+'"></span>').join('')+'</div>';
const cx=130,cy=130,R=109;
const polar=(a)=>{const ang=(a-90)*Math.PI/180;return [(cx+R*Math.cos(ang)).toFixed(4),(cy+R*Math.sin(ang)).toFixed(4)];};
const circle=(n,d,size=260)=>{
  const slices=Array.from({length:d},(_,i)=>{
    if(d===1)return '<circle cx="130" cy="130" r="'+R+'" fill="'+(i<n?'#58a091':'#e9eee7')+'" stroke="#fff" stroke-width="2"/>';
    const from=polar(i*360/d),to=polar((i+1)*360/d),large=(360/d>180)?1:0;
    return '<path d="M130 130 L'+from[0]+' '+from[1]+' A'+R+' '+R+' 0 '+large+' 1 '+to[0]+' '+to[1]+' Z" fill="'+(i<n?'#58a091':'#e9eee7')+'" stroke="#fffefa" stroke-width="2"/>';
  }).join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="'+size+'" height="'+size+'" role="img" aria-label="'+n+' vybarvených z '+d+' stejných kruhových výsečí"><circle cx="130" cy="130" r="114" fill="#f6faf4"/>'+slices+'<circle cx="130" cy="130" r="'+R+'" fill="none" stroke="#6d9f8b" stroke-width="1.6"/></svg>';
};

// I: Počet částí a vybraný podíl
let meaningView="circle";
function renderMeaning(){
  const d=num("meaningD"),elN=$("meaningN");
  elN.max=String(d);
  if(+elN.value>d)elN.value=String(d);
  const n=+elN.value;
  $("meaningDOut").textContent=d;
  $("meaningNOut").textContent=n;
  $("meaningNMax").textContent=d+" "+(d>=2&&d<=4?"díly":"dílů");
  $("meaningFormula").innerHTML=frac(n,d);
  $("meaningVisual").innerHTML=meaningView==="circle"?circle(n,d):meaningView==="strip"?'<div class="strip-model">'+strip(n,d)+'</div>':tiles(n,d);
  $("meaningPercent").textContent=fmt(100*n/d,1)+" %";
  $("meaningDecimal").textContent=fmt(n/d);
  $("meaningInsight").textContent=n===0?"Nevybíráme žádný díl: jde o nulu.":n===d?"Bereme všechny "+d+" díly, takže zlomek představuje jeden celý celek.":"Celek jsme rozdělili na "+d+(d<=4?" stejně velké části":" stejně velkých částí")+" a vybrali "+n+". Každý díl představuje 1/"+d+"; společně tvoří "+fmt(100*n/d,1)+" % celku.";
}
$("meaningD").addEventListener("input",renderMeaning);
$("meaningN").addEventListener("input",renderMeaning);
$("meaningReset").addEventListener("click",()=>{$("meaningD").value=4;$("meaningN").value=3;meaningView="circle";document.querySelectorAll("[data-view]").forEach(btn=>btn.setAttribute("aria-pressed",btn.dataset.view==="circle"?"true":"false"));renderMeaning();});
document.querySelectorAll(".scene-switch [data-view]").forEach(btn=>btn.addEventListener("click",()=>{meaningView=btn.dataset.view;document.querySelectorAll(".scene-switch [data-view]").forEach(b=>b.setAttribute("aria-pressed",b===btn?"true":"false"));renderMeaning();}));

// II: Rozšíření – mění se členění, nikoli podíl.
let baseN=1,baseD=2;
function renderEquivalence(){
  const k=num("factorSlider"),n=baseN*k,d=baseD*k;
  $("factorOut").textContent=k;
  $("equivLeftMath").innerHTML=frac(baseN,baseD);
  $("equivRightMath").innerHTML=frac(n,d);
  $("equivLeftBar").innerHTML='<div style="display:flex;justify-content:center;margin:4px 0 17px">'+circle(baseN,baseD,122)+'</div>'+strip(baseN,baseD);
  $("equivRightBar").innerHTML='<div style="display:flex;justify-content:center;margin:4px 0 17px">'+circle(n,d,122)+'</div>'+strip(n,d);
  $("equivSentence").textContent="Čitatel "+baseN+" vynásobíme "+k+" → "+n+". Jmenovatel "+baseD+" vynásobíme "+k+" → "+d+".";
  $("equivInsight").textContent=k===1?"Rozšiřování číslem 1 nemění zápis ani hodnotu. Zkus větší násobek.":"Přestože napravo vidíš "+d+" menších dílků místo "+baseD+" větších, vybarvená část zůstává shodná. Oba zlomky představují "+fmt(100*baseN/baseD,1)+" % celku.";
}
$("factorSlider").addEventListener("input",renderEquivalence);
document.querySelectorAll("[data-base]").forEach(btn=>btn.addEventListener("click",()=>{[baseN,baseD]=btn.dataset.base.split("/").map(Number);document.querySelectorAll("[data-base]").forEach(b=>b.classList.toggle("is-selected",b===btn));renderEquivalence();}));

// III: Krácení s opravdovým rozhodováním a historií kroků
let reductionStart=[12,18];
let reductionSteps=[{n:12,d:18,by:null}];
const currentReduction=()=>reductionSteps[reductionSteps.length-1];
function renderReduction(){
  const {n,d}=currentReduction(),g=gcd(n,d),finished=g===1;
  $("reduceMath").innerHTML=frac(n,d);
  $("reduceBar").innerHTML=strip(n,d);
  $("reduceGcd").textContent="NSD("+n+", "+d+") = "+g;
  $("reduceStatus").textContent=finished?"ZÁKLADNÍ TVAR ✓":"KRÁCENÍ POKRAČUJE";
  $("divisorButtons").innerHTML=Array.from({length:8},(_,i)=>'<button type="button" class="divisor-btn" data-divisor="'+(i+2)+'" '+(finished?'disabled':'')+' aria-label="Krátit číslem '+(i+2)+'">'+(i+2)+'</button>').join('');
  $("divisorButtons").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>reduceBy(Number(btn.dataset.divisor))));
  $("reduceUndo").disabled=reductionSteps.length===1;
  $("reduceHistory").innerHTML=reductionSteps.map((step,i)=>'<div class="history-step">'+(i?'<span>→</span><small class="history-divisor">÷'+step.by+'</small>':'')+frac(step.n,step.d)+'</div>').join('');
  if(finished){$("reduceFeedback").className="feedback ok";$("reduceFeedback").textContent="Hotovo. Zlomek "+n+"/"+d+" je v základním tvaru — dále jej krátit nelze.";}
}
function reduceBy(k){
  const {n,d}=currentReduction();
  if(n%k!==0||d%k!==0){
    $("reduceFeedback").className="feedback bad";
    $("reduceFeedback").textContent="Číslem "+k+" nelze krátit: nedělí současně "+n+" i "+d+" beze zbytku. Zkus jiného společného dělitele.";
    return;
  }
  reductionSteps.push({n:n/k,d:d/k,by:k});
  $("reduceFeedback").className="feedback ok";
  $("reduceFeedback").textContent="Správně. Oba členy jsme vydělili číslem "+k+"; podíl zůstává stejný.";
  renderReduction();
}
function chooseReduction(str){
  reductionStart=str.split("/").map(Number);
  reductionSteps=[{n:reductionStart[0],d:reductionStart[1],by:null}];
  document.querySelectorAll("[data-start]").forEach(b=>b.classList.toggle("is-selected",b.dataset.start===str));
  $("reduceFeedback").className="feedback";
  $("reduceFeedback").textContent="Najdi číslo, které dělí čitatele i jmenovatele.";
  renderReduction();
}
document.querySelectorAll("[data-start]").forEach(btn=>btn.addEventListener("click",()=>chooseReduction(btn.dataset.start)));
$("reduceUndo").addEventListener("click",()=>{if(reductionSteps.length>1){reductionSteps.pop();$("reduceFeedback").className="feedback";$("reduceFeedback").textContent="Poslední krok je vrácen. Zkus jiného společného dělitele.";renderReduction();}});

// IV: Přesné porovnání přes číselnou osu a křížové násobení
function renderComparison(){
  for(const side of ["A","B"]){
    const d=num("compareD"+side),nElement=$("compareN"+side);
    nElement.max=String(d);
    if(+nElement.value>d)nElement.value=String(d);
    const n=+nElement.value;
    $("compareD"+side+"Out").textContent=d;
    $("compareN"+side+"Out").textContent=n;
    $("compareMath"+side).innerHTML=frac(n,d);
    $("compareBar"+side).innerHTML=strip(n,d,side==="B");
  }
  const na=num("compareNA"),da=num("compareDA"),nb=num("compareNB"),db=num("compareDB");
  const va=na/da,vb=nb/db,crossA=na*db,crossB=nb*da;
  const aX=75+650*va,bX=75+650*vb;
  let ticks="";
  for(let i=0;i<=4;i++){const x=75+650*i/4;ticks+='<line x1="'+x+'" x2="'+x+'" y1="94" y2="110" stroke="#81998c" stroke-width="2"/><text x="'+x+'" y="133" fill="#809486" text-anchor="middle" font-size="16" font-family="Georgia,serif">'+(["0","¼","½","¾","1"][i])+'</text>';}
  $("numberLine").innerHTML='<svg viewBox="0 0 800 185" role="img" aria-label="Bod A je v poloze '+fmt(va)+'; bod B v poloze '+fmt(vb)+' na úseku od nuly do jedné"><line x1="75" y1="102" x2="725" y2="102" stroke="#b8cabb" stroke-width="4" stroke-linecap="round"/>'+ticks+
  '<line x1="75" y1="96" x2="'+aX+'" y2="96" stroke="#217c73" stroke-width="6" stroke-linecap="round" opacity=".8"/><line x1="'+aX+'" y1="60" x2="'+aX+'" y2="105" stroke="#217c73" stroke-width="2" stroke-dasharray="4 5"/><circle cx="'+aX+'" cy="60" r="13" fill="#217c73"/><text x="'+aX+'" y="66" fill="#fff" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold">A</text>'+
  '<line x1="75" y1="108" x2="'+bX+'" y2="108" stroke="#d68f62" stroke-width="6" stroke-linecap="round" opacity=".8"/><line x1="'+bX+'" y1="105" x2="'+bX+'" y2="160" stroke="#d68f62" stroke-width="2" stroke-dasharray="4 5"/><circle cx="'+bX+'" cy="160" r="13" fill="#d68f62"/><text x="'+bX+'" y="166" fill="#fff" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold">B</text></svg>';
  const sign=crossA===crossB?"=":crossA>crossB?">":"<";
  $("compareOutcome").innerHTML='<div>'+frac(na,da)+'</div><math xmlns="http://www.w3.org/1998/Math/MathML"><mo>'+sign.replace("<","&lt;")+'</mo></math><div>'+frac(nb,db)+'</div><span>protože '+na+' · '+db+' = '+crossA+' '+sign.replace("<","&lt;")+' '+nb+' · '+da+' = '+crossB+'</span>';
}
for(const id of ["compareDA","compareNA","compareDB","compareNB"])$(id).addEventListener("input",renderComparison);

// V: Zlomky s převody, student řeší sám.
const unitData={kg:{src:"kg",dst:"g",factor:1000,name:"kilogram"},m:{src:"m",dst:"cm",factor:100,name:"metr"},l:{src:"l",dst:"ml",factor:1000,name:"litr"}};
let selectedUnit="kg",unitOpen=false;
function unitMath(n,d,k,suffix){
  const answer=n*k/d;
  const approx=Number.isInteger(answer)?"=":"≈";
  return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mfrac><mn>'+n+'</mn><mn>'+d+'</mn></mfrac><mo>·</mo><mn>'+k+'</mn><mo>'+approx+'</mo><mn>'+fmt(answer,3).replace(",",".")+'</mn><mtext>&nbsp;'+suffix+'</mtext></math>';
}
function renderUnits(resetAnswer=true){
  const d=num("unitD"),inN=$("unitN");inN.max=String(d);if(+inN.value>d)inN.value=String(d);
  const n=+inN.value,u=unitData[selectedUnit],answer=n*u.factor/d;
  $("unitDOut").textContent=d;$("unitNOut").textContent=n;
  $("unitProblem").innerHTML=frac(n,d)+'<span>'+u.src+' = ? '+u.dst+'</span>';
  $("unitBar").innerHTML=strip(n,d);$("unitWhole").textContent="1 "+u.src+" = "+fmt(u.factor)+" "+u.dst;
  $("unitScaleEnd").textContent=fmt(u.factor)+" "+u.dst;
  $("unitReveal").innerHTML=unitMath(n,d,u.factor,u.dst);
  $("unitReveal").hidden=!unitOpen;$("unitShow").textContent=unitOpen?"Skrýt postup řešení":"Zobrazit postup řešení";
  if(resetAnswer){$("unitAnswer").value="";$("unitFeedback").textContent="";$("unitFeedback").className="feedback";}
}
$("unitD").addEventListener("input",()=>renderUnits());
$("unitN").addEventListener("input",()=>renderUnits());
document.querySelectorAll("[data-unit]").forEach(btn=>btn.addEventListener("click",()=>{selectedUnit=btn.dataset.unit;document.querySelectorAll("[data-unit]").forEach(b=>b.classList.toggle("is-selected",b===btn));unitOpen=false;renderUnits();}));
$("unitShow").addEventListener("click",()=>{unitOpen=!unitOpen;renderUnits(false);});
$("unitCheck").addEventListener("click",()=>{
  const raw=$("unitAnswer").value.trim().replace(",",".");
  const v=Number(raw),d=num("unitD"),n=num("unitN"),u=unitData[selectedUnit],answer=n*u.factor/d;
  if(raw===""||!Number.isFinite(v)){feedbackUnit("Zadej nejdřív číselný výsledek.",false);return;}
  if(Math.abs(v-answer)<=0.011){feedbackUnit("Správně. "+n+"/"+d+" z "+fmt(u.factor)+" "+u.dst+" je "+fmt(answer,2)+" "+u.dst+".",true);}
  else feedbackUnit("Zatím ne. Jeden celý "+u.name+" představuje "+fmt(u.factor)+" "+u.dst+". Nejprve zjisti jednu "+d+". část a pak ji vezmi "+n+"×.",false);
});
$("unitAnswer").addEventListener("keydown",e=>{if(e.key==="Enter")$("unitCheck").click();});
function feedbackUnit(msg,correct){$("unitFeedback").textContent=msg;$("unitFeedback").className="feedback "+(correct?"ok":"bad");}

// VI: Krátké úlohy zpracované konceptově, s vysvětlením po výběru.
const exercises=[
 {q:"Co vyjadřuje jmenovatel zlomku 3/7?",opts:["Počet vybraných dílů","Počet stejně velkých dílů celku","Velikost každého dílu v gramech","Počet celých částí"],correct:1,why:"Jmenovatel 7 rozděluje jeden celek na sedm stejně velkých částí. Čitatel 3 určuje, kolik jich bereme."},
 {q:"Který zlomek má stejnou hodnotu jako 2/3?",opts:["4/9","3/5","6/9","2/6"],correct:2,why:"Při rozšíření číslem 3 dostaneme 2·3 / (3·3) = 6/9. Hodnota je stále stejná."},
 {q:"Jaký je základní tvar zlomku 12/18?",opts:["3/6","2/3","6/9","4/9"],correct:1,why:"NSD(12,18) = 6. Oba členy vydělíme šesti: 12/18 = 2/3."},
 {q:"Kolik gramů představují 2/5 kilogramu?",opts:["250 g","200 g","500 g","400 g"],correct:3,why:"1 kg = 1000 g. Jedna pětina je 200 g, dvě pětiny jsou 400 g."}
];
let responses={};
function renderPractice(){
  $("practiceQuestions").innerHTML=exercises.map((e,i)=>{
    const answered=Object.prototype.hasOwnProperty.call(responses,i),selected=responses[i];
    return '<div class="question"><div class="question-count">'+String(i+1).padStart(2,"0")+'</div><div><div class="question-text">'+e.q+'</div><div class="choice-list">'+e.opts.map((o,j)=>'<button type="button" data-question="'+i+'" data-option="'+j+'" class="choice '+(answered&&j===e.correct?'correct':answered&&j===selected?'wrong':"")+'" '+(answered?'disabled':'')+'>'+o+'</button>').join('')+'</div>'+(answered?'<p class="answer-explain">'+(selected===e.correct?'✓ Správně. ':'Zkus se vrátit k příslušnému modelu. ')+e.why+'</p>':'')+'</div></div>';
  }).join("");
  $("practiceQuestions").querySelectorAll("button:not(:disabled)").forEach(b=>b.addEventListener("click",()=>{
    const i=Number(b.dataset.question);
    if(Object.prototype.hasOwnProperty.call(responses,i))return;
    responses[i]=Number(b.dataset.option);
    renderPractice();
  }));
  const total=Object.keys(responses).length;
  const score=exercises.reduce((s,e,i)=>s+(responses[i]===e.correct?1:0),0);
  $("practiceScore").textContent=score+" / "+exercises.length;
  $("practiceProgress").style.width=(100*total/exercises.length)+"%";
  $("practiceSummary").textContent=total===0?"Odpověz na čtyři otázky. Po každé se zobrazí vysvětlení.":total<exercises.length?"Vyhodnoceno "+total+" ze "+exercises.length+" otázek. Pokračuj dál.":score===exercises.length?"Výborně. Máš správně všechny čtyři principy.":score>=2?"Máš "+score+" ze čtyř. Vrať se k vysvětlení u chybných odpovědí.":"Vrať se k vizuálním modelům a vyzkoušej otázky znovu.";
}
$("practiceReset").addEventListener("click",()=>{responses={};renderPractice();});

// Aktivní kapitola v obsahu lekce; navigace zůstává běžnou kotvou.
if("IntersectionObserver" in window){
  const links=Array.from(document.querySelectorAll(".lesson-nav a"));
  const sections=Array.from(document.querySelectorAll("main section[id]"));
  const observer=new IntersectionObserver(entries=>{
    const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(active)links.forEach(a=>a.classList.toggle("current",a.getAttribute("href")==="#"+active.target.id));
  },{rootMargin:"-12% 0px -64% 0px",threshold:[0,.15,.4]});
  sections.forEach(s=>observer.observe(s));
}
renderMeaning();
renderEquivalence();
renderReduction();
renderComparison();
renderUnits();
renderPractice();
