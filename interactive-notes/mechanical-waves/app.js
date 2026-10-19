"use strict";
(function(){
const $=id=>document.getElementById(id);
const PI=Math.PI, TAU=2*PI;
const C={navy:"#13263d",blue:"#285e91",light:"#91b8d7",orange:"#be6c48",grid:"#dfe6ed",muted:"#64748b"};
const v=id=>Number($(id).value);
const set=(id,value)=>{$(id).textContent=value;};
const fmt=(n,places=2)=>Number(n).toLocaleString("cs-CZ",{minimumFractionDigits:places,maximumFractionDigits:places});
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const modulo=n=>((n%TAU)+TAU)%TAU;
const state={active:"wave",mode:"transverse",time:{wave:0,phase:0,instant:2,medium:0},run:{wave:true,phase:true,instant:false,medium:true},drag:null,fixedSpeed:null};
if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)Object.keys(state.run).forEach(key=>state.run[key]=false);
function canvas(id){
 const node=$(id),r=node.getBoundingClientRect(),w=r.width,h=r.height;
 if(w<1||h<1)return null;
 const dpr=Math.min(window.devicePixelRatio||1,2),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
 if(node.width!==pw||node.height!==ph){node.width=pw;node.height=ph;}
 const ctx=node.getContext("2d");
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 return {ctx,w,h};
}
function line(ctx,x,y,x2,y2,color=C.grid,width=1,dash=false){
 ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash?[5,5]:[]);
 ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
}
function dot(ctx,x,y,color,r=6){
 ctx.beginPath();ctx.arc(x,y,r+2,0,TAU);ctx.fillStyle="#fff";ctx.fill();
 ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=color;ctx.fill();
}
function label(ctx,text,x,y,color=C.muted,align="left",size=12){
 ctx.font="600 "+size+"px system-ui, sans-serif";ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(text,x,y);
}
function curve(ctx,fun,a,b,steps,color,width=2.8){
 ctx.beginPath();for(let j=0;j<=steps;j++){
  const p=fun(a+(b-a)*j/steps);if(j===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
 }
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin="round";ctx.stroke();
}
function axes(ctx,left,right,y){
 line(ctx,left,y,right,y,"#b7c7d3",1.2);
 for(let i=0;i<=12;i+=2){const x=left+(right-left)*i/12;line(ctx,x,y-4,x,y+4);label(ctx,String(i),x,y+20,C.muted,"center",10);}
 label(ctx,"x [m]",right,y+36,C.muted,"right",11);
}
function waveLambda(){return state.fixedSpeed===null?v("wave-l"):state.fixedSpeed/v("wave-f");}
function waveValues(){
 const A=v("wave-A"),f=v("wave-f"),lambda=waveLambda();
 const fixed=state.fixedSpeed!==null;
 set("wave-main-equation",state.mode==="transverse"
  ?"y(x, t) = A · sin [2π (f · t − x/λ)]"
  :"ξ(x, t) = A · sin [2π (f · t − x/λ)]");
 $("wave-l").disabled=fixed;
 set("wave-l-note",fixed?"Dopočtena ze vztahu λ = v/f":"Rozestup stejných fází");
 set("wave-medium-hint",fixed
  ?"Stejné nedisperzní prostředí: rychlost "+fmt(state.fixedSpeed)+" m/s je konstantní; při změně f se mění λ."
  :"Volný model: f a λ volíš nezávisle, a tím porovnáváš i různé rychlosti šíření.");
 set("wave-A-label",fmt(A,0)+" cm");set("wave-f-label",fmt(f,1)+" Hz");set("wave-l-label",fmt(lambda,1)+" m");
 set("wave-T",fmt(1/f,3)+" s");set("wave-v",fmt(f*lambda)+" m/s");set("wave-time",fmt(state.time.wave)+" s");
 set("wave-equation","v = "+fmt(f,1)+" × "+fmt(lambda,1)+" = "+fmt(f*lambda)+" m/s   ·   T = "+fmt(1/f,3)+" s");
}
function drawWave(){
 const c=canvas("wave-canvas");if(!c)return;
 const {ctx,w,h}=c,left=37,right=w-38,cy=h*.51;
 const A=v("wave-A"),f=v("wave-f"),lambda=waveLambda(),amp=A*4.2;
 const sx=x=>left+(right-left)*x/12;
 const phase=x=>TAU*(f*state.time.wave-x/lambda);
 axes(ctx,left,right,cy);
 if(state.mode==="transverse"){
  curve(ctx,x=>[sx(x),cy-amp*Math.sin(phase(x))],0,12,240,C.blue);
  const x=2,y=cy-amp*Math.sin(phase(x));
  line(ctx,sx(x),cy,sx(x),y,C.orange,1.6,true);dot(ctx,sx(x),y,C.orange);
  label(ctx,"Částice P",sx(x)+12,y-14,C.orange,"left",11);
  const x0=Math.max(0,Math.min(2,12-lambda)),x1=x0+lambda,top=cy-amp-25;
  if(x1<=12&&x1>x0+.2){line(ctx,sx(x0),top,sx(x1),top,C.navy,1.4);line(ctx,sx(x0),top-5,sx(x0),top+5,C.navy);line(ctx,sx(x1),top-5,sx(x1),top+5,C.navy);label(ctx,"λ",.5*(sx(x0)+sx(x1)),top-8,C.navy,"center",14);}
  label(ctx,"Kmitání kolmo na směr šíření",left,25);
 }else{
  for(let j=0;j<66;j++){
   const x=j*12/65;
   // Small longitudinal displacements retain particle ordering:
   // a linear displacement wave, not particles travelling with the signal.
   const dxPx=Math.min(4,(right-left)/65*.40)*A/20;
   const px=sx(x)+Math.sin(phase(x))*dxPx,py=cy+(j%3-1)*7;
   if(j===15){line(ctx,sx(x),cy-48,sx(x),cy+48,C.orange,1,true);dot(ctx,px,py,C.orange);label(ctx,"Částice P",px+12,py-23,C.orange,"left",11);}
   else dot(ctx,px,py,C.blue,3.5);
  }
  label(ctx,"Kmitání podél směru šíření",left,25);
  label(ctx,"zhuštění a zředění částic",right-15,cy-90,C.muted,"right",11);
 }
 const ay=h-54;line(ctx,left+20,ay,right-24,ay,C.muted,1.6);
 line(ctx,right-32,ay-5,right-24,ay,C.muted,1.6);line(ctx,right-32,ay+5,right-24,ay,C.muted,1.6);
 label(ctx,"šíření energie →",left+20,ay-12);
}
function phaseValues(){
 const lambda=v("phase-l"),a=v("phase-x1"),b=v("phase-x2"),dx=Math.abs(a-b),rad=TAU*dx/lambda,mod0=modulo(rad),mod=Math.min(mod0,TAU-mod0)<1e-8?0:mod0;
 let status="Fázově posunuté";
 if(Math.min(mod,TAU-mod)<.09)status="Stejná fáze";
 else if(Math.abs(mod-PI)<.09)status="Opačná fáze";
 set("phase-l-label",fmt(lambda,1)+" m");set("phase-x1-label",fmt(a,1)+" m");set("phase-x2-label",fmt(b,1)+" m");
 set("phase-equation","|Δφ| = 2π × "+fmt(dx,1)+" / "+fmt(lambda,1)+" = "+fmt(rad,3)+" rad");
 set("phase-distance",fmt(dx)+" m");set("phase-mod",fmt(mod,3)+" rad / "+fmt(mod*180/PI,1)+"°");set("phase-status",status);
}
function drawPhase(){
 const c=canvas("phase-canvas");if(!c)return;
 const {ctx,w,h}=c,left=41,right=w-39,cy=h*.25,amp=Math.min(58,h*.17),bottom=h*.77;
 const lambda=v("phase-l"),a=v("phase-x1"),b=v("phase-x2"),sx=x=>left+(right-left)*x/10;
 const phase=x=>TAU*(state.time.phase-x/lambda);
 line(ctx,left,cy,right,cy,"#b7c7d3");label(ctx,"Vlna v prostoru",left,23,C.navy);
 curve(ctx,x=>[sx(x),cy-amp*Math.sin(phase(x))],0,10,220,C.blue);
 [[a,C.orange,"A"],[b,C.navy,"B"]].forEach(item=>{
  const px=sx(item[0]),py=cy-amp*Math.sin(phase(item[0]));
  line(ctx,px,cy-amp-12,px,cy+amp+13,item[1],1.15,true);
  dot(ctx,px,py,item[1],7);label(ctx,item[2]+"  "+fmt(item[0],1)+" m",clamp(px,left+39,right-39),cy+amp+31,item[1],"center",11);
 });
 label(ctx,"Kmitání v čase",left,h*.53,C.navy);
 line(ctx,left,bottom,right,bottom,"#b7c7d3");
 [[a,C.orange],[b,C.navy]].forEach(item=>{
  curve(ctx,t=>[left+(right-left)*t/2,bottom-46*Math.sin(TAU*(state.time.phase+t-item[0]/lambda))],0,2,180,item[1],2.2);
 });
 label(ctx,"A",right-36,bottom-59,C.orange,"center",11);label(ctx,"B",right-14,bottom-59,C.navy,"center",11);
 label(ctx,"čas →",right,bottom+65,C.muted,"right",11);
}
function instantValues(){
 const A=v("instant-A"),T=v("instant-T"),lambda=v("instant-l"),x=v("instant-x"),t=v("instant-t"),p=v("instant-p");
 state.time.instant=t;
 const speed=lambda/T,arrival=x/speed,arrived=t>=arrival-1e-9,phase=TAU*(t/T-x/lambda)+p;
 const y=arrived?A*Math.sin(phase):0;
 set("instant-A-label",fmt(A,0)+" cm");set("instant-T-label",fmt(T,1)+" s");
 set("instant-l-label",fmt(lambda,1)+" m");set("instant-x-label",fmt(x,1)+" m");set("instant-t-label",fmt(t)+" s");
 const pName=p===0?"0":Math.abs(p-PI/2)<.1?"π/2":"π";set("instant-p-label",pName);
 set("instant-v",fmt(speed)+" m/s");set("instant-arrival",fmt(arrival)+" s");
 set("instant-y",fmt(y)+" cm"+(arrived?"":" · klid"));
 set("instant-equation",arrived
  ?"y = "+fmt(A,0)+" × sin[2π("+fmt(t)+"/"+fmt(T,1)+" − "+fmt(x,1)+"/"+fmt(lambda,1)+") + "+pName+"] = "+fmt(y)+" cm"
  :"t = "+fmt(t)+" s < x/v = "+fmt(arrival)+" s  →  vlna ještě nedorazila, y = 0 cm");
}
function drawInstant(){
 const c=canvas("instant-canvas");if(!c)return;
 const {ctx,w,h}=c,left=38,right=w-36,cy=h*.55,A=v("instant-A"),T=v("instant-T"),lambda=v("instant-l"),x=v("instant-x"),t=v("instant-t"),p=v("instant-p");
 const speed=lambda/T,front=clamp(speed*t,0,12),sx=u=>left+(right-left)*u/12;
 ctx.fillStyle="rgba(40,94,145,.055)";ctx.fillRect(left,cy-100,sx(front)-left,200);
 axes(ctx,left,right,cy);
 if(front>0.01)curve(ctx,u=>[sx(u),cy-A*4*Math.sin(TAU*(t/T-u/lambda)+p)],0,front,Math.max(35,Math.round(220*front/12)),C.blue);
 if(front<12)line(ctx,sx(front),cy-107,sx(front),cy+106,C.orange,1.5,true);
 label(ctx,"Čelo vlny",clamp(sx(front)+7,left+40,right-37),cy-112,C.orange,"center",11);
 const arrived=t>=x/speed,y=arrived?A*Math.sin(TAU*(t/T-x/lambda)+p):0;
 line(ctx,sx(x),cy-106,sx(x),cy+105,C.navy,1.4,true);dot(ctx,sx(x),cy-y*4,arrived?C.orange:C.muted,7);
 label(ctx,"Měřený bod, x = "+fmt(x,1)+" m",sx(x),cy+126,C.navy,"center",11);
 label(ctx,arrived?"Bod už kmitá":"Vlna do bodu zatím nedorazila",left,25);
}
function mediumValues(){
 const f=v("medium-f"),v1=v("medium-v1"),v2=v("medium-v2"),l1=v1/f,l2=v2/f;
 set("medium-f-label",fmt(f,1)+" Hz");set("medium-v1-label",fmt(v1,1)+" m/s");set("medium-v2-label",fmt(v2,1)+" m/s");
 set("medium-l1",fmt(l1)+" m");set("medium-l2",fmt(l2)+" m");set("medium-ratio",fmt(l2/l1)+"×");
 set("medium-equation","λ₁ = "+fmt(v1,1)+"/"+fmt(f,1)+" = "+fmt(l1)+" m     |     λ₂ = "+fmt(v2,1)+"/"+fmt(f,1)+" = "+fmt(l2)+" m");
}
function drawMedium(){
 const c=canvas("medium-canvas");if(!c)return;
 const {ctx,w,h}=c,left=37,right=w-37,cy=h*.54,boundary=6;
 const f=v("medium-f"),v1=v("medium-v1"),v2=v("medium-v2"),l1=v1/f,l2=v2/f,sx=x=>left+(right-left)*x/12;
 ctx.fillStyle="rgba(40,94,145,.048)";ctx.fillRect(left,32,sx(boundary)-left,h-72);
 ctx.fillStyle="rgba(190,108,72,.048)";ctx.fillRect(sx(boundary),32,right-sx(boundary),h-72);
 line(ctx,sx(boundary),31,sx(boundary),h-43,C.muted,1.6,true);line(ctx,left,cy,right,cy,"#b7c7d3");
 label(ctx,"Prostředí 1",sx(2),32,C.blue,"center",13);label(ctx,"Prostředí 2",sx(10),32,C.orange,"center",13);
 label(ctx,"λ₁ = "+fmt(l1)+" m",sx(2.5),h-48,C.blue,"center");
 label(ctx,"λ₂ = "+fmt(l2)+" m",sx(9.5),h-48,C.orange,"center");
 const phase=x=>TAU*(f*state.time.medium-(x<=boundary?x/l1:boundary/l1+(x-boundary)/l2));
 curve(ctx,x=>[sx(x),cy-68*Math.sin(phase(x))],0,boundary,170,C.blue);
 curve(ctx,x=>[sx(x),cy-68*Math.sin(phase(x))],boundary,12,170,C.orange);
 dot(ctx,sx(boundary),cy-68*Math.sin(phase(boundary)),C.navy,5);
}
function redraw(){
 if(state.active==="wave"){waveValues();drawWave();}
 else if(state.active==="phase"){phaseValues();drawPhase();}
 else if(state.active==="instant"){instantValues();drawInstant();}
 else{mediumValues();drawMedium();}
}
function tab(name){
 state.active=name;
 document.querySelectorAll(".tab").forEach(b=>{
  const on=b.dataset.tab===name;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));
 });
 document.querySelectorAll(".lab-section").forEach(s=>{
  const on=s.id==="lab-"+name;s.hidden=!on;s.classList.toggle("active",on);
 });
 redraw();
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.tab)));
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{
 state.mode=b.dataset.mode;
 document.querySelectorAll("[data-mode]").forEach(el=>el.classList.toggle("selected",el===b));
 redraw();
}));
["wave-A","wave-f","wave-l","phase-l","phase-x1","phase-x2","instant-A","instant-T","instant-l","instant-x","instant-p","medium-f","medium-v1","medium-v2"].forEach(id=>$(id).addEventListener("input",redraw));
$("instant-t").addEventListener("input",()=>{
 state.run.instant=false;set("instant-run","Přehrát běh času");redraw();
});
function toggle(lab,id){state.run[lab]=!state.run[lab];set(id,state.run[lab]?"Pozastavit animaci":"Spustit animaci");}
$("wave-lock-speed").addEventListener("change",event=>{
 state.fixedSpeed=event.target.checked?v("wave-f")*v("wave-l"):null;
 redraw();
});
$("wave-play").addEventListener("click",()=>toggle("wave","wave-play"));
$("phase-play").addEventListener("click",()=>toggle("phase","phase-play"));
$("medium-play").addEventListener("click",()=>toggle("medium","medium-play"));
$("instant-run").addEventListener("click",()=>{
 if(v("instant-t")>=12)$("instant-t").value="0";
 state.run.instant=!state.run.instant;set("instant-run",state.run.instant?"Pozastavit čas":"Přehrát běh času");
});
$("instant-zero").addEventListener("click",()=>{
 state.run.instant=false;$("instant-t").value="0";set("instant-run","Přehrát běh času");redraw();
});
$("wave-reset").addEventListener("click",()=>{
 [["wave-A","10"],["wave-f","1.2"],["wave-l","4"]].forEach(row=>$(row[0]).value=row[1]);
 state.mode="transverse";state.time.wave=0;state.fixedSpeed=null;$("wave-lock-speed").checked=false;
 document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("selected",b.dataset.mode==="transverse"));
 redraw();
});
function preset(opposite){
 const l=v("phase-l"),a=v("phase-x1"),d=opposite?l/2:l;
 // Always move both markers into the visible interval when necessary.
 const first=clamp(a,0,10-d);
 $("phase-x1").value=String(Math.round(first*10)/10);
 $("phase-x2").value=String(Math.round((first+d)*10)/10);
 redraw();
}
$("phase-same").addEventListener("click",()=>preset(false));
$("phase-opposite").addEventListener("click",()=>preset(true));
$("medium-slower").addEventListener("click",()=>{$("medium-v2").value="1.5";redraw();});
$("medium-faster").addEventListener("click",()=>{$("medium-v2").value="7";redraw();});
document.querySelectorAll("[data-check]").forEach(button=>button.addEventListener("click",()=>{
 const el=$(button.dataset.check+"-feedback");el.hidden=!el.hidden;
 button.textContent=el.hidden?"Zobrazit vysvětlení":"Skrýt vysvětlení";
}));

const numericalChecks={
 wave:{correct:1450,tolerance:1,help:"Nejdřív převeď 2 ms na 0,002 s. Potom dosaď do v = λ/T.",solution:"v = λ/T = 2,9 / 0,002 = 1450 m/s."},
 phase:{correct:0.5,tolerance:0.015,help:"Spočti λ = v/f a pak Δφ/π = 2Δx/λ.",solution:"λ = 360/450 = 0,8 m; |Δφ| = 2π·0,20/0,8 = 0,5π."},
 instant:{correct:-3,tolerance:0.04,help:"Dosaď t/T = 1 a x/λ = 0,25; dej pozor na znaménko sinu.",solution:"y = 3·sin[2π(1−5/20)] = 3·sin(3π/2) = −3 cm."},
 medium:{correct:450,tolerance:1,help:"Frekvence se nemění: f = v₁/λ₁ a v₂ = fλ₂.",solution:"f = 300/2 = 150 Hz; v₂ = 150·3 = 450 m/s."}
};
document.querySelectorAll("form[data-calc]").forEach(form=>form.addEventListener("submit",event=>{
 event.preventDefault();
 const lab=form.dataset.calc,field=$(lab+"-answer"),feedback=$(lab+"-check-feedback");
 const raw=field.value.trim().replace(/\s/g,"").replace(",",".");
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)){
  feedback.textContent="Zadej jedno číslo, bez jednotky. Můžeš použít desetinnou čárku.";
  feedback.dataset.result="error";return;
 }
 const val=Number(raw),quiz=numericalChecks[lab],correct=Number.isFinite(val)&&Math.abs(val-quiz.correct)<=quiz.tolerance;
 feedback.textContent=correct?"Správně. "+quiz.solution:"Zatím ne. "+quiz.help;
 feedback.dataset.result=correct?"correct":"error";
}));
const phaseCanvas=$("phase-canvas");
function pointerX(event){
 const r=phaseCanvas.getBoundingClientRect();return clamp((event.clientX-r.left-41)/(r.width-80)*10,0,10);
}
phaseCanvas.addEventListener("pointerdown",event=>{
 if(state.active!=="phase")return;
 const x=pointerX(event);
 state.drag=Math.abs(x-v("phase-x1"))<=Math.abs(x-v("phase-x2"))?"phase-x1":"phase-x2";
 phaseCanvas.setPointerCapture(event.pointerId);
 $(state.drag).value=String(Math.round(x*10)/10);redraw();event.preventDefault();
});
phaseCanvas.addEventListener("pointermove",event=>{
 if(!state.drag)return;
 $(state.drag).value=String(Math.round(pointerX(event)*10)/10);redraw();event.preventDefault();
});
["pointerup","pointercancel","lostpointercapture"].forEach(name=>phaseCanvas.addEventListener(name,()=>{state.drag=null;}));
let last=0,lastDraw=0;
function frame(now){
 const dt=last?Math.min((now-last)/1000,.08):0;last=now;
 if(!document.hidden){
  if(state.active!=="instant"&&state.run[state.active])state.time[state.active]+=dt;
  if(state.active==="instant"&&state.run.instant){
   let t=v("instant-t")+dt;
   if(t>=12){t=12;state.run.instant=false;set("instant-run","Přehrát běh času");redraw();}
   $("instant-t").value=String(t);
  }
  if(state.run[state.active] && now-lastDraw>=30){redraw();lastDraw=now;}
 }
 window.requestAnimationFrame(frame);
}
document.addEventListener("visibilitychange",()=>{last=0;});
window.addEventListener("resize",redraw,{passive:true});
for(const [lab,id] of [["wave","wave-play"],["phase","phase-play"],["medium","medium-play"]]){
 if(!state.run[lab])set(id,"Spustit animaci");
}
tab("wave");window.requestAnimationFrame(frame);
})();