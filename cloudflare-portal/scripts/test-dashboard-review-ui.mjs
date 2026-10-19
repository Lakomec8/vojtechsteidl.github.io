import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../../", import.meta.url);
const dashboardJs = readFileSync(new URL("assets/student-dashboard-material-selfchecks.js", root), "utf8");
const modalJs = readFileSync(new URL("cloudflare-portal/static/assets/student-self-checks-v2.js", root), "utf8");

class TextNode {
  constructor(value){this.value=String(value);}
  get textContent(){return this.value;}
}
class Element {
  constructor(tag="div"){
    this.tagName=tag.toUpperCase();
    this.childNodes=[];this.listeners={};this.parentNode=null;
    this.hidden=false;this.disabled=false;this.dataset={};this.value="";
    this._text="";this.className="";this.classNames=new Set();
    this.classList={
      toggle:(name,force)=>{if(force===undefined? !this.classNames.has(name):force)this.classNames.add(name);else this.classNames.delete(name);},
      contains:(name)=>this.classNames.has(name)
    };
  }
  get textContent(){return this._text+this.childNodes.map(node=>node.textContent??"").join("");}
  set textContent(text){this._text=String(text);this.childNodes=[];}
  get children(){return this.childNodes.filter(node=>node instanceof Element);}
  append(...parts){
    for(let child of parts){
      if(typeof child==="string")child=new TextNode(child);
      child.parentNode=this;
      this.childNodes.push(child);
    }
  }
  replaceChildren(...parts){this._text="";this.childNodes=[];this.append(...parts);}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  dispatch(type){for(const fn of this.listeners[type]||[])fn({type,target:this,preventDefault(){}});}
  showModal(){this.open=true;}
  close(){this.open=false;}
  setAttribute(key,value){this[key]=value;}
  removeAttribute(key){delete this[key];}
  closest(selector){return selector===".metric" ? this.parentNode : null;}
  querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
  querySelectorAll(selector){
    const found=[];
    const visit=(el)=>{
      for(const child of el.children){
        if(selector.startsWith(".") && child.className.split(" ").includes(selector.slice(1)))found.push(child);
        if(selector.startsWith("#") && child.id===selector.slice(1))found.push(child);
        if(selector==="h3" && child.tagName==="H3")found.push(child);
        visit(child);
      }
    };visit(this);return found;
  }
  remove(){if(this.parentNode)this.parentNode.childNodes=this.parentNode.childNodes.filter(x=>x!==this);}
  scrollIntoView(){}
}
const nodes=new Map();
for(const id of ["selfChecksList","selfCheckDialog","selfCheckContent","selfCheckTitle","selfCheckTopic","selfCheckClose","dashboardMaterialsList","dashboardTestsList","selfCheckScore"]){
  const element=new Element(id==="selfCheckDialog"?"dialog":"div");
  element.id=id;
  nodes.set(id,element);
}
const scoreMetric=new Element();scoreMetric.className="metric";
scoreMetric.append(nodes.get("selfCheckScore"));
const listeners={};
const document={
  getElementById(id){return nodes.get(id)??null;},
  createElement(tag){return new Element(tag);},
  createTextNode(text){return new TextNode(text);},
  querySelector(){return null;}
};
let confirmation=true;
const window={
  location:{hash:""},
  confirm(){return confirmation;},
  katex:null,
  setTimeout(fn){fn();return 0;},
  addEventListener(name,fn){(listeners[name]??=[]).push(fn);},
  dispatchEvent(event){for(const fn of listeners[event.type]||[])fn(event);}
};
class CustomEvent{constructor(type,opts={}){this.type=type;this.detail=opts.detail;}}
const pending=[];
let savedViews=0;
let submitted=false;
let earlyFinishCount=0;
const assignmentRows=[
  {id:"new-assignment",title:"Nová diagnostika",description:"",topic:"Funkce",question_count:2,estimated_minutes:10,assigned_at:"2026-10-19T10:00:00Z",latest_score:null,latest_max_score:null,latest_submitted_at:null,available:1},
  {id:"old-assignment",title:"Mechanické vlnění",description:"Opakování vztahů",topic:"Fyzika",question_count:2,estimated_minutes:12,assigned_at:"2026-10-18T10:00:00Z",latest_score:1,latest_max_score:3,latest_submitted_at:"2026-10-19T07:00:00Z",available:1}
];
const answerRows=[
  {position:1,prompt:JSON.stringify({instruction:"Spočti vlnovou délku",math:"\\lambda=v/f",category:"Vlnová délka"}),options:[{id:"a",label:"2 m"},{id:"b",label:"4 m"}],answer:"b",correctAnswer:"a",correct:false,pointsAwarded:0,points:2,explanation:"Použij v=fλ."},
  {position:2,prompt:"Co se přenáší vlněním?",options:[{id:"a",label:"Energie"},{id:"b",label:"Látka"}],answer:"a",correctAnswer:"a",correct:true,pointsAwarded:1,points:1,explanation:"Přenáší energii."}
];
const saved=(attempt="latest")=>({
  saved:true,readOnly:true,preview:false,
  assignment:{id:"old-assignment",title:"Mechanické vlnění",topic:"Fyzika"},
  attemptId:attempt==="old"?"attempt-old":"attempt-new",
  history:[{id:"attempt-new",score:1,maxScore:3,submittedAt:"2026-10-19T07:00:00Z"},{id:"attempt-old",score:3,maxScore:3,submittedAt:"2026-10-18T07:00:00Z"}],
  score:attempt==="old"?3:1,maxScore:3,percent:attempt==="old"?100:33,submittedAt:"2026-10-19T07:00:00Z",
  results:attempt==="old"?answerRows.map(x=>({...x,answer:x.correctAnswer,correct:true,pointsAwarded:x.points})):answerRows
});
const fetch=async (url,opts={})=>{
  if(url==="./api/self-checks/new-assignment/submit"){
    assert.equal(opts.method,"POST","Early finish must submit once through the same endpoint");
    const body=JSON.parse(opts.body);
    assert.equal(body.partial,true,"Student explicitly chose partial completion");
    assert.equal(Object.keys(body.answers).length,1,"Unanswered questions must not be forged as incorrect");
    earlyFinishCount++;
    submitted=true;
    return Response.json({
      saved:false,preview:false,isPartial:true,answeredCount:1,totalQuestions:2,fullMaxScore:3,coveragePercent:50,
      score:1,maxScore:1,percent:100,submittedAt:"2026-10-19T09:00:00Z",
      selfCheckSummary:{completedTests:0,averagePercent:null,latest:{title:"Nová diagnostika",score:1,maxScore:1,percent:100,isPartial:true,answeredCount:1,totalQuestions:2}},
      results:[{position:1,prompt:"Úloha 1",options:[{id:"a",label:"Ano"},{id:"b",label:"Ne"}],answer:"a",correctAnswer:"a",correct:true,pointsAwarded:1,points:1,explanation:"Správně."}]
    });
  }
  assert.equal(opts.method||"GET","GET","Read-only review must not submit or regrade a stored test");
  if(url==="./api/profile")return Response.json({materials:[]});
  if(url==="./api/self-checks")return Response.json({preview:false,assignments:assignmentRows});
  if(url==="./api/self-checks/new-assignment")return Response.json({
    preview:false,
    assignment:{id:"new-assignment",title:"Nová diagnostika",topic:"Funkce",description:"Vyzkoušej dvě otázky",questionCount:2,maxScore:3,estimatedMinutes:10},
    questions:[
      {id:"qa",position:1,prompt:"Úloha 1",points:1,options:[{id:"a",label:"Ano"},{id:"b",label:"Ne"}]},
      {id:"qb",position:2,prompt:"Úloha 2",points:2,options:[{id:"a",label:"Ano"},{id:"b",label:"Ne"}]}
    ]
  });
  if(url.startsWith("./api/self-checks/old-assignment/results")){
    savedViews++;
    return Response.json(saved(url.includes("attempt=attempt-old")?"old":"latest"));
  }
  return Response.json({error:"unexpected path "+url},{status:404});
};
const ctx={window,document,fetch,CustomEvent,Response,console,Date,Math,Number,String,Array,Map,Set,Intl,JSON,FormData};
vm.runInNewContext(modalJs,ctx,{filename:"student-self-checks-v2.js"});
vm.runInNewContext(dashboardJs,ctx,{filename:"student-dashboard-material-selfchecks.js"});
const tick=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
const findButton=(root,label)=>{
 const search=(el)=>{
   for(const child of el.children){
     if(child.tagName==="BUTTON" && child.textContent===label)return child;
     const found=search(child);if(found)return found;
   }
   return null;
 };
 return search(root);
};
await tick();
const dashboard=nodes.get("dashboardTestsList");
assert.equal(dashboard.children.length,2,"Unfinished new assignment must not hide last completed test");
assert(findButton(dashboard,"Zobrazit odpovědi"),"Last completed test must expose review button");
assert(findButton(scoreMetric,"Zobrazit odpovědi"),"Last score metric must expose review button");
assert(findButton(nodes.get("selfChecksList"),"Zobrazit odpovědi"),"Materials test list must expose review too");
findButton(dashboard,"Zobrazit odpovědi").dispatch("click");
await tick();
assert.equal(savedViews,1,"Review button should load stored results exactly once");
assert.equal(nodes.get("selfCheckDialog").open,true,"Saved result must open in the existing test modal");
const contentHost=nodes.get("selfCheckContent");
assert.match(contentHost.textContent,/Uložený výsledek/);
assert.match(contentHost.textContent,/Spočti vlnovou délku/);
assert.match(contentHost.textContent,/Tvoje odpověď/);
assert.match(contentHost.textContent,/Správně/);
assert.match(contentHost.textContent,/Vysvětlení/);
const filter=findButton(contentHost,"Jen chyby (1)");
assert(filter,"Errors-only filter must appear");
filter.dispatch("click");
const cards=contentHost.querySelectorAll(".self-check-v2-answer");
assert.equal(cards.length,2);
assert.equal(cards.filter(c=>c.hidden).length,1,"The correct answer is hidden by errors-only filter");
const history=contentHost.querySelectorAll(".self-check-v2-history-picker")[0];
assert(history,"Previous attempt selector must be shown");
history.value="attempt-old";history.dispatch("change");
await tick();
assert.equal(savedViews,2);
assert.match(contentHost.textContent,/3\/3/);
assert(findButton(contentHost,"Jen chyby (0)"),"Past successful attempt should contain no mistakes");

const openNew=findButton(nodes.get("selfChecksList"),"Spustit test");
assert(openNew,"Unfinished diagnostic must still be startable");
openNew.dispatch("click");
await tick();
assert.match(contentHost.textContent,/Ukončit a vyhodnotit dosavadní odpovědi/);
const stopBefore=findButton(contentHost,"Ukončit a vyhodnotit dosavadní odpovědi");
assert.equal(stopBefore.disabled,true,"Cannot stop a test with zero answers");
const option=contentHost.querySelectorAll(".self-check-v2-option")[0];
assert(option);
const radio=option.children.find(x=>x.tagName==="INPUT");
assert(radio);
radio.dispatch("change");
await tick();
const stopAfter=findButton(contentHost,"Ukončit a vyhodnotit dosavadní odpovědi");
assert.equal(stopAfter.disabled,false,"Allow a partial result after the first answered question");
confirmation=false;
stopAfter.dispatch("click");
await tick();
assert.equal(earlyFinishCount,0,"Cancellation must preserve the unfinished test");
confirmation=true;
stopAfter.dispatch("click");
await tick();
assert.equal(earlyFinishCount,1,"Confirming early finish must submit exactly one graded attempt");
assert.match(contentHost.textContent,/Částečný výsledek/);
assert.match(contentHost.textContent,/1\/2 úloh/);
assert.match(contentHost.textContent,/Úspěšnost 100 %/);
assert.match(contentHost.textContent,/neovlivňuje celkový studijní průměr/);
console.log("Student dashboard UI passed: saved results, test launch, zero-answer lock, partial-stop confirmation, single submission, and honest coverage reporting.");

