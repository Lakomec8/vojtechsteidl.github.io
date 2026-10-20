import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const html=readFileSync(resolve(root,"interactive-notes/limits/index.html"),"utf8");
const css=readFileSync(resolve(root,"interactive-notes/limits/style.css"),"utf8");
const js=readFileSync(resolve(root,"interactive-notes/limits/app.js"),"utf8");
new vm.Script(js,{filename:"interactive-notes/limits/app.js"});
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,"All HTML IDs unique");
for(const id of ["heroCanvas","approachCanvas","caseCanvas","sidesCanvas","infinityCanvas","epsilonCanvas","limitTable","quizQuestions","methodSteps"])assert(ids.includes(id),"Missing "+id);
assert.equal((html.match(/<canvas\b/g)||[]).length,6,"Six different graphs");
assert.match(css,/@media\(max-width:750px\)/);
assert.match(css,/prefers-reduced-motion/);
assert.match(html,/MathJax/);

const nodes=new Map();
function element(id,dataset={}){
 const noop=()=>{};
 const canvas={setTransform:noop,clearRect:noop,fillRect:noop,beginPath:noop,rect:noop,clip:noop,save:noop,restore:noop,stroke:noop,fill:noop,lineTo:noop,moveTo:noop,arc:noop,setLineDash:noop,fillText:noop};
 return {
  id,dataset,value:"",textContent:"",innerHTML:"",className:"",disabled:false,clientWidth:650,clientHeight:390,children:[],style:{},events:{},
  classList:{toggle:noop,add:noop,remove:noop},
  addEventListener(event,handler){this.events[event]=handler;},
  getAttribute(name){if(name==="href")return this.href;return null;},
  getContext(){return canvas;},
  appendChild(child){this.children.push(child);return child;},
  replaceChildren(...children){this.children=[...children];},
  click(){this.events.click?.({target:this})},
  input(){this.events.input?.({target:this})}
 };
}
function get(id){if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)}
const inputs={approachRange:1,precisionRange:3,infinityRange:1,epsilonRange:.6,deltaRange:.2};
Object.entries(inputs).forEach(([id,v])=>get(id).value=String(v));
const groups={};
for(const prop of ["direction","case","sidecase","method"]){
 groups["[data-"+prop+"]"]=[...html.matchAll(new RegExp('data-'+prop+'="([^"]+)"','g'))].map((match,i)=>element(prop+i,{[prop]:match[1]}));
}
groups["#chapterNav a"]=[];groups["main section[id]"]=[];
let onReady;
const doc={
 querySelector(selector){return selector.startsWith("#")?get(selector.slice(1)):null;},
 querySelectorAll(selector){return groups[selector]||[];},
 createElement(tag){return element(tag);},
 addEventListener(event,handler){if(event==="DOMContentLoaded")onReady=handler;},
 documentElement:{scrollHeight:2000}
};
const fakeWindow={devicePixelRatio:1,innerHeight:900,scrollY:50,addEventListener(){}};
vm.runInNewContext(js,{document:doc,window:fakeWindow,setInterval:()=>1,clearInterval:()=>{},Intl,Number,Math,Array,Map,Set},{timeout:10000});
assert.equal(typeof onReady,"function","DOM ready handler installed");
onReady();
assert.equal(get("approachX").textContent,"0,9");
assert.equal(get("approachY").textContent,"1,9");
groups["[data-direction]"][1].click();
assert.equal(get("approachX").textContent,"1,1","Approach changes sides");
get("approachRange").value="5";get("approachRange").input();
assert.equal(get("approachError").textContent,"0,00001","Logarithmic proximity");
groups["[data-case]"][2].click();
assert.match(get("caseValue").innerHTML,/f\(1\)=4/,"Different function value");
groups["[data-sidecase]"][1].click();
assert.match(get("sideVerdict").textContent,/neexistuje/,"Pole has opposing infinities");
groups["[data-sidecase]"][2].click();
assert.match(get("sideVerdict").textContent,/\+∞/,"Positive infinity on both sides");
get("precisionRange").value="6";get("precisionRange").input();
assert.equal(get("limitTable").children.length,12,"Six left and right numeric pairs");
groups["[data-method]"][1].click();
for(let i=0;i<4;i++)get("nextStep").click();
assert.equal(get("stepCounter").textContent,"4 / 4","Factorization completed");
assert.equal(get("methodSteps").children.length,4);
get("infinityRange").value="4";get("infinityRange").input();
assert.equal(get("infinityX").textContent,"10000");
assert(Math.abs(Number(get("infinityError").textContent.replace(",","."))-.00009999)<.0000005);
get("epsilonRange").value=".2";get("epsilonRange").input();
get("deltaRange").value=".9";get("deltaRange").input();
assert.match(get("epsilonStatus").textContent,/Příliš široké/,"Delta comparison warns");
const first=get("quizQuestions").children[0];
first.children[2].children[2].click();
assert.equal(get("quizScore").textContent,"1 / 6","Quiz scoring correct");
get("resetQuiz").click();
assert.equal(get("quizScore").textContent,"0 / 6","Quiz reset works");
console.log("Premium limits interactive: static checks + 11 interaction assertions passed.");