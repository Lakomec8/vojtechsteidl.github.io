'use strict';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const PALETTE={green:'#246853',orange:'#c18452',ink:'#243e37',grid:'#dde9df',axis:'#83968a',blue:'#4c7a8c'};
const fmt=n=>Number.isInteger(n)?String(n):Number(n.toFixed(3)).toLocaleString('cs-CZ',{maximumFractionDigits:3});
const signed=(n,variable='')=>n===0?'':(n>0?'+':'−')+Math.abs(n)+variable;
function tex(s){return '\\('+s+'\\)'}
function math(){if(window.MathJax&&window.MathJax.typesetPromise)window.MathJax.typesetPromise().catch(()=>{})}
function canvasCtx(id){const el=$('#'+id);if(!el)return null;const w=Math.max(260,el.clientWidth||500),h=Math.max(250,el.clientHeight||360),r=Math.min(window.devicePixelRatio||1,2);el.width=Math.round(w*r);el.height=Math.round(h*r);const c=el.getContext('2d');c.setTransform(r,0,0,r,0,0);c.clearRect(0,0,w,h);c.fillStyle='#fffefa';c.fillRect(0,0,w,h);return {c,w,h}}
function plot(id,domain,range,curves,point=null){const o=canvasCtx(id);if(!o)return;const {c,w,h}=o,L=42,R=w-18,T=23,B=h-34;
 const X=x=>L+(x-domain[0])*(R-L)/(domain[1]-domain[0]),Y=y=>B-(y-range[0])*(B-T)/(range[1]-range[0]);
 c.font='11px DM Sans,sans-serif';c.textBaseline='middle';c.textAlign='center';
 const stepX=domain[1]-domain[0]<=14?1:2,stepY=(range[1]-range[0]>18)?5:2;
 for(let x=Math.ceil(domain[0]/stepX)*stepX;x<=domain[1];x+=stepX){c.strokeStyle=PALETTE.grid;c.lineWidth=1;c.beginPath();c.moveTo(X(x),T);c.lineTo(X(x),B);c.stroke();c.fillStyle=PALETTE.axis;c.fillText(fmt(x),X(x),B+17)}
 c.textAlign='right';
 for(let y=Math.ceil(range[0]/stepY)*stepY;y<=range[1];y+=stepY){c.strokeStyle=PALETTE.grid;c.beginPath();c.moveTo(L,Y(y));c.lineTo(R,Y(y));c.stroke();c.fillStyle=PALETTE.axis;c.fillText(fmt(y),L-6,Y(y))}
 if(domain[0]<=0&&domain[1]>=0){c.strokeStyle='#a0b4a5';c.beginPath();c.moveTo(X(0),T);c.lineTo(X(0),B);c.stroke()}
 if(range[0]<=0&&range[1]>=0){c.strokeStyle='#a0b4a5';c.beginPath();c.moveTo(L,Y(0));c.lineTo(R,Y(0));c.stroke()}
 c.save();c.beginPath();c.rect(L,T,R-L,B-T);c.clip();
 for(const curve of curves){c.beginPath();for(let k=0;k<=360;k++){const x=domain[0]+(domain[1]-domain[0])*k/360,y=curve.f(x);if(k===0)c.moveTo(X(x),Y(y));else c.lineTo(X(x),Y(y))}c.strokeStyle=curve.color;c.lineWidth=3;c.stroke()}
 if(point&&point.x>=domain[0]&&point.x<=domain[1]&&point.y>=range[0]&&point.y<=range[1]){c.beginPath();c.fillStyle=PALETTE.ink;c.arc(X(point.x),Y(point.y),6,0,Math.PI*2);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke()}
 c.restore();
 if(point&&Number.isFinite(point.x)){c.textAlign='left';c.fillStyle=PALETTE.ink;c.font='bold 12px DM Sans,sans-serif';c.fillText('x = '+fmt(point.x),Math.max(L+8,Math.min(R-68,X(point.x)+10)),T+17)}
}
function hero(){plot('heroCanvas',[-1,8],[-2,19],[{f:x=>2*x+3,color:PALETTE.green},{f:()=>11,color:PALETTE.orange}],{x:4,y:11})}
function drawBalance(){const x=Number($('#balanceRange').value),a=2*x+3,b=11,d=a-b;$('#balanceX').textContent=fmt(x);$('#balanceLeft').textContent=fmt(a);$('#balanceRight').textContent='11';$('#balanceDiff').textContent=fmt(d);$('#balanceMath').innerHTML=tex('2\\cdot('+fmt(x)+')+3='+fmt(a)+(d===0?'=11':'\\ne 11'));$('#balanceStatus').textContent=d===0?'Rovnováha! x = 4 je řešením.':'Rovnice neplatí. Zkus se přiblížit x = 4.';
 $$('.balance-values span').forEach(e=>e.classList.toggle('ok',d===0));
 const o=canvasCtx('balanceCanvas');if(!o)return;const {c,w,h}=o;const mid=w/2, cy=h*.42,span=Math.min(160,w*.32),angle=Math.max(-.22,Math.min(.22,d*.028)),lx=mid-span*Math.cos(angle),ly=cy+span*Math.sin(angle),rx=mid+span*Math.cos(angle),ry=cy-span*Math.sin(angle);
 c.strokeStyle=PALETTE.ink;c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(mid,cy);c.lineTo(mid,h*.78);c.stroke();c.beginPath();c.moveTo(mid-40,h*.8);c.lineTo(mid+40,h*.8);c.stroke();
 c.lineWidth=6;c.beginPath();c.moveTo(lx,ly);c.lineTo(rx,ry);c.stroke();
 for(const [px,py,color,value,name] of [[lx,ly,PALETTE.green,a,'LEVÁ'],[rx,ry,PALETTE.orange,b,'PRAVÁ']]){c.strokeStyle='#82988b';c.lineWidth=2;c.beginPath();c.moveTo(px,py);c.lineTo(px,py+52);c.stroke();c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(px-48,py+52);c.lineTo(px+48,py+52);c.stroke();c.fillStyle=color;c.beginPath();c.ellipse(px,py+55,49,8,0,0,2*Math.PI);c.fill();c.font='700 12px DM Sans,sans-serif';c.fillStyle=PALETTE.ink;c.textAlign='center';c.fillText(name,px,py+86);c.font='700 30px Instrument Serif,serif';c.fillText(fmt(value),px,py+120)}
 c.fillStyle=d===0?PALETTE.green:PALETTE.orange;c.font='700 12px DM Sans,sans-serif';c.textAlign='center';c.fillText(d===0?'ROVNOVÁHA':'ROZDÍL: '+fmt(d),mid,25);math();
}
const story=[
 {title:'Roznásob závorku',formula:'3x-6+5=2x+4',why:'Každý člen v závorce násobíme trojkou: 3(x−2)=3x−6.'},
 {title:'Sečti konstanty',formula:'3x-1=2x+4',why:'Na levé straně platí −6+5=−1.'},
 {title:'Odečti 2x od obou stran',formula:'x-1=4',why:'Stejný výraz odečteme vlevo i vpravo, takže množina řešení zůstává stejná.'},
 {title:'Přičti 1 k oběma stranám',formula:'x=5',why:'Izolujeme neznámou. Tato úprava je ekvivalentní.'},
 {title:'Proveď zkoušku dosazením',formula:'3(5-2)+5=2\\cdot5+4\\quad\\Longrightarrow\\quad 14=14',why:'Do původní rovnice dosadíme x=5. Obě strany jsou rovny 14.'}
];let storyStep=0;
function renderStory(){const body=$('#stepBody');body.replaceChildren();story.slice(0,storyStep).forEach((s,i)=>{const el=document.createElement('article');el.className='step-item';el.innerHTML='<span>KROK '+String(i+1).padStart(2,'0')+'</span><strong>'+s.title+'</strong><div class="step-formula">'+tex(s.formula)+'</div><p>'+s.why+'</p>';body.appendChild(el)});$('#stepCounter').textContent=storyStep+' / '+story.length;$('#stepTitle').textContent=storyStep===story.length?'Dokončeno. Teď zkus podobnou rovnici sám.':'Každý krok má svůj důvod.';$('#nextStep').disabled=storyStep===story.length;math()}
const examples={
 brackets:{label:'01 / ZÁVORKY',title:'Roznásob a seskup stejné členy',equation:'2(x+3)-4=x+9',steps:[['Roznásob','2x+6-4=x+9','Dvojka násobí oba členy závorky.'],['Zjednoduš','2x+2=x+9','Sloučíme 6−4.'],['Odečti x a 2','x=7','Zkouška: 2(7+3)−4=16 a 7+9=16.']]},
 fractions:{label:'02 / ZLOMKY',title:'Odstraň jmenovatele bezpečně',equation:'\\frac{x-1}{3}+\\frac{x+2}{2}=4',steps:[['Násob celou rovnici 6','2(x-1)+3(x+2)=24','Nejmenší společný násobek 3 a 2 je 6.'],['Roznásob a uprav','2x-2+3x+6=24\\;\\Longleftrightarrow\\;5x+4=24','Na každý člen se musí správně rozdělit násobení.'],['Vyřeš a ověř','5x=20\\;\\Longleftrightarrow\\;x=4','Zkouška: (4−1)/3+(4+2)/2=1+3=4.']]},
 negative:{label:'03 / ZNAMÉNKA',title:'Mínus před závorkou mění obě znaménka',equation:'5-(2x-3)=2(x+1)',steps:[['Odstraň závorky','5-2x+3=2x+2','Před závorkou je −1: oba členy mění znaménko.'],['Uspořádej členy','8-2x=2x+2\\;\\Longleftrightarrow\\;6=4x','Odečti 2 a přičti 2x na obou stranách.'],['Vyděl čtyřmi','x=\\frac32','Zkouška: 5−(3−3)=5 a 2(1,5+1)=5.']]},
 word:{label:'04 / SLOVNÍ ÚLOHA',title:'Vyjádři situaci jedinou rovnicí',equation:'3x+40=190',steps:[['Pojmenuj neznámou','x=\\text{cena jednoho sešitu v Kč}','Tři stejné sešity a doprava za 40 Kč stojí 190 Kč.'],['Odstraň dopravu','3x=150','Od obou stran odečti 40 Kč.'],['Urči cenu a ověř','x=50','3·50+40=190 Kč, tedy jeden sešit stojí 50 Kč.']]}
};let chosen='brackets',exampleStep=0;
function renderExample(){const e=examples[chosen];$('#exampleLabel').textContent=e.label;$('#exampleTitle').textContent=e.title;$('#exampleEquation').innerHTML=tex(e.equation);$('#exampleCounter').textContent=exampleStep+' / '+e.steps.length;$('#exampleSteps').replaceChildren();e.steps.slice(0,exampleStep).forEach((s,i)=>{const el=document.createElement('article');el.className='step-item';el.innerHTML='<span>KROK '+String(i+1).padStart(2,'0')+'</span><strong>'+s[0]+'</strong><div class="step-formula">'+tex(s[1])+'</div><p>'+s[2]+'</p>';$('#exampleSteps').append(el)});$('#exampleNext').disabled=exampleStep===e.steps.length;$$('[data-example]').forEach(b=>b.classList.toggle('active',b.dataset.example===chosen));math()}
const vals=()=>['A','B','C','D'].map(k=>Number($('#coef'+k).value));
function coefficient(v,forX=true){if(v===0)return '0';if(forX)return (v===1?'':v===-1?'−':String(v))+'x';return fmt(v)}
function eqSide(a,b){if(a===0)return fmt(b);return coefficient(a)+(b===0?'':signed(b))}
function drawLines(){const [a,b,c,d]=vals();['A','B','C','D'].forEach((k,i)=>$('#val'+k).textContent=fmt([a,b,c,d][i]));$('#lineEquation').innerHTML=tex(eqSide(a,b)+'='+eqSide(c,d));const delta=a-c,offset=d-b;let x=null,y=null;
 if(delta!==0){x=offset/delta;y=a*x+b;$('#lineKind').textContent='jedno';$('#lineResult').textContent='x = '+fmt(x);$('#lineWhy').textContent='Různé směrnice přímek zaručují právě jeden průsečík.'}
 else if(b===d){$('#lineKind').textContent='nekonečně';$('#lineResult').textContent='x ∈ ℝ';$('#lineWhy').textContent='Stejná směrnice i absolutní člen: přímky splývají.'}
 else{$('#lineKind').textContent='žádné';$('#lineResult').textContent='∅';$('#lineWhy').textContent='Stejná směrnice, ale jiný absolutní člen: přímky jsou různé rovnoběžky.'}
 const mx=x!==null&&Math.abs(x)<=12?Math.max(7,Math.ceil(Math.abs(x))+2):7;const yr=Math.max(10,Math.min(32,Math.ceil(Math.max(Math.abs(a*mx+b),Math.abs(c*mx+d),Math.abs(y||0))*.8)));plot('linesCanvas',[-mx,mx],[-yr,yr],[{f:t=>a*t+b,color:PALETTE.green},{f:t=>c*t+d,color:PALETTE.orange}],x!==null?{x,y}:null);$$('[data-preset]').forEach(bt=>{const cases={one:[2,1,-1,4],none:[2,1,2,4],all:[2,1,2,1]};bt.classList.toggle('active',cases[bt.dataset.preset].every((n,i)=>n===[a,b,c,d][i]))});math()}
function drawParameter(){const a=Number($('#paramA').value),b=Number($('#paramB').value);$('#paramAVal').textContent=fmt(a);$('#paramBVal').textContent=fmt(b);$('#parameterEquation').innerHTML=tex(eqSide(a,b)+'=0');let point=null,message;if(a!==0){const x=-b/a;message='Jedno řešení: x = '+fmt(x)+'.';point={x,y:0}}else if(b===0){message='Nekonečně mnoho řešení: každé reálné x.'}else{message='Žádné řešení: nenulové číslo se nerovná nule.'}$('#parameterOutcome').textContent=message;plot('parameterCanvas',[-7,7],[-13,13],[{f:x=>a*x+b,color:PALETTE.green},{f:()=>0,color:PALETTE.orange}],point);math()}
const checkpoint=[
 {q:'Které x splňuje \\(2x+3=11\\)?',a:['2','3','4','8'],c:2,why:'Po odečtení 3 je 2x=8, tedy x=4.'},
 {q:'Jaký krok zachová řešení \\(x+7=12\\)?',a:['Odečíst 7 na obou stranách','Odečíst 7 pouze vlevo','Vynásobit jednu stranu dvěma','Dělit obě strany nulou'],c:0,why:'Stejnou hodnotu odečítáme od obou stran.'},
 {q:'Jak roznásobíš \\(3(x-2)\\)?',a:['3x−2','3x+6','3x−6','x−6'],c:2,why:'Trojnásobek obou členů: 3x−6.'},
 {q:'Kolik řešení má \\(2x+1=2x+4\\)?',a:['Jedno','Dvě','Žádné','Nekonečně'],c:2,why:'Po odečtení 2x by muselo platit 1=4, což je spor.'},
 {q:'Kolik řešení má \\(4(x+1)=4x+4\\)?',a:['Žádné','Jedno','Čtyři','Nekonečně mnoho'],c:3,why:'Po roznásobení jsou obě strany totožné.'},
 {q:'Co násobíš při odstraňování jmenovatelů v \\(\\frac{x}{2}+\\frac13=4\\)?',a:['Jen první zlomek','Jen druhý zlomek','Každý člen na obou stranách','Jen pravou stranu'],c:2,why:'Násobení musí platit pro celou rovnici.'},
 {q:'Co vyjde z \\(-3x=12\\)?',a:['x=4','x=−4','x=9','x=−9'],c:1,why:'Dělíme obě strany −3, tedy x=−4.'},
 {q:'Přímky \\(y=3x+1\\) a \\(y=3x−5\\) mají:',a:['Jeden průsečík','Dva průsečíky','Žádný průsečík','Všechny body společné'],c:2,why:'Stejná směrnice, jiný absolutní člen: rovnoběžky.'}
];const answers=new Map();
function renderQuiz(){const target=$('#quizArea');target.replaceChildren();checkpoint.forEach((q,i)=>{const item=document.createElement('article');item.className='quiz-card';item.innerHTML='<div class="quiz-top">ÚLOHA '+String(i+1).padStart(2,'0')+' / 08</div><h3>'+q.q+'</h3>';const options=document.createElement('div');options.className='quiz-buttons';q.a.forEach((a,j)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=String.fromCharCode(65+j)+' · '+a;if(answers.has(i)){btn.disabled=true;if(j===q.c)btn.classList.add('correct');else if(answers.get(i)===j)btn.classList.add('incorrect')}btn.addEventListener('click',()=>{if(answers.has(i))return;answers.set(i,j);renderQuiz()});options.appendChild(btn)});item.appendChild(options);if(answers.has(i)){const feedback=document.createElement('p'),ok=answers.get(i)===q.c;feedback.className='quiz-feedback '+(ok?'ok':'bad');feedback.textContent=(ok?'Správně. ':'Zatím ne. ')+q.why;item.appendChild(feedback)}target.appendChild(item)});const score=Array.from(answers.entries()).filter(([i,v])=>v===checkpoint[i].c).length;$('#quizSummary').textContent=score+' z '+checkpoint.length+' správně · '+answers.size+' zodpovězeno';math()}
function bind(){
 $('#balanceRange').addEventListener('input',drawBalance);$('#balanceReveal').addEventListener('click',()=>{$('#balanceRange').value='4';drawBalance()});
 $('#nextStep').addEventListener('click',()=>{storyStep=Math.min(story.length,storyStep+1);renderStory()});$('#resetSteps').addEventListener('click',()=>{storyStep=0;renderStory()});
 $$('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{const values={one:[2,1,-1,4],none:[2,1,2,4],all:[2,1,2,1]}[btn.dataset.preset];['A','B','C','D'].forEach((k,i)=>$('#coef'+k).value=values[i]);drawLines()}));
 ['A','B','C','D'].forEach(k=>$('#coef'+k).addEventListener('input',drawLines));
 $$('[data-example]').forEach(b=>b.addEventListener('click',()=>{chosen=b.dataset.example;exampleStep=0;renderExample()}));
 $('#exampleNext').addEventListener('click',()=>{exampleStep=Math.min(examples[chosen].steps.length,exampleStep+1);renderExample()});$('#exampleReset').addEventListener('click',()=>{exampleStep=0;renderExample()});
 $('#paramA').addEventListener('input',drawParameter);$('#paramB').addEventListener('input',drawParameter);
 $$('[data-mistake]').forEach(b=>b.addEventListener('click',()=>{const el=$('#'+b.dataset.mistake);el.hidden=!el.hidden;b.textContent=el.hidden?'Zobrazit rozbor →':'Skrýt rozbor ↑'}));
 $('#quizReset').addEventListener('click',()=>{answers.clear();renderQuiz()});
 window.addEventListener('resize',()=>{hero();drawBalance();drawLines();drawParameter()},{passive:true});
 window.addEventListener('scroll',()=>{const total=document.documentElement.scrollHeight-innerHeight;$('#progress').style.width=(total>0?100*scrollY/total:0)+'%';const chapters=$$('main section[id]');let active='uvod';chapters.forEach(el=>{if(el.getBoundingClientRect().top<180)active=el.id});$$('.sidebar nav a').forEach(a=>a.classList.toggle('current',a.hash==='#'+active))},{passive:true});
}
document.addEventListener('DOMContentLoaded',()=>{bind();hero();drawBalance();renderStory();drawLines();renderExample();drawParameter();renderQuiz()});
