import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const html=readFileSync(resolve(root,"interactive-notes/fractions/index.html"),"utf8");
const js=readFileSync(resolve(root,"interactive-notes/fractions/app.js"),"utf8");
new vm.Script(js,{filename:"fractions/app.js"});
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,"HTML IDs must be unique");
for(const required of ["pochopeni","rozsirovani","kraceni","porovnavani","jednotky","overeni"])assert(ids.includes(required),"Missing "+required);
assert(html.includes("<math"),"MathML equations must be typeset semantically");
assert(html.includes("Instrument+Serif"),"Editorial serif font is missing");
assert(html.includes('id="practiceQuestions"'),"Practice is missing");

const nodes=new Map(),groups=new Map();
function createElement(id, dataset={}){
  return {
    id,dataset,value:"",max:"",innerHTML:"",textContent:"",hidden:false,disabled:false,style:{},attributes:{},events:{},dynamicButtons:[],
    classList:{toggle(){}},
    addEventListener(type,handler){this.events[type]=handler},
    setAttribute(name,value){this.attributes[name]=value},
    getAttribute(name){return this.attributes[name]},
    querySelectorAll(selector){
      if(this.id==="divisorButtons" && selector==="button"){
        this.dynamicButtons=[...this.innerHTML.matchAll(/data-divisor="(\d+)"/g)].map(m=>createElement("divisor-"+m[1],{divisor:m[1]}));
        return this.dynamicButtons;
      }
      if(this.id==="practiceQuestions" && selector==="button:not(:disabled)"){
        this.dynamicButtons=[...this.innerHTML.matchAll(/<button[^>]*data-question="(\d+)"[^>]*data-option="(\d+)"[^>]*>/g)]
          .filter(m=>!m[0].includes("disabled")).map(m=>createElement("option-"+m[1]+"-"+m[2],{question:m[1],option:m[2]}));
        return this.dynamicButtons;
      }
      return [];
    },
    click(){this.events.click?.()},
    input(){this.events.input?.()}
  };
}
function node(id){if(!nodes.has(id))nodes.set(id,createElement(id));return nodes.get(id)}
for(const [id,value] of Object.entries({
 meaningD:4,meaningN:3,factorSlider:3,
 compareDA:4,compareNA:3,compareDB:6,compareNB:4,
 unitD:5,unitN:2,unitAnswer:""
}))node(id).value=String(value);
function buttons(dataKey,values){return values.map(v=>createElement(dataKey+"-"+v,{[dataKey]:v}))}
groups.set(".scene-switch [data-view]",buttons("view",["circle","strip","tiles"]));
groups.set("[data-base]",buttons("base",["1/2","2/3","3/4","2/5"]));
groups.set("[data-start]",buttons("start",["12/18","18/24","15/25","21/28"]));
groups.set("[data-unit]",buttons("unit",["kg","m","l"]));
groups.set(".lesson-nav a",[]);
groups.set("main section[id]",[]);
const document={getElementById:node,querySelectorAll(selector){return groups.get(selector)||[]}};
vm.runInNewContext(js,{document,window:{},Intl,Math,Number,Array,Object},{timeout:5000});

assert.match(node("meaningFormula").innerHTML,/<mfrac>/);
assert.equal(node("meaningPercent").textContent,"75 %");
node("meaningD").value="8";node("meaningN").value="6";node("meaningN").input();
assert.equal(node("meaningPercent").textContent,"75 %");
assert.match(node("meaningInsight").textContent,/8 stejně velkých částí/);

groups.get("[data-base]")[2].click();node("factorSlider").value="4";node("factorSlider").input();
assert.match(node("equivRightMath").innerHTML,/<mn>12<\/mn><mn>16<\/mn>/);
assert.match(node("equivInsight").textContent,/75 %/);

let buttonsNow=node("divisorButtons").dynamicButtons;
buttonsNow.find(b=>b.dataset.divisor==="4").click();
assert.match(node("reduceFeedback").textContent,/nelze krátit/);
buttonsNow.find(b=>b.dataset.divisor==="6").click();
assert.match(node("reduceMath").innerHTML,/<mn>2<\/mn><mn>3<\/mn>/);
assert.match(node("reduceFeedback").textContent,/základním tvaru/);
node("reduceUndo").click();
assert.match(node("reduceMath").innerHTML,/<mn>12<\/mn><mn>18<\/mn>/);

assert(node("compareOutcome").innerHTML.includes("<mo>></mo>"));
node("unitAnswer").value="400";node("unitCheck").click();
assert.match(node("unitFeedback").textContent,/Správně/);
groups.get("[data-unit]")[1].click();node("unitD").value="4";node("unitN").value="1";node("unitN").input();
node("unitAnswer").value="25";node("unitCheck").click();
assert.match(node("unitFeedback").textContent,/Správně/);

const keys=[1,2,1,3];
for(let i=0;i<keys.length;i++){
  const control=node("practiceQuestions").dynamicButtons.find(b=>+b.dataset.question===i&&+b.dataset.option===keys[i]);
  assert(control,"Missing practice answer button "+i);
  control.click();
}
assert.equal(node("practiceScore").textContent,"4 / 4");
assert.equal(node("practiceProgress").style.width,"100%");
node("practiceReset").click();
assert.equal(node("practiceScore").textContent,"0 / 4");
console.log("Fractions lesson: HTML + MathML + six sections + interactive maths + 4/4 quiz OK.");
