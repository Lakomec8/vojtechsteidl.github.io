import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import * as M from "../interactive-notes/inequalities/math.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const folder=resolve(root,"interactive-notes/inequalities");
const html=readFileSync(resolve(folder,"index.html"),"utf8");
const css=readFileSync(resolve(folder,"style.css"),"utf8");
const app=readFileSync(resolve(folder,"app.mjs"),"utf8");
new vm.Script(app.replace(/^import .*? from "\.\/math\.mjs";\n/m,"const {intervalFromBounds,intersection,union,notation,linear,quadratic,rational,system,belongs,relation,endpoint} = _model;\n"),{filename:"inequalities/app.mjs"});
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,"Duplicate HTML IDs");
for(const id of ["linearCanvas","intervalCanvas","systemCanvas","productCanvas","rationalCanvas","quadraticCanvas","linearAnswer","systemIntersection","productSignTable","rationalAnswer","quizMount","nextStep"])assert(ids.includes(id),"Missing "+id);
for(const op of ["[data-linear-op]","[data-system-preset]","[data-product-op]","[data-rational-op]","[data-track]"])assert(html.includes(op.replace(/[\[\]]/g,"")),"Missing control "+op);
assert(html.includes("STIX+Two+Math"),"Math typeface missing");
assert(html.includes('type="module"'),"ES-module loading missing");
assert(css.includes("@media(max-width:580px)"),"Responsive layout missing");

const I=(lo,hi,li=false,ri=false)=>M.interval(lo,hi,li,ri);
const output=v=>M.notation(v);
const check=(got,want,description)=>assert.equal(output(got),want,description);
check([I(1,3,false,true)],"(1; 3⟩","Open versus closed");
check([I(3,3,true,true)],"{3}","Singleton");
check([I(3,3,true,false)],"∅","Degenerate empty interval");
check([I(5,1,true,true)],"∅","Reversed endpoints");
check([I(-Infinity,Infinity)],"ℝ","Real line");
check([M.intersection(I(-3,2,true,true),I(1,5,false,true))],"(1; 2⟩","Overlapping intersection");
check([M.intersection(I(-3,1,true,true),I(1,4,true,true))],"{1}","Closed common point");
check([M.intersection(I(-3,1,true,false),I(1,4,true,true))],"∅","Touching but open");
check(M.union([I(-2,1,false,false),I(1,5,true,true)]),"(-2; 5⟩","Union touching where one boundary included");
check(M.union([I(-2,1,false,false),I(1,5,false,true)]),"(-2; 1) ∪ (1; 5⟩","Union excluding a missing point");
assert(M.belongs(2,[I(2,3,true,false)]));assert(!M.belongs(3,[I(2,3,true,false)]));

check(M.linear(-2,4,">").parts,"(−∞; 2)","Negative division reverses");
check(M.linear(-3,6,"≤").parts,"⟨2; +∞)","Negative division reversed, closed endpoint");
check(M.linear(2,-4,"≥").parts,"⟨2; +∞)","Positive coefficient");
check(M.linear(1,2,"<").parts,"(−∞; -2)","Strict upper bound");
check(M.quadratic(1,-3,2,"≤").parts,"⟨-3; 2⟩","Quadratic nonpositive");
check(M.quadratic(1,-3,2,">").parts,"(−∞; -3) ∪ (2; +∞)","Quadratic positive");
check(M.quadratic(-1,-2,2,"≥").parts,"⟨-2; 2⟩","Negative leading coefficient");
check(M.quadratic(1,2,2,"<").parts,"∅","Squared polynomial strictly negative");
check(M.quadratic(1,2,2,"≤").parts,"{2}","Squared polynomial nonpositive");
check(M.quadratic(1,2,2,">").parts,"(−∞; 2) ∪ (2; +∞)","Squared polynomial strictly positive");
check(M.quadratic(-1,2,2,"≥").parts,"{2}","Negative square nonnegative");
check(M.rational(-2,2,"≥").parts,"(−∞; -2⟩ ∪ (2; +∞)","Rational pole excluded, zero included");
check(M.rational(1,-3,"≥").parts,"(−∞; -3) ∪ ⟨1; +∞)","Swapped roots of rational");
check(M.rational(2,2,">").parts,"(−∞; 2) ∪ (2; +∞)","Cancelled rational hole persists");
check(M.rational(2,2,"<").parts,"∅","Cancelled rational expression always positive on domain");
check(M.rational(2,2,"≤").parts,"∅","Cancelled rational expression always positive on domain");
check(M.rational(-2,2,"<").parts,"(-2; 2)","Strict rational negativity");
// General invariant sampled at and around all critical points: exact interval membership
// must agree with mathematical relations whenever f is defined.
for(const a of [-3,-1,1,2])for(const r1 of [-3,0,2])for(const r2 of [-2,0,3])for(const op of ["<","≤",">","≥"]){
 const parts=M.quadratic(a,r1,r2,op).parts;
 for(const x of [-6,-4,-3,-2,-1,0,1,2,3,4,6,r1,r2,(r1+r2)/2]){
  const expected=M.relation(a*(x-r1)*(x-r2),op);
  assert.equal(M.belongs(x,parts),expected,JSON.stringify({a,r1,r2,op,x,parts}));
 }
}
for(const u of [-3,0,3])for(const v of [-3,1,3])for(const op of ["<","≤",">","≥"]){
 const parts=M.rational(u,v,op).parts;
 for(const x of [-7,-4,-3,-2,-1,0,1,2,3,4,7,u,v]){
  const expected=Math.abs(x-v)<1e-9?false:M.relation((x-u)/(x-v),op);
  assert.equal(M.belongs(x,parts),expected,JSON.stringify({u,v,op,x}));
 }
}
// Smoke-render all six canvases against a DOM stub; UI should not depend on a network.
const nodes=new Map();
function element(id="",dataset={}){
 const el={id,dataset,value:"",checked:false,textContent:"",innerHTML:"",disabled:false,style:{},width:640,height:340,events:{},attrs:{},
 addEventListener(type,cb){this.events[type]=cb;},setAttribute(k,v){this.attrs[k]=v;},
 getBoundingClientRect(){return{width:640,height:340,left:0,top:0};},
 classList:{toggle(){}},
 getContext(){const nope=()=>{};return {setTransform:nope,clearRect:nope,fillRect:nope,beginPath:nope,arc:nope,fill:nope,stroke:nope,moveTo:nope,lineTo:nope,save:nope,restore:nope,setLineDash:nope,fillText:nope,rect:nope,clip:nope};},
 click(){this.events.click?.({target:this})},input(){this.events.input?.({target:this})},change(){this.events.change?.({target:this})}};
 return el;
}
function get(id){if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id);}
const groups=new Map([
 ["[data-linear-op]",[">","≥","<","≤"].map(v=>element("",{linearOp:v}))],
 ["[data-product-op]",[">","≥","<","≤"].map(v=>element("",{productOp:v}))],
 ["[data-leading]",["1","-1"].map(v=>element("",{leading:v}))],
 ["[data-rational-op]",[">","≥","<","≤"].map(v=>element("",{rationalOp:v}))],
 ["[data-system-preset]",["overlap","empty","point","inside"].map(v=>element("",{systemPreset:v}))],
 ["[data-solved]",["0","1","2","3","4"].map(v=>element("",{solved:v}))],
 ["[data-track]",["basic","challenge"].map(v=>element("",{track:v}))],
 [".rail nav a",[]],["main section[id]",[]],
 ["canvas",["linearCanvas","intervalCanvas","systemCanvas","productCanvas","rationalCanvas","quadraticCanvas"].map(get)]
]);
const document={getElementById:get,querySelectorAll(selector){
 if(selector==="[data-answer]")return [...get("quizMount").innerHTML.matchAll(/data-answer="(\d+)"/g)].map(m=>element("",{answer:m[1]}));
 return groups.get(selector)||[];
}};
const vmCode=app.replace(/^import .*? from "\.\/math\.mjs";\n/m,"const {intervalFromBounds,intersection,union,notation,linear,quadratic,rational,system,belongs,relation,endpoint} = _model;\n");
vm.runInNewContext(vmCode,{document,window:{devicePixelRatio:1,addEventListener(){}},_model:M,Math,Number,Array,Set,Intl},{timeout:10000});
assert.match(get("linearAnswer").textContent,/x < 2/);
assert.match(get("intervalAnswer").textContent,/−2; 3/);
assert.match(get("systemIntersection").textContent,/1; 2/);
assert.match(get("productAnswer").textContent,/−3; 2/);
assert.match(get("rationalAnswer").textContent,/−2/);
assert.match(get("productSignTable").innerHTML,/sign-table/);
assert.equal(get("quizCounter").textContent,"Otázka 1 z 8");
groups.get("[data-system-preset]")[2].click();
assert.equal(get("systemIntersection").textContent,"{1}");
groups.get("[data-system-preset]")[1].click();
assert.equal(get("systemIntersection").textContent,"∅");
get("intervalPoint").click();
assert.equal(get("intervalAnswer").textContent,"I = {2}");
get("rationalHole").click();
assert.match(get("rationalAnswer").textContent,/2\)/);
groups.get("[data-track]")[1].click();
assert.equal(get("quizCounter").textContent,"Otázka 1 z 8");
console.log("Inequalities: 6 interactive charts, interval algebra, 16 quiz prompts and exhaustive critical-point sign checks passed.");
