import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (path) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const html = read("cloudflare-portal/static/student-portal.html");
const css = read("assets/student-portal.css");
const dashboardJS = read("assets/student-dashboard-material-selfchecks.js");
const mainJS = read("assets/student-portal.js");

const dashboardMatch = html.match(/<section class="resource-grid dashboard-resources"[\s\S]*?<\/section>\s*<div class="grid">/);
const materialsMatch = html.match(/<div class="resource-grid materials-resources"[\s\S]*?<\/div>\s*<section class="card links-card"/);
assert(dashboardMatch, "Three-column dashboard resource section is missing");
assert(materialsMatch, "Three-column materials gallery is missing");
for (const match of [dashboardMatch, materialsMatch]) {
  const positions = ["resource-panel-pdf", "resource-panel-interactive", "resource-panel-test"]
    .map(name => match[0].indexOf(name));
  assert(positions.every(index => index > 0));
  assert(positions[0] < positions[1] && positions[1] < positions[2], "Wrong resource order");
  assert.equal((match[0].match(/resource-panel resource-panel-/g)||[]).length,3);
}
for(const id of ["dashboardMaterialsList","dashboardInteractiveList","dashboardTestsList",
  "materialsList","interactiveNotesList","selfChecksList","selfCheckDialog",
  "materialsPdfTitle","materialsInteractiveTitle","materialsTestsTitle"]) {
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,"Exactly one "+id);
}
assert.match(css,/\.resource-grid\s*\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:1080px\)/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(mainJS,/button\.dataset\.resourceTarget/);
assert.match(html,/assets\/student-dashboard-material-selfchecks\.js\?v=20261020-1/);
assert.match(html,/assets\/student-portal\.css\?v=20261020-1/);
new vm.Script(dashboardJS);
new vm.Script(mainJS);

class Element {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();this.children=[];this.textContent="";
    this.className="";this.attrs={};this.style={};this.handlers={};
  }
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=[...items];}
  get childNodes(){return this.children;}
  addEventListener(name,callback){this.handlers[name]=callback;}
  setAttribute(name,value){this.attrs[name]=value;}
  closest(selector){return selector === ".metric" ? metric : null;}
}
const ids={};
for(const id of ["dashboardMaterialsList","dashboardInteractiveList","dashboardTestsList","selfCheckScore"]) ids[id]=new Element();
const metric=new Element();
metric.querySelector=()=>null;
const listeners={};
const document={
  getElementById(id){return ids[id]||null;},
  createElement(tag){return new Element(tag);},
  querySelector(){return null;}
};
const profile={
  materials:[
    {kind:"pdf",title:"Starší PDF",date:"2026-10-11",url:"/student-portal/Library/matematika/old.pdf",badge:"PDF"},
    {kind:"interactive",title:"Nový interaktivní zápis",date:"2026-10-20",url:"/interactive-notes/quadratics/",badge:"Aktuální materiál"},
    {kind:"pdf",title:"Nejnovější PDF",date:"2026-10-18",url:"/student-portal/Library/matematika/latest.pdf",badge:"Aktuální PDF"},
    {kind:"interactive",title:"Starší interaktivní zápis",date:"2026-10-12",url:"https://vojtechsteidl.eu/interactive-notes/fractions/",badge:"Interaktivní"}
  ]
};
let assignments=[
  {id:"test-new",title:"Nový test",description:"Nová diagnostika",topic:"Matematika",question_count:32,estimated_minutes:50,assigned_at:"2026-10-20 08:30:00",latest_score:null,latest_max_score:null,available:1},
  {id:"test-old",title:"Dokončený test",description:"Historická diagnostika",topic:"Matematika",question_count:12,estimated_minutes:20,assigned_at:"2026-10-12 08:30:00",latest_score:18,latest_max_score:20,latest_is_partial:0,latest_submitted_at:"2026-10-19 13:00:00",available:1}
];
const fetch=async(url)=>{
  assert(/^\.\/api\/(?:profile|self-checks)$/.test(url),"Unexpected URL "+url);
  return {ok:true,json:async()=>url.endsWith("self-checks")?{assignments}:profile};
};
const window={addEventListener(type,callback){listeners[type]=callback;},dispatchEvent(){}};
vm.runInNewContext(dashboardJS,{document,window,fetch,CustomEvent:class {}},{timeout:5000});
await new Promise(resolve=>setTimeout(resolve,15));
const desc=(element)=>[element?.textContent||"",...(element?.children||[]).map(desc)].join(" ");
const anchors=(element)=>[...(element?.tagName==="A"?[element]:[]),...(element?.children||[]).flatMap(anchors)];
const pdfText=desc(ids.dashboardMaterialsList),interactiveText=desc(ids.dashboardInteractiveList),testText=desc(ids.dashboardTestsList);
assert.match(pdfText,/Nejnovější PDF/);
assert.doesNotMatch(pdfText,/Nový interaktivní zápis/);
assert.match(interactiveText,/Nový interaktivní zápis/);
assert.doesNotMatch(interactiveText,/Nejnovější PDF/);
assert.match(interactiveText,/Další přiřazené zápisy: 1/);
assert(anchors(ids.dashboardMaterialsList).some(a=>a.href.endsWith("latest.pdf")&&a.textContent.includes("PDF")));
assert(anchors(ids.dashboardInteractiveList).some(a=>a.href.endsWith("/quadratics/")));
assert.match(testText,/Nový test/);
assert.match(testText,/Dokončený test/);
assert.match(testText,/18\/20 \(90 %\)/);
const buttons=(element)=>[...(element?.tagName==="BUTTON"?[element]:[]),...(element?.children||[]).flatMap(buttons)];
assert(buttons(ids.dashboardTestsList).some(b=>b.textContent==="Spustit test"));
assert(buttons(ids.dashboardTestsList).some(b=>b.textContent==="Zobrazit odpovědi"));
assert.equal(typeof listeners["student:self-check-submitted"],"function");
assignments=[...assignments,{id:"test-latest",title:"Po hodině",description:"Nejnovější self-check",topic:"Funkce",question_count:8,estimated_minutes:10,assigned_at:"2026-10-20 19:30:00",latest_score:null,latest_max_score:null,available:1}];
await listeners["student:self-check-submitted"]();
assert.match(desc(ids.dashboardTestsList),/Po hodině/,"Newly assigned self-check appears without refresh");
console.log("Student resources: 3 peer columns in both views, latest PDF/interactive separation, assignment and saved-result access, live test updates OK.");
