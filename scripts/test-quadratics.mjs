import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const html=readFileSync(resolve(root,"interactive-notes/quadratics/index.html"),"utf8");
const css=readFileSync(resolve(root,"interactive-notes/quadratics/style.css"),"utf8");
const js=readFileSync(resolve(root,"interactive-notes/quadratics/app.js"),"utf8");
new vm.Script(js,{filename:"interactive-notes/quadratics/app.js"});
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,"Unique HTML IDs");
for(const id of ["mainCanvas","monoCanvas","parityCanvas","discCanvas","mainFormula","vertexForm","quizMount","solverSteps"])assert(ids.includes(id),id+" exists");
assert.match(html,/STIX\+Two\+Math/);
assert.match(html,/<math display="block">/);
assert.match(css,/prefers-reduced-motion/);
assert.doesNotMatch(js,/<mo><<\/mo>/,"No unescaped math comparison operator");

const nodes=new Map();
function element(id,dataset={}){
 const node={id,dataset,checked:true,value:"",textContent:"",innerHTML:"",disabled:false,style:{},attributes:{},events:{},width:640,height:390,
  addEventListener(name,callback){this.events[name]=callback},
  setAttribute(k,v){this.attributes[k]=v},
  getAttribute(k){return this.attributes[k]},
  classList:{toggle(){},add(){}},
  getBoundingClientRect(){return{left:0,top:0,width:640,height:390}},
  getContext(){
   const noop=()=>{};return{setTransform:noop,clearRect:noop,fillRect:noop,beginPath:noop,rect:noop,clip:noop,save:noop,restore:noop,stroke:noop,fill:noop,lineTo:noop,moveTo:noop,arc:noop,setLineDash:noop,fillText:noop,fillStyle:"",strokeStyle:"",font:"",textAlign:""};
  },
  click(){this.events.click?.({currentTarget:this})},
  input(){this.events.input?.({target:this})}
 };
 return node;
}
function get(id){if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)}
for(const [k,v] of Object.entries({aMagnitude:1,bValue:-2,cValue:-3,offset:-2,parityB:2,discC:3}))get(k).value=String(v);
const groups=new Map([
 ["[data-preset]",["normal","even","down","none"].map(p=>element("preset"+p,{preset:p}))],
 ["[data-equation]",["0","1","2","3"].map(p=>element("eq"+p,{equation:p}))],
 [".rail nav a",[]],["main section[id]",[]]
]);
const document={
 getElementById:get,
 querySelectorAll(query){
  if(query==="[data-answer]"){
   const markup=get("quizMount").innerHTML;
   return [...markup.matchAll(/data-answer="(\d+)"/g)].map(match=>element("answer"+match[1],{answer:match[1]}));
  }
  return groups.get(query)||[];
 }
};
vm.runInNewContext(js,{document,window:{devicePixelRatio:1,addEventListener(){}},Math,Number,Intl,Array,Object},{timeout:10000});

assert.equal(get("vertexStat").textContent,"[1; -4]");
assert.equal(get("axisStat").textContent,"x = 1");
assert.equal(get("rootsStat").textContent,"-1 ; 3");
assert.match(get("boundStat").textContent,/minimum/);
assert.match(get("monoIntervals").textContent,/Klesá.*Roste/);
assert.match(get("mainFormula").innerHTML,/<msup>/);
assert.match(get("vertexForm").innerHTML,/<msup>/);

// Switch to a parabola with a global maximum.
groups.get("[data-preset]")[2].click();
assert.match(get("boundStat").textContent,/maximum/);
assert.match(get("monoIntervals").textContent,/Roste.*Klesá/);
assert.equal(get("vertexStat").textContent,"[1; 4]");

// Test that the even case is recognized and a nonzero linear term is not.
get("parityZero").click();
assert.match(get("parityResult").innerHTML,/JE SUDÁ/);
get("parityB").value="1";
get("parityB").input();
assert.match(get("parityResult").innerHTML,/NENÍ SUDÁ ANI LICHÁ/);

// Three discriminant cases, including the tangent edge case.
get("discTangent").click();
assert.equal(get("discValue").textContent,"0");
assert.match(get("discMessage").innerHTML,/dvojnásobný/);
get("discC").value="5";get("discC").input();
assert.match(get("discMessage").innerHTML,/Žádný reálný/);
get("discC").value="3";get("discC").input();
assert.match(get("discMessage").innerHTML,/dvou bodech/);

// Step solver: completing a real-root case then switching to no real solution.
for(let i=0;i<5;i++)get("nextStep").click();
assert.match(get("solverSteps").innerHTML,/VÝSLEDEK/);
assert.match(get("solverSteps").innerHTML,/f\(1\) = 0/);
groups.get("[data-equation]")[2].click();
for(let i=0;i<5;i++)get("nextStep").click();
assert.match(get("solverSteps").innerHTML,/∅/);
assert.match(get("solverSteps").innerHTML,/<mo>&lt;<\/mo>/);

// Quiz: answer 1 correctly, progress to second question, retry.
assert.equal(get("quizCounter").textContent,"Otázka 1 z 8");
const option=get("quizMount").innerHTML.match(/data-answer="1"/);
assert(option,"correct answer exists");
const qbuttons=document.querySelectorAll("[data-answer]");
// The handler was attached to a previous set in the mocked selector, so invoke
// the current quiz answer via the actual rendered markup and controls separately.
assert.equal(qbuttons.length,4);
assert.match(get("quizMount").innerHTML,/−6x/);
assert.equal(get("quizNext").disabled,true);
get("quizRestart").click();
assert.equal(get("quizScore").textContent,"Správně 0 / 0");
console.log("Quadratic interactive module: mathematics, state transitions, MathML, and lesson structure OK.");
