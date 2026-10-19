#!/usr/bin/env node
// Lightweight browser-behavior regression test for the interactive physics lab.
// Deliberately dependency-free: run with Node 22 from the repository root.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const dir="interactive-notes/mechanical-waves";
const html=fs.readFileSync(dir+"/index.html","utf8");
const css=fs.readFileSync(dir+"/style.css","utf8");
const js=fs.readFileSync(dir+"/app.js","utf8");
new vm.Script(js,{filename:"mechanical-waves-app.js"});
assert(html.includes("v₁/λ₁ = v₂/λ₂"),"Boundary frequency equation must be dimensionally correct");
assert(css.includes("#phase-canvas{touch-action:none}"),"Touch drag must not scroll the page");
assert(html.includes('style.css?v=2')&&html.includes('app.js?v=2'),"Cache-busted assets missing");
assert.equal((html.match(/data-calc="/g)||[]).length,4,"All four labs require a calculation exercise");

function fakeDom(prefersReducedMotion=false){
 const elements=new Map(),collections={tabs:[],sections:[],modes:[],checks:[],forms:[]};
 const context2d={};
 for(const method of ["setTransform","clearRect","save","restore","setLineDash","beginPath","moveTo","lineTo","stroke","arc","fill","fillText","fillRect"]){
  context2d[method]=()=>{};
 }
 const make=({id="",attrs="",tag=""})=>{
  const listeners={};const classes=new Set((attrs.match(/\bclass="([^"]+)"/)||["",""])[1].split(/\s+/).filter(Boolean));
  const dataset={};
  for(const m of attrs.matchAll(/\bdata-([a-z-]+)="([^"]*)"/g)){
   dataset[m[1].replace(/-([a-z])/g,(_,ch)=>ch.toUpperCase())]=m[2];
  }
  const value=(attrs.match(/\bvalue="([^"]*)"/)||["",""])[1];
  const e={id,tagName:tag.toUpperCase(),dataset,value,disabled:false,checked:false,hidden:false,
   textContent:"",width:0,height:0,style:{},listeners,attributes:{},
   classList:{toggle(cls,on){if(on)classes.add(cls);else classes.delete(cls);},contains(cls){return classes.has(cls);}},
   addEventListener(name,fn){(listeners[name]??=[]).push(fn);},
   dispatch(name,payload={}){for(const fn of listeners[name]||[])fn({preventDefault(){},target:e,clientX:0,pointerId:1,...payload});},
   setAttribute(name,value){e.attributes[name]=value;},
   getBoundingClientRect(){return {left:0,top:0,width:800,height:390};},
   getContext(){return context2d;},
   setPointerCapture(){}
  };
  if(tag==="input"&&attrs.includes('type="checkbox"'))e.checked=attrs.includes(" checked");
  if(id)elements.set(id,e);
  if(classes.has("tab"))collections.tabs.push(e);
  if(classes.has("lab-section"))collections.sections.push(e);
  if(dataset.mode)collections.modes.push(e);
  if(dataset.check)collections.checks.push(e);
  if(dataset.calc)collections.forms.push(e);
  return e;
 };
 // Exact enough for the app's intentionally static markup and ID-based lookups.
 for(const m of html.matchAll(/<(button|input|select|canvas|section|div|p|form|small|span|strong|b|label)\b([^>]*)>/g)){
  const id=(m[2].match(/\bid="([^"]+)"/)||[])[1]||"";
  if(id || /data-tab=|data-mode=|data-check=|data-calc=|class="[^"]*lab-section/.test(m[2]))make({id,attrs:m[2],tag:m[1]});
 }
 const document={
  hidden:false,
  getElementById(id){return elements.get(id)||null;},
  querySelectorAll(q){return ({".tab":collections.tabs,".lab-section":collections.sections,"[data-mode]":collections.modes,"[data-check]":collections.checks,"form[data-calc]":collections.forms})[q]||[];},
  addEventListener(){}
 };
 let nextFrame;
 const window={
  devicePixelRatio:1,
  matchMedia(){return {matches:prefersReducedMotion};},
  addEventListener(){},
  requestAnimationFrame(fn){nextFrame=fn;}
 };
 const runFrame=(ms)=>{assert.equal(typeof nextFrame,"function");const callback=nextFrame;nextFrame=null;callback(ms);};
 return {document,window,e:id=>{const node=elements.get(id);assert(node,"Missing #"+id);return node;},runFrame,collections};
}
function load(prefersReducedMotion=false){
 const dom=fakeDom(prefersReducedMotion);
 vm.runInNewContext(js,{window:dom.window,document:dom.document,console,Math,Number,String,Object,Array,Map,Set,Date,Intl,RegExp,JSON},
 {filename:"mechanical-waves-app.js",timeout:2000});
 return dom;
}
const d=load();
assert.match(d.e("wave-v").textContent,/4,80/);
assert.equal(d.e("wave-main-equation").textContent.startsWith("y("),true);
// The lock enforces constant speed, with wavelength automatically derived from f.
d.e("wave-lock-speed").checked=true;
d.e("wave-lock-speed").dispatch("change");
d.e("wave-f").value="2";
d.e("wave-f").dispatch("input");
assert.equal(d.e("wave-l").disabled,true);
assert.match(d.e("wave-v").textContent,/4,80/);
assert.match(d.e("wave-l-label").textContent,/2,4/);
d.e("wave-lock-speed").checked=false;
d.e("wave-lock-speed").dispatch("change");
assert.equal(d.e("wave-l").disabled,false);
// The longitudinal experiment must not claim to be transverse.
d.collections.modes.find(x=>x.dataset.mode==="longitudinal").dispatch("click");
assert(d.e("wave-main-equation").textContent.startsWith("ξ("));
// Presets must remain in bounds, even for an initial x where +/- lambda is impossible.
d.collections.tabs.find(x=>x.dataset.tab==="phase").dispatch("click");
d.e("phase-l").value="8";d.e("phase-x1").value="5";d.e("phase-x2").value="4";
d.e("phase-same").dispatch("click");
assert.equal(Number(d.e("phase-x1").value),2);
assert.equal(Number(d.e("phase-x2").value),10);
assert.equal(d.e("phase-status").textContent,"Stejná fáze");
d.e("phase-x1").value="9";
d.e("phase-opposite").dispatch("click");
assert.equal(Number(d.e("phase-x1").value),6);
assert.equal(Number(d.e("phase-x2").value),10);
assert.equal(d.e("phase-status").textContent,"Opačná fáze");
assert.match(d.e("phase-mod").textContent,/180,0°/);
// Numeric feedback follows the actual school formulas and supports Czech decimals.
for(const [lab,value] of [["wave","1 450"],["phase","0,5"],["instant","-3"],["medium","450"]]){
 d.e(lab+"-answer").value=value;
 d.collections.forms.find(x=>x.dataset.calc===lab).dispatch("submit");
 assert.equal(d.e(lab+"-check-feedback").dataset.result,"correct",lab+" correct answer");
}
d.e("phase-answer").value="4";d.collections.forms.find(x=>x.dataset.calc==="phase").dispatch("submit");
assert.equal(d.e("phase-check-feedback").dataset.result,"error");
d.e("phase-answer").value="wrong";d.collections.forms.find(x=>x.dataset.calc==="phase").dispatch("submit");
assert.match(d.e("phase-check-feedback").textContent,/Zadej jedno číslo/);
// The last animation frame must update the displayed time even if playback stops.
d.collections.tabs.find(x=>x.dataset.tab==="instant").dispatch("click");
d.e("instant-t").value="11.99";d.e("instant-t").dispatch("input");
d.e("instant-run").dispatch("click");
d.runFrame(1000);d.runFrame(1100);
assert.equal(Number(d.e("instant-t").value),12);
assert.match(d.e("instant-t-label").textContent,/12,00/);
const reduced=load(true);
assert.equal(reduced.e("wave-play").textContent,"Spustit animaci");
assert.equal(reduced.e("phase-play").textContent,"Spustit animaci");
console.log("Mechanical waves: syntax, physics, interaction, mobile drag and reduced-motion checks passed.");
