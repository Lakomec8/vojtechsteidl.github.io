'use strict';
const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
const COLORS={ink:'#34493f',grid:'#e8ece5',axis:'#a4b0a7',green:'#216b55',orange:'#c88649',light:'#dcece1',blue:'#558f85'};
const frame={left:43,right:22,top:26,bottom:35};
let direction='left',scenario='normal',sidecase='jump',method='direct',step=0,animation=null;
function number(value,digits=6){if(!Number.isFinite(value))return value>0?'+∞':'−∞';return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:digits,minimumFractionDigits:0,useGrouping:false}).format(value)}
function math(){if(window.MathJax&&window.MathJax.typesetPromise)window.MathJax.typesetPromise().catch(()=>{});}
function plot(canvas,bounds){
 const ratio=Math.min(2,window.devicePixelRatio||1),w=Math.max(240,canvas.clientWidth||500),h=Math.max(220,canvas.clientHeight||340);
 canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
 const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);
 ctx.clearRect(0,0,w,h);const l=frame.left,r=w-frame.right,t=frame.top,b=h-frame.bottom;
 const X=x=>l+(x-bounds.xMin)*(r-l)/(bounds.xMax-bounds.xMin);
 const Y=y=>b-(y-bounds.yMin)*(b-t)/(bounds.yMax-bounds.yMin);
 ctx.save();ctx.fillStyle='#fffefa';ctx.fillRect(0,0,w,h);
 let xs=bounds.xStep||1,ys=bounds.yStep||1;
 ctx.font='11px DM Sans, sans-serif';ctx.lineWidth=1;
 for(let x=Math.ceil(bounds.xMin/xs)*xs;x<=bounds.xMax+1e-9;x+=xs){
  const xx=X(x);ctx.strokeStyle=COLORS.grid;ctx.beginPath();ctx.moveTo(xx,t);ctx.lineTo(xx,b);ctx.stroke();
  ctx.fillStyle='#9ba89f';ctx.textAlign='center';ctx.fillText(number(x,1),xx,b+17);
 }
 for(let y=Math.ceil(bounds.yMin/ys)*ys;y<=bounds.yMax+1e-9;y+=ys){
  const yy=Y(y);ctx.strokeStyle=COLORS.grid;ctx.beginPath();ctx.moveTo(l,yy);ctx.lineTo(r,yy);ctx.stroke();
  ctx.fillStyle='#9ba89f';ctx.textAlign='right';ctx.fillText(number(y,1),l-9,yy+4);
 }
 ctx.strokeStyle=COLORS.axis;ctx.lineWidth=1.4;
 if(bounds.xMin<=0&&bounds.xMax>=0){ctx.beginPath();ctx.moveTo(X(0),t);ctx.lineTo(X(0),b);ctx.stroke();}
 if(bounds.yMin<=0&&bounds.yMax>=0){ctx.beginPath();ctx.moveTo(l,Y(0));ctx.lineTo(r,Y(0));ctx.stroke();}
 ctx.fillStyle='#72857a';ctx.textAlign='right';ctx.fillText('x',r,b+30);ctx.textAlign='left';ctx.fillText('y',l-18,t-9);
 ctx.beginPath();ctx.rect(l,t,r-l,b-t);ctx.clip();
 return{ctx,X,Y,l,r,t,b,w,h,done:()=>ctx.restore()};
}
function line(p,x1,y1,x2,y2,color=COLORS.green,width=2,dash=[]){
 const{ctx,X,Y}=p;ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(X(x1),Y(y1));ctx.lineTo(X(x2),Y(y2));ctx.stroke();ctx.setLineDash([]);
}
function curve(p,fn,min,max,color=COLORS.green,width=3,exclude=()=>false){
 const{ctx,X,Y}=p;const span=max-min;let previous=null;
 ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';
 for(let i=0;i<=900;i++){
  const x=min+span*i/900,y=fn(x),q={x:X(x),y:Y(y)};
  if(exclude(x)||!Number.isFinite(y)||y< -1e6||y>1e6){previous=null;continue}
  if(previous&&Math.abs(q.y-previous.y)<p.h*.33)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);
  previous=q;
 }
 ctx.stroke();
}
function point(p,x,y,color=COLORS.orange,open=false,radius=6){
 const{ctx,X,Y}=p;ctx.beginPath();ctx.arc(X(x),Y(y),radius,0,Math.PI*2);
 ctx.fillStyle=open?'#fffefa':color;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.fill();ctx.stroke();
}
function textOn(p,txt,x,y,color=COLORS.ink){
 const{ctx,X,Y}=p;ctx.font='700 12px DM Sans, sans-serif';ctx.fillStyle=color;ctx.textAlign='left';ctx.fillText(txt,X(x)+9,Y(y)-12);
}
function backgroundLabel(p,txt,color=COLORS.green){const{ctx,w}=p;ctx.font='700 10px DM Sans, sans-serif';ctx.textAlign='right';ctx.fillStyle=color;ctx.fillText(txt,w-29,18);}
function drawHero(){
 const p=plot($('#heroCanvas'),{xMin:-1.3,xMax:3.4,yMin:-.5,yMax:4.7,xStep:1,yStep:1});
 line(p,1,-.5,1,4.7,'#b6c8ba',1.5,[5,6]);line(p,-1.3,2,3.4,2,'#b8d2c0',1.4,[5,6]);curve(p,x=>x+1,-1.3,3.4,COLORS.green,3,x=>Math.abs(x-1)<.006);point(p,1,2,COLORS.orange,true,7);point(p,.57,1.57,COLORS.orange);point(p,1.43,2.43,COLORS.orange);textOn(p,'L = 2',1.43,2,COLORS.green);p.done();
}
function approachDistance(){return Math.pow(10,-Number($('#approachRange').value))}
function renderApproach(){
 const d=approachDistance(),x=1+(direction==='left'?-d:d),y=x+1,level=Number($('#approachRange').value);
 $('#approachLevel').textContent='10'+['⁰','⁻¹','⁻²','⁻³','⁻⁴','⁻⁵'][level];
 $('#approachX').textContent=number(x,6);$('#approachY').textContent=number(y,6);$('#approachError').textContent=number(d,6);
 $$('[data-direction]').forEach(b=>b.classList.toggle('selected',b.dataset.direction===direction));
 const p=plot($('#approachCanvas'),{xMin:-1.5,xMax:3.5,yMin:-1,yMax:5,xStep:1,yStep:1});
 line(p,1,-1,1,5,'#b3c9bb',1.6,[5,5]);line(p,-1.5,2,3.5,2,'#a6bfae',1.5,[6,7]);
 curve(p,t=>t+1,-1.5,3.5,COLORS.green,3.4,t=>Math.abs(t-1)<.003);
 point(p,1,2,COLORS.orange,true,7);line(p,x,-1,x,y,COLORS.orange,1.1,[4,4]);line(p,-1.5,y,x,y,COLORS.orange,1.1,[4,4]);point(p,x,y,COLORS.orange,false,6);
 if(d>.06)textOn(p,'x = '+number(x,2),x,y,COLORS.orange);
 backgroundLabel(p,'L = 2');p.done();
}
const caseContent={
 normal:['Spojitá funkce','Funkce má v bodě hodnotu 2. Průběh přímky kolem tohoto bodu ukazuje na stejnou hodnotu.','\\(f(1)=2\\)'],
 hole:['Odstranitelná nespojitost','Uprostřed přímky zůstane díra. A přesto zleva i zprava míříme k 2.','\\(f(1)\\) není definováno'],
 shift:['Předefinovaný jediný bod','Funkce v bodě 1 skáče na hodnotu 4. Okolí bodu se však vůbec nezměnilo.','\\(f(1)=4\\)']
};
function drawCase(){
 const p=plot($('#caseCanvas'),{xMin:-1.5,xMax:3.5,yMin:-.5,yMax:5.1,xStep:1,yStep:1});
 line(p,1,-.5,1,5.1,'#b7cabd',1.3,[5,5]);line(p,-1.5,2,3.5,2,'#bdd0c0',1,[4,6]);
 curve(p,x=>x+1,-1.5,3.5,COLORS.green,3.3,x=>scenario!=='normal'&&Math.abs(x-1)<.006);
 point(p,1,2,COLORS.orange,scenario!=='normal',7);
 if(scenario==='shift')point(p,1,4,COLORS.orange,false,7);
 textOn(p,'lim = 2',1.25,2.2,COLORS.green);p.done();
 const c=caseContent[scenario];$('#caseTitle').textContent=c[0];$('#caseCopy').textContent=c[1];$('#caseValue').innerHTML=c[2];math();
 $$('[data-case]').forEach(b=>b.classList.toggle('active',b.dataset.case===scenario));
}
const sideData={
 jump:['Skok v grafu','\\(\\lim_{x\\to0^-}f(x)=1\\)','\\(\\lim_{x\\to0^+}f(x)=3\\)','Oboustranná limita neexistuje.','Různé jednostranné limity se nemohou spojit do jediné konečné hodnoty.'],
 pole:['Opačné nekonečné chování','\\(\\lim_{x\\to0^-}\\frac1x=-\\infty\\)','\\(\\lim_{x\\to0^+}\\frac1x=+\\infty\\)','Oboustranná limita neexistuje ani jako rozšířená.','Funkce je zleva neomezená dolů a zprava neomezená nahoru.'],
 positive:['Stejné nekonečné chování','\\(\\lim_{x\\to0^-}\\frac1{x^2}=+\\infty\\)','\\(\\lim_{x\\to0^+}\\frac1{x^2}=+\\infty\\)','Nevlastní oboustranná limita je +∞.','Obě strany rostou bez omezení. Není to konečná reálná limita.'],
 meet:['Setkání v jediném bodě','\\(\\lim_{x\\to0^-}|x|=0\\)','\\(\\lim_{x\\to0^+}|x|=0\\)','Konečná oboustranná limita je 0.','Přestože se graf zleva a zprava liší směrnicí, hodnoty se blíží ke stejnému číslu.']
};
function drawSides(){
 const mode=sidecase,p=plot($('#sidesCanvas'),{xMin:-3,xMax:3,yMin:mode==='pole'?-6:-1,yMax:mode==='pole'?6:mode==='positive'?9:5,xStep:1,yStep:mode==='positive'?2:1});
 line(p,0,p.bounds?.yMin||-8,0,10,'#b9cabd',1,[4,5]);
 if(mode==='jump'){
  line(p,-3,1,0,1,COLORS.green,3.5);line(p,0,3,3,3,COLORS.orange,3.5);point(p,0,1,COLORS.green,true,7);point(p,0,3,COLORS.orange,false,7);
  point(p,-.85,1,COLORS.green);point(p,.85,3,COLORS.orange);
 }else if(mode==='meet'){
  curve(p,x=>Math.abs(x),-3,0,COLORS.green,3.5);curve(p,x=>Math.abs(x),0,3,COLORS.orange,3.5);
  point(p,0,0,COLORS.ink,false,5);point(p,-.85,.85,COLORS.green);point(p,.85,.85,COLORS.orange);
 }else{
  const f=mode==='pole'?x=>1/x:x=>1/(x*x);
  curve(p,f,-3,-.005,COLORS.green,3.4);curve(p,f,.005,3,COLORS.orange,3.4);
  point(p,-1,f(-1),COLORS.green);point(p,1,f(1),COLORS.orange);
 }
 p.done();const d=sideData[mode];
 $('#sideTitle').textContent=d[0];$('#sideLeft').innerHTML=d[1];$('#sideRight').innerHTML=d[2];$('#sideVerdict').textContent=d[3];$('#sideExplanation').textContent=d[4];
 $$('[data-sidecase]').forEach(b=>b.classList.toggle('active',b.dataset.sidecase===mode));math();
}
function renderTable(){
 const count=Number($('#precisionRange').value);$('#precisionValue').textContent=String(count);
 const tbody=$('#limitTable');tbody.replaceChildren();
 for(let n=1;n<=count;n++){
  const d=Math.pow(10,-n);
  for(const sign of [-1,1]){
   const row=document.createElement('tr');
   const vals=[sign<0?'Zleva  ←':'Zprava  →',number(1+sign*d,n+1),number(2+sign*d,n+1),number(d,n+1)];
   vals.forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell)});
   tbody.appendChild(row);
  }
 }
}
const methods={
 direct:{category:'SPOJITÁ FUNKCE',title:'Přímé dosazení',tex:'\\(\\displaystyle\\lim_{x\\to2}(3x-1)\\)',prompt:'Je funkce v bodě spojitá, takže můžeš rovnou dosadit?',steps:[
  ['Poznej funkci','\\(f(x)=3x-1\\)','Polynom je spojitý v každém reálném bodě.'],
  ['Dosaď a vyhodnoť','\\(\\displaystyle 3\\cdot2-1=\\boxed{5}\\)','Limita se rovná hodnotě spojité funkce v bodě.']]},
 factor:{category:'NEURČITÝ TVAR 0 / 0',title:'Rozlož. Zkrať. Dosaď.',tex:'\\(\\displaystyle\\lim_{x\\to1}\\frac{x^2-1}{x-1}\\)',prompt:'Co znamená, když přímým dosazením dostaneš 0/0?',steps:[
  ['Nejdříve dosaď','\\(\\displaystyle\\frac{1-1}{1-1}=\\frac00\\)','To není číslo 0 ani důkaz neexistence limity. Je to neurčitý tvar.'],
  ['Rozlož čitatel','\\(\\displaystyle x^2-1=(x-1)(x+1)\\)','Použij vzorec pro rozdíl druhých mocnin.'],
  ['Zkrať pouze pro x ≠ 1','\\(\\displaystyle\\frac{(x-1)(x+1)}{x-1}=x+1\\quad(x\\ne1)\\)','Krácení v samotném bodě není dovoleno, ale limita sleduje jeho okolí.'],
  ['Vypočítej limitu','\\(\\displaystyle\\lim_{x\\to1}(x+1)=\\boxed2\\)','Původní a zjednodušená funkce jsou v proraženém okolí stejné.']]},
 root:{category:'RACIONALIZACE',title:'Odstraň odmocninu',tex:'\\(\\displaystyle\\lim_{x\\to0}\\frac{\\sqrt{x+4}-2}{x}\\)',prompt:'Opět 0/0. Co udělá rozšíření sdruženým výrazem?',steps:[
  ['Dosazení nerozhoduje','\\(\\displaystyle\\frac{\\sqrt4-2}{0}=\\frac00\\)','Neurčitý tvar ještě není výsledná limita.'],
  ['Rozšiř sdruženým výrazem','\\(\\displaystyle\\frac{\\sqrt{x+4}-2}{x}\\cdot\\frac{\\sqrt{x+4}+2}{\\sqrt{x+4}+2}\\)','Použij vztah (a−b)(a+b)=a²−b².'],
  ['Zjednoduš zlomek','\\(\\displaystyle\\frac{x+4-4}{x(\\sqrt{x+4}+2)}=\\frac1{\\sqrt{x+4}+2}\\)','Rovnost platí pro x ≠ 0 v definičním oboru.'],
  ['Teď dosaď','\\(\\displaystyle\\frac1{2+2}=\\boxed{\\frac14}\\)','Úprava odstranila neurčitý tvar.']]},
 infty:{category:'LIMITA V NEKONEČNU',title:'Nejvyšší mocnina rozhoduje',tex:'\\(\\displaystyle\\lim_{x\\to+\\infty}\\frac{2x+3}{x+1}\\)',prompt:'Co zůstane, když argumenty porostou bez omezení?',steps:[
  ['Vyděl čitatel a jmenovatel x','\\(\\displaystyle\\frac{2+\\frac3x}{1+\\frac1x}\\)','Pro x→+∞ je x nenulové; tato úprava je v pořádku.'],
  ['Pozoruj mizící členy','\\(\\displaystyle\\frac3x\\to0,\\qquad\\frac1x\\to0\\)','Nižší mocniny ve srovnání s nejvyšší mizí.'],
  ['Vyhodnoť výsledný podíl','\\(\\displaystyle\\frac{2+0}{1+0}=\\boxed2\\)','Graf má vodorovnou asymptotu y=2.']]}
};
function methodUpdate(){
 const m=methods[method];$('#methodCategory').textContent=m.category;$('#methodTitle').textContent=m.title;$('#methodExpression').innerHTML=m.tex;$('#methodPrompt').textContent=m.prompt;
 $('#stepCounter').textContent=step+' / '+m.steps.length;$('#nextStep').disabled=step>=m.steps.length;$('#nextStep').innerHTML=step>=m.steps.length?'Celé řešení odkryto ✓':'Odkrýt další krok <span>→</span>';
 const root=$('#methodSteps');root.replaceChildren();
 for(let i=0;i<step;i++){
  const s=m.steps[i],el=document.createElement('article');el.className='step'+(i===m.steps.length-1?' final':'');
  el.innerHTML='<div class="step-no">KROK '+String(i+1).padStart(2,'0')+'</div><strong>'+s[0]+'</strong><div class="step-math">'+s[1]+'</div><p>'+s[2]+'</p>';root.appendChild(el);
 }
 $$('[data-method]').forEach(b=>b.classList.toggle('active',b.dataset.method===method));math();
}
function drawInfinity(){
 const x=Math.pow(10,Number($('#infinityRange').value)),y=(2*x+3)/(x+1),err=y-2;
 $('#infinityX').textContent=number(x,2);$('#infinityY').textContent=number(y,7);$('#infinityError').textContent=number(err,7);
 const xMax=Math.max(16,1.25*x);
 const p=plot($('#infinityCanvas'),{xMin:0,xMax,yMin:1.82,yMax:3.28,xStep:Math.max(1,Math.pow(10,Math.floor(Math.log10(xMax)))/2),yStep:.2});
 line(p,0,2,xMax,2,COLORS.orange,1.7,[7,5]);
 curve(p,t=>(2*t+3)/(t+1),0,xMax,COLORS.green,3.3);point(p,x,y,COLORS.orange,false,6);
 if(xMax<30)textOn(p,'f(x)',2,2.5,COLORS.green);
 backgroundLabel(p,'y = 2',COLORS.orange);p.done();
}
function drawEpsilon(){
 const epsilon=Number($('#epsilonRange').value),delta=Number($('#deltaRange').value),good=2*delta<=epsilon+1e-8;
 $('#epsilonValue').textContent=number(epsilon,2);$('#deltaValue').textContent=number(delta,2);
 $('#epsilonStatus').textContent=good?'Vyhovuje. Pro všechna 0 < |x−1| < δ je |f(x)−3| < ε.':'Příliš široké okolí. Na okraji by výstup překročil toleranci ε.';
 $('#epsilonStatus').classList.toggle('bad',!good);
 const p=plot($('#epsilonCanvas'),{xMin:0,xMax:2,yMin:1,yMax:5,xStep:.5,yStep:1});
 const{ctx,X,Y}=p;
 ctx.fillStyle='rgba(205,153,83,.17)';ctx.fillRect(p.l,Y(3+epsilon),p.r-p.l,Y(3-epsilon)-Y(3+epsilon));
 ctx.fillStyle='rgba(58,137,100,.13)';ctx.fillRect(X(1-delta),p.t,X(1+delta)-X(1-delta),p.b-p.t);
 line(p,0,3,2,3,COLORS.orange,1,[5,5]);line(p,1,1,1,5,COLORS.green,1,[5,5]);
 line(p,1-delta,1,1-delta,5,COLORS.green,1.1,[3,5]);line(p,1+delta,1,1+delta,5,COLORS.green,1.1,[3,5]);
 line(p,0,3-epsilon,2,3-epsilon,COLORS.orange,1,[3,4]);line(p,0,3+epsilon,2,3+epsilon,COLORS.orange,1,[3,4]);
 curve(p,x=>2*x+1,0,2,COLORS.green,3.5);point(p,1,3,COLORS.orange,false,6);
 textOn(p,'(a, L)',1,3,COLORS.ink);p.done();
}
const quiz=[
 {q:'Funkce \\(\\frac{x^2-1}{x-1}\\) není definovaná v \\(x=1\\). Jaká je její limita?',a:['Neexistuje','0','2','1'],correct:2,why:'Pro x ≠ 1 platí f(x)=x+1. Limita proto vychází 2; samotná díra nevadí.'},
 {q:'Co se stane s limitou, když definujeme \\(f(1)=5\\), ale pro \\(x\\ne1\\) ponecháme \\(f(x)=x+1\\)?',a:['Změní se na 5','Zůstane 2','Přestane existovat','Změní se na 1'],correct:1,why:'Změna jediné hodnoty nemění průběh v proraženém okolí bodu.'},
 {q:'Zleva se funkce blíží k 1, zprava k 3. Existuje její konečná oboustranná limita?',a:['Ano, 2','Ano, 3','Ne','Ano, 1'],correct:2,why:'Konečná oboustranná limita vyžaduje shodné jednostranné limity.'},
 {q:'Při dosazení do podílu vyjde neurčitý tvar \\(0/0\\). Co je správný další krok?',a:['Výsledek je nula','Limita neexistuje','Výsledek je nekonečno','Zkusit vhodnou algebraickou úpravu'],correct:3,why:'Podíl 0/0 o limitě sám o sobě nerozhoduje. Pokračuj rozkladem, racionalizací nebo jinou vhodnou metodou.'},
 {q:'Jaká je \\(\\displaystyle\\lim_{x\\to+\\infty}\\frac{2x+3}{x+1}\\)?',a:['2','0','+∞','3'],correct:0,why:'Po dělení x se získá (2+3/x)/(1+1/x) → 2.'},
 {q:'Pro \\(f(x)=1/x\\) a \\(x\\to0\\) platí:',a:['Limita je 0','Limita je +∞ z obou stran','Oboustranná limita neexistuje','Limita je −∞ z obou stran'],correct:2,why:'Zleva funkce klesá k −∞, zprava roste k +∞. Není společný oboustranný výsledek.'}
];
const answered=new Map();
function renderQuiz(){
 const container=$('#quizQuestions');container.replaceChildren();
 quiz.forEach((q,i)=>{
  const article=document.createElement('article');article.className='quiz-item';
  const meta=document.createElement('div');meta.className='quiz-meta';meta.textContent='OTÁZKA '+String(i+1).padStart(2,'0')+' / 06';article.appendChild(meta);
  const heading=document.createElement('h3');heading.innerHTML=q.q;article.appendChild(heading);
  const options=document.createElement('div');options.className='quiz-options';
  q.a.forEach((option,j)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=String.fromCharCode(65+j)+'  /  '+option;
   if(answered.has(i)){btn.disabled=true;if(j===q.correct)btn.classList.add('correct');else if(answered.get(i)===j)btn.classList.add('incorrect');}
   btn.addEventListener('click',()=>{if(answered.has(i))return;answered.set(i,j);renderQuiz();});options.appendChild(btn);
  });article.appendChild(options);
  if(answered.has(i)){const fb=document.createElement('div'),ok=answered.get(i)===q.correct;fb.className='quiz-feedback'+(ok?'':' bad');fb.textContent=(ok?'Správně. ':'Zatím ne. ')+q.why;article.appendChild(fb);}
  container.appendChild(article);
 });
 const correct=Array.from(answered).filter(([i,a])=>a===quiz[i].correct).length;
 $('#quizScore').textContent=correct+' / '+quiz.length;
 $('#quizMessage').textContent=answered.size===quiz.length?'Hotovo. Máš '+correct+' z '+quiz.length+' správně. Opravené odpovědi zůstávají viditelné.':'Zodpovězeno '+answered.size+' z '+quiz.length+' otázek.';
 math();
}
function bind(){
 $$('[data-direction]').forEach(b=>b.addEventListener('click',()=>{direction=b.dataset.direction;clearInterval(animation);animation=null;$('#animateApproach').textContent='Spustit přibližování ↗';renderApproach();}));
 $('#approachRange').addEventListener('input',()=>{clearInterval(animation);animation=null;$('#animateApproach').textContent='Spustit přibližování ↗';renderApproach()});
 $('#animateApproach').addEventListener('click',()=>{
  if(animation){clearInterval(animation);animation=null;$('#animateApproach').textContent='Spustit přibližování ↗';return;}
  $('#approachRange').value='0';renderApproach();$('#animateApproach').textContent='Zastavit animaci II';
  animation=setInterval(()=>{const input=$('#approachRange');input.value=String(Number(input.value)+1);renderApproach();if(Number(input.value)>=5){clearInterval(animation);animation=null;$('#animateApproach').textContent='Spustit znovu ↗';}},550);
 });
 $$('[data-case]').forEach(b=>b.addEventListener('click',()=>{scenario=b.dataset.case;drawCase()}));
 $$('[data-sidecase]').forEach(b=>b.addEventListener('click',()=>{sidecase=b.dataset.sidecase;drawSides()}));
 $('#precisionRange').addEventListener('input',renderTable);
 $$('[data-method]').forEach(b=>b.addEventListener('click',()=>{method=b.dataset.method;step=0;methodUpdate()}));
 $('#nextStep').addEventListener('click',()=>{step=Math.min(methods[method].steps.length,step+1);methodUpdate()});
 $('#resetSteps').addEventListener('click',()=>{step=0;methodUpdate()});
 $('#infinityRange').addEventListener('input',drawInfinity);
 $('#epsilonRange').addEventListener('input',drawEpsilon);$('#deltaRange').addEventListener('input',drawEpsilon);
 $('#resetQuiz').addEventListener('click',()=>{answered.clear();renderQuiz()});
 let resizeTimeout;window.addEventListener('resize',()=>{clearTimeout(resizeTimeout);resizeTimeout=setTimeout(drawAll,150)});
 const bar=$('#scrollProgress');
 const updateScroll=()=>{const height=document.documentElement.scrollHeight-window.innerHeight;bar.style.width=(height>0?100*window.scrollY/height:0)+'%';};
 window.addEventListener('scroll',updateScroll,{passive:true});updateScroll();
 const sections=$$('main section[id]');
 if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('#chapterNav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));}})},{rootMargin:'-15% 0px -70% 0px',threshold:0});
  sections.forEach(s=>observer.observe(s));
 }
}
function drawAll(){drawHero();renderApproach();drawCase();drawSides();drawInfinity();drawEpsilon()}
document.addEventListener('DOMContentLoaded',()=>{bind();renderTable();methodUpdate();renderQuiz();drawAll()});