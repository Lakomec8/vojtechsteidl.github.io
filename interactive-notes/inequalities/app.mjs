"use strict";
import {intervalFromBounds,intersection,union,notation,linear,quadratic,rational,system,belongs,relation,endpoint} from "./math.mjs";
const $=id=>document.getElementById(id);
const read=id=>Number($(id).value);
const fmt=n=>endpoint(n);
const sym=op=>({"<":"&lt;",">":"&gt;","≤":"≤","≥":"≥"})[op]||op;
const EPS=1e-9;
const close=(a,b)=>Math.abs(a-b)<EPS;
const math=inside=>'<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow>'+inside+'</mrow></math>';
const mn=n=>(n<0?'<mo>−</mo>':'')+'<mn>'+fmt(Math.abs(n))+'</mn>';
const term=(v,x,first=false)=>{
 if(v===0)return "";
 return(first?(v<0?"<mo>−</mo>":""):(v<0?"<mo>−</mo>":"<mo>+</mo>"))
   +(x&&Math.abs(v)===1?"":'<mn>'+fmt(Math.abs(v))+'</mn>')+(x?'<mi>'+x+'</mi>':"");
};
const inequality=(a,b,op)=>math(term(a,"x",true)+term(b,"",false)+'<mo>'+sym(op)+'</mo><mn>0</mn>');
const state={
 linearA:-2,linearB:4,linearOp:">",previousLinear:-2,
 iLower:-2,iUpper:3,iLi:true,iRi:false,
 aLo:-3,aHi:2,aLi:true,aRi:true,bLo:1,bHi:5,bLi:false,bRi:true,
 productR1:-3,productR2:2,productA:1,productOp:"≤",
 rationalU:-2,rationalV:2,rationalOp:"≥",
 solver:0,step:0,track:"basic",quiz:0,answers:[],locked:false
};
const COLOR={axis:"#a7bfb1",muted:"#738d7d",grid:"#e2ebe3",background:"#fcfefa",green:"#267963",violet:"#8575aa",orange:"#c08057",ink:"#32594b",disabled:"#c3d1c8"};
function canvas(id){
 const e=$(id);if(!e)return null;
 const r=e.getBoundingClientRect(),w=r.width,h=r.height;if(w<5||h<5)return null;
 const dpr=Math.min(2,window.devicePixelRatio||1);
 const pw=Math.round(w*dpr),ph=Math.round(h*dpr);
 if(e.width!==pw||e.height!==ph){e.width=pw;e.height=ph;}
 const ctx=e.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 ctx.fillStyle=COLOR.background;ctx.fillRect(0,0,w,h);
 return {ctx,w,h};
}
function line(ctx,x1,y1,x2,y2,color=COLOR.axis,width=1,dash=[]){
 ctx.save();ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
}
function dot(ctx,x,y,color=COLOR.green,closed=true,r=5.6){
 ctx.beginPath();ctx.arc(x,y,r+1.8,0,2*Math.PI);ctx.fillStyle=COLOR.background;ctx.fill();
 ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fillStyle=closed?color:"#fffefa";ctx.fill();
 ctx.strokeStyle=color;ctx.lineWidth=2.6;ctx.stroke();
}
function label(ctx,text,x,y,color=COLOR.muted,align="center",size=11){
 ctx.save();ctx.fillStyle=color;ctx.font="600 "+size+"px system-ui,sans-serif";ctx.textAlign=align;ctx.fillText(String(text),x,y);ctx.restore();
}
function axis(ctx,w,y,xmin=-7,xmax=7){
 const L=31,R=w-27,X=x=>L+(x-xmin)/(xmax-xmin)*(R-L);
 line(ctx,L,y,R,y,COLOR.axis,1.7);
 for(let n=Math.ceil(xmin);n<=Math.floor(xmax);n++){
   const x=X(n);line(ctx,x,y-4,x,y+4,COLOR.axis,1.1);
   if(n%2===0)label(ctx,fmt(n),x,y+19,COLOR.muted,"center",10);
 }
 label(ctx,"x",w-8,y-8,COLOR.ink,"right",13);
 return X;
}
function drawRegion(ctx,X,y,part,color=COLOR.green){
 if(!part)return;
 const lo=part.lo===-Infinity?-7:part.lo,hi=part.hi===Infinity?7:part.hi;
 const x1=X(Math.max(-7,lo)),x2=X(Math.min(7,hi));
 if(x2<x1-0.1)return;
 if(Math.abs(x1-x2)>0.1){line(ctx,x1,y,x2,y,color,6);if(part.lo===-Infinity)arrow(ctx,x1,y,-1,color);if(part.hi===Infinity)arrow(ctx,x2,y,1,color);}
 if(Number.isFinite(part.lo)&&part.lo>=-7&&part.lo<=7)dot(ctx,X(part.lo),y,color,part.li);
 if(Number.isFinite(part.hi)&&part.hi>=-7&&part.hi<=7&&!close(part.lo,part.hi))dot(ctx,X(part.hi),y,color,part.ri);
 if(Number.isFinite(part.lo)&&close(part.lo,part.hi))dot(ctx,X(part.lo),y,color,true);
}
function arrow(ctx,x,y,dir,color){
 ctx.save();ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.moveTo(x-dir*8,y-6);ctx.lineTo(x,y);ctx.lineTo(x-dir*8,y+6);ctx.stroke();ctx.restore();
}
function axisSet(ctx,w,y,parts,color,title){
 if(title)label(ctx,title,37,y-16,color,"left",11);
 const X=axis(ctx,w,y);
 parts.forEach(p=>drawRegion(ctx,X,y,p,color));
 return X;
}
function zeroPoint(p,all){if(Number.isFinite(p)&&p>=-7&&p<=7)all(p);}
function renderLinear(){
 const a=state.linearA,b=state.linearB,op=state.linearOp;
 const res=linear(a,b,op),x0=res.root,flipped=a<0;
 $("linearA").value=a;$("linearB").value=b;$("linearAOut").textContent=fmt(a);$("linearBOut").textContent=fmt(b);
 $("linearFormula").innerHTML=inequality(a,b,op);
 document.querySelectorAll("[data-linear-op]").forEach(e=>e.setAttribute("aria-pressed",String(e.dataset.linearOp===op)));
 const reducedOp=flipped?({">":"<","≥":"≤","<":">","≤":"≥"})[op]:op;
 $("linearAnswer").textContent="x "+reducedOp+" "+fmt(x0)+"    →    "+notation(res.parts);
 $("linearExplain").textContent=(flipped?"Dělíme záporným "+fmt(a)+" — znaménko musíme obrátit.":"Dělíme kladným "+fmt(a)+" — znaménko zachováme.")+" Hraniční bod x = "+fmt(x0)+(op==="≥"||op==="≤"?" patří":" nepatří")+" do řešení.";
 $("linearInsight").textContent="Kořen funkce ax + b je "+fmt(x0)+". Hledáme části osy, pro něž přímka leží "+(op===">"||op==="≥"?"nad":"pod")+" osou x."+(a<0?" Záporný sklon přímky vysvětluje obrácení znaménka.":"");
 const g=canvas("linearCanvas");if(!g)return;
 const {ctx,w,h}=g,L=42,R=w-19,top=28,bottom=h-82,X=x=>L+(x+7)/14*(R-L);
 const y0=a*(-7)+b,y1=a*7+b,range=Math.max(5,Math.abs(y0),Math.abs(y1));const Y=y=>top+(range-y)/(2*range)*(bottom-top);
 for(let yy=Math.ceil(-range/5)*5;yy<=range;yy+=5)line(ctx,L,Y(yy),R,Y(yy),COLOR.grid);
 line(ctx,L,Y(0),R,Y(0),COLOR.axis,1.4);
 const ox=X(0);line(ctx,ox,top,ox,bottom,COLOR.axis,1);
 label(ctx,"y = ax + b",L+5,top+4,COLOR.muted,"left");
 label(ctx,"0",ox+7,Y(0)-5);
 ctx.save();ctx.beginPath();ctx.rect(L,top,R-L,bottom-top);ctx.clip();
 line(ctx,X(-7),Y(y0),X(7),Y(y1),COLOR.violet,3.5);ctx.restore();
 if(x0>=-7&&x0<=7)dot(ctx,X(x0),Y(0),COLOR.orange,true);
 axisSet(ctx,w,h-42,res.parts,COLOR.green,"ŘEŠENÍ NEROVNICE");
}
function rawInterval(prefix){return intervalFromBounds(state[prefix+"Lo"]??state.iLower,state[prefix+"Hi"]??state.iUpper,state[prefix+"Li"]??state.iLi,state[prefix+"Ri"]??state.iRi)}
function renderInterval(){
 const {iLower:lo,iUpper:hi,iLi:li,iRi:ri}=state,p=intervalFromBounds(lo,hi,li,ri),parts=p?[p]:[];
 $("iLowerOut").textContent=fmt(lo);$("iUpperOut").textContent=fmt(hi);
 $("iLower").value=lo;$("iUpper").value=hi;
 $("iLeftClosed").checked=li;$("iRightClosed").checked=ri;
 $("intervalAnswer").textContent="I = "+notation(parts);
 $("intervalInsight").textContent=lo>hi?"Levá hranice leží napravo od pravé. Žádné číslo nemůže splňovat obě podmínky.":lo===hi?(li&&ri?"Obě meze splývají a jsou zahrnuté: vzniká množina s jediným bodem.":"Meze splývají, ale alespoň jedna je ostrá. Takový interval je prázdný."):"Levá mez je "+(li?"zahrnutá":"vyloučená")+", pravá mez "+(ri?"zahrnutá":"vyloučená")+".";
 const g=canvas("intervalCanvas");if(!g)return;
 label(g.ctx,"PROSVÍCENÉ BODY PATŘÍ DO INTERVALU",g.w/2,35,COLOR.muted);
 axisSet(g.ctx,g.w,Math.round(g.h*.55),parts,COLOR.green);
}
function renderSystem(){
 const A=rawInterval("a"),B=rawInterval("b"),z=system(A,B);
 for(const key of ["aLo","aHi","bLo","bHi"]) {$(key).value=state[key];$(key+"Out").textContent=fmt(state[key]);}
 for(const key of ["aLi","aRi","bLi","bRi"])$(key).checked=state[key];
 $("systemA").textContent=notation(A?[A]:[]);
 $("systemB").textContent=notation(B?[B]:[]);
 $("systemIntersection").textContent=notation(z.parts);
 $("systemUnion").textContent=notation(z.union);
 $("systemInsight").textContent=z.parts.length===0?"Průnik je ∅: žádné číslo nesplňuje obě podmínky zároveň.":z.parts[0].lo===z.parts[0].hi?"Oba intervaly sdílejí právě jeden zahrnutý bod. Výsledek je jednoprvková množina.":"Průnik tvoří společná oblast obou intervalů. Všimni si, jestli se hraniční body zahrnou do obou.";
 const g=canvas("systemCanvas");if(!g)return;
 const y1=g.h*.22,y2=g.h*.49,y3=g.h*.77;
 axisSet(g.ctx,g.w,y1,A?[A]:[],COLOR.green,"PODMÍNKA A");
 axisSet(g.ctx,g.w,y2,B?[B]:[],COLOR.violet,"PODMÍNKA B");
 line(g.ctx,28,(y2+y3)/2,g.w-27,(y2+y3)/2,COLOR.grid,1);
 axisSet(g.ctx,g.w,y3,z.parts,COLOR.orange,"A ∩ B · SPOLEČNÉ ŘEŠENÍ");
}
function signTable(critical,fn,poles=[],rowsLabel="Znaménko"){
 const cuts=[...new Set(critical)].sort((a,b)=>a-b),ends=[-Infinity,...cuts,Infinity];
 const test=[];for(let i=0;i<ends.length-1;i++){
  const lo=ends[i],hi=ends[i+1],x=lo===-Infinity?hi-2:hi===Infinity?lo+2:(lo+hi)/2;
  const y=fn(x),isPos=y>EPS;
  test.push({x,y,sign:isPos?"+":y<-EPS?"−":"0"});
 }
 const headers=[];
 test.forEach((t,i)=>{headers.push("<th>"+(i===0?"(−∞; "+fmt(cuts[0]??"")+ ")":i===test.length-1?"("+fmt(cuts.at(-1)??"")+"; +∞)":"("+fmt(cuts[i-1])+"; "+fmt(cuts[i])+")")+"</th>");if(i<cuts.length)headers.push("<th class=\"border-col\">"+fmt(cuts[i])+"</th>")});
 const values=[];
 test.forEach((t,i)=>{values.push('<td class="'+(t.sign==="+"?"pos":t.sign==="−"?"neg":"zero")+'">'+t.sign+"</td>");if(i<cuts.length)values.push(poles.some(p=>close(p,cuts[i]))?'<td class="excluded">nedef.</td>':'<td class="zero">0</td>')});
 return '<table class="sign-table"><thead><tr><th>x</th>'+headers.join("")+'</tr></thead><tbody><tr><th>'+rowsLabel+'</th>'+values.join("")+'</tr></tbody></table>';
}
function productFormula(a,r1,r2,op){
 const factor=r=>'<mrow><mo>(</mo><mi>x</mi><mo>'+(r<0?"+":"−")+'</mo><mn>'+fmt(Math.abs(r))+'</mn><mo>)</mo></mrow>';
 return math((a<0?"<mo>−</mo>":"")+factor(r1)+factor(r2)+"<mo>"+sym(op)+"</mo><mn>0</mn>");
}
function renderProduct(){
 const {productR1:r1,productR2:r2,productA:a,productOp:op}=state,r=quadratic(a,r1,r2,op);
 $("pRoot1").value=r1;$("pRoot2").value=r2;$("pRoot1Out").textContent=fmt(r1);$("pRoot2Out").textContent=fmt(r2);
 $("productFormula").innerHTML=productFormula(a,r1,r2,op);
 $("productAnswer").textContent="K = "+notation(r.parts);
 $("productInsight").textContent=close(r1,r2)?"Dvojnásobný kořen: znaménko se v kořeni neobrací. "+(op==="≤"||op==="≥"?"Rovnost může kořen zahrnout.":"Ostrá nerovnost kořen vylučuje."):"Jednoduché kořeny rozdělují osu na tři části. Každý průchod kořenem změní znaménko součinu.";
 document.querySelectorAll("[data-product-op]").forEach(el=>el.setAttribute("aria-pressed",String(el.dataset.productOp===op)));
 document.querySelectorAll("[data-leading]").forEach(el=>el.setAttribute("aria-pressed",String(Number(el.dataset.leading)===a)));
 const fn=x=>a*(x-r1)*(x-r2),roots=r.roots;
 $("productSignTable").innerHTML=signTable(roots,fn,[],"Součin");
 const g=canvas("productCanvas");if(g){axisSet(g.ctx,g.w,g.h*.50,r.parts,COLOR.green,"ŘEŠENÍ SOUČINOVÉ NEROVNICE"); roots.forEach(x=>label(g.ctx,"r = "+fmt(x),axis(g.ctx,g.w,g.h*.50)(x),g.h*.28,COLOR.orange));}
 renderQuadratic();
}
function renderRational(){
 const {rationalU:u,rationalV:v,rationalOp:op}=state,r=rational(u,v,op);
 $("rNumerator").value=u;$("rDenominator").value=v;
 $("rNumeratorOut").textContent=fmt(u);$("rDenominatorOut").textContent=fmt(v);
 const factor=t=>"<mrow><mi>x</mi><mo>"+(t<0?"+":"−")+"</mo><mn>"+fmt(Math.abs(t))+"</mn></mrow>";
 $("rationalFormula").innerHTML=math("<mfrac>"+factor(u)+factor(v)+"</mfrac><mo>"+sym(op)+"</mo><mn>0</mn>");
 $("rationalAnswer").textContent="K = "+notation(r.parts);
 $("rationalInsight").textContent=close(u,v)?"Čitatel i jmenovatel mají stejný činitel. Pro x ≠ "+fmt(v)+" je zlomek roven 1. Hodnota x = "+fmt(v)+" ale zůstává zakázaná.":"Bod "+fmt(u)+" nuluje čitatele, bod "+fmt(v)+" jmenovatele. Bod jmenovatele nikdy nesmíš zahrnout; bod čitatele zahrneš jen u neostré nerovnosti.";
 document.querySelectorAll("[data-rational-op]").forEach(el=>el.setAttribute("aria-pressed",String(el.dataset.rationalOp===op)));
 const fn=x=>close(u,v)?1:(x-u)/(x-v),cuts=[...new Set([u,v])].sort((a,b)=>a-b);
 $("rationalSignTable").innerHTML=signTable(cuts,fn,[v],"Zlomek");
 const g=canvas("rationalCanvas");if(g){
  const X=axisSet(g.ctx,g.w,g.h*.54,r.parts,COLOR.green,"PŘÍPUSTNÉ HODNOTY");
  label(g.ctx,"× zakázáno",X(v),g.h*.29,COLOR.orange);
  label(g.ctx,"○ nulový bod",X(u),g.h*.80,COLOR.violet);
 }
}
function renderQuadratic(){
 const {productR1:r1,productR2:r2,productA:a,productOp:op}=state,r=quadratic(a,r1,r2,op);
 $("quadFormula").innerHTML=productFormula(a,r1,r2,op);
 $("quadAnswer").textContent="K = "+notation(r.parts);
 $("quadInsight").textContent=a>0?"Ramena paraboly směřují nahoru.":"Ramena paraboly směřují dolů.";
 const g=canvas("quadraticCanvas");if(!g)return;
 const {ctx,w,h}=g,L=35,R=w-17,T=26,B=h-43,xmin=-7,xmax=7,X=x=>L+(x-xmin)/(xmax-xmin)*(R-L),fn=x=>a*(x-r1)*(x-r2);
 const samples=Array.from({length:301},(_,i)=>fn(xmin+(xmax-xmin)*i/300));
 const min=Math.min(0,...samples),max=Math.max(0,...samples),span=Math.max(5,max-min),low=min-.13*span,high=max+.13*span;
 const Y=y=>T+(high-y)/(high-low)*(B-T);
 for(let n=-6;n<=6;n+=2)line(ctx,X(n),T,X(n),B,COLOR.grid);
 line(ctx,L,Y(0),R,Y(0),COLOR.axis,1.8);line(ctx,X(0),T,X(0),B,COLOR.axis,1);
 label(ctx,"x",R-5,Y(0)-9,COLOR.muted,"right",12);
 ctx.save();ctx.beginPath();ctx.rect(L,T,R-L,B-T);ctx.clip();
 function plot(color,width,only){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";
 let prev=false;for(let i=0;i<=600;i++){const x=xmin+(xmax-xmin)*i/600,y=fn(x),here=!only||relation(y,op);
 if(here&&!prev)ctx.moveTo(X(x),Y(y));else if(here)ctx.lineTo(X(x),Y(y));
 prev=here;}
 ctx.stroke();}
 plot(COLOR.disabled,2.2,false);plot(COLOR.green,4,true);ctx.restore();
 for(const root of r.roots) if(root>=xmin&&root<=xmax)dot(ctx,X(root),Y(0),COLOR.green,op==="≤"||op==="≥",5.5);
 for(let n=-6;n<=6;n+=2)label(ctx,fmt(n),X(n),Math.min(h-8,Y(0)+17),COLOR.muted,"center",10);
 label(ctx,"ZELENÉ ČÁSTI GRAFU SPLŇUJÍ NEROVNOST",w/2,h-9,COLOR.muted,"center",10);
}
const SOLVED=[
 {prompt:"−2x + 4 &gt; 0",steps:[
 ["ODSTRAŇ KONSTANTU","−2x &gt; −4","Od obou stran odečti 4."],
 ["POZOR NA ZNAMÉNKO","x &lt; 2","Dělení záporným −2 obrací nerovnost."],
 ["ZAPIŠ INTERVAL","K = (−∞; 2)","Číslo 2 nepatří do řešení, protože nerovnost je ostrá."]]},
 {prompt:"x ≥ −2  ∧  x &lt; 3",steps:[
 ["VYŘEŠ JEDNOTLIVÉ PODMÍNKY","A = ⟨−2; +∞),  B = (−∞; 3)","Podmínky platí současně."],
 ["PROVEĎ PRŮNIK","A ∩ B = ⟨−2; 3)","Vezmi pouze čísla splňující obě podmínky."],
 ["OVĚŘ KRAJNÍ BODY","−2 ano, 3 ne","Levá hranice je neostrá, pravá ostrá."]]},
 {prompt:"(x + 2)(x − 3) ≤ 0",steps:[
 ["NAJDI KRITICKÉ BODY","x = −2,  x = 3","Zde je součin roven nule."],
 ["ZJISTI ZNAMÉNKA","+ | − | +","Zleva doprava na (−∞;−2), (−2;3), (3;+∞) je znaménko kladné, záporné, kladné."],
 ["VYBER NEKLADNÉ HODNOTY","K = ⟨−2; 3⟩","Zahrneme i oba kořeny, protože rovnost je povolená."]]},
 {prompt:"(x − 1) / (x + 2) ≥ 0",steps:[
 ["URČI DEFINIČNÍ OBOR","x ≠ −2","Nula jmenovatele je zakázaná bez ohledu na znaménko nerovnosti."],
 ["ROZDĚL OSU","−∞, −2, 1, +∞","Nula čitatele je 1, nula jmenovatele −2."],
 ["PROVEĎ ZNAMÉNKOVÝ ROZBOR","+ | − | +","Pro x = −3 je zlomek kladný, pro x = 0 záporný, pro x = 2 kladný."],
 ["ZAPIŠ VÝSLEDEK","K = (−∞; −2) ∪ ⟨1; +∞)","Bod −2 je vždy vyloučen, ale nula čitatele 1 je přípustná."]]},
 {prompt:"(x − 2)² &lt; 0",steps:[
 ["VYUŽIJ VLASTNOST DRUHÉ MOCNINY","(x − 2)² ≥ 0","Každý reálný čtverec je nezáporný."],
 ["OVĚŘ ZNAMÉNKO","x = 2 → 0, jinde &gt; 0","Znaménko se v dvojnásobném kořeni nepřevrací."],
 ["ZAPIŠ VÝSLEDEK","K = ∅","Neexistuje reálné číslo, pro které by druhá mocnina byla záporná."]]}
];
function renderSolver(){
 const item=SOLVED[state.solver];
 $("workedPrompt").textContent=item.prompt.replaceAll("&gt;",">").replaceAll("&lt;","<");
 document.querySelectorAll("[data-solved]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.solved)===state.solver));
 $("workedSteps").innerHTML=item.steps.slice(0,state.step).map(([title,result,description],idx)=>'<article class="solve-step"><small>0'+(idx+1)+' / '+title+'</small><div class="step-math">'+result+'</div><p>'+description+'</p></article>').join("");
 $("nextStep").disabled=state.step>=item.steps.length;
 $("nextStep").textContent=state.step>=item.steps.length?"Všechny kroky zobrazeny":"Odhalit další krok →";
}
const BASIC=[
 ["Který interval odpovídá −2 < x ≤ 3?",["(−2; 3)","⟨−2; 3⟩","(−2; 3⟩","⟨−2; 3)"],2,"Levá hranice je ostrá, pravá neostrá."],
 ["Jaké řešení má nerovnice −3x > 6?",["x > −2","x < −2","x ≥ −2","x < 2"],1,"Po dělení číslem −3 obrátíme znaménko: x < −2."],
 ["Jaký je průnik ⟨−2; 4⟩ ∩ (1; 6)?",["(1; 4⟩","⟨1; 4⟩","(−2; 6)","∅"],0,"Čísla musí patřit do obou intervalů. Bod 1 je z B vyloučen, 4 patří do obou."],
 ["Co znamená A ∩ B?",["Sjednocení","Rozdíl","Průnik","Doplněk"],2,"∩ vybírá čísla splňující obě podmínky současně."],
 ["Které řešení má x + 4 ≤ 1?",["x ≥ −3","x ≤ −3","x < 3","x ≥ 3"],1,"Od obou stran odečti 4: x ≤ −3."],
 ["Jaký je průnik (−∞; 2) ∩ ⟨2; 5⟩?",["{2}","(2; 5⟩","∅","⟨2; 5⟩"],2,"První množina neobsahuje 2, druhá zahrnuje jen čísla od 2 výše. Nemají společný bod."],
 ["Co platí pro x ≥ 1 a zároveň x ≤ 1?",["∅","{1}","ℝ","(−∞; 1)"],1,"Obě podmínky jsou splněny právě pro x = 1."],
 ["Jaká je množina řešení x < 0 nebo x > 2?",["(0; 2)","(−∞; 0) ∪ (2; +∞)","(−∞; 2)","∅"],1,"„Nebo“ vede ke sjednocení dvou oddělených intervalů."]
];
const ADVANCED=[
 ["Urči řešení (x + 1)(x − 4) < 0.",["(−1; 4)","⟨−1; 4⟩","(−∞;−1)∪(4;+∞)","∅"],0,"Součin má záporné znaménko mezi dvěma jednoduchými kořeny."],
 ["Jaké řešení má (x − 2)² ≤ 0?",["ℝ","∅","{2}","(−∞;2)"],2,"Druhá mocnina je vždy ≥ 0. ≤ 0 platí jen v nulovém bodě x = 2."],
 ["Pro která x platí (x − 1)/(x + 3) ≥ 0?",["⟨−3;1⟩","(−∞;−3) ∪ ⟨1;+∞)","(−3;1)","ℝ"],1,"Pól −3 nesmí patřit do řešení. Nulový bod čitatele 1 naopak zahrneme."],
 ["Jaké řešení má (x − 5)/(x − 5) > 0?",["ℝ","ℝ ∖ {5}","{5}","∅"],1,"Výraz je roven 1 všude kromě x = 5, kde není definován."],
 ["Pro jaká x je −(x+2)(x−2) ≥ 0?",["(−∞;−2)∪(2;+∞)","(−2;2)","⟨−2;2⟩","ℝ"],2,"Záporný vedoucí koeficient obrátí znaménka. Včetně kořenů je řešení ⟨−2;2⟩."],
 ["Který výrok o řešení f(x)>0 je správný, když f(x)=(x−1)²?",["Všechna reálná x","Všechna x kromě 1","Pouze 1","Žádná x"],1,"Dvojnásobný kořen není součástí ostré nerovnosti, jinde je funkce kladná."],
 ["Jaký je průnik ⟨−1;2) ∩ ⟨2;4⟩?",["{2}","∅","⟨−1;4⟩","(2;4)"],1,"Do prvního intervalu 2 nepatří. Dotyk otevřeného a uzavřeného bodu nestačí."],
 ["Jaká je množina řešení 1/(x−2) < 0?",["(−∞;2)","(2;+∞)","ℝ","∅"],0,"Čitatel 1 je kladný; záporná hodnota vzniká právě tehdy, je-li jmenovatel záporný."]
];
function renderQuiz(){
 const qset=state.track==="basic"?BASIC:ADVANCED,idx=state.quiz;
 document.querySelectorAll("[data-track]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.track===state.track)));
 $("quizCounter").textContent=idx<qset.length?"Otázka "+(idx+1)+" z "+qset.length:"Výsledek";
 $("quizScore").textContent="Správně "+state.answers.filter(x=>x.correct).length+" / "+state.answers.length;
 $("quizBar").style.width=(idx/qset.length*100)+"%";
 $("quizNext").disabled=!state.locked;
 $("quizNext").textContent=idx===qset.length-1?"Zobrazit výsledek →":"Další otázka →";
 if(idx>=qset.length){
  $("quizBar").style.width="100%";$("quizNext").disabled=true;
  const n=state.answers.filter(a=>a.correct).length;
  $("quizMount").innerHTML='<div class="quiz-complete"><h3>'+n+' z '+qset.length+' správně</h3><p>'+(n===qset.length?"Rozumíš principům. Dokážeš je také vysvětlit nahlas bez tabulky?":"Vrať se k laboratořím k otázkám, u kterých jsi chyboval(a), a sleduj krajní body.")+'</p></div>';return;
 }
 const q=qset[idx],answer=state.answers[idx];
 $("quizMount").innerHTML='<h3>'+q[0].replaceAll("<","&lt;").replaceAll(">","&gt;")+'</h3><div class="quiz-options">'+q[1].map((s,i)=>'<button type="button" data-answer="'+i+'">'+String.fromCharCode(65+i)+'. '+s.replaceAll("<","&lt;").replaceAll(">","&gt;")+'</button>').join("")+'</div><div class="quiz-feedback" id="quizFeedback" role="status"></div>';
 document.querySelectorAll("[data-answer]").forEach(el=>el.addEventListener("click",()=>choose(Number(el.dataset.answer))));
 if(state.locked&&answer){
  document.querySelectorAll("[data-answer]").forEach(el=>{el.disabled=true;const k=Number(el.dataset.answer);el.classList.toggle("correct",k===q[2]);el.classList.toggle("incorrect",k===answer.choice&&k!==q[2]);});
  $("quizFeedback").textContent=(answer.correct?"Správně. ":"Správné řešení: "+q[1][q[2]]+". ")+q[3];
 }
}
function choose(choice){if(state.locked)return;const qset=state.track==="basic"?BASIC:ADVANCED;state.answers.push({choice,correct:choice===qset[state.quiz][2]});state.locked=true;renderQuiz();}
function systemPreset(kind){
 const presets={
 overlap:[-3,2,true,true,1,5,false,true],
 empty:[-5,-1,true,true,1,5,true,true],
 point:[-3,1,true,true,1,4,true,true],
 inside:[-5,5,true,true,-2,3,false,false]
 };
 const names=["aLo","aHi","aLi","aRi","bLo","bHi","bLi","bRi"];
 presets[kind].forEach((v,i)=>state[names[i]]=v);renderSystem();
}
function bind(){
 $("linearA").addEventListener("input",e=>{
  let n=Number(e.target.value);
  if(n===0)n=state.linearA>0?-1:1;
  state.linearA=n;renderLinear();
 });
 $("linearB").addEventListener("input",e=>{state.linearB=Number(e.target.value);renderLinear()});
 document.querySelectorAll("[data-linear-op]").forEach(b=>b.addEventListener("click",()=>{state.linearOp=b.dataset.linearOp;renderLinear()}));
 $("linearReset").addEventListener("click",()=>{state.linearA=-2;state.linearB=4;state.linearOp=">";renderLinear()});
 [["iLower","iLower"],["iUpper","iUpper"]].forEach(([id,key])=>$(id).addEventListener("input",e=>{state[key]=Number(e.target.value);renderInterval()}));
 [["iLeftClosed","iLi"],["iRightClosed","iRi"]].forEach(([id,key])=>$(id).addEventListener("change",e=>{state[key]=e.target.checked;renderInterval()}));
 $("intervalPoint").addEventListener("click",()=>{state.iLower=2;state.iUpper=2;state.iLi=true;state.iRi=true;renderInterval()});
 ["aLo","aHi","bLo","bHi"].forEach(key=>$(key).addEventListener("input",e=>{state[key]=Number(e.target.value);renderSystem()}));
 ["aLi","aRi","bLi","bRi"].forEach(key=>$(key).addEventListener("change",e=>{state[key]=e.target.checked;renderSystem()}));
 document.querySelectorAll("[data-system-preset]").forEach(btn=>btn.addEventListener("click",()=>systemPreset(btn.dataset.systemPreset)));
 [["pRoot1","productR1"],["pRoot2","productR2"],["rNumerator","rationalU"],["rDenominator","rationalV"]].forEach(([id,key])=>$(id).addEventListener("input",e=>{state[key]=Number(e.target.value);key.startsWith("product")?renderProduct():renderRational()}));
 document.querySelectorAll("[data-product-op]").forEach(el=>el.addEventListener("click",()=>{state.productOp=el.dataset.productOp;renderProduct()}));
 document.querySelectorAll("[data-leading]").forEach(el=>el.addEventListener("click",()=>{state.productA=Number(el.dataset.leading);renderProduct()}));
 document.querySelectorAll("[data-rational-op]").forEach(el=>el.addEventListener("click",()=>{state.rationalOp=el.dataset.rationalOp;renderRational()}));
 $("rationalHole").addEventListener("click",()=>{state.rationalU=state.rationalV;renderRational()});
 document.querySelectorAll("[data-solved]").forEach(btn=>btn.addEventListener("click",()=>{state.solver=Number(btn.dataset.solved);state.step=0;renderSolver()}));
 $("nextStep").addEventListener("click",()=>{state.step=Math.min(SOLVED[state.solver].steps.length,state.step+1);renderSolver()});
 $("restartSteps").addEventListener("click",()=>{state.step=0;renderSolver()});
 document.querySelectorAll("[data-track]").forEach(btn=>btn.addEventListener("click",()=>{state.track=btn.dataset.track;state.quiz=0;state.locked=false;state.answers=[];renderQuiz()}));
 $("quizNext").addEventListener("click",()=>{if(!state.locked)return;state.quiz++;state.locked=false;renderQuiz()});
 $("quizRestart").addEventListener("click",()=>{state.quiz=0;state.answers=[];state.locked=false;renderQuiz()});
}
function render(){renderLinear();renderInterval();renderSystem();renderProduct();renderRational();renderSolver();renderQuiz();}
bind();render();
if("ResizeObserver" in window){
 const observer=new ResizeObserver(()=>{renderLinear();renderInterval();renderSystem();renderProduct();renderRational();});
 document.querySelectorAll("canvas").forEach(c=>observer.observe(c));
}else window.addEventListener("resize",()=>{renderLinear();renderInterval();renderSystem();renderProduct();renderRational();});
if("IntersectionObserver" in window){
 const links=[...document.querySelectorAll(".rail nav a")];
 const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(link=>link.classList.toggle("active",link.hash==="#"+entry.target.id));});},{rootMargin:"-12% 0px -65% 0px"});
 document.querySelectorAll("main section[id]").forEach(el=>io.observe(el));
}
