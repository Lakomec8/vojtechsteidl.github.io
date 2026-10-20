"use strict";
(function(){
const $=id=>document.getElementById(id);
const EPS=1e-8;
const fmt=(v,d=2)=>Number(Math.abs(v)<EPS?0:v).toLocaleString("cs-CZ",{maximumFractionDigits:d});
const sgn=v=>v<0?"−"+fmt(-v):fmt(v);
const absMath=v=>"<mn>"+fmt(Math.abs(v))+"</mn>";
const numberMath=v=>(v<0?"<mo>−</mo>":"")+absMath(v);
const expr=(a,b,c,zero=false)=>{
 let terms="<mrow>";
 const coeff=(n,variable,first)=>{
  if(Math.abs(n)<EPS)return "";
  const sign=first?(n<0?"<mo>−</mo>":""):(n<0?"<mo>−</mo>":"<mo>+</mo>");
  const magnitude=Math.abs(n);
  return sign+(variable&&Math.abs(magnitude-1)<EPS?"":absMath(magnitude))+variable;
 };
 terms+=coeff(a,"<msup><mi>x</mi><mn>2</mn></msup>",true);
 terms+=coeff(b,"<mi>x</mi>",false);
 terms+=coeff(c,"",false);
 if(zero)terms+="<mo>=</mo><mn>0</mn>";
 return "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" aria-label=\""+(zero?"Kvadratická rovnice":"Kvadratická funkce")+"\"><mrow>"+(!zero?"<mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo>":"")+terms+"</mrow></mrow></math>";
};
const m=(html)=>"<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mrow>"+html+"</mrow></math>";
const value=(a,b,c,x)=>a*x*x+b*x+c;
const calc=(a,b,c)=>{const p=-b/(2*a),q=value(a,b,c,p),d=b*b-4*a*c;return{a,b,c,p,q,d,roots:d>EPS?[(-b-Math.sqrt(d))/(2*a),(-b+Math.sqrt(d))/(2*a)].sort((x,y)=>x-y):Math.abs(d)<=EPS?[p]:[]}};
const state={a:1,b:-2,c:-3,selected:0,parityB:2,discC:3,offset:-2,solver:0,step:0,quiz:0,answers:[],locked:false};
let lastChart=null;
const colours={ink:"#203e36",grid:"#e0eae2",axis:"#a6bcb0",green:"#277c6a",violet:"#9a7bb3",orange:"#ba7b4c",paper:"#fbfdfa"};
function context(id){
 const canvas=$(id);if(!canvas)return null;const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;if(w<10||h<10)return null;
 const dpr=Math.min(2,window.devicePixelRatio||1),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
 const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{canvas,ctx,w,h};
}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(Math.max(x,.0001)))),n=x/p;return(n<=1?1:n<=2?2:n<=5?5:10)*p}
function graphBase(id,xmin,xmax,ymin,ymax){
 const target=context(id);if(!target)return null;
 const {ctx,w,h}=target,margin={l:39,r:17,t:21,b:30},pw=w-margin.l-margin.r,ph=h-margin.t-margin.b;
 const X=x=>margin.l+(x-xmin)/(xmax-xmin)*pw,Y=y=>margin.t+(ymax-y)/(ymax-ymin)*ph;
 ctx.fillStyle=colours.paper;ctx.fillRect(0,0,w,h);
 const drawLine=(x1,y1,x2,y2,color=colours.grid,width=1,dash=[])=>{ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore()};
 const sx=niceStep((xmax-xmin)/9),sy=niceStep((ymax-ymin)/7);
 ctx.font="10px system-ui,sans-serif";ctx.fillStyle="#7c9687";
 for(let x=Math.ceil(xmin/sx)*sx;x<=xmax+EPS;x+=sx){const px=X(x);drawLine(px,margin.t,px,h-margin.b);if(Math.abs(x)<EPS||Math.abs(px-X(0))<17)continue;ctx.textAlign="center";ctx.fillText(sgn(x),px,Math.min(h-7,Math.max(margin.t+10,Y(0)+14)));}
 for(let y=Math.ceil(ymin/sy)*sy;y<=ymax+EPS;y+=sy){const py=Y(y);drawLine(margin.l,py,w-margin.r,py);if(Math.abs(y)<EPS)continue;ctx.textAlign="right";ctx.fillText(sgn(y),margin.l-7,py+4);}
 if(0>=xmin&&0<=xmax)drawLine(X(0),margin.t,X(0),h-margin.b,colours.axis,1.3);
 if(0>=ymin&&0<=ymax)drawLine(margin.l,Y(0),w-margin.r,Y(0),colours.axis,1.3);
 ctx.fillStyle="#56766a";ctx.font="12px Georgia,serif";ctx.textAlign="right";ctx.fillText("x",w-7,Math.min(h-10,Math.max(20,Y(0)-7)));ctx.textAlign="left";ctx.fillText("y",Math.max(43,Math.min(w-23,X(0)+9)),16);
 ctx.save();ctx.beginPath();ctx.rect(margin.l,margin.t,pw,ph);ctx.clip();
 return {...target,X,Y,margin,drawLine,finish:()=>ctx.restore(),xmin,xmax,ymin,ymax};
}
function path(g,fn,left,right,color=colours.green,lineWidth=3.1,dashed=false){
 const {ctx,X,Y}=g;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.lineCap="round";ctx.lineJoin="round";ctx.setLineDash(dashed?[6,5]:[]);ctx.beginPath();
 for(let i=0;i<=400;i++){const x=left+(right-left)*i/400;if(i===0)ctx.moveTo(X(x),Y(fn(x)));else ctx.lineTo(X(x),Y(fn(x)));}
 ctx.stroke();ctx.restore();
}
function mark(g,x,y,text,color=colours.green){
 if(x<g.xmin||x>g.xmax||y<g.ymin||y>g.ymax)return;
 const {ctx,X,Y}=g,px=X(x),py=Y(y);ctx.beginPath();ctx.arc(px,py,6.2,0,2*Math.PI);ctx.fillStyle="#fff";ctx.fill();ctx.beginPath();ctx.arc(px,py,4.2,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();
 if(text){ctx.font="700 11px system-ui,sans-serif";ctx.textAlign=px>g.w-108?"right":"left";ctx.fillStyle=color;ctx.fillText(text,px>g.w-108?px-10:px+10,py-10);}
}
function limit(v,a,b){return Math.max(a,Math.min(b,v))}
function mainGraph(){
 const {a,b,c}=state,r=calc(a,b,c),rootDistance=r.roots.reduce((z,x)=>Math.max(z,Math.abs(x-r.p)),0),half=limit(Math.max(4.3,rootDistance+1.15),4.3,8),xmin=r.p-half,xmax=r.p+half;
 const yleft=value(a,b,c,xmin),lo=Math.min(0,r.q,yleft),hi=Math.max(0,r.q,yleft),pad=Math.max(2,(hi-lo)*.13),g=graphBase("mainCanvas",xmin,xmax,lo-pad,hi+pad);if(!g)return;
 const {ctx,X,Y}=g;lastChart={X,Xmin:xmin,Xmax:xmax,margin:g.margin,w:g.w};
 if($("showSymmetry").checked)g.drawLine(X(r.p),g.margin.t,X(r.p),g.h-g.margin.b,colours.orange,1.5,[5,5]);
 path(g,x=>value(a,b,c,x),xmin,xmax);
 if($("showRoots").checked)r.roots.forEach((root,i)=>mark(g,root,0,r.roots.length===1?"x₀":"x"+(i+1),colours.orange));
 mark(g,r.p,r.q,"V ["+fmt(r.p)+"; "+fmt(r.q)+"]",colours.orange);
 const sel=limit(state.selected,xmin,xmax);mark(g,sel,value(a,b,c,sel),null,colours.violet);
 g.finish();
}
function showMain(){
 const {a,b,c}=state,r=calc(a,b,c);
 $("mainFormula").innerHTML=expr(a,b,c,false);
 $("openUp").setAttribute("aria-pressed",String(a>0));$("openDown").setAttribute("aria-pressed",String(a<0));
 $("aMagnitude").value=String(Math.abs(a));$("aOut").textContent=fmt(Math.abs(a));
 $("bValue").value=String(b);$("bOut").textContent=sgn(b);
 $("cValue").value=String(c);$("cOut").textContent=sgn(c);
 $("vertexStat").textContent="["+fmt(r.p)+"; "+fmt(r.q)+"]";
 $("axisStat").textContent="x = "+fmt(r.p);
 $("rootsStat").textContent=r.roots.length===0?"Žádný v ℝ":r.roots.map(x=>fmt(x)).join(" ; ");
 $("pointStat").textContent="["+fmt(state.selected)+"; "+fmt(value(a,b,c,state.selected))+"]";
 $("coefficientInsight").textContent="Protože a "+(a>0?"> 0, ramena směřují nahoru a vrchol je minimum.":"< 0, ramena směřují dolů a vrchol je maximum.")+" Osa souměrnosti je x = "+fmt(r.p)+", diskriminant Δ = "+fmt(r.d)+".";
 mainGraph();showProperties();
}
function showProperties(){
 const {a,b,c}=state,r=calc(a,b,c),up=a>0,p=fmt(r.p),q=fmt(r.q);
 $("vertexForm").innerHTML=m("<mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo>"+numberMath(a)+"<msup><mrow><mo>(</mo><mi>x</mi>"+(r.p<0?"<mo>+</mo>":"<mo>−</mo>")+absMath(r.p)+"<mo>)</mo></mrow><mn>2</mn></msup>"+(r.q<0?"<mo>−</mo>":"<mo>+</mo>")+absMath(r.q));
 $("vertexExplanation").textContent="Dosazením p = −b/(2a) = "+p+" vyjde q = f(p) = "+q+". Osa souměrnosti: x = "+p+". Obor hodnot: "+(up?"⟨"+q+"; +∞)":"(−∞; "+q+"⟩")+".";
 $("monoIntervals").textContent=up?"Klesá: (−∞; "+p+"⟩. Roste: ⟨"+p+"; +∞).":"Roste: (−∞; "+p+"⟩. Klesá: ⟨"+p+"; +∞).";
 $("boundStat").textContent=up?"Zdola omezená, globální minimum "+q:"Shora omezená, globální maximum "+q;
 $("boundExplanation").textContent=up?"f(x) ≥ "+q+" pro každé x ∈ ℝ. Není shora omezená.":"f(x) ≤ "+q+" pro každé x ∈ ℝ. Není zdola omezená.";
 showMono();
}
function showMono(){
 const {a,b,c}=state,r=calc(a,b,c),p=r.p,span=4.5,edge=value(a,b,c,p+span),lo=Math.min(0,r.q,edge)-2,hi=Math.max(0,r.q,edge)+2,g=graphBase("monoCanvas",p-span,p+span,lo,hi);
 if(g){
  g.drawLine(g.X(p),g.margin.t,g.X(p),g.h-g.margin.b,colours.orange,1.4,[4,5]);
  path(g,x=>value(a,b,c,x),p-span,p,a>0?colours.orange:colours.green,3.4);
  path(g,x=>value(a,b,c,x),p,p+span,a>0?colours.green:colours.orange,3.4);
  mark(g,p,r.q,"V",colours.orange);
  const x=p+state.offset;mark(g,x,value(a,b,c,x),"P",colours.violet);g.finish();
 }
 $("offsetOut").textContent=sgn(state.offset);
 $("monoPoint").textContent="P = ["+fmt(p+state.offset)+"; "+fmt(value(a,b,c,p+state.offset))+"]";
 $("monoAnalysis").textContent=Math.abs(state.offset)<EPS?"Právě jsi ve vrcholu. Derivace zde je 0 a funkce mění monotónnost.":(a*state.offset>0?"Pohybuješ se po rostoucí větvi.":"Pohybuješ se po klesající větvi.")+" Pro x v tomto místě má derivace znaménko "+(a*state.offset>0?"+":"−")+" (f′(x) = 2ax + b).";
}
function showParity(){
 const b=state.parityB,a=1,c=1,lo=Math.min(-5,-b*b/4-2),hi=27, g=graphBase("parityCanvas",-4.5,4.5,lo,hi);
 if(g){
  path(g,x=>value(a,b,c,x),-4.5,4.5,colours.green,3);
  path(g,x=>value(a,b,c,-x),-4.5,4.5,colours.violet,2.6,true);
  mark(g,-b/2,value(a,b,c,-b/2),null,colours.orange);
  g.finish();
 }
 $("parityBOut").textContent=sgn(b);$("parityEquation").innerHTML=expr(1,b,1);
 const f2=value(1,b,1,2),fm2=value(1,b,1,-2);
 $("parityResult").innerHTML=(Math.abs(b)<EPS?"<strong>ANO, JE SUDÁ.</strong> Obě křivky se překryly.":"<strong>NENÍ SUDÁ ANI LICHÁ.</strong> Křivky se nepřekrývají.")+"<br>f(2) = "+sgn(f2)+", f(−2) = "+sgn(fm2)+". "+(b===0?"Platí f(−x) = f(x).":"Tyto hodnoty se liší. Osa souměrnosti je x = "+fmt(-b/2)+".");
}
function showDiscriminant(){
 const c=state.discC,a=1,b=-4,r=calc(a,b,c),xmin=-2,xmax=6,lo=Math.min(-7,r.q-2),hi=Math.max(17,c+15),g=graphBase("discCanvas",xmin,xmax,lo,hi);
 if(g){g.drawLine(g.X(2),g.margin.t,g.X(2),g.h-g.margin.b,colours.orange,1.3,[5,6]);path(g,x=>value(a,b,c,x),xmin,xmax,colours.green,3.3);mark(g,2,r.q,"V",colours.orange);r.roots.forEach((x,i)=>mark(g,x,0,r.roots.length===1?"dvojnásobný":("x"+(i+1)),colours.violet));g.finish();}
 $("discCOut").textContent=fmt(c);$("discFormula").innerHTML=expr(a,b,c);
 $("discValue").textContent=sgn(r.d);
 $("discMessage").innerHTML=r.d>EPS?"<strong>Δ > 0</strong> · Graf protíná osu x ve dvou bodech. Kořeny: "+r.roots.map(x=>fmt(x)).join(" a ")+".":r.d<-EPS?"<strong>Δ < 0</strong> · Celá parabola leží nad osou x. Žádný reálný kořen.":"<strong>Δ = 0</strong> · Vrchol právě leží na ose x. Jediný dvojnásobný kořen: x = 2.";
}
const equations=[
 {a:1,b:-4,c:3,reason:"Dva různé reálné průsečíky s osou x."},
 {a:1,b:-4,c:4,reason:"Parabola se osy x jen dotýká ve vrcholu."},
 {a:1,b:0,c:4,reason:"Parabola leží celá nad osou x."},
 {a:1,b:0,c:-9,reason:"Neúplná kvadratická rovnice: můžeš také upravit x² = 9."}
];
function showSolver(){
 const e=equations[state.solver],r=calc(e.a,e.b,e.c);
 document.querySelectorAll("[data-equation]").forEach(el=>el.classList.toggle("selected",Number(el.dataset.equation)===state.solver));
 $("solverEquation").innerHTML=expr(e.a,e.b,e.c,true);
 const s=[
  {tag:"01 / IDENTIFIKACE",html:m("<mi>a</mi><mo>=</mo>"+numberMath(e.a)+"<mo>,</mo><mspace width=\".7em\"/><mi>b</mi><mo>=</mo>"+numberMath(e.b)+"<mo>,</mo><mspace width=\".7em\"/><mi>c</mi><mo>=</mo>"+numberMath(e.c)),desc:"Nejprve uprav rovnici tak, aby na pravé straně byla nula."},
  {tag:"02 / DISKRIMINANT",html:m("<mi>Δ</mi><mo>=</mo><msup><mrow><mo>(</mo>"+numberMath(e.b)+"<mo>)</mo></mrow><mn>2</mn></msup><mo>−</mo><mn>4</mn><mo>⋅</mo>"+numberMath(e.a)+"<mo>⋅</mo>"+numberMath(e.c)+"<mo>=</mo>"+numberMath(r.d)),desc:"Spočítáme Δ = b² − 4ac. Znaménko určí počet reálných řešení."},
  {tag:"03 / INTERPRETACE",html:m("<mi>Δ</mi><mo>"+(r.d>EPS?">":r.d<-EPS?"<":"=")+"</mo><mn>0</mn>"),desc:r.reason||e.reason},
  {tag:"04 / KOŘENY",html:r.roots.length?m("<msub><mi>x</mi><mrow><mn>1</mn><mo>,</mo><mn>2</mn></mrow></msub><mo>=</mo><mfrac><mrow><mo>−</mo><mo>(</mo>"+numberMath(e.b)+"<mo>)</mo><mo>±</mo><msqrt>"+numberMath(r.d)+"</msqrt></mrow><mrow><mn>2</mn><mo>⋅</mo>"+numberMath(e.a)+"</mrow></mfrac>"):m("<mi>K</mi><mo>=</mo><mo>∅</mo>"),desc:r.roots.length===0?"V reálných číslech není možné odmocnit záporné Δ.":r.roots.length===1?"Protože Δ = 0, oba formální kořeny splývají.":"Dosadíme vypočtené Δ do vzorce pro kořeny."},
  {tag:"05 / VÝSLEDEK",html:r.roots.length?m("<mi>K</mi><mo>=</mo><mo>{</mo>"+r.roots.map((x,i)=>numberMath(x)).join("<mo>;</mo>")+"<mo>}</mo>"):m("<mi>K</mi><mo>=</mo><mo>∅</mo>"),desc:r.roots.length?"Zkouška dosazením: "+r.roots.map(x=>"f("+fmt(x)+") = "+fmt(value(e.a,e.b,e.c,x))).join("; ")+".": "V oboru reálných čísel nemá rovnice řešení. Poznámka: v komplexních číslech řešení existují."}
 ];
 $("solverSteps").innerHTML=s.slice(0,state.step).map(x=>'<div class="solve-step"><small>'+x.tag+'</small><div class="step-math">'+x.html+'</div><p>'+x.desc+'</p></div>').join("");
 $("nextStep").disabled=state.step>=s.length;$("nextStep").textContent=state.step===s.length?"Všechny kroky zobrazeny":"Zobrazit další krok →";
}
const questions=[
 {q:"Pro funkci f(x) = x² − 6x + 5 je osa souměrnosti…",a:["x = −3","x = 3","x = 6","x = 0"],correct:1,why:"p = −b/(2a) = 6/2 = 3. Osa symetrie prochází vrcholem."},
 {q:"Funkce f(x) = −2(x − 1)² + 7 má…",a:["globální minimum 7","globální maximum 7","globální maximum 1","žádný extrém"],correct:1,why:"a = −2 < 0: parabola je otevřená dolů. Vrchol [1;7] je maximum."},
 {q:"Je-li a > 0 a vrchol má x-ovou souřadnici p, funkce na intervalu (−∞; p⟩…",a:["roste","klesá","je konstantní","není spojitá"],correct:1,why:"Na levé větvi paraboly otevřené nahoru hodnoty při pohybu doprava klesají."},
 {q:"Která kvadratická funkce je sudá na ℝ?",a:["2x² − 5","x² + 2x","3x² − x + 4","−x² + x"],correct:0,why:"Sudost f(−x) = f(x) u kvadratického polynomu nastává právě při b = 0."},
 {q:"Kolik reálných kořenů má x² + 4 = 0?",a:["dva","jeden","žádný","nekonečně mnoho"],correct:2,why:"Δ = −16 < 0. Navíc x² ≥ 0, tedy x² + 4 je vždy kladné."},
 {q:"Při Δ = 0 má kvadratická rovnice v ℝ…",a:["dva různé kořeny","jeden dvojnásobný kořen","žádný kořen","vždy kořen 0"],correct:1,why:"Graf se dotýká osy x právě ve vrcholu. Kořen je −b/(2a)."},
 {q:"Které tvrzení platí o f(x) = x² + 2x + 1?",a:["je shora omezená","není spojitá","je zdola omezená","je lichá"],correct:2,why:"f(x) = (x + 1)² ≥ 0. Má minimum 0 v x = −1, shora omezená není."},
 {q:"Může být skutečná kvadratická funkce f(x) = ax² + bx + c, a ≠ 0, na celém ℝ lichá?",a:["ano, když c = 0","ano, když b = 0","ano, když a < 0","ne, nikdy"],correct:3,why:"Pro lichost by se člen ax² při dosazení −x musel změnit ve svůj opak, což pro a ≠ 0 není možné."}
];
function showQuiz(){
 const i=state.quiz,n=questions.length;
 $("quizBar").style.width=(100*i/n)+"%";
 $("quizCounter").textContent=i<n?"Otázka "+(i+1)+" z "+n:"Hotovo · "+n+" otázek";
 $("quizScore").textContent="Správně "+state.answers.filter(x=>x.correct).length+" / "+state.answers.length;
 $("quizNext").disabled=!state.locked;
 $("quizNext").textContent=i===n-1?"Zobrazit výsledek →":"Další otázka →";
 if(i>=n){$("quizBar").style.width="100%";$("quizMount").innerHTML='<div class="quiz-complete"><h3>Výsledek: '+state.answers.filter(x=>x.correct).length+' z '+n+'</h3><p>'+(state.answers.every(x=>x.correct)?"Všechny principy zvládnuté. Zkus vysvětlit jeden graf bez vzorců.":"Vrať se ke kapitolám, v nichž jsi chyboval(a), a zkus experiment změnit.")+'</p></div>';$("quizNext").disabled=true;return;}
 const q=questions[i];
 $("quizMount").innerHTML='<h3>'+q.q+'</h3><div class="quiz-options">'+q.a.map((label,k)=>'<button type="button" data-answer="'+k+'">'+String.fromCharCode(65+k)+'. '+label+'</button>').join("")+'</div><div class="quiz-feedback" id="quizFeedback" role="status"></div>';
 document.querySelectorAll("[data-answer]").forEach(el=>el.addEventListener("click",()=>chooseAnswer(Number(el.dataset.answer))));
 if(state.locked){const old=state.answers[i];document.querySelectorAll("[data-answer]").forEach(el=>{el.disabled=true;const k=Number(el.dataset.answer);if(k===q.correct)el.classList.add("correct");else if(k===old.answer)el.classList.add("incorrect");});$("quizFeedback").textContent=(old.correct?"Správně. ":"Zatím ne. Správně je "+q.a[q.correct]+". ")+q.why;}
}
function chooseAnswer(answer){
 if(state.locked)return;const q=questions[state.quiz];state.locked=true;state.answers.push({answer,correct:answer===q.correct});showQuiz();
}
function setPreset(a,b,c){state.a=a;state.b=b;state.c=c;state.selected=-b/(2*a);showMain();}
$("aMagnitude").addEventListener("input",e=>{state.a=Math.sign(state.a)*Number(e.target.value);showMain()});
$("bValue").addEventListener("input",e=>{state.b=Number(e.target.value);showMain()});
$("cValue").addEventListener("input",e=>{state.c=Number(e.target.value);showMain()});
$("openUp").addEventListener("click",()=>{state.a=Math.abs(state.a);showMain()});
$("openDown").addEventListener("click",()=>{state.a=-Math.abs(state.a);showMain()});
$("showSymmetry").addEventListener("change",mainGraph);
$("showRoots").addEventListener("change",mainGraph);
$("mainReset").addEventListener("click",()=>setPreset(1,-2,-3));
document.querySelectorAll("[data-preset]").forEach(el=>el.addEventListener("click",()=>{const p=el.dataset.preset;const cases={normal:[1,-2,-3],even:[1,0,-4],down:[-1,2,3],none:[1,0,3]};setPreset(...cases[p]);}));
$("mainCanvas").addEventListener("click",e=>{if(!lastChart)return;const rect=e.currentTarget.getBoundingClientRect(),px=e.clientX-rect.left,m=lastChart.margin,inner=lastChart.w-m.l-m.r;state.selected=limit(lastChart.Xmin+(px-m.l)/inner*(lastChart.Xmax-lastChart.Xmin),lastChart.Xmin,lastChart.Xmax);showMain()});
$("offset").addEventListener("input",e=>{state.offset=Number(e.target.value);showMono()});
$("parityB").addEventListener("input",e=>{state.parityB=Number(e.target.value);showParity()});
$("parityZero").addEventListener("click",()=>{state.parityB=0;$("parityB").value=0;showParity()});
$("discC").addEventListener("input",e=>{state.discC=Number(e.target.value);showDiscriminant()});
$("discTangent").addEventListener("click",()=>{state.discC=4;$("discC").value=4;showDiscriminant()});
document.querySelectorAll("[data-equation]").forEach(el=>el.addEventListener("click",()=>{state.solver=Number(el.dataset.equation);state.step=0;showSolver()}));
$("nextStep").addEventListener("click",()=>{state.step=Math.min(5,state.step+1);showSolver()});
$("restartSteps").addEventListener("click",()=>{state.step=0;showSolver()});
$("quizNext").addEventListener("click",()=>{if(!state.locked)return;state.quiz++;state.locked=false;showQuiz()});
$("quizRestart").addEventListener("click",()=>{state.quiz=0;state.locked=false;state.answers=[];showQuiz()});
function redraw(){showMain();showParity();showDiscriminant();}
if(typeof ResizeObserver!=="undefined"){const ro=new ResizeObserver(()=>{mainGraph();showMono();showParity();showDiscriminant()});["mainCanvas","monoCanvas","parityCanvas","discCanvas"].forEach(id=>ro.observe($(id)))}else window.addEventListener("resize",redraw);
if(typeof IntersectionObserver!=="undefined"){const links=[...document.querySelectorAll(".rail nav a")];const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(a=>a.classList.toggle("active",a.hash==="#"+entry.target.id));}})},{rootMargin:"-14% 0px -68% 0px"});document.querySelectorAll("main section[id]").forEach(el=>io.observe(el));}
showMain();showParity();showDiscriminant();showSolver();showQuiz();
})();
